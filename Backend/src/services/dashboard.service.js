const interviewReportModel = require("../models/interviewReport.model")
const chatModel = require("../models/chat.model")
const mockInterviewModel = require("../models/mockInterview.model")
const codingInterviewModel = require("../models/codingInterview.model")
const resumeVersionModel = require("../models/resumeVersion.model")
const roadmapModel = require("../models/roadmap.model")

/**
 * @name getDashboardStats
 * @description Aggregate dashboard statistics for a user.
 */
async function getDashboardStats({ userId }) {
    const [
        interviewReports,
        chats,
        mockInterviews,
        codingInterviews,
        resumeVersions,
        roadmaps
    ] = await Promise.all([
        interviewReportModel.find({ user: userId }),
        chatModel.find({ user: userId }),
        mockInterviewModel.find({ user: userId }),
        codingInterviewModel.find({ user: userId }),
        resumeVersionModel.find({ user: userId }),
        roadmapModel.find({ user: userId })
    ])

    // Average match score
    const matchScores = interviewReports.map(r => r.matchScore).filter(s => s !== null && s !== undefined)
    const avgMatchScore = matchScores.length > 0
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : 0

    // Completed interviews
    const completedMockInterviews = mockInterviews.filter(m => m.status === "completed")
    const completedCodingInterviews = codingInterviews.filter(c => c.status === "completed")
    const completedInterviews = completedMockInterviews.length + completedCodingInterviews.length

    // Mock interview average score
    const mockScores = []
    completedMockInterviews.forEach(session => {
        const scores = session.questions
            .filter(q => q.evaluation?.score !== null && q.evaluation?.score !== undefined)
            .map(q => q.evaluation.score)
        if (scores.length > 0) {
            mockScores.push(scores.reduce((a, b) => a + b, 0) / scores.length)
        }
    })
    const avgMockScore = mockScores.length > 0
        ? Math.round(mockScores.reduce((a, b) => a + b, 0) / mockScores.length * 10) / 10
        : 0

    // Coding interview average score
    const codingScores = []
    completedCodingInterviews.forEach(session => {
        const scores = session.questions
            .filter(q => q.evaluation?.score !== null && q.evaluation?.score !== undefined)
            .map(q => q.evaluation.score)
        if (scores.length > 0) {
            codingScores.push(scores.reduce((a, b) => a + b, 0) / scores.length)
        }
    })
    const avgCodingScore = codingScores.length > 0
        ? Math.round(codingScores.reduce((a, b) => a + b, 0) / codingScores.length * 10) / 10
        : 0

    return {
        interviewReportCount: interviewReports.length,
        chatCount: chats.length,
        avgMatchScore,
        completedInterviews,
        resumeVersionCount: resumeVersions.length,
        roadmapCount: roadmaps.length,
        avgMockScore,
        avgCodingScore,
        mockInterviewCount: mockInterviews.length,
        codingInterviewCount: codingInterviews.length,
        totalMessages: chats.reduce((acc, c) => acc + (c.messages?.length || 0), 0)
    }
}

module.exports = { getDashboardStats }
