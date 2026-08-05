import React, { useState, useEffect } from 'react'
import { getAnalyticsData } from '../services/platform.api'
import "../style/platform.scss"
import "../style/analytics.scss"

const AnalyticsPage = () => {
    const [ data, setData ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const [ error, setError ] = useState("")

    useEffect(() => {
        const load = async () => {
            try {
                const result = await getAnalyticsData()
                setData(result.analytics)
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || "Failed to load analytics.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="platform-page">
                <div className="empty-state"><div className="empty-state__icon">⏳</div><div className="empty-state__title">Loading analytics...</div></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="platform-page">
                <div className="error-banner">{error}</div>
            </div>
        )
    }

    const avgScore = data?.avgScore ?? 0
    const questionsAnswered = data?.questionsAnswered ?? 0
    const strongAreas = data?.strongAreas ?? []
    const weakAreas = data?.weakAreas ?? []
    const mostAskedTopics = data?.mostAskedTopics ?? []
    const progressData = data?.progressOverTime ?? []

    return (
        <div className="platform-page">
            <header className="platform-header">
                <h1>Analytics</h1>
                <p className="platform-subtitle">Track your interview preparation progress.</p>
            </header>

            {/* Key metrics */}
            <div className="dashboard-grid">
                <div className="dashboard-card" style={{ "--card-color": "#059669" }}>
                    <div className="dashboard-card__icon">🎯</div>
                    <div className="dashboard-card__value">{avgScore.toFixed(1)}</div>
                    <div className="dashboard-card__title">Avg Score</div>
                </div>
                <div className="dashboard-card" style={{ "--card-color": "#4f46e5" }}>
                    <div className="dashboard-card__icon">📝</div>
                    <div className="dashboard-card__value">{questionsAnswered}</div>
                    <div className="dashboard-card__title">Questions Answered</div>
                </div>
            </div>

            {/* Strong & Weak Areas */}
            <div className="analytics-grid">
                <div className="analytics-section">
                    <h2 className="analytics-section__title">✅ Strong Areas</h2>
                    {strongAreas.length > 0 ? (
                        <div className="tag-list">
                            {strongAreas.map((area, i) => (
                                <span key={i} className="platform-tag platform-tag--low">{area}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="analytics-empty">No data yet.</p>
                    )}
                </div>

                <div className="analytics-section">
                    <h2 className="analytics-section__title">⚠️ Areas to Improve</h2>
                    {weakAreas.length > 0 ? (
                        <div className="tag-list">
                            {weakAreas.map((area, i) => (
                                <span key={i} className="platform-tag platform-tag--high">{area}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="analytics-empty">No data yet.</p>
                    )}
                </div>
            </div>

            {/* Most Asked Topics */}
            {mostAskedTopics.length > 0 && (
                <div className="analytics-section">
                    <h2 className="analytics-section__title">📊 Most Asked Topics</h2>
                    <div className="tag-list">
                        {mostAskedTopics.map((t, i) => (
                            <span key={i} className="platform-tag platform-tag--medium">{t}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Progress Over Time */}
            {progressData.length > 0 && (
                <div className="analytics-section">
                    <h2 className="analytics-section__title">📈 Progress Over Time</h2>
                    <div className="progress-list">
                        {progressData.map((p, i) => (
                            <div key={i} className="progress-item">
                                <div className="progress-item__label">
                                    <span className="progress-item__date">{p.date || p.period || `Week ${i + 1}`}</span>
                                    <span className="progress-item__score">{p.score ?? p.avgScore ?? 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar__fill"
                                        style={{ width: `${p.score ?? p.avgScore ?? 0}%`, background: "#4f46e5" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!strongAreas.length && !weakAreas.length && !mostAskedTopics.length && !progressData.length && (
                <div className="empty-state">
                    <div className="empty-state__icon">📊</div>
                    <div className="empty-state__title">No analytics yet</div>
                    <div className="empty-state__subtitle">Complete some interviews to see your progress.</div>
                </div>
            )}
        </div>
    )
}

export default AnalyticsPage
