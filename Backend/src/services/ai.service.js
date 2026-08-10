const OpenAI = require("openai");
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")
// const fs = require("fs")

const ai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// Find an installed Chromium-based browser for Puppeteer to use for PDF generation.
// Chrome and Edge (Windows/Mac/Linux) both support headless PDF rendering.
// const CANDIDATE_BROWSERS = [
//     process.env.PUPPETEER_EXECUTABLE_PATH,
//     "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//     "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
//     "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
//     "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
//     "/usr/bin/google-chrome",
//     "/usr/bin/google-chrome-stable",
//     "/usr/bin/chromium",
//     "/usr/bin/chromium-browser",
//     "/usr/bin/microsoft-edge",
// ].filter(Boolean)

// function getBrowserExecutable() {
//     for (const p of CANDIDATE_BROWSERS) {
//         try {
//             if (fs.existsSync(p)) return p
//         } catch { /* ignore */ }
//     }
//     return null
// }


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * OpenRouter free models often wrap JSON in markdown code fences (```json ... ```)
 * or add prose around it. This strips the fences/prose and returns the raw JSON
 * so JSON.parse succeeds.
 */
function extractJson(text) {
    if (typeof text !== "string") {
        // Some models return content as an array of content parts
        if (Array.isArray(text)) {
            text = text.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("")
        } else {
            throw new Error("AI returned a non-string response.")
        }
    }

    const candidates = []

    // 1. Markdown fenced block (```json ... ```)
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced) {
        candidates.push(fenced[ 1 ].trim())
    }

    // 2. Balanced { ... } object (handles prose around the JSON)
    const start = text.indexOf("{")
    if (start !== -1) {
        let depth = 0
        for (let i = start; i < text.length; i++) {
            const ch = text[ i ]
            if (ch === "{") depth++
            else if (ch === "}") {
                depth--
                if (depth === 0) {
                    candidates.push(text.slice(start, i + 1).trim())
                    break
                }
            }
        }
    }

    // 3. Whole trimmed text
    candidates.push(text.trim())

    // Try each candidate, including versions with escaped newlines/quotes unescaped
    for (const candidate of candidates) {
        if (!candidate) continue
        const variants = [
            candidate,
            candidate.replace(/\\n/g, "\n").replace(/\\t/g, "\t"),
            candidate.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "\t")
        ]
        for (const v of variants) {
            try {
                return JSON.parse(v)
            } catch { /* try next variant */ }
        }
    }

    // Last resort: the whole response may itself be a JSON-encoded string
    try {
        const parsed = JSON.parse(text)
        if (typeof parsed === "string") {
            return JSON.parse(parsed)
        }
    } catch { /* ignore */ }

    throw new Error("Could not parse JSON from AI response. Raw: " + text.slice(0, 300))
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `
Generate an interview report for a candidate.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY valid JSON in this exact format:

{
  "matchScore": 90,
  "technicalQuestions": [
    {
      "question": "",
      "intention": "",
      "answer": ""
    }
  ],
  "behavioralQuestions": [
    {
      "question": "",
      "intention": "",
      "answer": ""
    }
  ],
  "skillGaps": [
    {
      "skill": "",
      "severity": "low"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "",
      "tasks": [""]
    }
  ],
  "title": ""
}
`;

    const response = await ai.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7
    });

    return extractJson(response.choices[0].message.content);

}

// async function generatePdfFromHtml(htmlContent) {
//     console.log("[PDF] setContent HTML length:", htmlContent?.length ?? "NULL")

//     const executablePath = getBrowserExecutable()
//     console.log("[PDF] browser executable found:", executablePath ?? "NONE (using puppeteer's bundled Chromium)")

//     // const launchOptions = executablePath ? { executablePath } : {}
//     // const browser = await puppeteer.launch(launchOptions)

//     const browser = await puppeteer.launch({
//       executablePath: executablePath || undefined,
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//       ]
//     })
//     try {
//         const page = await browser.newPage();
//         await page.setContent(htmlContent, { waitUntil: "networkidle0" })
//         console.log("[PDF] setContent OK")

//         const pdfResult = await page.pdf({
//             format: "A4", margin: {
//                 top: "20mm",
//                 bottom: "20mm",
//                 left: "15mm",
//                 right: "15mm"
//             }
//         })

//         const pdfBuffer = Buffer.from(pdfResult)
//         console.log("[PDF] page.pdf() returned buffer length:", pdfBuffer.length)

//         if (pdfBuffer.length === 0) {
//             throw new Error("Puppeteer page.pdf() returned an empty buffer (0 bytes).")
//         }

//         return pdfBuffer
//     } finally {
//         await browser.close()
//     }
// }
async function generatePdfFromHtml(htmlContent) {
    console.log("[PDF] setContent HTML length:", htmlContent?.length ?? "NULL")

    const executablePath = puppeteer.executablePath()

    console.log("[PDF] Puppeteer executable path:", executablePath)

    const browser = await puppeteer.launch({
        executablePath
    })

    try {
        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: "networkidle0"
        })

        console.log("[PDF] setContent OK")

        const pdfResult = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        const pdfBuffer = Buffer.from(pdfResult)

        console.log(
            "[PDF] page.pdf() returned buffer length:",
            pdfBuffer.length
        )

        if (pdfBuffer.length === 0) {
            throw new Error(
                "Puppeteer page.pdf() returned an empty buffer (0 bytes)."
            )
        }

        return pdfBuffer
    } finally {
        await browser.close()
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7
    })

    const rawContent = response.choices[0]?.message?.content
    console.log("[AI] generateResumePdf raw response length:", rawContent?.length ?? "NULL")

    const jsonContent = extractJson(rawContent)
    console.log("[AI] parsed jsonContent keys:", jsonContent ? Object.keys(jsonContent) : null)

    // Validate that the AI actually returned HTML content
    if (!jsonContent.html || typeof jsonContent.html !== "string" || jsonContent.html.trim().length === 0) {
        throw new Error("AI response did not contain a valid 'html' field with resume content.")
    }

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf, ai }

