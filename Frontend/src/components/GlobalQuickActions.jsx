import { useNavigate } from "react-router"
import { useAuth } from "../features/auth/hooks/useAuth"
import { useTheme } from "../features/theme/hooks/useTheme"

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg>
)

const SunIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
)

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></svg>
)

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5m5 5H3m8-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
)

const GlobalQuickActions = () => {
    const navigate = useNavigate()
    const { handleLogout } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const logout = async () => {
        await handleLogout()
        navigate("/login", { replace: true })
    }

    return (
        <nav className="quick-actions" aria-label="Quick actions">
            <button type="button" onClick={() => navigate("/")} aria-label="Go to home">
                <HomeIcon />
                <span>Home</span>
            </button>
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button type="button" className="quick-actions__logout" onClick={logout} aria-label="Log out">
                <LogoutIcon />
                <span>Logout</span>
            </button>
        </nav>
    )
}

export default GlobalQuickActions
