const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const { checkAtsMatchController } = require("../controllers/ats.controller")

const atsRouter = express.Router()

atsRouter.post("/check", authMiddleware.authUser, upload.single("resume"), checkAtsMatchController)

module.exports = atsRouter
