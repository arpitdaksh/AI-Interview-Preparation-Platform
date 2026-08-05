import React, { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import { useSpeechSynthesis } from "../../../hooks/useSpeechSynthesis";


function formatTimestamp(dateStr) {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (isToday) return time
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
)

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
)

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
)

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
)

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
)


const MessageBubble = ({
    message,
    isLastAssistant,
    onRegenerate,
    onDelete,
    streaming
}) => {
    const [ copied, setCopied ] = useState(false)
    const isUser = message.role === "user"
    const { speak, stopSpeaking, speaking } = useSpeechSynthesis()

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard API unavailable
        }
    }

    const handleSpeak = () => {
        if (speaking) {
            stopSpeaking()
        } else {
            speak(message.content)
        }
    }

    return (
        <div className={`message-row message-row--${isUser ? "user" : "assistant"} message-row--animate`}>
            <div className={`message-avatar message-avatar--${isUser ? "user" : "assistant"}`}>
                {isUser ? "You" : "AI"}
            </div>

            <div className="message-content">
                <div className="message-bubble">
                    {isUser ? (
                        <p className="message-text">{message.content}</p>
                    ) : (
                        <MarkdownRenderer content={message.content} />
                    )}
                </div>

                <div className="message-meta">
                    {message.createdAt && (
                        <span className="message-timestamp">{formatTimestamp(message.createdAt)}</span>
                    )}
                </div>

                <div className="message-actions">
                    {!isUser && (
                        <>
                            <button
                                className={`message-action ${copied ? "copied" : ""}`}
                                onClick={handleCopy}
                                title="Copy response"
                                type="button"
                            >
                                <CopyIcon />
                                {copied ? "Copied" : "Copy"}
                            </button>

                            <button
                                className={`message-action ${speaking ? "speaking" : ""}`}
                                onClick={handleSpeak}
                                title={speaking ? "Stop reading" : "Read aloud"}
                                type="button"
                            >
                                <SpeakerIcon />
                                {speaking ? "Stop" : "Listen"}
                            </button>

                            {isLastAssistant && (
                                <button
                                    className="message-action"
                                    onClick={onRegenerate}
                                    disabled={streaming}
                                    title="Regenerate response"
                                    type="button"
                                >
                                    <RefreshIcon />
                                    Regenerate
                                </button>
                            )}
                        </>
                    )}

                    <button
                        className="message-action message-action--danger"
                        onClick={onDelete}
                        title="Delete message"
                        type="button"
                    >
                        <TrashIcon />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}


export default MessageBubble
