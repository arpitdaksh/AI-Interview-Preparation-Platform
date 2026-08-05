const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { getDashboardController } = require("../controllers/dashboard.controller")

const dashboardRouter = express.Router()

/**
 * @route GET /api/dashboard/
 * @description Get aggregated dashboard statistics.
 * @access private
 */
dashboardRouter.get("/", authMiddleware.authUser, getDashboardController)

module.exports = dashboardRouter
