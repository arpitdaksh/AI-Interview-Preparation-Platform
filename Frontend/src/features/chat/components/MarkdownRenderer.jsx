import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";


const CodeBlock = ({ inline, className, children, ...props }) => {
    const [ copied, setCopied ] = useState(false)

    const match = /language-(\w+)/.exec(className || "")
    const code = String(children || "").replace(/\n$/, "")

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Clipboard API unavailable
        }
    }

    if (inline) {
        return (
            <code className="inline-code" {...props}>
                {children}
            </code>
        )
    }

    return (
        <div className="code-block">
            <div className="code-block__header">
                <span className="code-block__lang">{match?.[1] || "code"}</span>
                <button
                    className={`code-block__copy ${copied ? "copied" : ""}`}
                    onClick={handleCopy}
                    type="button"
                >
                    {copied ? "Copied!" : "Copy code"}
                </button>
            </div>
            <pre className="code-block__pre">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    )
}


const MarkdownRenderer = ({ content }) => {
    return (
        <div className="markdown-body">
            <ReactMarkdown
                remarkPlugins={[ remarkGfm ]}
                rehypePlugins={[ rehypeHighlight ]}
                components={{
                    code: CodeBlock,
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}


export default MarkdownRenderer

