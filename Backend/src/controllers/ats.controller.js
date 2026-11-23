const { analyzeResumeAgainstJob } = require("../services/ats.service")

async function checkAtsMatchController(req, res) {
    try {
        const { jobDescription, jobTitle, resumeText } = req.body || {}
        const analysis = await analyzeResumeAgainstJob({
            file: req.file,
            resumeText,
            jobDescription,
            jobTitle
        })

        res.status(200).json({ message: "Resume analysis complete.", analysis })
    } catch (error) {
        console.error("[ATS] Resume analysis failed:", error.message)
        res.status(error.status || 500).json({ message: error.message || "Failed to analyze resume." })
    }
}

module.exports = { checkAtsMatchController }
