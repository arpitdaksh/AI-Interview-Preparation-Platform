const userModel = require("../models/user.model")
const { sanitizeInput } = require("./security.service")

/**
 * @name getProfile
 * @description Get the logged in user's profile.
 */
async function getProfile({ userId }) {
    const user = await userModel.findById(userId).select("-password")

    if (!user) {
        const error = new Error("User not found.")
        error.status = 404
        throw error
    }

    return user
}

/**
 * @name updateProfile
 * @description Update profile fields (username, skills, experience, theme).
 */
async function updateProfile({ userId, updateData }) {
    const user = await userModel.findById(userId)

    if (!user) {
        const error = new Error("User not found.")
        error.status = 404
        throw error
    }

    // Sanitize string inputs
    if (updateData.username !== undefined) {
        const username = sanitizeInput(updateData.username, 60)
        if (username) user.username = username
    }

    if (updateData.experience !== undefined) {
        user.experience = sanitizeInput(updateData.experience, 500)
    }

    if (updateData.theme !== undefined) {
        user.theme = updateData.theme === "dark" ? "dark" : "light"
    }

    if (updateData.skills !== undefined) {
        user.skills = (Array.isArray(updateData.skills) ? updateData.skills : [])
            .filter(s => typeof s === "string")
            .map(s => sanitizeInput(s, 80))
            .filter(s => s.length > 0)
    }

    await user.save()

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        skills: user.skills,
        experience: user.experience,
        theme: user.theme
    }
}

module.exports = { getProfile, updateProfile }
