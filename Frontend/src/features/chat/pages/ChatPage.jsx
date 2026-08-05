import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import { useChat } from "../hooks/useChat";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import ConfirmDialog from "../components/ConfirmDialog";
import {
    createChat,
    getChats,
    getChatById,
    deleteChat,
    clearChatMessages,
    streamSendMessage,
    streamSendMessageWithFile,
    streamRegenerateReply
} from "../services/chat.api";
import "../style/chat.scss";
import "highlight.js/styles/github-dark.css";


const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
)

const CollapseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="11 17 6 12 11 7" />
        <polyline points="18 17 13 12 18 7" />
    </svg>
)


const ChatPage = () => {
    const { chatId } = useParams()
    const navigate = useNavigate()
    const [ searchParams ] = useSearchParams()
    const interviewReportId = searchParams.get("interviewReportId")
    const { user, handleLogout } = useAuth()
    const {
        chats,
        setChats,
        activeChat,
        setActiveChat,
        messages,
        setMessages,
        suggestedQuestions,
        setSuggestedQuestions,
        loading,
        setLoading,
        streaming,
        setStreaming,
        chatError,
        setChatError,
        clearError
    } = useChat()

    const abortControllerRef = useRef(null)
    const [ showClearConfirm, setShowClearConfirm ] = useState(false)
    const [ sidebarCollapsed, setSidebarCollapsed ] = useState(false)
    const [ mobileSidebarOpen, setMobileSidebarOpen ] = useState(false)

    // ── Load chat list on mount ─────────────────────────────────────────────
    useEffect(() => {
        const loadChats = async () => {
            try {
                const data = await getChats()
                setChats(data.chats || [])
            } catch (err) {
                console.error("[Chat] Failed to load chats:", err)
            }
        }
        loadChats()
    }, [ setChats ])

    // ── Load a specific chat when the URL changes ───────────────────────────
    useEffect(() => {
        if (!chatId) {
            setActiveChat(null)
            setMessages([])
            setSuggestedQuestions([])
            return
        }

        const loadChat = async () => {
            setLoading(true)
            clearError()
            try {
                const data = await getChatById(chatId)
                setActiveChat(data.chat)
                setMessages((data.chat.messages || []).map(m => ({
                    ...m,
                    id: m._id || Math.random().toString(36).slice(2)
                })))
                setSuggestedQuestions([])
            } catch (err) {
                console.error("[Chat] Failed to load chat:", err)
                navigate("/chat", { replace: true })
            } finally {
                setLoading(false)
            }
        }

        loadChat()
    }, [ chatId, setActiveChat, setMessages, setSuggestedQuestions, setLoading, clearError, navigate ])

    // ── Create-or-find a chat linked to an interview report ─────────────────
    useEffect(() => {
        if (!interviewReportId || chatId) return

        const findOrCreateReportChat = async () => {
            setLoading(true)
            clearError()
            try {
                const data = await getChats()
                setChats(data.chats || [])

                // Reuse existing chat for this report so history is restored
                const existing = (data.chats || []).find(c => c.interviewReportId === interviewReportId)
                if (existing) {
                    navigate(`/chat/${existing._id}`, { replace: true })
                    const chatData = await getChatById(existing._id)
                    setActiveChat(chatData.chat)
                    setMessages((chatData.chat.messages || []).map(m => ({
                        ...m,
                        id: m._id || Math.random().toString(36).slice(2)
                    })))
                } else {
                    const created = await createChat({ message: undefined, interviewReportId })
                    setChats(prev => [ created.chat, ...prev ])
                    navigate(`/chat/${created.chat._id}`, { replace: true })
                    setActiveChat(created.chat)
                    setMessages([])
                }
                setSuggestedQuestions([])
            } catch (err) {
                console.error("[Chat] Failed to create/find report chat:", err)
            } finally {
                setLoading(false)
            }
        }

        findOrCreateReportChat()
    }, [ interviewReportId, chatId, navigate, setActiveChat, setMessages, setChats, setSuggestedQuestions, setLoading, clearError ])

    // ── New chat ────────────────────────────────────────────────────────────
    const handleNewChat = async () => {
        try {
            const data = await createChat({ message: undefined })
            setChats(prev => [ data.chat, ...prev ])
            setActiveChat(data.chat)
            setMessages([])
            setSuggestedQuestions([])
            navigate(`/chat/${data.chat._id}`)
        } catch (err) {
            console.error("[Chat] Failed to create chat:", err)
        }
    }

    // ── Select a chat ───────────────────────────────────────────────────────
    const handleSelectChat = useCallback((id) => {
        navigate(`/chat/${id}`)
        setMobileSidebarOpen(false)
    }, [ navigate ])

    // ── Delete a chat ───────────────────────────────────────────────────────
    const handleDeleteChat = async (id) => {
        try {
            await deleteChat(id)
            setChats(prev => prev.filter(c => c._id !== id))
            if (activeChat?._id === id) {
                navigate("/chat", { replace: true })
            }
        } catch (err) {
            console.error("[Chat] Failed to delete chat:", err)
        }
    }

    // ── Clear conversation ──────────────────────────────────────────────────
    const handleClearConversation = async () => {
        if (!activeChat) return

        setShowClearConfirm(false)
        try {
            await clearChatMessages(activeChat._id)
            setMessages([])
            setSuggestedQuestions([])
            setActiveChat(prev => ({ ...prev, messages: [] }))
            setChats(prev => prev.map(c =>
                c._id === activeChat._id ? { ...c, messageCount: 0 } : c
            ))
        } catch (err) {
            console.error("[Chat] Failed to clear conversation:", err)
            setChatError(err?.response?.data?.message || "AI is temporarily unavailable. Please try again.")
        }
    }

    // ── Send a message (streaming, optional file) ───────────────────────────
    const handleSendMessage = async (text, file, chatOverride) => {
        const chat = chatOverride || activeChat
        if (!chat) return

        // File-only sends still need a text body for the backend; use a default prompt.
        const messageText = (text && text.trim()) || (file ? "Please analyze the attached file." : "")
        if (!messageText) return

        // Optimistically add the user message
        const tempId = `temp-${Date.now()}`
        const userMsg = { id: tempId, role: "user", content: messageText, createdAt: new Date().toISOString() }
        setMessages(prev => [ ...prev, userMsg ])
        setSuggestedQuestions([])
        setStreaming(true)
        clearError()

        // Add a placeholder assistant message that will stream into
        const assistantTempId = `temp-assistant-${Date.now()}`
        const assistantMsg = { id: assistantTempId, role: "assistant", content: "", createdAt: new Date().toISOString() }
        setMessages(prev => [ ...prev, assistantMsg ])

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            let reply = ""

            // Use multipart upload when a file is attached, otherwise JSON.
            if (file) {
                await streamSendMessageWithFile({
                    chatId: chat._id,
                    message: messageText,
                    file,
                    signal: controller.signal,
                    onEvent: ({ event, data }) => {
                        if (event === "token") {
                            reply += data.token || ""
                            setMessages(prev => prev.map(m =>
                                m.id === assistantTempId ? { ...m, content: reply } : m
                            ))
                        } else if (event === "suggested_questions") {
                            setSuggestedQuestions(data.suggestedQuestions || [])
                        } else if (event === "error") {
                            console.error("[Chat] Stream error:", data.message)
                            setMessages(prev => prev.map(m =>
                                m.id === assistantTempId ? { ...m, content: reply || "⚠️ AI is temporarily unavailable. Please try again." } : m
                            ))
                        }
                    }
                })
            } else {
                await streamSendMessage({
                    chatId: chat._id,
                    message: messageText,
                    signal: controller.signal,
                    onEvent: ({ event, data }) => {
                        if (event === "token") {
                            reply += data.token || ""
                            setMessages(prev => prev.map(m =>
                                m.id === assistantTempId ? { ...m, content: reply } : m
                            ))
                        } else if (event === "suggested_questions") {
                            setSuggestedQuestions(data.suggestedQuestions || [])
                        } else if (event === "error") {
                            console.error("[Chat] Stream error:", data.message)
                            setMessages(prev => prev.map(m =>
                                m.id === assistantTempId ? { ...m, content: reply || "⚠️ AI is temporarily unavailable. Please try again." } : m
                            ))
                        }
                    }
                })
            }

            // Refresh chat list (title may have changed)
            const data = await getChats()
            setChats(data.chats || [])

            // Refresh active chat messages from server
            const chatData = await getChatById(chat._id)
            setActiveChat(chatData.chat)
            setMessages((chatData.chat.messages || []).map(m => ({
                ...m,
                id: m._id || Math.random().toString(36).slice(2)
            })))
        } catch (err) {
            console.error("[Chat] Send failed:", err)
            if (err.name !== "AbortError") {
                setMessages(prev => prev.map(m =>
                    m.id === assistantTempId ? { ...m, content: "⚠️ AI is temporarily unavailable. Please try again." } : m
                ))
                setChatError("AI is temporarily unavailable. Please try again.")
            }
        } finally {
            setStreaming(false)
            abortControllerRef.current = null
        }
    }

    // ── Handle suggestion chip clicked while no active chat ─────────────────
    const handleSuggestionChip = async (text) => {
        if (activeChat) {
            handleSendMessage(text, null)
            return
        }

        // No active chat: create one then send the prompt
        try {
            const data = await createChat({ message: undefined, interviewReportId })
            setChats(prev => [ data.chat, ...prev ])
            setActiveChat(data.chat)
            setMessages([])
            setSuggestedQuestions([])
            navigate(`/chat/${data.chat._id}`, { replace: true })
            await new Promise(resolve => setTimeout(resolve, 0))
            handleSendMessage(text, null, data.chat)
        } catch (err) {
            console.error("[Chat] Failed to create chat from chip:", err)
            setChatError("AI is temporarily unavailable. Please try again.")
        }
    }

    // ── Stop generation ─────────────────────────────────────────────────────
    const handleStop = () => {
        abortControllerRef.current?.abort()
    }

    // ── Regenerate last reply ───────────────────────────────────────────────
    const handleRegenerate = async () => {
        if (!activeChat || streaming) return

        // Remove the last assistant message from the UI
        setMessages(prev => {
            const next = [ ...prev ]
            while (next.length > 0 && next[next.length - 1].role === "assistant") {
                next.pop()
            }
            return next
        })

        setSuggestedQuestions([])
        setStreaming(true)
        clearError()

        const controller = new AbortController()
        abortControllerRef.current = controller

        const assistantTempId = `temp-regenerated-${Date.now()}`
        setMessages(prev => [ ...prev, { id: assistantTempId, role: "assistant", content: "", createdAt: new Date().toISOString() } ])

        try {
            let reply = ""

            await streamRegenerateReply({
                chatId: activeChat._id,
                signal: controller.signal,
                onEvent: ({ event, data }) => {
                    if (event === "token") {
                        reply += data.token || ""
                        setMessages(prev => prev.map(m =>
                            m.id === assistantTempId ? { ...m, content: reply } : m
                        ))
                    } else if (event === "suggested_questions") {
                        setSuggestedQuestions(data.suggestedQuestions || [])
                    } else if (event === "error") {
                        console.error("[Chat] Regenerate error:", data.message)
                        setMessages(prev => prev.map(m =>
                            m.id === assistantTempId ? { ...m, content: reply || "⚠️ AI is temporarily unavailable. Please try again." } : m
                        ))
                    }
                }
            })

            const chatData = await getChatById(activeChat._id)
            setActiveChat(chatData.chat)
            setMessages((chatData.chat.messages || []).map(m => ({
                ...m,
                id: m._id || Math.random().toString(36).slice(2)
            })))
        } catch (err) {
            console.error("[Chat] Regenerate failed:", err)
            if (err.name !== "AbortError") {
                setMessages(prev => prev.map(m =>
                    m.id === assistantTempId ? { ...m, content: "⚠️ AI is temporarily unavailable. Please try again." } : m
                ))
                setChatError("AI is temporarily unavailable. Please try again.")
            }
        } finally {
            setStreaming(false)
            abortControllerRef.current = null
        }
    }

    // ── Delete a single message ─────────────────────────────────────────────
    const handleDeleteMessage = async (message) => {
        setMessages(prev => prev.filter(m => m.id !== message.id))
    }

    // ── Select a suggested question ─────────────────────────────────────────
    const handleSelectSuggested = (question) => {
        handleSendMessage(question, null)
    }

    return (
        <div className="chat-page">
            <Sidebar
                chats={chats}
                activeChatId={activeChat?._id}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                user={user}
                onLogout={handleLogout}
                collapsed={sidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            {/* Mobile drawer backdrop */}
            <div
                className={`chat-sidebar-backdrop ${mobileSidebarOpen ? "open" : ""}`}
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
            />

            <main className="chat-main">
                {/* Chat header */}
                <header className="chat-header">
                    <button
                        className="chat-drawer-toggle"
                        onClick={() => setMobileSidebarOpen(true)}
                        title="Open menu"
                        aria-label="Open menu"
                        type="button"
                    >
                        <MenuIcon />
                    </button>

                    <button
                        className="sidebar__collapse-btn"
                        onClick={() => setSidebarCollapsed(c => !c)}
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        type="button"
                    >
                        <CollapseIcon />
                    </button>

                    {activeChat ? (
                        <>
                            <h2 className="chat-header__title">{activeChat.title || "Interview Prep Assistant"}</h2>
                            <span className="chat-header__status">
                                {streaming ? "Generating..." : messages.length > 0 ? "Online" : "New chat"}
                            </span>
                            <button
                                className="chat-header__clear"
                                onClick={() => setShowClearConfirm(true)}
                                disabled={streaming || messages.length === 0}
                                title="Clear conversation"
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span>Clear Conversation</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="chat-header__title">AI Interview Assistant</h2>
                            <span className="chat-header__status">Ready</span>
                        </>
                    )}
                </header>

                {chatError && (
                    <div className="chat-error-banner" role="alert">
                        <span>{chatError}</span>
                        <button onClick={clearError} type="button" aria-label="Dismiss">✕</button>
                    </div>
                )}

                <div className="chat-body">
                    <ChatWindow
                        messages={messages}
                        streaming={streaming}
                        isStreaming={streaming}
                        loading={loading}
                        suggestedQuestions={suggestedQuestions}
                        onRegenerate={handleRegenerate}
                        onDeleteMessage={handleDeleteMessage}
                        onSelectSuggested={handleSelectSuggested}
                        onSelectSuggestionChip={handleSuggestionChip}
                        recentChats={chats}
                        onSelectRecent={handleSelectChat}
                        emptyState={{
                            title: "AI Interview Assistant",
                            subtitle: "Ask anything about your interview preparation. Get personalized coaching, resume feedback, and mock interview practice."
                        }}
                    />

                    <ChatInput
                        onSend={handleSendMessage}
                        onStop={handleStop}
                        streaming={streaming}
                        disabled={loading || !activeChat}
                    />
                </div>

                <ConfirmDialog
                    isOpen={showClearConfirm}
                    title="Clear Conversation"
                    message="Are you sure you want to clear all messages in this conversation? This cannot be undone."
                    confirmLabel="Clear"
                    cancelLabel="Cancel"
                    danger
                    onConfirm={handleClearConversation}
                    onCancel={() => setShowClearConfirm(false)}
                />
            </main>
        </div>
    )
}


export default ChatPage
