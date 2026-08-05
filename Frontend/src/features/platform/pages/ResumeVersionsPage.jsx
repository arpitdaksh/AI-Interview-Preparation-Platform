import React, { useState, useEffect, useCallback } from 'react'
import { uploadResumeVersion, getResumeVersions, deleteResumeVersion, getResumeVersionById } from '../services/platform.api'
import "../style/platform.scss"

const ResumeVersionsPage = () => {
    const [ versions, setVersions ] = useState([])
    const [ file, setFile ] = useState(null)
    const [ jobTitle, setJobTitle ] = useState("")
    const [ uploading, setUploading ] = useState(false)
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState("")
    const [ success, setSuccess ] = useState("")
    const [ preview, setPreview ] = useState(null)

    const loadVersions = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const data = await getResumeVersions()
            setVersions(data.resumes || [])
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load resumes.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadVersions()
    }, [ loadVersions ])

    const handleUpload = async () => {
        if (!file) {
            setError("Please choose a PDF or DOCX resume first.")
            return
        }
        setUploading(true)
        setError("")
        setSuccess("")
        try {
            const data = await uploadResumeVersion({ resumeFile: file, jobTitle: jobTitle.trim() || undefined })
            setSuccess(data.message || "Resume uploaded successfully.")
            setVersions(prev => [ data.resume, ...prev ])
            setFile(null)
            setJobTitle("")
            if (document.getElementById("resume-file-input")) {
                document.getElementById("resume-file-input").value = ""
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to upload resume.")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this resume version?")) return
        try {
            await deleteResumeVersion({ resumeId: id })
            setVersions(prev => prev.filter(v => v._id !== id))
            setSuccess("Resume version deleted.")
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to delete resume.")
        }
    }

    const handlePreview = async (id) => {
        try {
            const data = await getResumeVersionById({ resumeId: id })
            setPreview(data.resume)
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load preview.")
        }
    }

    return (
        <div className="platform-page">
            <header className="platform-header">
                <h1>Resume Versions</h1>
                <p className="platform-subtitle">Track and manage your resume history.</p>
            </header>

            {/* Upload card */}
            <div className="platform-card">
                <div className="platform-card__header">
                    <span className="platform-card__title">Upload New Version</span>
                </div>

                <div className="resume-upload">
                    <div className="platform-field">
                        <label>Resume File (PDF or DOCX, max 5MB)</label>
                        <input
                            id="resume-file-input"
                            type="file"
                            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="platform-file-input"
                        />
                        {file && <span className="resume-upload__file-name">📄 {file.name} ({Math.round(file.size / 1024)} KB)</span>}
                    </div>

                    <div className="platform-field">
                        <label>Target Job Title (optional)</label>
                        <input
                            className="platform-input"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                        />
                    </div>

                    {error && <div className="error-banner">{error}</div>}
                    {success && <div className="success-banner">{success}</div>}

                    <button
                        className="platform-btn platform-btn--primary"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? "Uploading..." : "⬆ Upload Resume"}
                    </button>
                </div>
            </div>

            {/* Versions list */}
            {loading ? (
                <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Loading...</div></div>
            ) : versions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">📄</div>
                    <div className="empty-state__title">No resume versions yet</div>
                    <div className="empty-state__subtitle">Upload your resume to start tracking versions.</div>
                </div>
            ) : (
                <div className="resume-list">
                    <h2>Saved Versions</h2>
                    <div className="resume-list__grid">
                        {versions.map((v, i) => (
                            <div key={v._id} className="resume-item">
                                <div className="resume-item__badge">V{versions.length - i}</div>
                                <div className="resume-item__info">
                                    <div className="resume-item__title">{v.jobTitle || v.fileName || "Resume"}</div>
                                    <div className="resume-item__meta">
                                        {v.fileName} · {new Date(v.createdAt).toLocaleDateString()}
                                    </div>
                                    {v.resumeText && (
                                        <div className="resume-item__excerpt">{v.resumeText.slice(0, 140)}...</div>
                                    )}
                                </div>
                                <div className="resume-item__actions">
                                    <button className="platform-btn platform-btn--secondary platform-btn--small" onClick={() => handlePreview(v._id)}>👁 Preview</button>
                                    <button className="platform-btn platform-btn--danger platform-btn--small" onClick={() => handleDelete(v._id)}>🗑</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview modal */}
            {preview && (
                <div className="preview-modal" onClick={() => setPreview(null)}>
                    <div className="preview-modal__content" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-modal__header">
                            <h3>{preview.fileName || "Resume Preview"}</h3>
                            <button className="platform-btn platform-btn--danger platform-btn--small" onClick={() => setPreview(null)}>✕</button>
                        </div>
                        <pre className="preview-modal__body">{preview.resumeText || "No extracted text available."}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeVersionsPage
