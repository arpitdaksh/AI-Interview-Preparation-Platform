const { uploadResume, getUserResumes, getResumeVersion, deleteResumeVersion } = require("../services/resumeVersion.service")

/**
 * @name uploadResumeController
 * @description Upload a new resume version.
 * @access private
 */
async function uploadResumeController(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: "Resume file is required (PDF or DOCX)." })
    }

    const { jobTitle } = req.body

    try {
        const version = await uploadResume({
            userId: req.user.id,
            file: req.file,
            jobTitle
        })

        res.status(201).json({ message: "Resume uploaded.", version })
    } catch (error) {
        console.error("[ResumeVersion] Failed to upload:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to upload resume." })
    }
}

/**
 * @name getUserResumesController
 * @description Get all resume versions for the user.
 * @access private
 */
async function getUserResumesController(req, res) {
    try {
        const resumes = await getUserResumes({ userId: req.user.id })

        res.status(200).json({ message: "Resumes fetched.", resumes })
    } catch (error) {
        console.error("[ResumeVersion] Failed to list:", error)
        res.status(500).json({ message: error.message || "Failed to fetch resumes." })
    }
}

/**
 * @name getResumeVersionController
 * @description Get a specific resume version.
 * @access private
 */
async function getResumeVersionController(req, res) {
    const { resumeId } = req.params

    try {
        const resume = await getResumeVersion({ userId: req.user.id, resumeId })

        res.status(200).json({ message: "Resume fetched.", resume })
    } catch (error) {
        console.error("[ResumeVersion] Failed to fetch:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch resume." })
    }
}

/**
 * @name deleteResumeVersionController
 * @description Delete a resume version.
 * @access private
 */
async function deleteResumeVersionController(req, res) {
    const { resumeId } = req.params

    try {
        await deleteResumeVersion({ userId: req.user.id, resumeId })

        res.status(200).json({ message: "Resume version deleted." })
    } catch (error) {
        console.error("[ResumeVersion] Failed to delete:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to delete resume." })
    }
}

module.exports = {
    uploadResumeController,
    getUserResumesController,
    getResumeVersionController,
    deleteResumeVersionController
}
