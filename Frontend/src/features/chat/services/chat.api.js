import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Create a new chat. If `message` is provided, the chat is created
 * and the message is sent (legacy backward-compatible flow).
 */
export const createChat = async ({ message, interviewReportId }) => {
    const response = await api.post("/api/chat/", { message, interviewReportId })

    return response.data
}


/**
 * @description Get all chats for the logged in user, newest first.
 */
export const getChats = async () => {
    const response = await api.get("/api/chat/")

    return response.data
}


/**
 * @description Get a single chat with its messages.
 */
export const getChatById = async (chatId) => {
    const response = await api.get(`/api/chat/${chatId}`)

    return response.data
}


/**
 * @description Delete a chat.
 */
export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/chat/${chatId}`)

    return response.data
}


/**
 * @description Clear all messages in a chat (conversation kept).
 */
export const clearChatMessages = async (chatId) => {
    const response = await api.delete(`/api/chat/${chatId}/messages`)

    return response.data
}


/**
 * @description Read an SSE stream and invoke a callback for each parsed event.
 * Supported events: start, token, suggested_questions, done, error.
 */
export const readSSEStream = async ({ url, options, onEvent, signal }) => {

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        signal
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Request failed.")
    }

    if (!response.body) {
        throw new Error("Streaming not supported in this browser.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    const flushBuffer = async (buffer) => {
        if (!buffer.trim()) return buffer

        const lines = buffer.split("\n")
        let event = "message"
        let data = ""

        for (const line of lines) {
            if (line.startsWith("event:")) {
                event = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
                data += line.slice(5).trim()
            }
        }

        if (data) {
            try {
                await onEvent({ event, data: JSON.parse(data) })
            } catch {
                await onEvent({ event, data: { raw: data } })
            }
        }

        return ""
    }

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by blank lines
        const parts = buffer.split("\n\n")
        buffer = parts.pop() || ""

        for (const part of parts) {
            buffer = await flushBuffer(part)
        }
    }

    await flushBuffer(buffer)
}


/**
 * @description Send a message in a chat using SSE streaming. Calls onEvent for
 * each parsed event: { event, data }. Supports aborting via AbortController.
 */
export const streamSendMessage = async ({ chatId, message, signal, onEvent }) => {
    await readSSEStream({
        url: `http://localhost:3000/api/chat/${chatId}/messages`,
        options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        },
        onEvent,
        signal
    })
}


/**
 * @description Send a message with an optional file attachment using SSE
 * streaming. The file is sent as multipart/form-data. Calls onEvent for each
 * parsed event: { event, data }. Supports aborting via AbortController.
 */
export const streamSendMessageWithFile = async ({ chatId, message, file, signal, onEvent }) => {
    const formData = new FormData()
    formData.append("message", message)
    if (file) {
        formData.append("file", file, file.name)
    }

    await readSSEStream({
        url: `http://localhost:3000/api/chat/${chatId}/messages`,
        options: {
            method: "POST",
            body: formData
        },
        onEvent,
        signal
    })
}


/**
 * @description Regenerate the last assistant reply using SSE streaming.
 */
export const streamRegenerateReply = async ({ chatId, signal, onEvent }) => {
    await readSSEStream({
        url: `http://localhost:3000/api/chat/${chatId}/regenerate`,
        options: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        },
        onEvent,
        signal
    })
}

