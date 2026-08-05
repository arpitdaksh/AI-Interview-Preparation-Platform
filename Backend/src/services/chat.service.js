const interviewReportModel = require("../models/interviewReport.model")
const chatModel = require("../models/chat.model")
const { ai } = require("./ai.service")
const { extractFileText } = require("./fileExtract.service")

// OpenRouter model used for chat completions. Overridable via env var.
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-20b:free"

const MAX_HISTORY_MESSAGES = 20
const SUGGESTED_QUESTIONS_COUNT = 3

/**
 * @name formatQuestions
 * @description Format technical/behavioral questions for the system prompt.
 */
function formatQuestions(questions = []) {
    if (!questions || questions.length === 0) return "None"
    return questions.map((q, i) =>
        `${i + 1}. Question: ${q.question}\n   Intention: ${q.intention}\n   Answer: ${q.answer}`
    ).join("\n")
}

/**
 * @name formatSkillGaps
 * @description Format skill gaps for the system prompt.
 */
function formatSkillGaps(skillGaps = []) {
    if (!skillGaps || skillGaps.length === 0) return "None"
    return skillGaps.map((g, i) => `${i + 1}. ${g.skill} (severity: ${g.severity})`).join("\n")
}

/**
 * @name formatPreparationPlan
 * @description Format the preparation plan for the system prompt.
 */
function formatPreparationPlan(preparationPlan = []) {
    if (!preparationPlan || preparationPlan.length === 0) return "None"
    return preparationPlan.map((p) =>
        `Day ${p.day} - Focus: ${p.focus}\n  Tasks: ${p.tasks.join(", ")}`
    ).join("\n")
}

/**
 * @name getInterviewReportById
 * @description Fetch the interview report that belongs to the logged in user.
 */
async function getInterviewReportById({ interviewReportId, userId }) {
    if (!interviewReportId) return null

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: userId
    })

    if (!interviewReport) {
        const error = new Error("Interview report not found.")
        error.status = 404
        throw error
    }

    return interviewReport
}

/**
 * @name buildInterviewCoachSystemPrompt
 * @description Build the custom system prompt for the Interview Coach assistant
 * using the candidate's interview report data (if available).
 */
function buildInterviewCoachSystemPrompt(interviewReport) {
    const reportContext = interviewReport
        ? `
Interview Report Context:
- Job Title: ${interviewReport.title}
- Match Score: ${interviewReport.matchScore}/100

Resume:
${interviewReport.resume || "Not provided"}

Self Description:
${interviewReport.selfDescription || "Not provided"}

Job Description:
${interviewReport.jobDescription || "Not provided"}

Technical Questions:
${formatQuestions(interviewReport.technicalQuestions)}

Behavioral Questions:
${formatQuestions(interviewReport.behavioralQuestions)}

Skill Gaps:
${formatSkillGaps(interviewReport.skillGaps)}

Preparation Plan:
${formatPreparationPlan(interviewReport.preparationPlan)}
`
        : "The candidate has not attached an interview report to this chat yet. Ask them for their target job description or role so you can help them prepare."

    return `You are an expert Interview Coach.

Your job is to help the candidate prepare for interviews.

You already know the candidate's resume, interview report, preparation plan and job description.

Never answer with generic responses if the interview report already contains relevant information.

Always personalize your answers.

Rules:
- If the user asks technical questions, explain them clearly with examples.
- If the user asks behavioral questions, answer using STAR format.
- If the user asks about resume improvements, suggest improvements based on the uploaded resume.
- If the user asks about skill gaps, use the generated skill gap analysis.
- Be concise but detailed.
- Format your responses using Markdown. Use # for headings, ## for subheadings, - for bullet lists, ** for bold, and code blocks (\\\`\\\`\\\`cpp ... \\\`\\\`\\\`) for code.
- If the user asks something unrelated to interviews, politely reply that you only answer interview-related questions based on their interview report.${reportContext}`
}

/**
 * @name extractJsonArray
 * @description Robustly extract a JSON array (e.g. suggested questions) from an
 * AI response that may include prose or markdown fences around it.
 */
function extractJsonArray(text) {
    if (typeof text !== "string") {
        if (Array.isArray(text)) {
            text = text.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("")
        } else {
            throw new Error("AI returned a non-string response.")
        }
    }

    const candidates = []

    // 1. Markdown fenced block (```json ... ```)
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced) {
        candidates.push(fenced[1].trim())
    }

    // 2. Balanced [ ... ] array (handles prose around it)
    const start = text.indexOf("[")
    if (start !== -1) {
        let depth = 0
        for (let i = start; i < text.length; i++) {
            const ch = text[i]
            if (ch === "[") depth++
            else if (ch === "]") {
                depth--
                if (depth === 0) {
                    candidates.push(text.slice(start, i + 1).trim())
                    break
                }
            }
        }
    }

    // 3. Whole trimmed text
    candidates.push(text.trim())

    for (const candidate of candidates) {
        if (!candidate) continue
        try {
            const parsed = JSON.parse(candidate)
            if (Array.isArray(parsed)) return parsed
        } catch { /* try next */ }
    }

    throw new Error("Could not parse JSON array from AI response. Raw: " + text.slice(0, 300))
}

/**
 * @name defaultSuggestedQuestions
 * @description Fallback suggested questions if the AI call fails.
 */
function defaultSuggestedQuestions() {
    return [
        "Can you ask me another technical question?",
        "How can I improve my resume?",
        "What should I focus on in my preparation plan?"
    ]
}

/**
 * @name generateSuggestedQuestions
 * @description Generate exactly 3 suggested interview-preparation follow-up
 * questions after each AI reply.
 */
async function generateSuggestedQuestions({ systemPrompt, conversationHistory, userMessage, aiReply }) {

    const suggestionPrompt = `Based on the conversation so far and the assistant's latest reply, suggest exactly 3 short follow-up questions the candidate could ask next to keep preparing for their interview.

Return ONLY a valid JSON array of 3 strings. Do not include any other text.

Latest assistant reply:
${aiReply}`

    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            ...conversationHistory,
            {
                role: "user",
                content: userMessage
            },
            {
                role: "assistant",
                content: aiReply
            },
            {
                role: "user",
                content: suggestionPrompt
            }
        ],
        temperature: 0.8
    })

    const rawContent = response?.choices?.[0]?.message?.content

    if (!rawContent || typeof rawContent !== "string") {
        throw new Error("AI returned an empty response for suggested questions.")
    }

    let questions = extractJsonArray(rawContent)

    // Normalize to strings and cap at the required count
    questions = questions
        .filter(q => typeof q === "string" && q.trim().length > 0)
        .map(q => q.trim())
        .slice(0, SUGGESTED_QUESTIONS_COUNT)

    return questions

}

/**
 * @name autoGenerateTitle
 * @description Generate a short chat title automatically from the first user
 * message. Falls back to a deterministic truncated title on AI failure.
 */
async function autoGenerateTitle(message) {
    const fallback = message.trim().slice(0, 40) || "New Chat"

    try {
        const response = await ai.chat.completions.create({
            model: CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You generate very short chat titles (max 5 words). Return ONLY the title, no quotes or punctuation."
                },
                {
                    role: "user",
                    content: `Title for this first user message: "${message}"`
                }
            ],
            temperature: 0.5,
            max_tokens: 20
        })

        const title = response?.choices?.[0]?.message?.content?.trim()

        return title && title.length <= 60 ? title : fallback
    } catch (error) {
        console.error("[Chat] Auto-title generation failed, using fallback:", error)
        return fallback
    }
}

/**
 * @name createChat
 * @description Create a new empty chat for a user.
 */
async function createChat({ userId, interviewReportId }) {
    const chat = await chatModel.create({
        user: userId,
        interviewReportId: interviewReportId || null,
        messages: []
    })

    return chat
}

/**
 * @name getUserChats
 * @description Get all chats for a user, newest first.
 */
async function getUserChats({ userId }) {
    const chats = await chatModel.find({ user: userId }).sort({ updatedAt: -1 })

    return chats.map(c => ({
        _id: c._id,
        title: c.title || "New Chat",
        interviewReportId: c.interviewReportId,
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt
    }))
}

/**
 * @name getUserChat
 * @description Get a single chat with messages (ownership checked).
 */
async function getUserChat({ userId, chatId }) {
    const chat = await chatModel.findOne({ _id: chatId, user: userId })

    if (!chat) {
        const error = new Error("Chat not found.")
        error.status = 404
        throw error
    }

    return chat
}

/**
 * @name deleteChat
 * @description Delete a chat (ownership checked).
 */
async function deleteChat({ userId, chatId }) {
    const chat = await chatModel.findOneAndDelete({ _id: chatId, user: userId })

    if (!chat) {
        const error = new Error("Chat not found.")
        error.status = 404
        throw error
    }

    return chat
}

/**
 * @name clearChatMessages
 * @description Clear all messages in a chat but keep the chat (ownership checked).
 */
async function clearChatMessages({ userId, chatId }) {
    const chat = await chatModel.findOne({ _id: chatId, user: userId })

    if (!chat) {
        const error = new Error("Chat not found.")
        error.status = 404
        throw error
    }

    chat.messages = []
    await chat.save()

    return chat
}

/**
 * @name buildMessagesPayload
 * @description Build the OpenAI messages array: system prompt + conversation
 * history + the new user message.
 */
function buildMessagesPayload({ systemPrompt, history, message }) {
    return [
        {
            role: "system",
            content: systemPrompt
        },
        ...history.map(m => ({ role: m.role, content: m.content })),
        {
            role: "user",
            content: message
        }
    ]
}

/**
 * @name buildUserMessageWithFile
 * @description Append the extracted file content to the user's message so the
 * AI can read the uploaded document. For images, we note the attachment name.
 */
function buildUserMessageWithFile(message, fileInfo) {
    if (!fileInfo || !fileInfo.kind || fileInfo.kind === "none") {
        return message
    }

    if (fileInfo.kind === "image") {
        return `${message}\n\n[The user attached an image file: ${fileInfo.imageName || "image"}.]`
    }

    const text = (fileInfo.text || "").trim()
    if (!text) {
        return `${message}\n\n[The user attached a file, but no text could be extracted from it.]`
    }

    return `${message}\n\n[Attached file content:\n${text.slice(0, 12000)}\n]`
}

/**
 * @name persistExchange
 * @description Append a user + assistant message to a chat and save.
 */
async function persistExchange({ chat, userMessage, assistantMessage }) {
    chat.messages.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage }
    )
    chat.trimMessages()
    await chat.save()
}

/**
 * @name sendMessage
 * @description Non-streaming chat message flow (legacy path). Returns the reply
 * and suggested questions.
 */
async function sendMessage({ userId, chatId, message }) {

    const chat = await getUserChat({ userId, chatId })
    const interviewReport = await getInterviewReportById({ interviewReportId: chat.interviewReportId, userId })

    const systemPrompt = buildInterviewCoachSystemPrompt(interviewReport)
    const history = chat.messages.slice(-MAX_HISTORY_MESSAGES)

    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: buildMessagesPayload({ systemPrompt, history, message }),
        temperature: 0.7
    })

    const reply = response?.choices?.[0]?.message?.content

    if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
        throw new Error("AI returned an empty response.")
    }

    // Auto-title if needed
    if (!chat.title && chat.messages.length === 0) {
        chat.title = await autoGenerateTitle(message)
    }

    await persistExchange({ chat, userMessage: message, assistantMessage: reply })

    // Generate 3 suggested follow-up questions
    let suggestedQuestions = defaultSuggestedQuestions()
    try {
        const generated = await generateSuggestedQuestions({
            systemPrompt,
            conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
            userMessage: message,
            aiReply: reply
        })
        if (generated.length === SUGGESTED_QUESTIONS_COUNT) {
            suggestedQuestions = generated
        }
    } catch (error) {
        console.error("[Chat] Failed to generate suggested questions, using defaults:", error)
    }

    return {
        chatId: chat._id,
        reply,
        suggestedQuestions
    }

}

/**
 * @name streamChatReply
 * @description Streaming chat message flow (SSE). Writes tokens progressively,
 * persists the exchange, sends suggested questions at the end.
 */
async function streamChatReply({ req, res, userId, chatId, message, file }) {

    const chat = await getUserChat({ userId, chatId })
    const interviewReport = await getInterviewReportById({ interviewReportId: chat.interviewReportId, userId })

    const systemPrompt = buildInterviewCoachSystemPrompt(interviewReport)
    const history = chat.messages.slice(-MAX_HISTORY_MESSAGES)

    // If a file was uploaded, extract its text and append it to the user's
    // message so the AI can read the attached document.
    let fileInfo = null
    let userMessage = message
    if (file) {
        try {
            fileInfo = await extractFileText({ file })
            userMessage = buildUserMessageWithFile(message, fileInfo)
        } catch (error) {
            console.error("[Chat] Failed to extract file text:", error)
            userMessage = `${message}\n\n[The user attached a file: ${file.originalname || "file"} but its content could not be read.]`
        }
    }

    const stream = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: buildMessagesPayload({ systemPrompt, history, message: userMessage }),
        temperature: 0.7,
        stream: true
    })

    // Set SSE headers
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    })

    const send = (event, data) => {
        if (res.writableEnded) return
        res.write(`event: ${event}\n`)
        res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    send("start", { message: "start" })

    let reply = ""

    try {
        for await (const chunk of stream) {
            if (res.writableEnded) break

            const delta = chunk?.choices?.[0]?.delta?.content || ""
            if (delta) {
                reply += delta
                send("token", { token: delta })
            }
        }

// Auto-title if needed
        if (!chat.title && chat.messages.length === 0) {
            chat.title = await autoGenerateTitle(message)
        }

        await persistExchange({ chat, userMessage, assistantMessage: reply })

        // Generate suggested questions after the reply completes
        let suggestedQuestions = defaultSuggestedQuestions()
        try {
            const generated = await generateSuggestedQuestions({
                systemPrompt,
                conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
                userMessage,
                aiReply: reply
            })
            if (generated.length === SUGGESTED_QUESTIONS_COUNT) {
                suggestedQuestions = generated
            }
        } catch (error) {
            console.error("[Chat] Failed to generate suggested questions, using defaults:", error)
        }

        send("suggested_questions", { suggestedQuestions })
        send("done", { message: "done" })
    } catch (error) {
        console.error("[Chat] Streaming error:", error)

        if (!res.writableEnded) {
            send("error", { message: error?.message || "Failed to generate AI reply." })
        }
    } finally {
        if (!res.writableEnded) {
            res.end()
        }
    }

}

/**
 * @name regenerateReply
 * @description Regenerate only the last assistant reply in a chat. Removes the
 * last assistant message and re-streams the reply to the last user message.
 */
async function regenerateReply({ req, res, userId, chatId }) {

    const chat = await getUserChat({ userId, chatId })

    // Find the last user message index
    let lastUserIndex = -1
    for (let i = chat.messages.length - 1; i >= 0; i--) {
        if (chat.messages[i].role === "user") {
            lastUserIndex = i
            break
        }
    }

    if (lastUserIndex === -1) {
        const error = new Error("No user message to regenerate.")
        error.status = 400
        throw error
    }

    // Remove any trailing assistant message(s) after the last user message
    if (chat.messages.length > lastUserIndex + 1) {
        chat.messages = chat.messages.slice(0, lastUserIndex + 1)
        await chat.save()
    }

    const lastUserMessage = chat.messages[lastUserIndex].content

    const interviewReport = await getInterviewReportById({ interviewReportId: chat.interviewReportId, userId })

    const systemPrompt = buildInterviewCoachSystemPrompt(interviewReport)
    const history = chat.messages.slice(-MAX_HISTORY_MESSAGES)

    const stream = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: buildMessagesPayload({ systemPrompt, history, message: lastUserMessage }),
        temperature: 0.7,
        stream: true
    })

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    })

    const send = (event, data) => {
        if (res.writableEnded) return
        res.write(`event: ${event}\n`)
        res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    send("start", { message: "start" })

    let reply = ""

    try {
        for await (const chunk of stream) {
            if (res.writableEnded) break

            const delta = chunk?.choices?.[0]?.delta?.content || ""
            if (delta) {
                reply += delta
                send("token", { token: delta })
            }
        }

        // Append the regenerated assistant message
        chat.messages.push({ role: "assistant", content: reply })
        chat.trimMessages()
        await chat.save()

        let suggestedQuestions = defaultSuggestedQuestions()
        try {
            const generated = await generateSuggestedQuestions({
                systemPrompt,
                conversationHistory: history.map(m => ({ role: m.role, content: m.content })),
                userMessage: lastUserMessage,
                aiReply: reply
            })
            if (generated.length === SUGGESTED_QUESTIONS_COUNT) {
                suggestedQuestions = generated
            }
        } catch (error) {
            console.error("[Chat] Failed to generate suggested questions, using defaults:", error)
        }

        send("suggested_questions", { suggestedQuestions })
        send("done", { message: "done" })
    } catch (error) {
        console.error("[Chat] Regenerate streaming error:", error)

        if (!res.writableEnded) {
            send("error", { message: error?.message || "Failed to regenerate AI reply." })
        }
    } finally {
        if (!res.writableEnded) {
            res.end()
        }
    }

}

module.exports = {
    createChat,
    getUserChats,
    getUserChat,
    deleteChat,
    clearChatMessages,
    autoGenerateTitle,
    sendMessage,
    streamChatReply,
    regenerateReply
}

