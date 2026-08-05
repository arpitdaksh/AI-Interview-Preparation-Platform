import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import SuggestedQuestions from "./SuggestedQuestions";
import SuggestionChips from "./SuggestionChips";
import ChatSkeleton from "./ChatSkeleton";


const WelcomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
)

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
)


const ChatWindow = ({
    messages,
    streaming,
    isStreaming,
    loading,
    suggestedQuestions,
    onRegenerate,
    onDeleteMessage,
    onSelectSuggested,
    onSelectSuggestionChip,
    emptyState,
    recentChats,
    onSelectRecent
}) => {
    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [ messages, isStreaming, suggestedQuestions ])

    if (loading) {
        return (
            <div className="chat-window">
                <ChatSkeleton />
            </div>
        )
    }

    return (
        <div className="chat-window">
            {messages.length === 0 ? (
                <>
                    <div className="chat-welcome">
                        <div className="chat-welcome__icon">
                            <WelcomeIcon />
                        </div>
                        <h1 className="chat-welcome__title">
                            {emptyState.title || "AI Interview Assistant"}
                        </h1>
                        <p className="chat-welcome__subtitle">
                            {emptyState.subtitle || "Ask anything about your interview preparation. Upload a resume, practice questions, and get personalized coaching — all in one place."}
                        </p>
                        <SuggestionChips
                            onSelect={onSelectSuggestionChip}
                            disabled={streaming}
                        />
                    </div>

                    {recentChats?.length > 0 && (
                        <div className="welcome-recent">
                            <p className="welcome-recent__label">Recent conversations</p>
                            <div className="welcome-recent__list">
                                {recentChats.slice(0, 5).map(chat => (
                                    <button
                                        key={chat._id}
                                        className="welcome-recent__item"
                                        onClick={() => onSelectRecent?.(chat._id)}
                                        type="button"
                                    >
                                        <ChatIcon />
                                        {chat.title || "New Chat"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="chat-messages">
                    {messages.map((message, index) => {
                        const isLastAssistant = message.role === "assistant" &&
                            index === messages.length - 1

                        return (
                            <MessageBubble
                                key={message.id || index}
                                message={message}
                                isLastAssistant={isLastAssistant}
                                onRegenerate={() => onRegenerate(message)}
                                onDelete={() => onDeleteMessage(message)}
                                streaming={streaming}
                            />
                        )
                    })}

                    {isStreaming && <TypingIndicator />}

                    {!streaming && suggestedQuestions.length > 0 && (
                        <SuggestedQuestions
                            questions={suggestedQuestions}
                            onSelect={onSelectSuggested}
                            disabled={streaming}
                        />
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
    )
}


export default ChatWindow
