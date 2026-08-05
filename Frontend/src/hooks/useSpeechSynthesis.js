import { useState, useCallback, useEffect } from "react"

/**
 * Wraps the browser's SpeechSynthesis API.
 * Provides speak(), stopSpeaking(), and speaking state.
 */
export const useSpeechSynthesis = () => {
    const [ speaking, setSpeaking ] = useState(false)
    const [ supported ] = useState(() => {
        return typeof window !== "undefined" && "speechSynthesis" in window
    })

    const stopSpeaking = useCallback(() => {
        if (supported && window.speechSynthesis) {
            window.speechSynthesis.cancel()
        }
        setSpeaking(false)
    }, [ supported ])

    const speak = useCallback((text, { rate = 1, pitch = 1, onEnd } = {}) => {
        if (!supported || !window.speechSynthesis || !text) return

        stopSpeaking()

        const utterance = new SpeechSynthesisUtterance(String(text))
        utterance.rate = rate
        utterance.pitch = pitch

        // Prefer an English voice if available
        const voices = window.speechSynthesis.getVoices()
        const englishVoice = voices.find(v => v.lang && v.lang.startsWith("en"))
        if (englishVoice) {
            utterance.voice = englishVoice
        }

        utterance.onstart = () => setSpeaking(true)
        utterance.onend = () => {
            setSpeaking(false)
            if (onEnd) onEnd()
        }
        utterance.onerror = () => setSpeaking(false)

        window.speechSynthesis.speak(utterance)
    }, [ supported, stopSpeaking ])

    useEffect(() => {
        return () => {
            if (supported && window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
    }, [ supported ])

    return { speak, stopSpeaking, speaking, supported: !!supported }
}

