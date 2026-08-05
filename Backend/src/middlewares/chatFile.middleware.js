const multer = require("multer")

/**
 * Allowed file types for chat attachments.
 * Only documents that can be parsed for text AND images are supported.
 */
const ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/x-markdown": "md",
    "image/png": "png",
    "image/jpeg": "jpg"
}

/**
 * Multer middleware for chat file uploads.
 * - Uses memory storage (no disk writes).
 * - Max 10MB per file.
 * - Rejects unsupported file types with a clear message.
 */
const chatFileUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const ext = ALLOWED_MIME_TYPES[file.mimetype]
        if (!ext) {
            const err = new Error("Unsupported file type. Allowed: PDF, DOCX, TXT, MD, PNG, JPG, JPEG (max 10MB).")
            err.status = 400
            return cb(err)
        }
        cb(null, true)
    }
})

module.exports = chatFileUpload
