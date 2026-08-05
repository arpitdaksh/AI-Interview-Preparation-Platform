import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { startMockInterview, submitMockAnswer, completeMockInterview, getMockInterviewById, exportMockInterviewPdf } from '../services/platform.api'
import { downloadBlob } from '../services/platform.api'
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis'
import "../style/mock.scss"
import "../style/platform.scss"

const INTERVIEW_TYPES = [ "HR", "Technical", "Behavioral", "DSA", "System Design" ]
const DURATIONS = [ 15, 30, 45, 60 ]

const MockInterviewPage = () => {
    const [ searchParams ] = useSearchParams()
    const reportId = searchParams.get("interviewReportId")

    const [ type, setType ] = useState("Technical")
    const [ durationMin, setDurationMin ] = useState(30)
    const [ session, setSession ] = useState(null)
    const [ currentQuestion, setCurrentQuestion ] = useState("")
    const [ answer, setAnswer ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const [ submitting, setSubmitting ] = useState(false)
    const [ evaluation, setEvaluation ] = useState(null)
    const [ history, setHistory ] = useState([])
    const [ error, setError ] = useState("")
    const [ completed, setCompleted ] = useState(false)

    // Timer
    const [ timeLeft, setTimeLeft ] = useState(0)
    const [ timerRunning, setTimerRunning ] = useState(false)
    const timerRef = useRef(null)

    // Voice
    const { transcript, listening, startListening, stopListening, supported: voiceSupported } = useSpeechRecognition()
    const { speak, stopSpeaking, speaking } = useSpeechSynthesis()

    // Sync voice transcript into answer field
    useEffect(() => {
        if (transcript) setAnswer(transcript)
    }, [ transcript ])

    // Timer countdown
    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimerRunning(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [ timerRunning, timeLeft ])

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }

    const handleStart = async () => {
        setLoading(true)
        setError("")
        setHistory([])
        setEvaluation(null)
        setCompleted(false)
        try {
            const data = await startMockInterview({ type, durationMin, interviewReportId: reportId || undefined })
            setSession(data.session)
            setCurrentQuestion(data.session.currentQuestion)
            setTimeLeft(durationMin * 60)
            setTimerRunning(true)
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to start the mock interview.")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitAnswer = async () => {
        if (!session || !answer.trim() || submitting) return

        setSubmitting(true)
        setError("")
        setTimerRunning(false)
        try {
            const data = await submitMockAnswer({ sessionId: session.sessionId, answer: answer.trim() })

            // Add to history
            setHistory(prev => [ ...prev, { question: currentQuestion, answer: answer.trim() } ])
            setEvaluation(data.result?.evaluation)
            setCurrentQuestion(data.result?.currentQuestion || "")
            setAnswer("")

            // Speak the next question
            if (data.result?.currentQuestion) {
                speak(data.result.currentQuestion)
            }

            setTimerRunning(true)
            setTimeLeft(prev => prev || durationMin * 60)
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to submit your answer.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleComplete = async () => {
        if (!session || submitting) return
        setSubmitting(true)
        setError("")
        setTimerRunning(false)
        try {
            const data = await completeMockInterview({ sessionId: session.sessionId })
            setCompleted(true)
            setSession(prev => ({ ...prev, ...data.result }))
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to complete the interview.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleExport = async () => {
        try {
            const blob = await exportMockInterviewPdf({ sessionId: session.sessionId })
            await downloadBlob({ blob, fileName: `mock-interview_${session.sessionId}.pdf` })
        } catch (err) {
            setError(err?.message || "Failed to export PDF.")
        }
    }

    const handleReset = () => {
        setSession(null)
        setCurrentQuestion("")
        setAnswer("")
        setHistory([])
        setEvaluation(null)
        setCompleted(false)
        setTimeLeft(0)
        setTimerRunning(false)
        stopSpeaking()
    }

    // Setup screen
    if (!session) {
        return (
            <div className="platform-page">
                <header className="platform-header">
                    <h1>Mock Interview</h1>
                    <p className="platform-subtitle">Practice with an AI interviewer and get real-time feedback.</p>
                </header>

                <div className="mock-setup">
                    <div className="mock-setup__card">
                        <div className="platform-field">
                            <label>Interview Type</label>
                            <div className="type-grid">
                                {INTERVIEW_TYPES.map(t => (
                                    <button
                                        key={t}
                                        className={`type-chip ${type === t ? "type-chip--active" : ""}`}
                                        onClick={() => setType(t)}
                                        type="button"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="platform-field">
                            <label>Duration</label>
                            <div className="duration-select">
                                <select
                                    className="platform-select"
                                    value={durationMin}
                                    onChange={(e) => setDurationMin(Number(e.target.value))}
                                >
                                    {DURATIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                                </select>
                            </div>
                        </div>

                        {error && <div className="error-banner">{error}</div>}

                        <button
                            className="platform-btn platform-btn--primary platform-btn--full"
                            onClick={handleStart}
                            disabled={loading}
                        >
                            {loading ? "Starting..." : "▶ Start Mock Interview"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Completed screen
    if (completed || (session.status === "completed" && currentQuestion === "")) {
        const answered = history.length
        const avgScore = evaluation?.score ?? null
        return (
            <div className="platform-page">
                <header className="platform-header">
                    <h1>Interview Complete</h1>
                    <p className="platform-subtitle">{session.type} interview with {session.durationMin || 30} min duration</p>
                </header>

                <div className="mock-summary">
                    <div className="mock-summary__stats">
                        <div className="mock-summary__stat">
                            <span className="mock-summary__value">{answered}</span>
                            <span className="mock-summary__label">Questions Answered</span>
                        </div>
                        <div className="mock-summary__stat">
                            <span className="mock-summary__value">{avgScore !== null ? `${avgScore}/10` : "N/A"}</span>
                            <span className="mock-summary__label">Current Score</span>
                        </div>
                        <div className="mock-summary__stat">
                            <span className="mock-summary__value">{session.status ?? "completed"}</span>
                            <span className="mock-summary__label">Status</span>
                        </div>
                    </div>

                    <div className="mock-summary__actions">
                        <button className="platform-btn platform-btn--secondary" onClick={handleExport}>
                            📄 Export PDF
                        </button>
                        <button className="platform-btn platform-btn--primary" onClick={handleReset}>
                            🔄 New Interview
                        </button>
                    </div>
                </div>

                {/* History */}
                <h2 style={{ margin: "24px 0 12px" }}>Your Responses</h2>
                {history.map((h, i) => (
                    <div key={i} className="mock-history-item">
                        <h3>Q{i + 1}: {h.question}</h3>
                        <p>{h.answer}</p>
                    </div>
                ))}
            </div>
        )
    }

    // Active interview screen
    return (
        <div className="platform-page mock-active">
            <header className="mock-header">
                <div>
                    <h1>{session.type} Interview</h1>
                    <p className="platform-subtitle">Question {history.length + 1}</p>
                </div>
                <div className={`mock-timer ${timeLeft < 60 ? "mock-timer--warning" : ""}`}>
                    <span className="mock-timer__icon">⏱️</span>
                    <span className="mock-timer__value">{formatTime(timeLeft)}</span>
                </div>
            </header>

            {/* Current question */}
            <div className="mock-question-card">
                <div className="mock-question-card__label">AI Interviewer</div>
                <p className="mock-question-card__text">{currentQuestion}</p>
                <div className="mock-question-card__actions">
                    <button
                        className="platform-btn platform-btn--secondary platform-btn--small"
                        onClick={() => speak(currentQuestion)}
                        disabled={speaking}
                        type="button"
                    >
                        {speaking ? "⏹ Stop" : "🔊 Hear Question"}
                    </button>
                    {speaking && (
                        <button
                            className="platform-btn platform-btn--danger platform-btn--small"
                            onClick={stopSpeaking}
                            type="button"
                        >
                            Stop
                        </button>
                    )}
                </div>
            </div>

            {/* Answer input */}
            <div className="mock-answer-section">
                <div className="platform-field">
                    <label>Your Answer</label>
                    <textarea
                        className="platform-textarea"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here... or use the microphone below."
                        rows={5}
                    />
                </div>

                {voiceSupported && (
                    <button
                        className={`platform-btn ${listening ? "platform-btn--danger" : "platform-btn--secondary"}`}
                        onClick={listening ? stopListening : startListening}
                        type="button"
                    >
                        {listening ? "⏹ Stop Listening" : "🎙️ Answer with Voice"}
                    </button>
                )}
                {!voiceSupported && (
                    <span className="mock-voice-note">🎙️ Voice input not supported in this browser.</span>
                )}

                {error && <div className="error-banner">{error}</div>}

                <div className="mock-actions">
                    <button
                        className="platform-btn platform-btn--primary"
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim() || submitting}
                    >
                        {submitting ? "Evaluating..." : "Submit Answer →"}
                    </button>
                    <button
                        className="platform-btn platform-btn--secondary"
                        onClick={handleComplete}
                        disabled={submitting}
                    >
                        End Interview
                    </button>
                </div>
            </div>

            {/* Evaluation from last answer */}
            {evaluation?.fullResponse && (
                <div className="mock-evaluation">
                    <div className="mock-evaluation__header">
                        <h2>Last Evaluation</h2>
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

export default MockInterviewPage
