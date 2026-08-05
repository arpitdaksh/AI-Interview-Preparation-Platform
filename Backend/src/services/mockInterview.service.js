const mockInterviewModel = require("../models/mockInterview.model")
const interviewReportModel = require("../models/interviewReport.model")
const { ai } = require("./ai.service")

const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-20b:free"

/**
 * Build the system prompt for the AI interviewer.
 */
function buildInterviewerPrompt(type, interviewReport) {
    let context = ""
    if (interviewReport) {
        context = `
Candidate Context:
- Job Title: ${interviewReport.title || "Not specified"}
- Resume: ${interviewReport.resume || "Not provided"}
- Job Description: ${interviewReport.jobDescription || "Not provided"}
- Skill Gaps: ${(interviewReport.skillGaps || []).map(g => `${g.skill} (${g.severity})`).join(", ")}
`
    }

    return `You are an expert AI interviewer conducting a ${type} interview.

Your role is to:
1. Ask ONE relevant ${type} interview question at a time.
2. Wait for the candidate's answer.
3. Evaluate the answer with a score (/10), strengths, weaknesses, a better answer, and interview tips.
4. Then automatically ask the NEXT relevant question.
5. Keep the conversation natural and professional, like a real interview.

${context}

Rules:
- Ask questions one at a time.
- After the candidate answers, provide a structured evaluation and then ask the next question.
- If the candidate says "stop" or "end interview", end the session.
- Be challenging but fair.
- Format responses using Markdown.`
}

/**
 * @name generateFirstQuestion
 * @description Generate the first question for a mock interview.
 */
async function generateFirstQuestion({ type, interviewReport }) {
    const systemPrompt = buildInterviewerPrompt(type, interviewReport)

    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Start the interview. Ask me the first question." }
        ],
        temperature: 0.7
    })

    const question = response?.choices?.[0]?.message?.content
    if (!question || typeof question !== "string" || question.trim().length === 0) {
        throw new Error("AI failed to generate the first question.")
    }

    return question
}

/**
 * @name evaluateAnswer
 * @description Evaluate the candidate's answer and generate the next question.
 */
async function evaluateAnswer({ type, interviewReport, question, answer, questionHistory }) {
    const systemPrompt = buildInterviewerPrompt(type, interviewReport)

    const history = (questionHistory || []).map(q => ([
        { role: "assistant", content: q.question },
        { role: "user", content: q.answer || "No answer provided" }
    ])).flat()

    // Build the evaluation + next question prompt
    const evalPrompt = `The candidate answered the following question:

Question: "${question}"
Answer: "${answer}"

First, evaluate the answer with:
- Score (/10)
- Strengths (list)
- Weaknesses (list)
- Better Answer (a model answer)
- Interview Tips (list)

Then, ask the NEXT interview question.

Return your response in this format:

## Evaluation
**Score:** X/10

**Strengths:**
- ...

**Weaknesses:**
- ...

**Better Answer:**
...

**Interview Tips:**
- ...

## Next Question
(Your next question here)`

    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "assistant", content: question },
            { role: "user", content: answer },
            { role: "user", content: evalPrompt }
        ],
        temperature: 0.7
    })

    const reply = response?.choices?.[0]?.message?.content
    if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
        throw new Error("AI failed to evaluate the answer.")
    }

    return reply
}

/**
 * @name startMockInterview
 * @description Create a new mock interview session and ask the first question.
 */
async function startMockInterview({ userId, type, durationMin, interviewReportId }) {
    let interviewReport = null
    if (interviewReportId) {
        interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: userId })
    }

    const firstQuestion = await generateFirstQuestion({ type, interviewReport })

    const session = await mockInterviewModel.create({
        user: userId,
        type,
        durationMin,
        status: "in-progress",
        questions: [{ question: firstQuestion }],
        startedAt: new Date()
    })

    return {
        sessionId: session._id,
        type: session.type,
        durationMin: session.durationMin,
        currentQuestion: firstQuestion,
        questionsAnswered: 0,
        totalQuestions: session.questions.length,
        status: session.status,
        startedAt: session.startedAt
    }
}

/**
 * @name submitAnswer
 * @description Submit an answer to the current question, get evaluation + next question.
 */
async function submitAnswer({ userId, sessionId, answer }) {
    const session = await mockInterviewModel.findOne({ _id: sessionId, user: userId })

    if (!session) {
        const error = new Error("Mock interview session not found.")
        error.status = 404
        throw error
    }

    if (session.status === "completed") {
        const error = new Error("This interview session is already completed.")
        error.status = 400
        throw error
    }

    // Find the last unanswered question
    const lastQuestion = session.questions[session.questions.length - 1]
    if (!lastQuestion) {
        const error = new Error("No question found to answer.")
        error.status = 400
        throw error
    }

    // Get the interview report context if linked
    let interviewReport = null
    // We'll try to find it from the user's recent reports (mock interviews don't have a direct link field)
    // Allow context via the chat interviewReportId pattern

    const type = session.type
    const questionHistory = session.questions.map(q => ({
        question: q.question,
        answer: q.answer
    }))

    const evalReply = await evaluateAnswer({
        type,
        interviewReport,
        question: lastQuestion.question,
        answer,
        questionHistory
    })

    // Parse the evaluation from the reply
    // The reply contains both evaluation and the next question
    // We'll store the evaluation and the next question

    // Extract score
    const scoreMatch = evalReply.match(/Score\s*:\s*(\d+)\s*\/\s*10/i)
    let score = null
    if (scoreMatch) {
        score = Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10)))
    } else {
        // Try to find a number near "Score" or "X/10"
        const simpleMatch = evalReply.match(/(\d+)\s*\/\s*10/)
        if (simpleMatch) {
            score = Math.min(10, Math.max(0, parseInt(simpleMatch[1], 10)))
        }
    }

    // Update the last question with answer and evaluation
    lastQuestion.answer = answer
    lastQuestion.evaluation = {
        score,
        strengths: [],
        weaknesses: [],
        betterAnswer: "",
        tips: []
    }

    // Extract the next question (everything after "## Next Question" or the last section)
    let nextQuestion = ""
    const nextQuestionMatch = evalReply.match(/## Next Question\s*\n([\s\S]*)$/i)
    if (nextQuestionMatch) {
        nextQuestion = nextQuestionMatch[1].trim()
    } else {
        // If no next question section, the whole response might end with a question
        // Check if the last paragraph ends with "?"
        const paragraphs = evalReply.split(/\n\s*\n/).filter(p => p.trim())
        const lastPara = paragraphs[paragraphs.length - 1]
        if (lastPara && lastPara.includes("?")) {
            nextQuestion = lastPara
        } else {
            // Try to find a question mark in the last few lines
            const lines = evalReply.split("\n").filter(l => l.trim())
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].includes("?")) {
                    nextQuestion = lines[i].trim()
                    break
                }
            }
        }
    }

    // Add the next question if found
    if (nextQuestion) {
        session.questions.push({ question: nextQuestion })
    }

    await session.save()

    // Calculate stats
    const answeredQuestions = session.questions.filter(q => q.answer && q.answer.trim().length > 0)
    const scores = answeredQuestions
        .map(q => q.evaluation?.score)
        .filter(s => s !== null && s !== undefined)
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null

    return {
        sessionId: session._id,
        evaluation: {
            score,
            fullResponse: evalReply
        },
        currentQuestion: nextQuestion || null,
        questionsAnswered: answeredQuestions.length,
        totalQuestions: session.questions.length,
        avgScore,
        status: session.status
    }
}

/**
 * @name completeMockInterview
 * @description Complete a mock interview session.
 */
async function completeMockInterview({ userId, sessionId }) {
    const session = await mockInterviewModel.findOne({ _id: sessionId, user: userId })

    if (!session) {
        const error = new Error("Mock interview session not found.")
        error.status = 404
        throw error
    }

    session.status = "completed"
    session.endedAt = new Date()
    await session.save()

    // Calculate summary stats
    const answeredQuestions = session.questions.filter(q => q.answer && q.answer.trim().length > 0)
    const scores = answeredQuestions
        .map(q => q.evaluation?.score)
        .filter(s => s !== null && s !== undefined)
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null

    return {
        sessionId: session._id,
        type: session.type,
        durationMin: session.durationMin,
        questionsAnswered: answeredQuestions.length,
        totalQuestions: session.questions.length,
        avgScore,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    }
}

/**
 * @name getMockInterview
 * @description Get a single mock interview session.
 */
async function getMockInterview({ userId, sessionId }) {
    const session = await mockInterviewModel.findOne({ _id: sessionId, user: userId })

    if (!session) {
        const error = new Error("Mock interview session not found.")
        error.status = 404
        throw error
    }

    return session
}

/**
 * @name getUserMockInterviews
 * @description Get all mock interviews for a user.
 */
async function getUserMockInterviews({ userId }) {
    const sessions = await mockInterviewModel.find({ user: userId }).sort({ startedAt: -1 })

    return sessions.map(s => ({
        _id: s._id,
        type: s.type,
        durationMin: s.durationMin,
        status: s.status,
        questionsAnswered: s.questions.filter(q => q.answer).length,
        totalQuestions: s.questions.length,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        createdAt: s.createdAt
    }))
}

module.exports = {
    startMockInterview,
    submitAnswer,
    completeMockInterview,
    getMockInterview,
    getUserMockInterviews
}
