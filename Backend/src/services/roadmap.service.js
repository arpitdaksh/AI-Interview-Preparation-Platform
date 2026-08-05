const roadmapModel = require("../models/roadmap.model")
const interviewReportModel = require("../models/interviewReport.model")
const { ai } = require("./ai.service")

const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-20b:free"

/**
 * @name generateRoadmap
 * @description Generate a 4-week personalized career roadmap based on resume, job description, and skill gaps.
 */
async function generateRoadmap({ userId, interviewReportId }) {
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: userId })

    if (!interviewReport) {
        const error = new Error("Interview report not found.")
        error.status = 404
        throw error
    }

    const prompt = `Generate a personalized 4-week interview preparation roadmap for a candidate.

Job Title: ${interviewReport.title || "Not specified"}
Job Description: ${interviewReport.jobDescription || "Not provided"}
Resume: ${interviewReport.resume || "Not provided"}
Self Description: ${interviewReport.selfDescription || "Not provided"}
Match Score: ${interviewReport.matchScore || "N/A"}/100
Skill Gaps: ${(interviewReport.skillGaps || []).map(g => `${g.skill} (${g.severity})`).join(", ")}
Technical Questions Need to Prepare: ${(interviewReport.technicalQuestions || []).length} questions
Behavioral Questions Need to Prepare: ${(interviewReport.behavioralQuestions || []).length} questions

Return ONLY valid JSON in this exact format, no other text:

{
  "title": "4-Week Interview Preparation Roadmap",
  "summary": "A brief summary of the roadmap",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1 Title",
      "focus": "Main focus for this week",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "resources": ["Resource 1", "Resource 2"]
    }
  ]
}

Generate exactly 4 weeks. Each week should have 3-5 tasks and 1-3 resources.`
    
    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            {
                role: "system",
                content: "You are a career coach that generates personalized interview preparation roadmaps. Always return valid JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7
    })

    const rawContent = response?.choices?.[0]?.message?.content
    if (!rawContent || typeof rawContent !== "string") {
        throw new Error("AI failed to generate roadmap.")
    }

    // Extract JSON from the response
    let jsonContent
    try {
        // Try direct parse first
        jsonContent = JSON.parse(rawContent)
    } catch {
        // Try to extract from markdown code fences
        const fenced = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i)
        if (fenced) {
            try {
                jsonContent = JSON.parse(fenced[1].trim())
            } catch {
                throw new Error("Failed to parse roadmap JSON from AI response.")
            }
        } else {
            // Try to find a balanced { } object
            const start = rawContent.indexOf("{")
            if (start !== -1) {
                let depth = 0
                for (let i = start; i < rawContent.length; i++) {
                    if (rawContent[i] === "{") depth++
                    else if (rawContent[i] === "}") {
                        depth--
                        if (depth === 0) {
                            try {
                                jsonContent = JSON.parse(rawContent.slice(start, i + 1))
                            } catch {
                                throw new Error("Failed to parse roadmap JSON from AI response.")
                            }
                            break
                        }
                    }
                }
            }
        }
    }

    if (!jsonContent || !jsonContent.weeks || !Array.isArray(jsonContent.weeks)) {
        throw new Error("AI response did not contain valid roadmap weeks.")
    }

    // Create the roadmap in the database
    const roadmap = await roadmapModel.create({
        user: userId,
        interviewReportId,
        title: jsonContent.title || "4-Week Interview Preparation Roadmap",
        summary: jsonContent.summary || "",
        weeks: jsonContent.weeks
    })

    return roadmap
}

/**
 * @name getRoadmap
 * @description Get a roadmap by ID.
 */
async function getRoadmap({ userId, roadmapId }) {
    const roadmap = await roadmapModel.findOne({ _id: roadmapId, user: userId })

    if (!roadmap) {
        const error = new Error("Roadmap not found.")
        error.status = 404
        throw error
    }

    return roadmap
}

/**
 * @name getUserRoadmaps
 * @description Get all roadmaps for a user.
 */
async function getUserRoadmaps({ userId }) {
    const roadmaps = await roadmapModel.find({ user: userId }).sort({ createdAt: -1 })

    return roadmaps.map(r => ({
        _id: r._id,
        title: r.title,
        summary: r.summary,
        interviewReportId: r.interviewReportId,
        weekCount: r.weeks.length,
        createdAt: r.createdAt
    }))
}

module.exports = {
    generateRoadmap,
    getRoadmap,
    getUserRoadmaps
}
