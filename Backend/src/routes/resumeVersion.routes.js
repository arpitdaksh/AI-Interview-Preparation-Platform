const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const {
    uploadResumeController,
    getUserResumesController,
    getResumeVersionController,
    deleteResumeVersionController
} = require("../controllers/resumeVersion.controller")

const resumeVersionRouter = express.Router()

/**
 * @route POST /api/resumes/
 * @description Upload a new resume version.
 * @access private
 */
resumeVersionRouter.post("/", authMiddleware.authUser, upload.single("resume"), uploadResumeController)

/**
 * @route GET /api/resumes/
 * @description Get all resume versions for the user.
 * @access private
 */
resumeVersionRouter.get("/", authMiddleware.authUser, getUserResumesController)

/**
 * @route GET /api/resumes/:resumeId
 * @description Get a specific resume version.
 * @access private
 */
resumeVersionRouter.get("/:resumeId", authMiddleware.authUser, getResumeVersionController)

/**
 * @route DELETE /api/resumes/:resumeId
 * @description Delete a resume version.
 * @access private
 */
resumeVersionRouter.delete("/:resumeId", authMiddleware.authUser, deleteResumeVersionController)

module.exports = resumeVersionRouter
