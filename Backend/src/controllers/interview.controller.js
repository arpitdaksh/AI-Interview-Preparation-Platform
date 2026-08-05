const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")



/**
 * @description Extract text from an uploaded resume file.
 * Supports PDF (via pdf-parse) and DOCX (via mammoth).
 */
async function extractResumeText(file) {
    if (!file) return ""

    const isPdf = file.mimetype === "application/pdf"
    const isDocx = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    if (isPdf) {
        // pdf-parse v2 API: new PDFParse({ data: buffer }) + parser.getText()
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
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    console.log("========== REQUEST ==========");
    console.log("file present:", !!req.file);
    console.log("file mimetype:", req.file?.mimetype);
    console.log("file size:", req.file?.size);
    console.log(req.body);
    console.log("=============================");

    const { selfDescription, jobDescription } = req.body
    const resumeFile = req.file

    // jobDescription is required to generate a meaningful strategy
    if (!jobDescription || !jobDescription.trim()) {
        return res.status(400).json({
            message: "Job description is required. Please paste the target job description."
        })
    }

    // Either a resume or a self description is required
    if (!resumeFile && (!selfDescription || !selfDescription.trim())) {
        return res.status(400).json({
            message: "Please upload a resume (PDF or DOCX) or provide a self description."
        })
    }

    let resumeContent = ""
    try {
        resumeContent = await extractResumeText(resumeFile)
    } catch (error) {
        console.error("[Controller] Failed to extract resume text:", error)
        return res.status(400).json({
            message: error?.message || "Could not read the resume file. Please upload a valid PDF or DOCX."
        })
    }

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params
        console.log("[Controller] generateResumePdfController called. interviewReportId:", interviewReportId)

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            console.log("[Controller] interview report NOT found")
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport
        console.log("[Controller] resume.length:", resume?.length ?? 0, "jobDescription.length:", jobDescription?.length ?? 0, "selfDescription.length:", selfDescription?.length ?? 0)

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })
        console.log("[Controller] generateResumePdf returned buffer length:", pdfBuffer.length)

        if (!pdfBuffer || pdfBuffer.length === 0) {
            console.log("[Controller] ERROR: pdfBuffer is empty!")
            return res.status(500).json({
                message: "Resume PDF generation returned an empty file."
            })
        }

        console.log("[Controller] PDF magic bytes:", pdfBuffer[0], pdfBuffer[1], pdfBuffer[2], pdfBuffer[3])

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
        console.log("[Controller] PDF sent to client. Bytes:", pdfBuffer.length)
    } catch (error) {
        console.error("[Controller] ERROR generating resume PDF:", error)
        res.status(500).json({
            message: error?.message || "Failed to generate resume PDF."
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }

