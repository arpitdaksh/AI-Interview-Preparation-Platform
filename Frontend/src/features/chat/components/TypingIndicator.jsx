import React from "react";


const TypingIndicator = () => {
    return (
        <div className="message-row message-row--assistant">
            <div className="message-avatar message-avatar--assistant">
                AI
            </div>
            <div className="typing-bubble" aria-label="AI is typing">
                <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                </div>
                <span className="typing-text">AI is thinking...</span>
            </div>
        </div>
    )
}


export default TypingIndicator
