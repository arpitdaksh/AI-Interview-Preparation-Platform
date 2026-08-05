const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    exportReportAsPdfController,
    exportChatAsPdfController,
    exportMockInterviewAsPdfController,
    exportRoadmapAsPdfController
} = require("../controllers/export.controller")

const exportRouter = express.Router()

/**
 * @route GET /api/export/report/:interviewReportId
 * @description Export an interview report as PDF.
 * @access private
 */
exportRouter.get("/report/:interviewReportId", authMiddleware.authUser, exportReportAsPdfController)

/**
 * @route GET /api/export/chat/:chatId
 * @description Export a chat conversation as PDF.
 * @access private
 */
exportRouter.get("/chat/:chatId", authMiddleware.authUser, exportChatAsPdfController)

/**
 * @route GET /api/export/mock-interview/:sessionId
 * @description Export a mock interview session as PDF.
 * @access private
 */
exportRouter.get("/mock-interview/:sessionId", authMiddleware.authUser, exportMockInterviewAsPdfController)

/**
 * @route GET /api/export/roadmap/:roadmapId
 * @description Export a career roadmap as PDF.
 * @access private
 */
exportRouter.get("/roadmap/:roadmapId", authMiddleware.authUser, exportRoadmapAsPdfController)

module.exports = exportRouter
