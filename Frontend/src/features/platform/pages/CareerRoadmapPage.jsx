import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { generateRoadmap, getRoadmapById, getAllRoadmaps, exportRoadmapPdf } from '../services/platform.api'
import { downloadBlob } from '../services/platform.api'
import "../style/platform.scss"

const CareerRoadmapPage = () => {
    const [ searchParams ] = useSearchParams()
    const reportId = searchParams.get("interviewReportId")

    const [ roadmaps, setRoadmaps ] = useState([])
    const [ active, setActive ] = useState(null)
    const [ loading, setLoading ] = useState(false)
    const [ generating, setGenerating ] = useState(false)
    const [ error, setError ] = useState("")

    // Load all roadmaps on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAllRoadmaps()
                setRoadmaps(data.roadmaps || [])
            } catch (err) {
                console.error("[Roadmap] Failed to load roadmaps:", err)
            }
        }
        load()
    }, [])

    const handleGenerate = async () => {
        if (!reportId) {
            setError("Please open this page from an interview report to generate a roadmap.")
            return
        }
        setGenerating(true)
        setError("")
        try {
            const data = await generateRoadmap({ interviewReportId: reportId })
            setActive(data.roadmap)
            setRoadmaps(prev => [ data.roadmap, ...prev ])
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to generate roadmap.")
        } finally {
            setGenerating(false)
        }
    }

    const handleSelect = async (id) => {
        setLoading(true)
        setError("")
        try {
            const data = await getRoadmapById({ roadmapId: id })
            setActive(data.roadmap)
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load roadmap.")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        if (!active) return
        try {
            const blob = await exportRoadmapPdf({ roadmapId: active._id })
            await downloadBlob({ blob, fileName: `roadmap_${active._id}.pdf` })
        } catch (err) {
            setError(err?.message || "Failed to export roadmap.")
        }
    }

    return (
        <div className="platform-page">
            <header className="platform-header">
                <h1>Career Roadmap</h1>
                <p className="platform-subtitle">A personalized 4-week plan to close your skill gaps.</p>
            </header>

            {error && <div className="error-banner">{error}</div>}

            {/* Actions */}
            <div className="roadmap-actions">
                {reportId ? (
                    <button
                        className="platform-btn platform-btn--primary"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        {generating ? "Generating..." : "✨ Generate Roadmap from Report"}
                    </button>
                ) : (
                    <div className="platform-card" style={{ maxWidth: 560 }}>
                        <p className="platform-card__title" style={{ marginBottom: 8 }}>
                            📌 Tip
                        </p>
                        <p className="platform-card__subtitle">
                            Open a roadmap from an interview report page to auto-generate a personalized plan.
                        </p>
                    </div>
                )}

                {roadmaps.length > 0 && (
                    <button className="platform-btn platform-btn--secondary" onClick={() => setActive(null)}>
                        Show All Roadmaps
                    </button>
                )}
            </div>

            {/* Roadmap list */}
            {roadmaps.length > 0 && !active && (
                <div className="roadmap-list">
                    <h2>Your Roadmaps</h2>
                    <div className="roadmap-list__grid">
                        {roadmaps.map(r => (
                            <button
                                key={r._id}
                                className="roadmap-item"
                                onClick={() => handleSelect(r._id)}
                                type="button"
                            >
                                <div className="roadmap-item__title">
                                    {r.title || `Roadmap for ${r.linkedReportTitle || "your interview"}`}
                                </div>
                                <div className="roadmap-item__meta">
                                    {r.weeks?.length || 4} weeks · {new Date(r.createdAt).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active roadmap */}
            {loading && <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Loading roadmap...</div></div>}

            {active && (
                <div className="roadmap-detail">
                    <div className="roadmap-detail__header">
                        <h2>{active.title || "Your Career Roadmap"}</h2>
                        {reportId && (
                            <button className="platform-btn platform-btn--secondary" onClick={handleExport}>
                                📄 Export PDF
                            </button>
                        )}
                    </div>

                    {active.weeks?.map((week, wi) => (
                        <div key={wi} className="roadmap-week">
                            <div className="roadmap-week__header">
                                <span className="roadmap-week__badge">Week {week.week || wi + 1}</span>
                                <h3>{week.title || week.focus}</h3>
                            </div>
                            <div className="roadmap-week__body">
                                {week.focus && (
                                    <p className="roadmap-week__focus"><strong>Focus:</strong> {week.focus}</p>
                                )}
                                {week.tasks?.length > 0 && (
                                    <div className="roadmap-week__section">
                                        <span className="roadmap-week__label">Tasks</span>
                                        <ul>
                                            {week.tasks.map((t, i) => <li key={i}>✓ {t}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {week.resources?.length > 0 && (
                                    <div className="roadmap-week__section">
                                        <span className="roadmap-week__label">Resources</span>
                                        <ul>
                                            {week.resources.map((r, i) => <li key={i}>🔗 {r}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {!active.weeks?.length && (
                        <div className="empty-state">
                            <div className="empty-state__icon">🗺️</div>
                            <div className="empty-state__title">No roadmap content yet</div>
                            <div className="empty-state__subtitle">Open this page from an interview report to generate your personalized plan.</div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!active && roadmaps.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">🗺️</div>
                    <div className="empty-state__title">No roadmap yet</div>
                    <div className="empty-state__subtitle">
                        Generate a personalized 4-week preparation roadmap based on your latest interview report.
                    </div>
                </div>
            )}
        </div>
    )
}

export default CareerRoadmapPage
