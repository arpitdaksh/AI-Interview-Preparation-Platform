const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")

/**
 * Extract raw text from a PDF buffer.
 */
async function extractTextFromPdf(buffer) {
    const data = await pdfParse(buffer)
    return (data && data.text) || ""
}

/**
 * Extract raw text from a DOCX buffer using mammoth.
 */
async function extractTextFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer })
    return (result && result.value) || ""
}

/**
 * Decode a plain-text buffer (TXT / MD) to a string.
 */
function extractTextFromPlain(buffer) {
    return buffer.toString("utf-8")
}

/**
 * Extracts the text content of an uploaded chat file so it can be passed to the
 * AI as context. For images (no OCR available) it returns a friendly marker.
 *
 * @param {{file: {buffer: Buffer, mimetype: string, originalname: string}}} input
 * @returns {Promise<{text: string, kind: string, imageName?: string}>}
 */
async function extractFileText({ file }) {
    if (!file) return { text: "", kind: "none" }

    const mime = file.mimetype

    if (mime === "application/pdf") {
        return { text: await extractTextFromPdf(file.buffer), kind: "pdf" }
    }

    if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        return { text: await extractTextFromDocx(file.buffer), kind: "docx" }
    }

    if (mime === "text/plain" || mime === "text/markdown" || mime === "text/x-markdown") {
        return { text: extractTextFromPlain(file.buffer), kind: "text" }
    }

    // Images: no OCR available in this backend — mark them so the AI knows a
    // file was attached even though its contents cannot be read.
    return { text: "", kind: "image", imageName: file.originalname || "image" }
}

module.exports = { extractFileText }
