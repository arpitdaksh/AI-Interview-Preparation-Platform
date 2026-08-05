const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const {
    getNotificationsController,
    getStoredNotificationsController,
    markNotificationsReadController
} = require("../controllers/notification.controller")

const notificationRouter = express.Router()

/**
 * @route GET /api/notifications/
 * @description Get reminder cards (Today's Goal, Tomorrow's Goal, Revision Reminder).
 * @access private
 */
notificationRouter.get("/", authMiddleware.authUser, getNotificationsController)

/**
 * @route GET /api/notifications/history
 * @description Get all persisted notifications.
 * @access private
 */
notificationRouter.get("/history", authMiddleware.authUser, getStoredNotificationsController)

/**
 * @route PATCH /api/notifications/read
 * @description Mark all notifications as read.
 * @access private
 */
notificationRouter.patch("/read", authMiddleware.authUser, markNotificationsReadController)

module.exports = notificationRouter
