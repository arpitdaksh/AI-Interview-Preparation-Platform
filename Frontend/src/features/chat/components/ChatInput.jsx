import React, { useRef, useState, useEffect } from "react";
import { useSpeechRecognition } from "../../../hooks/useSpeechRecognition";

/* Allowed file types + max size (mirrors backend) */
const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "image/png",
    "image/jpeg"
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
)

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
)

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
)

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
)

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
)


const ChatInput = ({ onSend, onStop, streaming, disabled, onInputChange }) => {
    const [ value, setValue ] = useState("")
    const [ file, setFile ] = useState(null)
    const [ fileError, setFileError ] = useState("")
    const fileInputRef = useRef(null)
    const textareaRef = useRef(null)

    const { transcript, listening, startListening, stopListening, supported: voiceSupported } = useSpeechRecognition()

    // Sync transcript from speech recognition into the textarea
    useEffect(() => {
        if (transcript) {
            setValue(transcript)
        }
    }, [ transcript ])

    // Auto-expand textarea up to ~8 lines
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, 210)}px`
    }, [ value ])

    const handleSend = () => {
        const trimmed = value.trim()
        if ((!trimmed && !file) || streaming || disabled) return

        onSend(trimmed, file)
        setValue("")
        setFile(null)
        setFileError("")
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (listening) stopListening()
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0]
        setFileError("")
        if (!selected) {
            setFile(null)
            return
        }

        if (!ACCEPTED_TYPES.includes(selected.type)) {
            setFileError("Unsupported file type. Use PDF, DOCX, TXT, MD, PNG, or JPG.")
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        if (selected.size > MAX_SIZE) {
            setFileError("File too large. Maximum size is 10MB.")
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            return
        }

        setFile(selected)
    }

    const handleRemoveFile = () => {
        setFile(null)
        setFileError("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleVoiceToggle = () => {
        if (!voiceSupported) return
        if (listening) {
            stopListening()
        } else {
            startListening()
        }
    }

    const canSend = !!(value.trim() || file) && !streaming && !disabled

    return (
        <div className="chat-input-wrap">
            <div className={`chat-input ${streaming ? "chat-input--streaming" : ""}`}>
                {/* File preview */}
                {file && (
                    <div className="chat-attachment-preview">
                        <FileIcon />
                        <span>{file.name}</span>
                        <button onClick={handleRemoveFile} title="Remove file" aria-label="Remove file" type="button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="chat-input__field-wrap">
                    <textarea
                        ref={textareaRef}
                        className="chat-input__field"
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value)
                            if (onInputChange) onInputChange(e.target.value)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your interview preparation..."
                        rows={1}
                        disabled={disabled}
                        aria-label="Message"
                    />
                </div>

                <div className="chat-input__actions">
                    {/* Upload */}
                    <button
                        className="chat-input__btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload file (PDF, DOCX, TXT, MD, image)"
                        aria-label="Upload file"
                        type="button"
                        disabled={streaming || disabled}
                    >
                        <UploadIcon />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        onChange={handleFileChange}
                        hidden
                        aria-hidden="true"
                        tabIndex={-1}
                    />

                    {/* Voice */}
                    {voiceSupported && (
                        <button
                            className={`chat-input__btn ${listening ? "chat-input__btn--active" : ""}`}
                            onClick={handleVoiceToggle}
                            title={listening ? "Stop voice input" : "Voice input"}
                            aria-label={listening ? "Stop voice input" : "Voice input"}
                            type="button"
                            disabled={streaming || disabled}
                        >
                            <MicIcon />
                        </button>
                    )}

                    {/* Send / Stop */}
                    {streaming ? (
                        <button
                            className="chat-input__stop"
                            onClick={onStop}
                            title="Stop generating"
                            type="button"
                        >
                            <StopIcon />
                            Stop
                        </button>
                    ) : (
                        <button
                            className="chat-input__send"
                            onClick={handleSend}
                            disabled={!canSend}
                            title="Send message (Enter)"
                            aria-label="Send message"
                            type="button"
                        >
                            <SendIcon />
                        </button>
                    )}
                </div>
            </div>

            {fileError && (
                <p className="chat-input__hint" style={{ color: "#fca5a5" }} role="alert">
                    {fileError}
                </p>
            )}

            <p className="chat-input__hint">
                {streaming
                    ? "Generating response... click Stop to cancel."
                    : listening
                        ? "Listening... speak now."
                        : "Enter to send • Shift+Enter for a new line"}
            </p>
        </div>
    )
}


export default ChatInput
