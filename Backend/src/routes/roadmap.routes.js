const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    generateRoadmapController,
    getRoadmapController,
    getUserRoadmapsController
} = require("../controllers/roadmap.controller")

const roadmapRouter = express.Router()

/**
 * @route POST /api/roadmap/
 * @description Generate a 4-week career roadmap from an interview report.
 * @access private
 */
roadmapRouter.post("/", authMiddleware.authUser, generateRoadmapController)

/**
 * @route GET /api/roadmap/
 * @description Get all roadmaps for the user.
 * @access private
 */
roadmapRouter.get("/", authMiddleware.authUser, getUserRoadmapsController)

/**
 * @route GET /api/roadmap/:roadmapId
 * @description Get a roadmap by ID.
 * @access private
 */
roadmapRouter.get("/:roadmapId", authMiddleware.authUser, getRoadmapController)

module.exports = roadmapRouter
