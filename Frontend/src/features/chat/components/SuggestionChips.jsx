import React from "react";


const SUGGESTIONS = [
    {
        text: "Improve Resume",
        prompt: "Help me improve my resume",
        desc: "Get actionable tips to refine your resume",
        icon: "📄"
    },
    {
        text: "Mock Interview",
        prompt: "Let's do a mock interview",
        desc: "Practice with realistic interview questions",
        icon: "🎤"
    },
    {
        text: "Explain Match Score",
        prompt: "Explain my match score",
        desc: "Understand how your profile maps to the role",
        icon: "🎯"
    },
    {
        text: "Generate HR Questions",
        prompt: "Generate HR interview questions for me",
        desc: "Common HR questions with STAR answers",
        icon: "🧑‍💼"
    },
    {
        text: "Technical Questions",
        prompt: "Ask me technical interview questions",
        desc: "Sharpen your technical & problem-solving skills",
        icon: "💻"
    },
    {
        text: "Salary Negotiation",
        prompt: "Give me salary negotiation tips",
        desc: "Learn how to negotiate your offer confidently",
        icon: "💰"
    },
    {
        text: "Career Roadmap",
        prompt: "Create a career roadmap for my role",
        desc: "A step-by-step growth plan for your career",
        icon: "🗺️"
    },
    {
        text: "ATS Resume Review",
        prompt: "Review my resume for ATS",
        desc: "Check ATS compatibility and fix red flags",
        icon: "🤖"
    }
]


const SuggestionChips = ({ onSelect, disabled }) => {
    return (
        <div className="suggestion-cards">
            <p className="suggestion-cards__label">Get started with these suggestions</p>
            <div className="suggestion-cards__grid">
                {SUGGESTIONS.map((s, i) => (
                    <button
                        key={i}
                        className="suggestion-card"
                        onClick={() => onSelect(s.prompt)}
                        disabled={disabled}
                        type="button"
                    >
                        <span className="suggestion-card__icon">{s.icon}</span>
                        <span className="suggestion-card__title">{s.text}</span>
                        <span className="suggestion-card__desc">{s.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}


export default SuggestionChips
