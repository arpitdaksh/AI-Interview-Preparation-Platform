const { generateSuggestions, getSuggestionsByReport } = require("../services/aiSuggestion.service")

/**
 * @name generateSuggestionsController
 * @description Generate AI suggestions for an interview report.
 * @access private
 */
async function generateSuggestionsController(req, res) {
    const { interviewReportId } = req.body

    if (!interviewReportId) {
        return res.status(400).json({ message: "interviewReportId is required." })
    }

    try {
        const suggestions = await generateSuggestions({ userId: req.user.id, interviewReportId })

        res.status(201).json({ message: "AI suggestions generated.", suggestions })
    } catch (error) {
        console.error("[AISuggestion] Failed to generate:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to generate suggestions." })
    }
}

/**
 * @name getSuggestionsController
 * @description Get stored AI suggestions for a report.
 * @access private
 */
async function getSuggestionsController(req, res) {
    const { interviewReportId } = req.params

    try {
        const suggestions = await getSuggestionsByReport({ userId: req.user.id, interviewReportId })

        res.status(200).json({ message: "AI suggestions fetched.", suggestions })
    } catch (error) {
        console.error("[AISuggestion] Failed to fetch:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch suggestions." })
    }
}

module.exports = {
    generateSuggestionsController,
    getSuggestionsController
}
