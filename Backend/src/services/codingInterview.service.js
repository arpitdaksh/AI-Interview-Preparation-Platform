const codingInterviewModel = require("../models/codingInterview.model")
const { ai } = require("./ai.service")

const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-20b:free"

/**
 * @name generateCodingQuestion
 * @description Generate a coding question for the given topic.
 */
async function generateCodingQuestion({ topic, language = "javascript" }) {
    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            {
                role: "system",
                content: `You are a coding interview examiner. Ask exactly ONE ${topic} coding question.
The user will solve it in ${language}.

Return ONLY the question text. Include:
- Problem statement
- Input/output format
- Example test cases
- Constraints

Do NOT include the solution.`
            },
            {
                role: "user",
                content: `Ask me a ${topic} coding question for a ${language} coding interview.`
            }
        ],
        temperature: 0.7
    })

    const question = response?.choices?.[0]?.message?.content
    if (!question || typeof question !== "string" || question.trim().length === 0) {
        throw new Error("AI failed to generate a coding question.")
    }

    return question
}

/**
 * @name evaluateCodingSolution
 * @description Evaluate the candidate's code solution.
 */
async function evaluateCodingSolution({ question, code, language = "javascript", topic }) {
    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            {
                role: "system",
                content: `You are a coding interview evaluator. Evaluate the candidate's ${topic} solution in ${language}.

Provide a structured evaluation:
- Score (/10)
- Strengths (list)
- Weaknesses (list)
- Better Solution (code)
- Time Complexity
- Space Complexity
- Tips (list)

Return in this exact format:

## Evaluation
**Score:** X/10

**Strengths:**
- ...

**Weaknesses:**
- ...

**Better Solution:**
\`\`\`${language}
...
\`\`\`

**Time Complexity:** O(...)

**Space Complexity:** O(...)

**Tips:**
- ...`
            },
            {
                role: "user",
                content: `Question: ${question}\n\nCandidate's Solution (${language}):\n\`\`\`${language}\n${code}\n\`\`\``
            }
        ],
        temperature: 0.7
    })

    const reply = response?.choices?.[0]?.message?.content
    if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
        throw new Error("AI failed to evaluate the solution.")
    }

    return reply
}

/**
 * @name startCodingInterview
 * @description Start a new coding interview session.
 */
async function startCodingInterview({ userId, topic, language = "javascript" }) {
    const question = await generateCodingQuestion({ topic, language })

    const session = await codingInterviewModel.create({
        user: userId,
        topic,
        status: "in-progress",
        questions: [{
            question,
            topic,
            language,
            code: ""
        }],
        startedAt: new Date()
    })

    return {
        sessionId: session._id,
        topic: session.topic,
        currentQuestion: question,
        status: session.status,
        startedAt: session.startedAt
    }
}

/**
 * @name submitCodingSolution
 * @description Submit a coding solution for evaluation.
 */
async function submitCodingSolution({ userId, sessionId, code, language = "javascript" }) {
    const session = await codingInterviewModel.findOne({ _id: sessionId, user: userId })

    if (!session) {
        const error = new Error("Coding interview session not found.")
        error.status = 404
        throw error
    }

    if (session.status === "completed") {
        const error = new Error("This coding interview is already completed.")
        error.status = 400
        throw error
    }

    const lastQuestion = session.questions[session.questions.length - 1]
    if (!lastQuestion) {
        const error = new Error("No question found to answer.")
        error.status = 400
        throw error
    }

    // Evaluate the solution
    const evalReply = await evaluateCodingSolution({
        question: lastQuestion.question,
        code,
        language,
        topic: session.topic
    })

    // Parse score
    const scoreMatch = evalReply.match(/Score\s*:\s*(\d+)\s*\/\s*10/i)
    let score = null
    if (scoreMatch) {
        score = Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10)))
    }

    // Extract complexities
    const timeComplexityMatch = evalReply.match(/Time Complexity\s*:\s*(.+)/i)
    const spaceComplexityMatch = evalReply.match(/Space Complexity\s*:\s*(.+)/i)

    // Update the question
    lastQuestion.code = code
    lastQuestion.language = language
    lastQuestion.evaluation = {
        score,
        strengths: [],
        weaknesses: [],
        betterSolution: "",
        timeComplexity: timeComplexityMatch ? timeComplexityMatch[1].trim() : "",
        spaceComplexity: spaceComplexityMatch ? spaceComplexityMatch[1].trim() : "",
        tips: []
    }

    session.status = "completed"
    session.endedAt = new Date()
    await session.save()

    return {
        sessionId: session._id,
        topic: session.topic,
        evaluation: {
            score,
            fullResponse: evalReply
        },
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt
    }
}

/**
 * @name getCodingInterview
 * @description Get a single coding interview session.
 */
async function getCodingInterview({ userId, sessionId }) {
    const session = await codingInterviewModel.findOne({ _id: sessionId, user: userId })

    if (!session) {
        const error = new Error("Coding interview session not found.")
        error.status = 404
        throw error
    }

    return session
}

/**
 * @name getUserCodingInterviews
 * @description Get all coding interviews for a user.
 */
async function getUserCodingInterviews({ userId }) {
    const sessions = await codingInterviewModel.find({ user: userId }).sort({ startedAt: -1 })

    return sessions.map(s => ({
        _id: s._id,
        topic: s.topic,
        status: s.status,
        questionsAnswered: s.questions.filter(q => q.code).length,
        totalQuestions: s.questions.length,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        createdAt: s.createdAt
    }))
}

module.exports = {
    startCodingInterview,
    submitCodingSolution,
    getCodingInterview,
    getUserCodingInterviews
}
