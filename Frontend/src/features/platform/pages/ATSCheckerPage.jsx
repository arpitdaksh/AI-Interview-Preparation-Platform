import { useState } from "react"
import { checkAtsMatch } from "../services/platform.api"
import "../style/platform.scss"
import "../style/ats-checker.scss"

const ATSCheckerPage = () => {
    const [resumeFile, setResumeFile] = useState(null)
    const [jobTitle, setJobTitle] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [analysis, setAnalysis] = useState(null)
    const [checking, setChecking] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async event => {
        event.preventDefault()
        setError("")
        setAnalysis(null)
        if (!resumeFile) {
            setError("Choose your resume PDF or DOCX file first.")
            return
        }
        if (jobDescription.trim().length < 80) {
            setError("Paste the full job description (at least 80 characters).")
            return
        }

        setChecking(true)
        try {
            const result = await checkAtsMatch({
                resumeFile,
                jobDescription: jobDescription.trim(),
                jobTitle: jobTitle.trim()
            })
            setAnalysis(result.analysis)
        } catch (requestError) {
            setError(requestError?.response?.data?.message || requestError?.message || "Resume check failed. Please try again.")
        } finally {
            setChecking(false)
        }
    }

    const scoreTone = analysis?.score >= 75 ? "strong" : analysis?.score >= 50 ? "medium" : "low"

    return (
        <div className="platform-page ats-page">
            <header className="platform-header">
                <span className="ats-eyebrow">RESUME TOOL</span>
                <h1>ATS Resume Checker</h1>
                <p className="platform-subtitle">See how your resume lines up with a specific job before you apply.</p>
            </header>

            <form className="ats-form platform-card" onSubmit={handleSubmit}>
                <div className="ats-form__heading">
                    <div>
                        <h2>Check your job match</h2>
                        <p>We send extracted resume text to our AI provider for this check. The uploaded file is not saved to your account.</p>
                    </div>
                    <span className="ats-private-badge">Not saved to profile</span>
                </div>

                <label className="ats-field">
                    <span>Resume file <small>PDF or DOCX · max 5 MB</small></span>
                    <input
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={event => setResumeFile(event.target.files?.[0] || null)}
                        disabled={checking}
                    />
                    {resumeFile && <small className="ats-file-name">📄 {resumeFile.name} · {Math.max(1, Math.round(resumeFile.size / 1024))} KB</small>}
                </label>

                <label className="ats-field">
                    <span>Target job title <small>Optional</small></span>
                    <input
                        className="platform-input"
                        value={jobTitle}
                        onChange={event => setJobTitle(event.target.value)}
                        placeholder="e.g. Frontend Developer"
                        maxLength={160}
                        disabled={checking}
                    />
                </label>

                <label className="ats-field">
                    <span>Job description <small>Paste the full listing for a more useful comparison</small></span>
                    <textarea
                        className="platform-textarea ats-job-description"
                        value={jobDescription}
                        onChange={event => setJobDescription(event.target.value)}
                        placeholder="Paste the job responsibilities, required skills, and qualifications here..."
                        minLength={80}
                        maxLength={18000}
                        required
                        disabled={checking}
                    />
                    <small className="ats-character-count">{jobDescription.length.toLocaleString()} / 18,000 characters</small>
                </label>

                {error && <div className="error-banner" role="alert">{error}</div>}

                <div className="ats-form__footer">
                    <p>AI feedback is a guide, not a guarantee of how an employer’s ATS will score your application.</p>
                    <button className="platform-btn platform-btn--primary" type="submit" disabled={checking}>
                        {checking ? "Checking your match…" : "✨ Check my resume"}
                    </button>
                </div>
            </form>

            {analysis && (
                <section className="ats-results" aria-live="polite">
                    <div className="ats-score-card">
                        <div className={`ats-score ats-score--${scoreTone}`}>
                            <strong>{analysis.score}</strong><span>/ 100</span>
                        </div>
                        <div>
                            <span className="ats-eyebrow">YOUR JOB MATCH</span>
                            <h2>{analysis.score >= 75 ? "Strong match" : analysis.score >= 50 ? "Good starting point" : "Room to improve"}</h2>
                            <p>{analysis.summary}</p>
                        </div>
                    </div>

                    <div className="ats-result-grid">
                        <ResultList title="Skills found in your resume" items={analysis.matchedKeywords} tone="good" empty="No clear matching skills were found." />
                        <ResultList title="Job requirements to address" items={analysis.missingKeywords} tone="attention" empty="No major missing keywords identified." />
                        <ResultList title="Your strengths" items={analysis.strengths} tone="good" empty="No strengths returned." />
                        <ResultList title="Suggested improvements" items={analysis.improvements} tone="attention" empty="No edits suggested." />
                    </div>

                    {analysis.sectionFeedback?.length > 0 && (
                        <div className="platform-card ats-sections">
                            <h2>Section-by-section feedback</h2>
                            {analysis.sectionFeedback.map((item, index) => (
                                <div className="ats-section-row" key={`${item.section}-${index}`}>
                                    <strong>{item.section}</strong>
                                    <span className={`ats-status ats-status--${item.status}`}>{item.status}</span>
                                    <p>{item.feedback}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

const ResultList = ({ title, items, tone, empty }) => (
    <div className="platform-card ats-list-card">
        <h2>{title}</h2>
        {items?.length ? (
            <ul className={`ats-list ats-list--${tone}`}>
                {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
        ) : <p className="ats-empty">{empty}</p>}
    </div>
)

export default ATSCheckerPage
