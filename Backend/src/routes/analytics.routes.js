const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { getAnalyticsController } = require("../controllers/analytics.controller")

const analyticsRouter = express.Router()

/**
 * @route GET /api/analytics/
 * @description Get analytics data for the user.
 * @access private
 */
analyticsRouter.get("/", authMiddleware.authUser, getAnalyticsController)

module.exports = analyticsRouter
