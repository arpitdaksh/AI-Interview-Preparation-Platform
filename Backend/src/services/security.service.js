/**
 * @name sanitizeInput
 * @description Sanitize user input strings to prevent prompt injection and
 * XSS attacks. Strips HTML tags, trims whitespace, and limits length.
 * @param {string} input - The user input to sanitize.
 * @param {number} [maxLength=10000] - Maximum allowed length.
 * @returns {string} Sanitized input.
 */
function sanitizeInput(input, maxLength = 10000) {
    if (typeof input !== "string") return ""

    let sanitized = input
        .trim()
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Remove script tags and event handlers
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
        // Remove potential prompt injection delimiters
        .replace(/```/g, "'''")
        .replace(/\$\{/g, "\\${")
        // Limit length
        .slice(0, maxLength)

    return sanitized
}

/**
 * @name sanitizeForSystemPrompt
 * @description Separate user content from system instructions to prevent
 * prompt injection. Wraps user content in a clearly delimited block.
 * @param {string} userContent - The user's message content.
 * @returns {string} Wrapped content safe for inclusion in system prompts.
 */
function sanitizeForSystemPrompt(userContent) {
    if (typeof userContent !== "string") return "[empty]"

    const sanitized = sanitizeInput(userContent, 5000)

    return `[BEGIN USER CONTENT]
${sanitized}
[END USER CONTENT]`
}

/**
 * @name validateObjectId
 * @description Basic check that a string looks like a valid MongoDB ObjectId.
 * @param {string} id - The ID to validate.
 * @returns {boolean}
 */
function validateObjectId(id) {
    return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id)
}

/**
 * @name validateEmail
 * @description Basic email format validation.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * @name truncateLog
 * @description Truncate sensitive data for logging to avoid leaking secrets.
 * @param {string} str - The string to truncate.
 * @param {number} [maxLen=100] - Max length.
 * @returns {string}
 */
function truncateLog(str, maxLen = 100) {
    if (typeof str !== "string") return String(str)
    if (str.length <= maxLen) return str
    return str.slice(0, maxLen) + "..."
}

module.exports = {
    sanitizeInput,
    sanitizeForSystemPrompt,
    validateObjectId,
    validateEmail,
    truncateLog
}
