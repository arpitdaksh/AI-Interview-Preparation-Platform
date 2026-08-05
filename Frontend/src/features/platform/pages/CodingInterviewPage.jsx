import React, { useState } from 'react'
import { startCodingInterview, submitCodingSolution, exportMockInterviewPdf } from '../services/platform.api'
import { downloadBlob } from '../services/platform.api'
import "../style/mock.scss"
import "../style/platform.scss"

const TOPICS = [ "Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming", "SQL", "OOPs" ]
const LANGUAGES = [ "javascript", "python", "java", "cpp", "sql" ]

const CodingInterviewPage = () => {
    const [ topic, setTopic ] = useState("Arrays")
    const [ language, setLanguage ] = useState("javascript")
    const [ session, setSession ] = useState(null)
    const [ currentQuestion, setCurrentQuestion ] = useState("")
    const [ code, setCode ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const [ submitting, setSubmitting ] = useState(false)
    const [ evaluation, setEvaluation ] = useState(null)
    const [ error, setError ] = useState("")
    const [ completed, setCompleted ] = useState(false)

    const handleStart = async () => {
        setLoading(true)
        setError("")
        setEvaluation(null)
        setCompleted(false)
        try {
            const data = await startCodingInterview({ topic, language })
            setSession(data.session)
            setCurrentQuestion(data.session.currentQuestion)
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to start coding interview.")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!session || !code.trim() || submitting) return

        setSubmitting(true)
        setError("")
        try {
            const data = await submitCodingSolution({ sessionId: session.sessionId, code, language })
            setEvaluation(data.result?.evaluation)
            if (data.result?.status === "completed" || data.result?.questionCompleted) {
                setCompleted(true)
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to evaluate your solution.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleExport = async () => {
        try {
            const blob = await exportMockInterviewPdf({ sessionId: session.sessionId })
            await downloadBlob({ blob, fileName: `coding-interview_${session.sessionId}.pdf` })
        } catch (err) {
            setError(err?.message || "Failed to export PDF.")
        }
    }

    const handleReset = () => {
        setSession(null)
        setCurrentQuestion("")
        setCode("")
        setEvaluation(null)
        setCompleted(false)
        setError("")
    }

    // Setup screen
    if (!session) {
        return (
            <div className="platform-page">
                <header className="platform-header">
                    <h1>Coding Interview</h1>
                    <p className="platform-subtitle">Solve AI-generated problems and get instant feedback.</p>
                </header>

                <div className="mock-setup">
                    <div className="mock-setup__card">
                        <div className="platform-field">
                            <label>Topic</label>
                            <div className="type-grid">
                                {TOPICS.map(t => (
                                    <button
                                        key={t}
                                        className={`type-chip ${topic === t ? "type-chip--active" : ""}`}
                                        onClick={() => setTopic(t)}
                                        type="button"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="platform-field">
                            <label>Language</label>
                            <select
                                className="platform-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <button
                            className="platform-btn platform-btn--primary platform-btn--full"
                            onClick={handleStart}
                            disabled={loading}
                        >
                            {loading ? "Generating Problem..." : "▶ Start Coding Interview"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Completed screen
    if (completed) {
        return (
            <div className="platform-page">
                <header className="platform-header">
                    <h1>Solution Submitted!</h1>
                    <p className="platform-subtitle">{topic} — {language}</p>
                </header>

                {evaluation?.fullResponse && (
                    <div className="mock-evaluation">
                        <div className="mock-evaluation__header">
                            <h2>Evaluation</h2>
                            {evaluation.score !== null && evaluation.score !== undefined && (
                                <span className="score-ring score-ring--mid">{evaluation.score}/10</span>
                            )}
                        </div>
                        <div className="mock-evaluation__body">{evaluation.fullResponse}</div>
                    </div>
                )}

                <div className="mock-summary__actions" style={{ marginTop: 24 }}>
                    <button className="platform-btn platform-btn--secondary" onClick={handleExport}>📄 Export PDF</button>
                    <button className="platform-btn platform-btn--primary" onClick={handleReset}>🔄 New Problem</button>
                </div>
            </div>
        )
    }

    return (
        <div className="platform-page mock-active">
            <header className="mock-header">
                <div>
                    <h1>{topic} — Coding Interview</h1>
                    <p className="platform-subtitle">{language}</p>
                </div>
            </header>

            {/* Problem */}
            <div className="mock-question-card">
                <div className="mock-question-card__label">Problem</div>
                <p className="mock-question-card__text">{currentQuestion}</p>
            </div>

            {/* Code editor */}
            <div className="mock-answer-section">
                <div className="platform-field">
                    <label>Your Solution ({language})</label>
                    <textarea
                        className="platform-textarea"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`function solve() {\n  // Write your ${language} solution here\n}`}
                        rows={12}
                        style={{ fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: "0.85rem", lineHeight: 1.6 }}
                    />
                </div>

                {error && <div className="error-banner">{error}</div>}

                <div className="mock-actions">
                    <button
                        className="platform-btn platform-btn--primary"
                        onClick={handleSubmit}
                        disabled={!code.trim() || submitting}
                    >
                        {submitting ? "Evaluating..." : "Submit Solution"}
                    </button>
                    <button className="platform-btn platform-btn--secondary" onClick={handleReset}>
                        Cancel
                    </button>
                </div>
            </div>

            {/* Evaluation */}
            {evaluation?.fullResponse && (
                <div className="mock-evaluation">
                    <div className="mock-evaluation__header">
                        <h2>Feedback</h2>
                        {evaluation.score !== null && evaluation.score !== undefined && (
                            <span className="score-ring score-ring--mid">{evaluation.score}/10</span>
                        )}
                    </div>
                    <div className="mock-evaluation__body">{evaluation.fullResponse}</div>
                </div>
            )}
        </div>
    )
}

export default CodingInterviewPage
