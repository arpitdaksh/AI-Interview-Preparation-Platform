const { getAnalytics } = require("../services/analytics.service")

/**
 * @name getAnalyticsController
 * @description Get analytics data for the logged in user.
 * @access private
 */
async function getAnalyticsController(req, res) {
    try {
        const analytics = await getAnalytics({ userId: req.user.id })

        res.status(200).json({ message: "Analytics fetched.", analytics })
    } catch (error) {
        console.error("[Analytics] Failed to fetch:", error)
        res.status(500).json({ message: error.message || "Failed to fetch analytics." })
    }
}

module.exports = { getAnalyticsController }
