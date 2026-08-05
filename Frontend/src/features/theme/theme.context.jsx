import { createContext, useState, useEffect, useCallback } from "react";
import { getProfile, updateProfile } from "../platform/services/platform.api";

export const ThemeContext = createContext()

const THEME_KEY = "aimock_theme"

export const ThemeProvider = ({ children }) => {
    const [ theme, setTheme ] = useState(() => {
        try {
            return localStorage.getItem(THEME_KEY) || "dark"
        } catch {
            return "dark"
        }
    })

    // Apply theme class to the document root
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        document.body.setAttribute("data-theme", theme)
        try {
            localStorage.setItem(THEME_KEY, theme)
        } catch { /* ignore */ }
    }, [ theme ])

    // Load the user's saved theme preference from the server
    useEffect(() => {
        let cancelled = false
        const loadUserTheme = async () => {
            try {
                const data = await getProfile()
                if (!cancelled && data.user?.theme) {
                    setTheme(data.user.theme)
                }
            } catch { /* ignore */ }
        }
        loadUserTheme()
        return () => { cancelled = true }
    }, [])

    const toggleTheme = useCallback(async () => {
        setTheme(prev => {
            const next = prev === "dark" ? "light" : "dark"
            // Persist to server (fire-and-forget)
            updateProfile({ theme: next }).catch(() => {})
            return next
        })
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

