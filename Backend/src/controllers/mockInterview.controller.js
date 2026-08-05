const { startMockInterview, submitAnswer, completeMockInterview, getMockInterview, getUserMockInterviews } = require("../services/mockInterview.service")

/**
 * @name startMockInterviewController
 * @description Start a new mock interview session.
 * @access private
 */
async function startMockInterviewController(req, res) {
    const { type, durationMin, interviewReportId } = req.body

    if (!type) {
        return res.status(400).json({ message: "Interview type is required (HR, Technical, Behavioral, DSA, System Design)." })
    }

    const validTypes = ["HR", "Technical", "Behavioral", "DSA", "System Design"]
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` })
    }

    try {
        const session = await startMockInterview({
            userId: req.user.id,
            type,
            durationMin: durationMin || 30,
            interviewReportId
        })

        res.status(201).json({ message: "Mock interview started.", session })
    } catch (error) {
        console.error("[MockInterview] Failed to start:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to start mock interview." })
    }
}

/**
 * @name submitAnswerController
 * @description Submit an answer and get evaluation + next question.
 * @access private
 */
async function submitAnswerController(req, res) {
    const { sessionId } = req.params
    const { answer } = req.body

    if (!answer || typeof answer !== "string" || !answer.trim()) {
        return res.status(400).json({ message: "Answer is required." })
    }

    try {
        const result = await submitAnswer({
            userId: req.user.id,
            sessionId,
            answer: answer.trim()
        })

        res.status(200).json({ message: "Answer submitted.", result })
    } catch (error) {
        console.error("[MockInterview] Failed to submit answer:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to submit answer." })
    }
}

/**
 * @name completeMockInterviewController
 * @description Complete a mock interview session.
 * @access private
 */
async function completeMockInterviewController(req, res) {
    const { sessionId } = req.params

    try {
        const result = await completeMockInterview({ userId: req.user.id, sessionId })

        res.status(200).json({ message: "Mock interview completed.", result })
    } catch (error) {
        console.error("[MockInterview] Failed to complete:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to complete mock interview." })
    }
}

/**
 * @name getMockInterviewController
 * @description Get a single mock interview session.
 * @access private
 */
async function getMockInterviewController(req, res) {
    const { sessionId } = req.params

    try {
        const session = await getMockInterview({ userId: req.user.id, sessionId })

        res.status(200).json({ message: "Mock interview fetched.", session })
    } catch (error) {
        console.error("[MockInterview] Failed to fetch:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch mock interview." })
    }
}

/**
 * @name getUserMockInterviewsController
 * @description Get all mock interviews for the user.
 * @access private
 */
async function getUserMockInterviewsController(req, res) {
    try {
        const sessions = await getUserMockInterviews({ userId: req.user.id })

        res.status(200).json({ message: "Mock interviews fetched.", sessions })
    } catch (error) {
        console.error("[MockInterview] Failed to list:", error)
        res.status(500).json({ message: error.message || "Failed to fetch mock interviews." })
    }
}

module.exports = {
    startMockInterviewController,
    submitAnswerController,
    completeMockInterviewController,
    getMockInterviewController,
    getUserMockInterviewsController
}
