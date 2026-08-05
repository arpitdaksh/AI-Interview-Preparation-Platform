import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response?.interviewReport ?? null)
            return response?.interviewReport ?? null
        } catch (error) {
            console.error("Failed to generate interview report:", error)
            // Rethrow so the UI can display a helpful error message
            throw error
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response?.interviewReport ?? null)
            return response?.interviewReport ?? null
        } catch (error) {
            console.error(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response?.interviewReports ?? [])
            return response?.interviewReports ?? []
        } catch (error) {
            console.error(error)
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const blob = await generateResumePdf({ interviewReportId })

            // If the server returned an error as a JSON blob, surface it instead of downloading a corrupt file
            if (blob?.type?.includes("application/json")) {
                const text = await blob.text()
                let message = "Failed to generate resume PDF."
                try {
                    message = JSON.parse(text)?.message || message
                } catch { /* ignore parse error, use default message */ }
                throw new Error(message)
            }

            // Reconstruct from raw bytes to guarantee an exact, uncorrupted PDF blob.
            const arrayBuffer = await blob.arrayBuffer()
            const pdfBlob = new Blob([ arrayBuffer ], { type: "application/pdf" })

            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            // IMPORTANT: defer cleanup so the browser can finish reading the blob
            // before the URL is revoked. Removing/revoking immediately after
            // click() can truncate/corrupt the downloaded file.
            setTimeout(() => {
                link.remove()
                window.URL.revokeObjectURL(url)
            }, 1000)
        } catch (error) {
            console.error(error)
            alert(error?.message || "Failed to download resume. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}

