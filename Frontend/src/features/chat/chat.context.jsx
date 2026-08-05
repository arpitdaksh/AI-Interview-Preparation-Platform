import { createContext, useState, useCallback } from "react";


export const ChatContext = createContext()


export const ChatProvider = ({ children }) => {
    const [ chats, setChats ] = useState([])
    const [ activeChat, setActiveChat ] = useState(null)
    const [ messages, setMessages ] = useState([])
    const [ suggestedQuestions, setSuggestedQuestions ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const [ streaming, setStreaming ] = useState(false)
    const [ chatError, setChatError ] = useState(null)

    const clearError = useCallback(() => setChatError(null), [])

    return (
        <ChatContext.Provider value={{
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
        }}>
            {children}
        </ChatContext.Provider>
    )
}
