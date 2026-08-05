const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    startCodingInterviewController,
    submitCodingSolutionController,
    getCodingInterviewController,
    getUserCodingInterviewsController
} = require("../controllers/codingInterview.controller")

const codingInterviewRouter = express.Router()

/**
 * @route POST /api/coding-interview/
 * @description Start a new coding interview session.
 * @access private
 */
codingInterviewRouter.post("/", authMiddleware.authUser, startCodingInterviewController)

/**
 * @route GET /api/coding-interview/
 * @description Get all coding interviews for the user.
 * @access private
 */
codingInterviewRouter.get("/", authMiddleware.authUser, getUserCodingInterviewsController)

/**
 * @route POST /api/coding-interview/:sessionId/solution
 * @description Submit a coding solution for evaluation.
 * @access private
 */
codingInterviewRouter.post("/:sessionId/solution", authMiddleware.authUser, submitCodingSolutionController)

/**
 * @route GET /api/coding-interview/:sessionId
 * @description Get a single coding interview session.
 * @access private
 */
codingInterviewRouter.get("/:sessionId", authMiddleware.authUser, getCodingInterviewController)

module.exports = codingInterviewRouter
