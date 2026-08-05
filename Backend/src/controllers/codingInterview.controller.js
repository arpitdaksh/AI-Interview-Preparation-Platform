const { startCodingInterview, submitCodingSolution, getCodingInterview, getUserCodingInterviews } = require("../services/codingInterview.service")

/**
 * @name startCodingInterviewController
 * @description Start a new coding interview session.
 * @access private
 */
async function startCodingInterviewController(req, res) {
    const { topic, language } = req.body

    const validTopics = ["Arrays", "Strings", "Trees", "Graphs", "DP", "SQL", "OOPs"]
    if (!topic || !validTopics.includes(topic)) {
        return res.status(400).json({ message: `Topic is required. Must be one of: ${validTopics.join(", ")}` })
    }

    try {
        const session = await startCodingInterview({
            userId: req.user.id,
            topic,
            language: language || "javascript"
        })

        res.status(201).json({ message: "Coding interview started.", session })
    } catch (error) {
        console.error("[CodingInterview] Failed to start:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to start coding interview." })
    }
}

/**
 * @name submitCodingSolutionController
 * @description Submit a coding solution for evaluation.
 * @access private
 */
async function submitCodingSolutionController(req, res) {
    const { sessionId } = req.params
    const { code, language } = req.body

    if (!code || typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ message: "Code solution is required." })
    }

    try {
        const result = await submitCodingSolution({
            userId: req.user.id,
            sessionId,
            code: code.trim(),
            language: language || "javascript"
        })

        res.status(200).json({ message: "Solution evaluated.", result })
    } catch (error) {
        console.error("[CodingInterview] Failed to submit solution:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to submit solution." })
    }
}

/**
 * @name getCodingInterviewController
 * @description Get a single coding interview session.
 * @access private
 */
async function getCodingInterviewController(req, res) {
    const { sessionId } = req.params

    try {
        const session = await getCodingInterview({ userId: req.user.id, sessionId })

        res.status(200).json({ message: "Coding interview fetched.", session })
    } catch (error) {
        console.error("[CodingInterview] Failed to fetch:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch coding interview." })
    }
}

/**
 * @name getUserCodingInterviewsController
 * @description Get all coding interviews for the user.
 * @access private
 */
async function getUserCodingInterviewsController(req, res) {
    try {
        const sessions = await getUserCodingInterviews({ userId: req.user.id })

        res.status(200).json({ message: "Coding interviews fetched.", sessions })
    } catch (error) {
        console.error("[CodingInterview] Failed to list:", error)
        res.status(500).json({ message: error.message || "Failed to fetch coding interviews." })
    }
}

module.exports = {
    startCodingInterviewController,
    submitCodingSolutionController,
    getCodingInterviewController,
    getUserCodingInterviewsController
}
