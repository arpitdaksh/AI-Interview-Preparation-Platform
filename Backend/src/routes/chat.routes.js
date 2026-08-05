const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const chatFileUpload = require("../middlewares/chatFile.middleware")
const {
    createChatController,
    getChatsController,
    getChatByIdController,
    deleteChatController,
    clearChatMessagesController,
    sendMessageController,
    regenerateReplyController
} = require("../controllers/chat.controller")

const chatRouter = express.Router()


/**
 * @route POST /api/chat
 * @description Create a new chat (empty or with a message — backward compatible).
 * @access private
 */
chatRouter.post("/", authMiddleware.authUser, createChatController)


/**
 * @route GET /api/chat
 * @description Get all chats for the logged in user, newest first.
 * @access private
 */
chatRouter.get("/", authMiddleware.authUser, getChatsController)


/**
 * @route GET /api/chat/:chatId
 * @description Get a single chat with its messages.
 * @access private
 */
chatRouter.get("/:chatId", authMiddleware.authUser, getChatByIdController)


/**
 * @route DELETE /api/chat/:chatId
 * @description Delete a chat.
 * @access private
 */
chatRouter.delete("/:chatId", authMiddleware.authUser, deleteChatController)


/**
 * @route POST /api/chat/:chatId/messages
 * @description Send a message in a chat and stream the AI response.
 * @access private
 */
chatRouter.post("/:chatId/messages", authMiddleware.authUser, chatFileUpload.single("file"), sendMessageController)


/**
 * @route DELETE /api/chat/:chatId/messages
 * @description Clear all messages in a chat (conversation kept).
 * @access private
 */
chatRouter.delete("/:chatId/messages", authMiddleware.authUser, clearChatMessagesController)


/**
 * @route POST /api/chat/:chatId/regenerate
 * @description Regenerate the last assistant reply.
 * @access private
 */
chatRouter.post("/:chatId/regenerate", authMiddleware.authUser, regenerateReplyController)


module.exports = chatRouter
