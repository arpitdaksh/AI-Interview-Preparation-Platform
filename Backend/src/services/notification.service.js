const notificationModel = require("../models/notification.model")
const interviewReportModel = require("../models/interviewReport.model")
const roadmapModel = require("../models/roadmap.model")

/**
 * @name getNotifications
 * @description Get reminder notifications for a user's dashboard.
 * Builds Today's Goal, Tomorrow's Goal, and Revision Reminder cards.
 */
async function getNotifications({ userId }) {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

    // Fetch user's latest roadmap and interview report for goal generation
    const latestRoadmap = await roadmapModel.findOne({ user: userId }).sort({ createdAt: -1 })
    const latestReport = await interviewReportModel.findOne({ user: userId }).sort({ createdAt: -1 })

    // Build notifications
    const notifications = []

    // Today's Goal
    if (latestRoadmap && latestRoadmap.weeks && latestRoadmap.weeks.length > 0) {
        const latestWeek = latestRoadmap.weeks[0]
        notifications.push({
            type: "todayGoal",
            title: "Today's Goal",
            message: latestWeek.tasks[0] || `Focus on ${latestWeek.focus}`,
            date: now
        })
    } else if (latestReport) {
        notifications.push({
            type: "todayGoal",
            title: "Today's Goal",
            message: `Prepare for: ${latestReport.title || "your target role"} — review your preparation plan.`,
            date: now
        })
    } else {
        notifications.push({
            type: "todayGoal",
            title: "Today's Goal",
            message: "Generate an interview report to start your personalized prep.",
            date: now
        })
    }

    // Tomorrow's Goal
    if (latestRoadmap && latestRoadmap.weeks && latestRoadmap.weeks.length > 0) {
        const latestWeek = latestRoadmap.weeks[0]
        notifications.push({
            type: "tomorrowGoal",
            title: "Tomorrow's Goal",
            message: latestWeek.tasks[1] || `Complete ${latestWeek.focus} tasks from your roadmap.`,
            date: startOfTomorrow
        })
    } else {
        notifications.push({
            type: "tomorrowGoal",
            title: "Tomorrow's Goal",
            message: "Set up a mock interview to practice your skills.",
            date: startOfTomorrow
        })
    }

    // Revision Reminder
    if (latestReport && latestReport.skillGaps && latestReport.skillGaps.length > 0) {
        const topGap = latestReport.skillGaps[0]
        notifications.push({
            type: "revision",
            title: "Revision Reminder",
            message: `Revise: ${topGap.skill} (${topGap.severity} priority)`,
            date: now
        })
    } else {
        notifications.push({
            type: "revision",
            title: "Revision Reminder",
            message: "Revise key concepts from your latest interview session.",
            date: now
        })
    }

    // Check if any of today's notifications already exist to avoid duplicates
    const existingToday = await notificationModel.findOne({
        user: userId,
        date: { $gte: startOfToday, $lt: startOfTomorrow }
    })

    if (!existingToday) {
        // Persist today's notifications for history
        const persisted = notifications.map(n => ({
            user: userId,
            type: n.type,
            title: n.title,
            message: n.message,
            date: n.date
        }))
        await notificationModel.insertMany(persisted)
    }

    return notifications
}

/**
 * @name getStoredNotifications
 * @description Get all persisted notifications for a user.
 */
async function getStoredNotifications({ userId }) {
    const notifications = await notificationModel.find({ user: userId }).sort({ date: -1 })
    return notifications
}

/**
 * @name markNotificationsRead
 * @description Mark all notifications as read.
 */
async function markNotificationsRead({ userId }) {
    await notificationModel.updateMany({ user: userId, read: false }, { read: true })
    return { success: true }
}

module.exports = { getNotifications, getStoredNotifications, markNotificationsRead }
