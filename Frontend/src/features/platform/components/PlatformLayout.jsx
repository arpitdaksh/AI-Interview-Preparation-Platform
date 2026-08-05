import React from 'react'
import { NavLink, useNavigate } from 'react-router'
import { Outlet } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTheme } from '../../theme/hooks/useTheme'
import "../style/platform.scss"

const NAV_LINKS = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/mock-interview", label: "Mock Interview", icon: "🎤" },
    { to: "/coding-interview", label: "Coding Interview", icon: "👨‍💻" },
    { to: "/roadmap", label: "Career Roadmap", icon: "🗺️" },
    { to: "/resumes", label: "Resumes", icon: "📄" },
    { to: "/analytics", label: "Analytics", icon: "📈" },
    { to: "/profile", label: "Profile", icon: "👤" },
]

const PlatformLayout = () => {
    const { user, handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    return (
        <div className="platform-layout">
            {/* Sidebar */}
            <aside className="platform-sidebar">
                <div className="platform-sidebar__brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
                    🚀 <span>AI Prep</span>
                </div>

                <nav className="platform-sidebar__nav">
                    {NAV_LINKS.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `platform-sidebar__link ${isActive ? "platform-sidebar__link--active" : ""}`
                            }
                        >
                            <span className="platform-sidebar__icon">{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="platform-sidebar__footer">
                    <button
                        className="platform-sidebar__theme"
                        onClick={toggleTheme}
                        type="button"
                    >
                        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                    </button>
                    <div className="platform-sidebar__user">
                        <div className="platform-sidebar__avatar">
                            {(user?.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="platform-sidebar__username">{user?.username || "User"}</span>
                        <button
                            className="platform-sidebar__logout"
                            onClick={handleLogout}
                            title="Logout"
                            type="button"
                        >
                            ⎋
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="platform-main">
                <Outlet />
            </main>
        </div>
    )
}

export default PlatformLayout
