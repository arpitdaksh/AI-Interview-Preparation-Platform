const aiSuggestionModel = require("../models/aiSuggestion.model")
const interviewReportModel = require("../models/interviewReport.model")
const { ai } = require("./ai.service")

const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-20b:free"

/**
 * @name generateSuggestions
 * @description Generate AI suggestions for an interview report: top companies,
 * missing skills, courses, projects, certifications.
 */
async function generateSuggestions({ userId, interviewReportId }) {
    const interviewReport = await interviewReportModel.findOne({ _id: interviewReportId, user: userId })

    if (!interviewReport) {
        const error = new Error("Interview report not found.")
        error.status = 404
        throw error
    }

    const prompt = `Based on the following interview report, generate personalized suggestions.

Job Title: ${interviewReport.title || "Not specified"}
Job Description: ${interviewReport.jobDescription || "Not provided"}
Resume: ${interviewReport.resume || "Not provided"}
Match Score: ${interviewReport.matchScore || "N/A"}/100
Skill Gaps: ${(interviewReport.skillGaps || []).map(g => `${g.skill} (${g.severity})`).join(", ")}

Return ONLY valid JSON in this exact format, no other text:

{
  "topCompanies": ["Company 1", "Company 2", "Company 3", "Company 4", "Company 5"],
  "topMissingSkills": ["Skill 1", "Skill 2", "Skill 3"],
  "recommendedCourses": ["Course 1", "Course 2"],
  "recommendedProjects": ["Project 1", "Project 2"],
  "recommendedCertifications": ["Cert 1", "Cert 2"]
}

Provide exactly 5 companies, and 2-4 items for each other category.`

    const response = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
            {
                role: "system",
                content: "You are an AI career advisor. Always return valid JSON with suggestions tailored to the candidate's profile."
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
        throw new Error("AI failed to generate suggestions.")
    }

    // Parse JSON (robust)
    let jsonContent
    try {
        jsonContent = JSON.parse(rawContent)
    } catch {
        const fenced = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i)
        if (fenced) {
            try {
                jsonContent = JSON.parse(fenced[1].trim())
            } catch {
                throw new Error("Failed to parse suggestions JSON from AI response.")
            }
        } else {
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
                                throw new Error("Failed to parse suggestions JSON from AI response.")
                            }
                            break
                        }
                    }
                }
            }
        }
    }

    if (!jsonContent) {
        throw new Error("Failed to parse suggestions from AI response.")
    }

    // Upsert suggestions for this report
    const suggestions = await aiSuggestionModel.findOneAndUpdate(
        { user: userId, interviewReportId },
        {
            user: userId,
            interviewReportId,
            topCompanies: jsonContent.topCompanies || [],
            topMissingSkills: jsonContent.topMissingSkills || [],
            recommendedCourses: jsonContent.recommendedCourses || [],
            recommendedProjects: jsonContent.recommendedProjects || [],
            recommendedCertifications: jsonContent.recommendedCertifications || []
        },
        { new: true, upsert: true }
    )

    return suggestions
}

/**
 * @name getSuggestionsByReport
 * @description Get stored suggestions for a report.
 */
async function getSuggestionsByReport({ userId, interviewReportId }) {
    const suggestions = await aiSuggestionModel.findOne({ user: userId, interviewReportId })

    if (!suggestions) {
        const error = new Error("AI suggestions not found. Generate them first.")
        error.status = 404
        throw error
    }

    return suggestions
}

module.exports = { generateSuggestions, getSuggestionsByReport }
