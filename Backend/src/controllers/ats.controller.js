const { analyzeResumeAgainstJob } = require("../services/ats.service")
const billingService = require("../services/billing.service")

async function checkAtsMatchController(req, res) {
    let reservation
    try {
        const { jobDescription, jobTitle, resumeText } = req.body || {}
        reservation = await billingService.reserveAtsCheck(req.user.id)
        const analysis = await analyzeResumeAgainstJob({
            file: req.file,
            resumeText,
            jobDescription,
            jobTitle
        })

        const status = await billingService.getBillingStatus(req.user.id)
        res.status(200).json({ message: "Resume analysis complete.", analysis, status })
    } catch (error) {
        if (reservation && !reservation.isPro) {
            await billingService.releaseAtsCheck(req.user.id).catch(refundError => {
                console.error("[ATS] Could not restore free check after failure:", refundError.message)
            })
        }
        console.error("[ATS] Resume analysis failed:", error.message)
        res.status(error.status || 500).json({
            message: error.message || "Failed to analyze resume.",
            ...(error.code ? { code: error.code } : {})
        })
    }
}

module.exports = { checkAtsMatchController }
