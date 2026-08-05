const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { getProfileController, updateProfileController } = require("../controllers/user.controller")

const userRouter = express.Router()

/**
 * @route GET /api/user/profile
 * @description Get the logged in user's profile.
 * @access private
 */
userRouter.get("/profile", authMiddleware.authUser, getProfileController)

/**
 * @route PATCH /api/user/profile
 * @description Update profile fields (username, skills, experience, theme).
 * @access private
 */
userRouter.patch("/profile", authMiddleware.authUser, updateProfileController)

module.exports = userRouter
