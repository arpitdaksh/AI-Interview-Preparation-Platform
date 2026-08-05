const { getProfile, updateProfile } = require("../services/user.service")

/**
 * @name getProfileController
 * @description Get the logged in user's profile.
 * @access private
 */
async function getProfileController(req, res) {
    try {
        const profile = await getProfile({ userId: req.user.id })

        res.status(200).json({
            message: "Profile fetched.",
            user: {
                id: profile._id,
                username: profile.username,
                email: profile.email,
                skills: profile.skills || [],
                experience: profile.experience || "",
                theme: profile.theme || "light"
            }
        })
    } catch (error) {
        console.error("[User] Failed to fetch profile:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to fetch profile." })
    }
}

/**
 * @name updateProfileController
 * @description Update profile fields (username, skills, experience, theme).
 * @access private
 */
async function updateProfileController(req, res) {
    const { username, skills, experience, theme } = req.body

    try {
        const user = await updateProfile({
            userId: req.user.id,
            updateData: { username, skills, experience, theme }
        })

        res.status(200).json({ message: "Profile updated.", user })
    } catch (error) {
        console.error("[User] Failed to update profile:", error)
        res.status(error.status || 500).json({ message: error.message || "Failed to update profile." })
    }
}

module.exports = { getProfileController, updateProfileController }
