import { useState, useRef, useEffect, useCallback } from "react"

/**
 * Wraps the browser's SpeechRecognition API (Web Speech API).
 * Returns transcript, listening state, and start/stop controls.
 */
export const useSpeechRecognition = () => {
    const [ transcript, setTranscript ] = useState("")
    const [ listening, setListening ] = useState(false)
    const recognitionRef = useRef(null)
    const [ supported ] = useState(() => {
        return typeof window !== "undefined" &&
            (window.SpeechRecognition || window.webkitSpeechRecognition)
    })

    const finalTranscriptRef = useRef("")

    const startListening = useCallback(() => {
        if (!supported) return

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!recognitionRef.current) {
            const recognition = new SR()
            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = "en-US"

            recognition.onresult = (event) => {
                let interim = ""
                let final = ""
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[ i ]
                    if (result.isFinal) {
                        final += result[ 0 ].transcript
                    } else {
                        interim += result[ 0 ].transcript
                    }
                }
                if (final) {
                    finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + final
                }
                setTranscript(finalTranscriptRef.current + (interim ? " " + interim : ""))
            }

            recognition.onend = () => {
                setListening(false)
            }

            recognition.onerror = () => {
                setListening(false)
            }

            recognitionRef.current = recognition
        }

        finalTranscriptRef.current = ""
        setTranscript("")
        recognitionRef.current.start()
        setListening(true)
    }, [ supported ])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch { /* ignore */ }
        }
        setListening(false)
    }, [])

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop()
                } catch { /* ignore */ }
            }
        }
    }, [])

    return { transcript, listening, startListening, stopListening, supported: !!supported }
}

