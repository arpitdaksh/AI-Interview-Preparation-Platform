const interviewReportModel = require("../models/interviewReport.model")
const chatModel = require("../models/chat.model")
const mockInterviewModel = require("../models/mockInterview.model")
const roadmapModel = require("../models/roadmap.model")
const { exportInterviewReport, exportChat, exportMockInterview, exportRoadmap } = require("../services/export.service")

/**
 * @name exportReportAsPdfController
 * @description Export an interview report as PDF.
 * @access private
 */
async function exportReportAsPdfController(req, res) {
    const { interviewReportId } = req.params

    try {
        const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
        if (!report) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        const pdfBuffer = await exportInterviewReport(report)

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=interview-report_${interviewReportId}.pdf`
        })
        res.send(pdfBuffer)
    } catch (error) {
        console.error("[Export] Failed to export report:", error)
        res.status(500).json({ message: error.message || "Failed to export report as PDF." })
    }
}

/**
 * @name exportChatAsPdfController
 * @description Export a chat conversation as PDF.
 * @access private
 */
async function exportChatAsPdfController(req, res) {
    const { chatId } = req.params

    try {
        const chat = await chatModel.findOne({ _id: chatId, user: req.user.id })
        if (!chat) {
            return res.status(404).json({ message: "Chat not found." })
        }

        const pdfBuffer = await exportChat(chat)

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=chat_${chatId}.pdf`
        })
        res.send(pdfBuffer)
    } catch (error) {
        console.error("[Export] Failed to export chat:", error)
        res.status(500).json({ message: error.message || "Failed to export chat as PDF." })
    }
}

/**
 * @name exportMockInterviewAsPdfController
 * @description Export a mock interview session as PDF.
 * @access private
 */
async function exportMockInterviewAsPdfController(req, res) {
    const { sessionId } = req.params

    try {
        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id })
        if (!session) {
            return res.status(404).json({ message: "Mock interview not found." })
        }

        const pdfBuffer = await exportMockInterview(session)

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=mock-interview_${sessionId}.pdf`
        })
        res.send(pdfBuffer)
    } catch (error) {
        console.error("[Export] Failed to export mock interview:", error)
        res.status(500).json({ message: error.message || "Failed to export mock interview as PDF." })
    }
}

/**
 * @name exportRoadmapAsPdfController
 * @description Export a career roadmap as PDF.
 * @access private
 */
async function exportRoadmapAsPdfController(req, res) {
    const { roadmapId } = req.params

    try {
        const roadmap = await roadmapModel.findOne({ _id: roadmapId, user: req.user.id })
        if (!roadmap) {
            return res.status(404).json({ message: "Roadmap not found." })
        }

        const pdfBuffer = await exportRoadmap(roadmap)

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=roadmap_${roadmapId}.pdf`
        })
        res.send(pdfBuffer)
    } catch (error) {
        console.error("[Export] Failed to export roadmap:", error)
        res.status(500).json({ message: error.message || "Failed to export roadmap as PDF." })
    }
}

module.exports = {
    exportReportAsPdfController,
    exportChatAsPdfController,
    exportMockInterviewAsPdfController,
    exportRoadmapAsPdfController
}
