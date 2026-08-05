const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    startMockInterviewController,
    submitAnswerController,
    completeMockInterviewController,
    getMockInterviewController,
    getUserMockInterviewsController
} = require("../controllers/mockInterview.controller")

const mockInterviewRouter = express.Router()

/**
 * @route POST /api/mock-interview/
 * @description Start a new mock interview session.
 * @access private
 */
mockInterviewRouter.post("/", authMiddleware.authUser, startMockInterviewController)

/**
 * @route GET /api/mock-interview/
 * @description Get all mock interviews for the user.
 * @access private
 */
mockInterviewRouter.get("/", authMiddleware.authUser, getUserMockInterviewsController)

/**
 * @route POST /api/mock-interview/:sessionId/answer
 * @description Submit an answer and get evaluation + next question.
 * @access private
 */
mockInterviewRouter.post("/:sessionId/answer", authMiddleware.authUser, submitAnswerController)

/**
 * @route POST /api/mock-interview/:sessionId/complete
 * @description Complete a mock interview session.
 * @access private
 */
mockInterviewRouter.post("/:sessionId/complete", authMiddleware.authUser, completeMockInterviewController)

/**
 * @route GET /api/mock-interview/:sessionId
 * @description Get a single mock interview session.
 * @access private
 */
mockInterviewRouter.get("/:sessionId", authMiddleware.authUser, getMockInterviewController)

module.exports = mockInterviewRouter
