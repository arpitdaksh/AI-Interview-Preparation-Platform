const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    generateSuggestionsController,
    getSuggestionsController
} = require("../controllers/aiSuggestion.controller")

const aiSuggestionRouter = express.Router()

/**
 * @route POST /api/ai-suggestions/
 * @description Generate AI suggestions for an interview report.
 * @access private
 */
aiSuggestionRouter.post("/", authMiddleware.authUser, generateSuggestionsController)

/**
 * @route GET /api/ai-suggestions/:interviewReportId
 * @description Get stored AI suggestions for a report.
 * @access private
 */
aiSuggestionRouter.get("/:interviewReportId", authMiddleware.authUser, getSuggestionsController)

module.exports = aiSuggestionRouter
