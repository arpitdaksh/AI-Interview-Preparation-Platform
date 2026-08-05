import React from "react";


const SuggestedQuestions = ({ questions, onSelect, disabled }) => {
    if (!questions || questions.length === 0) return null

    return (
        <div className="suggested-questions">
            <p className="suggested-questions__label">Suggested follow-up questions:</p>
            <div className="suggested-questions__grid">
                {questions.map((q, i) => (
                    <button
                        key={i}
                        className="suggested-question"
                        onClick={() => onSelect(q)}
                        disabled={disabled}
                        type="button"
                    >
                        <span className="suggested-question__icon">→</span>
                        {q}
                    </button>
                ))}
            </div>
        </div>
    )
}


export default SuggestedQuestions

