const multer = require("multer")

const ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB (matches the UI dropzone text)
    },
    fileFilter: (req, file, cb) => {
        // Reject files that are not PDF or DOCX with a clear error.
        const ext = ALLOWED_MIME_TYPES[ file.mimetype ]
        if (!ext) {
            const err = new Error("Only PDF or DOCX files are allowed.")
            err.status = 400
            return cb(err)
        }
        cb(null, true)
    }
})


module.exports = upload

