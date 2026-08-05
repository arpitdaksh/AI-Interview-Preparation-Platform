const { getDashboardStats } = require("../services/dashboard.service")

/**
 * @name getDashboardController
 * @description Get aggregated dashboard statistics for the logged in user.
 * @access private
 */
async function getDashboardController(req, res) {
    try {
        const stats = await getDashboardStats({ userId: req.user.id })

        res.status(200).json({ message: "Dashboard stats fetched.", stats })
    } catch (error) {
        console.error("[Dashboard] Failed to fetch:", error)
        res.status(500).json({ message: error.message || "Failed to fetch dashboard stats." })
    }
}

module.exports = { getDashboardController }
