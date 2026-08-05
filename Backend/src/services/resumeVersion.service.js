const resumeVersionModel = require("../models/resumeVersion.model")
const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")

/**
 * @name extractResumeText
 * @description Extract text from an uploaded resume file (PDF or DOCX).
 */
async function extractResumeText(file) {
    if (!file) return ""

    const isPdf = file.mimetype === "application/pdf"
    const isDocx = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    if (isPdf) {
        const parser = new pdfParse.PDFParse({ data: file.buffer })
        try {
            const result = await parser.getText()
            return result.text
        } finally {
            await parser.destroy()
        }
    }

    if (isDocx) {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        return result.value
    }

    throw new Error("Unsupported file type. Please upload a PDF or DOCX.")
}

/**
 * @name uploadResume
 * @description Upload a new resume version.
 */
async function uploadResume({ userId, file, jobTitle }) {
    const resumeText = await extractResumeText(file)

    // Count existing versions
    const existingCount = await resumeVersionModel.countDocuments({ user: userId })

    const version = await resumeVersionModel.create({
        user: userId,
        version: existingCount + 1,
        fileName: file.originalname || "resume.pdf",
        resumeText,
        jobTitle: jobTitle || ""
    })

    return version
}

/**
 * @name getUserResumes
 * @description Get all resume versions for a user.
 */
async function getUserResumes({ userId }) {
    const resumes = await resumeVersionModel.find({ user: userId }).sort({ version: -1 })

    return resumes.map(r => ({
        _id: r._id,
        version: r.version,
        fileName: r.fileName,
        jobTitle: r.jobTitle,
        resumeTextLength: r.resumeText?.length || 0,
        createdAt: r.createdAt
    }))
}

/**
 * @name getResumeVersion
 * @description Get a specific resume version.
 */
async function getResumeVersion({ userId, resumeId }) {
    const resume = await resumeVersionModel.findOne({ _id: resumeId, user: userId })

    if (!resume) {
        const error = new Error("Resume version not found.")
        error.status = 404
        throw error
    }

    return resume
}

/**
 * @name deleteResumeVersion
 * @description Delete a resume version.
 */
async function deleteResumeVersion({ userId, resumeId }) {
    const resume = await resumeVersionModel.findOneAndDelete({ _id: resumeId, user: userId })

    if (!resume) {
        const error = new Error("Resume version not found.")
        error.status = 404
        throw error
    }

    return resume
}

module.exports = {
    uploadResume,
    getUserResumes,
    getResumeVersion,
    deleteResumeVersion
}
