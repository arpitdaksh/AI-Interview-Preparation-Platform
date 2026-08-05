const mockInterviewModel = require("../models/mockInterview.model")
const codingInterviewModel = require("../models/codingInterview.model")
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @name getAnalytics
 * @description Compute analytics dashboard data: avg score, questions answered,
 * strong/weak areas, most asked topics, progress over time.
 */
async function getAnalytics({ userId }) {
    const [
        mockInterviews,
        codingInterviews,
        interviewReports
    ] = await Promise.all([
        mockInterviewModel.find({ user: userId }).sort({ startedAt: 1 }),
        codingInterviewModel.find({ user: userId }).sort({ startedAt: 1 }),
        interviewReportModel.find({ user: userId }).sort({ createdAt: 1 })
    ])

    // All evaluations
    const allMockScores = []
    const areaScores = {} // keyed by type/topic

    mockInterviews.forEach(session => {
        const type = session.type
        if (!areaScores[type]) areaScores[type] = []
        session.questions.forEach(q => {
            if (q.evaluation?.score !== null && q.evaluation?.score !== undefined) {
                allMockScores.push(q.evaluation.score)
                areaScores[type].push(q.evaluation.score)
            }
        })
    })

    codingInterviews.forEach(session => {
        const topic = session.topic
        if (!areaScores[topic]) areaScores[topic] = []
        session.questions.forEach(q => {
            if (q.evaluation?.score !== null && q.evaluation?.score !== undefined) {
                allMockScores.push(q.evaluation.score)
                areaScores[topic].push(q.evaluation.score)
            }
        })
    })

    const avgScore = allMockScores.length > 0
        ? Math.round(allMockScores.reduce((a, b) => a + b, 0) / allMockScores.length * 10) / 10
        : 0

    // Questions answered
    const mockQuestionsAnswered = mockInterviews.reduce(
        (acc, s) => acc + s.questions.filter(q => q.answer && q.answer.trim().length > 0).length, 0
    )
    const codingQuestionsAnswered = codingInterviews.reduce(
        (acc, s) => acc + s.questions.filter(q => q.code && q.code.trim().length > 0).length, 0
    )
    const questionsAnswered = mockQuestionsAnswered + codingQuestionsAnswered

    // Strong / weak areas
    const strongAreas = []
    const weakAreas = []
    Object.entries(areaScores).forEach(([area, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        if (avg >= 7) strongAreas.push({ area, avgScore: Math.round(avg * 10) / 10, count: scores.length })
        else if (avg < 5) weakAreas.push({ area, avgScore: Math.round(avg * 10) / 10, count: scores.length })
    })

    strongAreas.sort((a, b) => b.avgScore - a.avgScore)
    weakAreas.sort((a, b) => a.avgScore - b.avgScore)

    // Most asked topics (interviews per type/topic)
    const topicCounts = {}
    mockInterviews.forEach(s => { topicCounts[s.type] = (topicCounts[s.type] || 0) + 1 })
    codingInterviews.forEach(s => { topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1 })
    const mostAskedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)

    // Progress over time
    const progressOverTime = []
    let cumulativeSum = 0
    let cumulativeCount = 0

    // Combine mock + coding + report events chronologically
    const events = []
    mockInterviews.forEach(s => {
        s.questions.forEach(q => {
            if (q.evaluation?.score !== null && q.evaluation?.score !== undefined) {
                events.push({ date: s.createdAt || s.startedAt, score: q.evaluation.score })
            }
        })
    })
    codingInterviews.forEach(s => {
        s.questions.forEach(q => {
            if (q.evaluation?.score !== null && q.evaluation?.score !== undefined) {
                events.push({ date: s.createdAt || s.startedAt, score: q.evaluation.score })
            }
        })
    })
    events.sort((a, b) => new Date(a.date) - new Date(b.date))

    events.forEach(ev => {
        cumulativeSum += ev.score
        cumulativeCount++
        progressOverTime.push({
            date: ev.date,
            score: Math.round(cumulativeSum / cumulativeCount * 10) / 10
        })
    })

    return {
        avgScore,
        questionsAnswered,
        strongAreas,
        weakAreas,
        mostAskedTopics,
        progressOverTime,
        mockInterviewCount: mockInterviews.length,
        codingInterviewCount: codingInterviews.length,
        interviewReportCount: interviewReports.length
    }
}

module.exports = { getAnalytics }
