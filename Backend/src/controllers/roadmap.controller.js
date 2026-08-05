const { generateRoadmap, getRoadmap, getUserRoadmaps } = require("../services/roadmap.service")

/**
 * @name generateRoadmapController
 * @description Generate a 4-week career roadmap from an interview report.
 * @access private
 */
async function generateRoadmapController(req, res) {
    const { interviewReportId } = req.body

    if (!interviewReportId) {
        return res.status(400).json({ message: "interviewReportId is required." })
    }

    try {
        const roadmap = await generateRoadmap({ userId: req.user.id, interviewReportId })

        res.status(201).json({ message: "Roadmap generated.", roadmap })
    } catch (error) {
        console.error("[Roadmap] Failed to generate:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to generate roadmap." })
    }
}

/**
 * @name getRoadmapController
 * @description Get a roadmap by ID.
 * @access private
 */
async function getRoadmapController(req, res) {
    const { roadmapId } = req.params

    try {
        const roadmap = await getRoadmap({ userId: req.user.id, roadmapId })

        res.status(200).json({ message: "Roadmap fetched.", roadmap })
    } catch (error) {
        console.error("[Roadmap] Failed to fetch:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch roadmap." })
    }
}

/**
 * @name getUserRoadmapsController
 * @description Get all roadmaps for the user.
 * @access private
 */
async function getUserRoadmapsController(req, res) {
    try {
        const roadmaps = await getUserRoadmaps({ userId: req.user.id })

        res.status(200).json({ message: "Roadmaps fetched.", roadmaps })
    } catch (error) {
        console.error("[Roadmap] Failed to list:", error)
        res.status(500).json({ message: error.message || "Failed to fetch roadmaps." })
    }
}

module.exports = {
    generateRoadmapController,
    getRoadmapController,
    getUserRoadmapsController
}
