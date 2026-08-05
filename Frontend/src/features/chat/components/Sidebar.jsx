import React, { useState } from "react";
import { useNavigate } from "react-router";

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
)

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
)

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
)

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
)

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
)


const Sidebar = ({
    chats,
    activeChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    user,
    onLogout,
    collapsed,
    mobileOpen,
    onCloseMobile
}) => {
    const navigate = useNavigate()
    const [ query, setQuery ] = useState("")

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const sameDay = date.toDateString() === now.toDateString()
        if (sameDay) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }

    const filteredChats = chats.filter(c =>
        (c.title || "New Chat").toLowerCase().includes(query.toLowerCase())
    )

    const handleSelect = (id) => {
        onSelectChat(id)
        onCloseMobile?.()
    }

    return (
        <aside
            className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}
            aria-label="Chat navigation"
        >
            {/* Brand */}
            <div className="sidebar__brand">
                <div className="sidebar__brand-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                </div>
                <span className="sidebar__brand-name">AI Prep</span>
                <span className="sidebar__brand-badge">Beta</span>
            </div>

            {/* New Chat */}
            <div className="sidebar__new-chat">
                <button
                    onClick={() => { onNewChat(); onCloseMobile?.() }}
                    type="button"
                >
                    <PlusIcon />
                    New Chat
                </button>
            </div>

            {/* Search */}
            <div className="sidebar__search">
                <SearchIcon />
                <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search chats..."
                    aria-label="Search chats"
                />
            </div>

            {/* Chat history */}
            <div className="sidebar__section">Chat History</div>
            <div className="sidebar__chats">
                {filteredChats.length === 0 ? (
                    <p className="sidebar__empty">
                        <span className="sidebar__empty-icon">💬</span>
                        {query ? "No chats match your search." : "No chats yet. Start a new conversation!"}
                    </p>
                ) : (
                    <ul className="chat-list">
                        {filteredChats.map(chat => (
                            <li key={chat._id}>
                                <div
                                    className={`chat-list__item ${activeChatId === chat._id ? "active" : ""}`}
                                    onClick={() => handleSelect(chat._id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSelect(chat._id)
                                    }}
                                >
                                    <span className="chat-list__item-icon">
                                        <MessageIcon />
                                    </span>
                                    <span className="chat-list__item-info">
                                        <span className="chat-list__item-title">{chat.title || "New Chat"}</span>
                                        <span className="chat-list__item-date">{formatDate(chat.updatedAt)}</span>
                                    </span>
                                    <button
                                        className="chat-list__item-delete"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteChat(chat._id)
                                        }}
                                        title="Delete chat"
                                        aria-label={`Delete chat: ${chat.title || "New Chat"}`}
                                        type="button"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="sidebar__footer">
                <button
                    className="sidebar__nav-btn"
                    onClick={() => { navigate("/"); onCloseMobile?.() }}
                    type="button"
                >
                    <HomeIcon />
                    Home
                </button>
                <button
                    className="sidebar__nav-btn"
                    onClick={() => { navigate("/dashboard"); onCloseMobile?.() }}
                    type="button"
                >
                    <SettingsIcon />
                    Dashboard & Settings
                </button>

                <div className="sidebar__user-card">
                    <span className="sidebar__user-avatar">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">{user?.username || "User"}</span>
                        <span className="sidebar__user-email">{user?.email || user?.username || "Signed in"}</span>
                    </div>
                    <button
                        className="sidebar__logout"
                        onClick={onLogout}
                        title="Logout"
                        aria-label="Logout"
                        type="button"
                    >
                        <LogoutIcon />
                    </button>
                </div>
            </div>
        </aside>
    )
}


export default Sidebar
