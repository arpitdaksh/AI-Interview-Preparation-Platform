const {
    createChat,
    getUserChats,
    getUserChat,
    deleteChat,
    clearChatMessages,
    sendMessage,
    streamChatReply,
    regenerateReply
} = require("../services/chat.service")


/**
 * @name createChatController
 * @description Create a new empty chat for the logged in user. If a `message`
 * is provided, it creates the chat and sends the message (backward compatible
 * with the original POST /api/chat contract).
 * @access private
 */
async function createChatController(req, res) {

    const { message, interviewReportId } = req.body

    try {
        // If a message is provided, create chat + send message (legacy flow)
        if (message) {
            if (typeof message !== "string" || !message.trim()) {
                return res.status(400).json({
                    message: "Message is required and must be a non-empty string."
                })
            }

            const chat = await createChat({
                userId: req.user.id,
                interviewReportId
            })

            const result = await sendMessage({
                userId: req.user.id,
                chatId: chat._id,
                message: message.trim()
            })

            return res.status(201).json({
                message: "Chat message sent successfully.",
                chatId: result.chatId,
                reply: result.reply,
                suggestedQuestions: result.suggestedQuestions
            })
        }

        // Otherwise create an empty chat
        const chat = await createChat({
            userId: req.user.id,
            interviewReportId
        })

        res.status(201).json({
            message: "Chat created successfully.",
            chat
        })
    } catch (error) {
        console.error("[Chat] Failed to create chat:", error)

        const status = error.status || 500
        const errorMessage = error.message || "Failed to create chat. Please try again."

        res.status(status).json({ message: errorMessage })
    }

}


/**
 * @name getChatsController
 * @description Get all chats for the logged in user, newest first.
 * @access private
 */
async function getChatsController(req, res) {

    try {
        const chats = await getUserChats({ userId: req.user.id })

        res.status(200).json({
            message: "Chats fetched successfully.",
            chats
        })
    } catch (error) {
        console.error("[Chat] Failed to fetch chats:", error)
        res.status(500).json({ message: error.message || "Failed to fetch chats." })
    }

}


/**
 * @name getChatByIdController
 * @description Get a single chat with messages.
 * @access private
 */
async function getChatByIdController(req, res) {

    const { chatId } = req.params

    try {
        const chat = await getUserChat({ userId: req.user.id, chatId })

        res.status(200).json({
            message: "Chat fetched successfully.",
            chat
        })
    } catch (error) {
        console.error("[Chat] Failed to fetch chat:", error)

        const status = error.status || 500
        const errorMessage = error.message || "Failed to fetch chat."

        res.status(status).json({ message: errorMessage })
    }

}


/**
 * @name deleteChatController
 * @description Delete a chat.
 * @access private
 */
async function deleteChatController(req, res) {

    const { chatId } = req.params

    try {
        await deleteChat({ userId: req.user.id, chatId })

        res.status(200).json({
            message: "Chat deleted successfully."
        })
    } catch (error) {
        console.error("[Chat] Failed to delete chat:", error)

        const status = error.status || 500
        const errorMessage = error.message || "Failed to delete chat."

        res.status(status).json({ message: errorMessage })
    }

}


/**
 * @name clearChatMessagesController
 * @description Clear all messages in a chat (conversation kept).
 * @access private
 */
async function clearChatMessagesController(req, res) {

    const { chatId } = req.params

    try {
        await clearChatMessages({ userId: req.user.id, chatId })

        res.status(200).json({
            message: "Chat conversation cleared successfully."
        })
    } catch (error) {
        console.error("[Chat] Failed to clear chat messages:", error)

        const status = error.status || 500
        const errorMessage = error.message || "Failed to clear chat conversation."

        res.status(status).json({ message: errorMessage })
    }

}


/**
 * @name sendMessageController
 * @description Send a message in a chat and stream the AI response (SSE).
 * @access private
 */
async function sendMessageController(req, res) {

    const { chatId } = req.params
    const message = req.body.message
    const file = req.file

    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            message: "Message is required and must be a non-empty string."
        })
    }

    try {
        await streamChatReply({
            req,
            res,
            userId: req.user.id,
            chatId,
            message: message.trim(),
            file
        })
    } catch (error) {
        console.error("[Chat] Failed to stream message:", error)

        if (!res.headersSent) {
            const status = error.status || 500
            const errorMessage = error.message || "Failed to generate AI reply. Please try again."
            res.status(status).json({ message: errorMessage })
        } else {
            res.end()
        }
    }

}


/**
 * @name regenerateReplyController
 * @description Regenerate only the last assistant reply (SSE).
 * @access private
 */
async function regenerateReplyController(req, res) {

    const { chatId } = req.params

    try {
        await regenerateReply({
            req,
            res,
            userId: req.user.id,
            chatId
        })
    } catch (error) {
        console.error("[Chat] Failed to regenerate reply:", error)

        if (!res.headersSent) {
            const status = error.status || 500
            const errorMessage = error.message || "Failed to regenerate AI reply."
            res.status(status).json({ message: errorMessage })
        } else {
            res.end()
        }
    }

}


module.exports = {
    createChatController,
    getChatsController,
    getChatByIdController,
    deleteChatController,
    clearChatMessagesController,
    sendMessageController,
    regenerateReplyController
}

