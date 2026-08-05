import axios from "axios";

const api = axios.create({
    baseURL: "https://ai-interview-preparation-platform-fze2.onrender.com",
    withCredentials: true,
})

// ── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
    const response = await api.get("/api/dashboard/")
    return response.data
}

// ── Mock Interview ──────────────────────────────────────────────────────────
export const startMockInterview = async ({ type, durationMin, interviewReportId }) => {
    const response = await api.post("/api/mock-interview/", { type, durationMin, interviewReportId })
    return response.data
}

export const submitMockAnswer = async ({ sessionId, answer }) => {
    const response = await api.post(`/api/mock-interview/${sessionId}/answer`, { answer })
    return response.data
}

export const completeMockInterview = async ({ sessionId }) => {
    const response = await api.post(`/api/mock-interview/${sessionId}/complete`)
    return response.data
}

export const getMockInterviewById = async ({ sessionId }) => {
    const response = await api.get(`/api/mock-interview/${sessionId}`)
    return response.data
}

export const getAllMockInterviews = async () => {
    const response = await api.get("/api/mock-interview/")
    return response.data
}

// ── Coding Interview ────────────────────────────────────────────────────────
export const startCodingInterview = async ({ topic, language }) => {
    const response = await api.post("/api/coding-interview/", { topic, language })
    return response.data
}

export const submitCodingSolution = async ({ sessionId, code, language }) => {
    const response = await api.post(`/api/coding-interview/${sessionId}/solution`, { code, language })
    return response.data
}

export const getCodingInterviewById = async ({ sessionId }) => {
    const response = await api.get(`/api/coding-interview/${sessionId}`)
    return response.data
}

export const getAllCodingInterviews = async () => {
    const response = await api.get("/api/coding-interview/")
    return response.data
}

// ── Roadmap ─────────────────────────────────────────────────────────────────
export const generateRoadmap = async ({ interviewReportId }) => {
    const response = await api.post("/api/roadmap/", { interviewReportId })
    return response.data
}

export const getRoadmapById = async ({ roadmapId }) => {
    const response = await api.get(`/api/roadmap/${roadmapId}`)
    return response.data
}

export const getAllRoadmaps = async () => {
    const response = await api.get("/api/roadmap/")
    return response.data
}

// ── Resume Versions ─────────────────────────────────────────────────────────
export const uploadResumeVersion = async ({ resumeFile, jobTitle }) => {
    const formData = new FormData()
    formData.append("resume", resumeFile)
    if (jobTitle) formData.append("jobTitle", jobTitle)
    const response = await api.post("/api/resumes/", formData)
    return response.data
}

export const getResumeVersions = async () => {
    const response = await api.get("/api/resumes/")
    return response.data
}

export const getResumeVersionById = async ({ resumeId }) => {
    const response = await api.get(`/api/resumes/${resumeId}`)
    return response.data
}

export const deleteResumeVersion = async ({ resumeId }) => {
    const response = await api.delete(`/api/resumes/${resumeId}`)
    return response.data
}

// ── Analytics ───────────────────────────────────────────────────────────────
export const getAnalyticsData = async () => {
    const response = await api.get("/api/analytics/")
    return response.data
}

// ── Notifications ───────────────────────────────────────────────────────────
export const getNotifications = async () => {
    const response = await api.get("/api/notifications/")
    return response.data
}

export const getNotificationHistory = async () => {
    const response = await api.get("/api/notifications/history")
    return response.data
}

export const markNotificationsRead = async () => {
    const response = await api.patch("/api/notifications/read")
    return response.data
}

// ── AI Suggestions ──────────────────────────────────────────────────────────
export const generateAISuggestions = async ({ interviewReportId }) => {
    const response = await api.post("/api/ai-suggestions/", { interviewReportId })
    return response.data
}

export const getAISuggestions = async ({ interviewReportId }) => {
    const response = await api.get(`/api/ai-suggestions/${interviewReportId}`)
    return response.data
}

// ── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = async () => {
    const response = await api.get("/api/user/profile")
    return response.data
}

export const updateProfile = async ({ username, skills, experience, theme }) => {
    const response = await api.patch("/api/user/profile", { username, skills, experience, theme })
    return response.data
}

// ── Export PDF ──────────────────────────────────────────────────────────────
export const exportReportPdf = async ({ interviewReportId }) => {
    const response = await api.get(`/api/export/report/${interviewReportId}`, { responseType: "blob" })
    return response.data
}

export const exportChatPdf = async ({ chatId }) => {
    const response = await api.get(`/api/export/chat/${chatId}`, { responseType: "blob" })
    return response.data
}

export const exportMockInterviewPdf = async ({ sessionId }) => {
    const response = await api.get(`/api/export/mock-interview/${sessionId}`, { responseType: "blob" })
    return response.data
}

export const exportRoadmapPdf = async ({ roadmapId }) => {
    const response = await api.get(`/api/export/roadmap/${roadmapId}`, { responseType: "blob" })
    return response.data
}

// ── Helper: download blob ───────────────────────────────────────────────────
export async function downloadBlob({ blob, fileName }) {
    if (blob?.type?.includes("application/json")) {
        const text = await blob.text()
        let message = "Download failed."
        try {
            message = JSON.parse(text)?.message || message
        } catch { /* ignore */ }
        throw new Error(message)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const pdfBlob = new Blob([ arrayBuffer ], { type: "application/pdf" })
    const url = window.URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
        link.remove()
        window.URL.revokeObjectURL(url)
    }, 1000)
}

