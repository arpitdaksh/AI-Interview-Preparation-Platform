import React, { useState, useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { getProfile, updateProfile } from '../services/platform.api'
import "../style/platform.scss"
import "../style/profile.scss"

const ProfilePage = () => {
    const { user } = useAuth()
    const [ profile, setProfile ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const [ saving, setSaving ] = useState(false)
    const [ error, setError ] = useState("")
    const [ success, setSuccess ] = useState("")

    // Form fields
    const [ username, setUsername ] = useState("")
    const [ skills, setSkills ] = useState("")
    const [ experience, setExperience ] = useState("")
    const [ theme, setTheme ] = useState("dark")

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getProfile()
                const p = data.user
                setProfile(p)
                setUsername(p.username || "")
                setSkills((p.skills || []).join(", "))
                setExperience(p.experience || "")
                setTheme(p.theme || "dark")
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || "Failed to load profile.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setError("")
        setSuccess("")
        try {
            const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean)
            const data = await updateProfile({
                username: username.trim() || undefined,
                skills: skillsArray.length > 0 ? skillsArray : undefined,
                experience: experience.trim() || undefined,
                theme
            })
            setProfile(data.user)
            setSuccess("Profile updated successfully!")
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to update profile.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="platform-page">
                <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Loading profile...</div></div>
            </div>
        )
    }

    return (
        <div className="platform-page">
            <header className="platform-header">
                <h1>Profile</h1>
                <p className="platform-subtitle">Manage your account and preferences.</p>
            </header>

            <div className="profile-layout">
                {/* Info Card */}
                <div className="profile-card">
                    <div className="profile-card__avatar">
                        {(profile?.username || user?.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-card__info">
                        <h2>{profile?.username || user?.username || "User"}</h2>
                        <p>{profile?.email || user?.email || ""}</p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="platform-card">
                    <div className="platform-card__header">
                        <span className="platform-card__title">Edit Profile</span>
                    </div>

                    {error && <div className="error-banner">{error}</div>}
                    {success && <div className="success-banner">{success}</div>}

                    <div className="platform-field">
                        <label>Username</label>
                        <input
                            className="platform-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>

                    <div className="platform-field">
                        <label>Email</label>
                        <input
                            className="platform-input"
                            value={profile?.email || user?.email || ""}
                            disabled
                            placeholder="Email address"
                        />
                        <span className="field-hint">Email cannot be changed.</span>
                    </div>

                    <div className="platform-field">
                        <label>Skills (comma-separated)</label>
                        <input
                            className="platform-input"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g. JavaScript, React, Node.js, Python"
                        />
                    </div>

                    <div className="platform-field">
                        <label>Experience</label>
                        <textarea
                            className="platform-textarea"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="Briefly describe your professional experience and background."
                            rows={4}
                        />
                    </div>

                    <div className="platform-field">
                        <label>Theme</label>
                        <select
                            className="platform-select"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>

                    <button
                        className="platform-btn platform-btn--primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "💾 Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
