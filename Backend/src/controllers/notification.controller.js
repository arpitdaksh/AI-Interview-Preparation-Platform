const { getNotifications, getStoredNotifications, markNotificationsRead } = require("../services/notification.service")

/**
 * @name getNotificationsController
 * @description Get reminder cards (Today's Goal, Tomorrow's Goal, Revision Reminder).
 * @access private
 */
async function getNotificationsController(req, res) {
    try {
        const notifications = await getNotifications({ userId: req.user.id })

        res.status(200).json({ message: "Notifications fetched.", notifications })
    } catch (error) {
        console.error("[Notification] Failed to fetch:", error)
        res.status(500).json({ message: error.message || "Failed to fetch notifications." })
    }
}

/**
 * @name getStoredNotificationsController
 * @description Get all persisted notifications for the user.
 * @access private
 */
async function getStoredNotificationsController(req, res) {
    try {
        const notifications = await getStoredNotifications({ userId: req.user.id })

        res.status(200).json({ message: "Notifications fetched.", notifications })
    } catch (error) {
        console.error("[Notification] Failed to fetch stored:", error)
        res.status(500).json({ message: error.message || "Failed to fetch notifications." })
    }
}

/**
 * @name markNotificationsReadController
 * @description Mark all notifications as read.
 * @access private
 */
async function markNotificationsReadController(req, res) {
    try {
        await markNotificationsRead({ userId: req.user.id })

        res.status(200).json({ message: "Notifications marked as read." })
    } catch (error) {
        console.error("[Notification] Failed to mark read:", error)
        res.status(500).json({ message: error.message || "Failed to update notifications." })
    }
}

module.exports = {
    getNotificationsController,
    getStoredNotificationsController,
    markNotificationsReadController
}
