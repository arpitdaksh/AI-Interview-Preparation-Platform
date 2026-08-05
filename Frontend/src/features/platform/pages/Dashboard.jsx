import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { getDashboardStats } from '../services/platform.api'
import "../style/platform.scss"

const Dashboard = () => {
    const [ stats, setStats ] = useState(null)
    const [ loading, setLoading ] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDashboardStats()
                setStats(data.stats)
            } catch (err) {
                console.error("[Dashboard] Failed to load:", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="platform-page">
                <div className="platform-skeleton">
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                </div>
            </div>
        )
    }

    const cards = [
        {
            title: "Interview Reports",
            value: stats?.interviewReportCount ?? 0,
            icon: "📊",
            color: "#4f46e5",
            link: "/"
        },
        {
            title: "Chats",
            value: stats?.chatCount ?? 0,
            icon: "💬",
            color: "#0891b2",
            link: "/chat"
        },
        {
            title: "Avg Match Score",
            value: `${stats?.avgMatchScore ?? 0}%`,
            icon: "🎯",
            color: "#059669",
            link: "/"
        },
        {
            title: "Completed Interviews",
            value: stats?.completedInterviews ?? 0,
            icon: "✅",
            color: "#d97706",
            link: "/mock-interview"
        },
        {
            title: "Resume Versions",
            value: stats?.resumeVersionCount ?? 0,
            icon: "📄",
            color: "#dc2626",
            link: "/resumes"
        },
        {
            title: "Roadmaps",
            value: stats?.roadmapCount ?? 0,
            icon: "🗺️",
            color: "#7c3aed",
            link: "/roadmap"
        }
    ]

    return (
        <div className="platform-page">
            <header className="platform-header">
                <h1>Dashboard</h1>
                <p className="platform-subtitle">Your interview preparation at a glance</p>
            </header>

            <div className="dashboard-grid">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="dashboard-card"
                        style={{ "--card-color": card.color }}
                        onClick={() => navigate(card.link)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && navigate(card.link)}
                    >
                        <div className="dashboard-card__icon">{card.icon}</div>
                        <div className="dashboard-card__value">{card.value}</div>
                        <div className="dashboard-card__title">{card.title}</div>
                    </div>
                ))}
            </div>

            {/* Notifications Section */}
            <DashboardNotifications />
        </div>
    )
}

const DashboardNotifications = () => {
    const [ notifications, setNotifications ] = useState([])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const { default: api } = await import("../../platform/services/platform.api")
                const data = await api.getNotifications()
                if (!cancelled) setNotifications(data.notifications || [])
            } catch { /* ignore */ }
        }
        load()
        return () => { cancelled = true }
    }, [])

    if (!notifications.length) return null

    return (
        <section className="dashboard-notifications">
            <h2>Reminders</h2>
            <div className="notifications-grid">
                {notifications.map((n, i) => (
                    <div key={i} className="notification-card">
                        <div className="notification-card__title">{n.title}</div>
                        <div className="notification-card__message">{n.message}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Dashboard
