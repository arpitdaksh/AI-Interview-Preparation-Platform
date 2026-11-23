const OpenAI = require("openai");
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")
const pdfParse = require("pdf-parse")
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

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

const RESUME_THEME = `<style>
    @page { size: A4; margin: 14mm 16mm; }
    html { color-scheme: light; }
    body {
        margin: 0 !important;
        color: #243247 !important;
        background: #fff !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 9.5pt !important;
        line-height: 1.38 !important;
        letter-spacing: normal !important;
        text-transform: none !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    h1 {
        color: #172b4d !important;
        font-size: 25pt !important;
        line-height: 1.08 !important;
        letter-spacing: -0.45pt !important;
        text-transform: none !important;
        margin: 0 0 4pt !important;
    }
    h2 {
        color: #147d82 !important;
        font-size: 10pt !important;
        line-height: 1.2 !important;
        letter-spacing: 1.1pt !important;
        text-transform: uppercase !important;
        border: 0 !important;
        border-bottom: 0.8pt solid #d8e5e9 !important;
        padding: 0 0 4pt !important;
        margin: 12pt 0 5pt !important;
        break-after: avoid-page;
    }
    h3, h4 {
        color: #243b5a !important;
        font-size: 9.5pt !important;
        line-height: 1.25 !important;
        letter-spacing: normal !important;
        text-transform: none !important;
        margin: 7pt 0 2pt !important;
        break-after: avoid-page;
    }
    p { margin: 2.5pt 0 !important; orphans: 2; widows: 2; }
    ul, ol { margin: 3pt 0 5pt !important; padding-left: 15pt !important; }
    li { margin: 1.5pt 0 !important; padding-left: 1pt; }
    a { color: #126b72 !important; text-decoration: none !important; }
    table { width: 100% !important; border-collapse: collapse !important; }
    tr, img { break-inside: avoid; }
    img { max-width: 100% !important; height: auto !important; }
    .resume-page { max-width: 760px; margin: 0 auto; }
    .resume-header {
        border-bottom: 2pt solid #147d82;
        padding: 0 0 10pt;
        margin: 0 0 11pt;
    }
    .resume-kicker {
        color: #147d82;
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: 1.8pt;
        text-transform: uppercase;
        margin: 0 0 5pt;
    }
    .resume-role { color: #5b6b80; font-size: 11pt; margin: 0; }
    .resume-section { margin: 0 0 9pt; }
    .resume-section h2 { margin-top: 9pt !important; }
    .resume-section p { overflow-wrap: anywhere; }
</style>`

const ONE_PAGE_RESUME_THEME = `<style>
    @page { size: A4; margin: 8mm 10mm; }
    body { font-size: 8.3pt !important; line-height: 1.2 !important; }
    h1 { font-size: 20pt !important; margin-bottom: 2pt !important; }
    h2 { font-size: 8.5pt !important; margin: 6pt 0 3pt !important; padding-bottom: 2pt !important; }
    h3, h4 { font-size: 8.2pt !important; margin: 4pt 0 1pt !important; }
    p { margin: 1pt 0 !important; }
    ul, ol { margin: 1.5pt 0 2.5pt !important; padding-left: 12pt !important; }
    li { margin: 0.5pt 0 !important; }
    .resume-header { padding-bottom: 5pt; margin-bottom: 5pt; }
    .resume-section, .resume-section h2 { margin-top: 4pt !important; }
</style>`

const TWO_PAGE_RESUME_THEME = `<style>
    @page { size: A4; margin: 12mm 14mm; }
</style>`

function getResumeLengthTheme(pageLength) {
    if (pageLength === "one-page") return ONE_PAGE_RESUME_THEME
    if (pageLength === "two-pages") return TWO_PAGE_RESUME_THEME
    return ""
}

function getResumeRoleTitle({ title, jobDescription }) {
    const rawTitle = String(title || "")
    const titleLooksTracked = /^[A-Z\s]{10,}$/.test(rawTitle) || /^[A-Z0-9]{14,}$/.test(rawTitle)
    let role = String(titleLooksTracked ? jobDescription : (title || jobDescription || "Target role"))
        .split(/\r?\n/)[0]
        .replace(/\s+candidate$/i, "")
        .replace(/^(?:looking for|hiring|need|seeking)\s+/i, "")
        .replace(/\s+(?:needed|wanted|position|role)$/i, "")
        .slice(0, 100)
        .trim()
    if (role && (role === role.toLowerCase() || role === role.toUpperCase())) {
        role = role.toLowerCase().replace(/\b[a-z]/g, character => character.toUpperCase())
    }
    return role
}

function applyResumeTheme(html, roleTitle, pageLength) {
    let documentHtml = String(html || "").trim()
    const resumeTheme = `${RESUME_THEME}${getResumeLengthTheme(pageLength)}`
    if (roleTitle) {
        documentHtml = documentHtml.replace(
            /(<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p\b[^>]*>)([\s\S]*?)(<\/p>)/i,
            (match, prefix, content, suffix) => {
                const visibleText = content.replace(/<[^>]*>/g, "").trim()
                const looksCorrupted = visibleText.length > 12 && !/[a-z]/.test(visibleText)
                return looksCorrupted ? `${prefix}${escapeHtml(roleTitle)}${suffix}` : match
            }
        )
    }
    if (!/<html[\s>]/i.test(documentHtml)) {
        return `<!doctype html><html lang="en"><head><meta charset="utf-8">${resumeTheme}</head><body>${documentHtml}</body></html>`
    }

    if (/<\/head\s*>/i.test(documentHtml)) {
        return documentHtml.replace(/<\/head\s*>/i, `${resumeTheme}</head>`)
    }
    return documentHtml.replace(/<html([^>]*)>/i, `<html$1><head><meta charset="utf-8">${resumeTheme}</head>`)
}

function buildFallbackResumeHtml({ sourceText, jobDescription, title, pageLength }) {
    const normalizeLine = line => line
        .replace(/\b(?:[A-Z]\s+){2,}[A-Z]\b/g, value => value.replace(/\s+/g, ""))
        .replace(/\b(\d)\s+(?=\d\b)/g, "$1")
        .replace(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)(?=\d)/gi, "$1 ")
        .replace(/(\d{4})\s*[—–-]\s*(PRESENT|CURRENT|TODAY)/gi, "$1 - $2")
        .trim()
    const rawLines = String(sourceText || "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !/^(?:[•●▪*-]\s*)?[-–—]*\s*\d+\s+of\s+\d+\s*[-–—]*$/i.test(line))
    const lines = rawLines
        .map(normalizeLine)

    const name = lines.shift() || "Professional Resume"
    const secondLine = lines[0] || ""
    const role = secondLine && secondLine.length < 100 ? lines.shift() : ""
    const roleWasLetterSpaced = /^[A-Z](?:\s+[A-Z]){5,}$/.test(rawLines[1] || "")
    const roleLooksTracked = roleWasLetterSpaced || /^[A-Z\s]{10,}$/.test(role)
    const sectionAliases = new Map([
        ["summary", "Profile"], ["professional summary", "Profile"], ["profile", "Profile"], ["about", "Profile"],
        ["employment history", "Experience"], ["work experience", "Experience"], ["professional experience", "Experience"], ["experience", "Experience"],
        ["education", "Education"], ["skills", "Skills"], ["technical skills", "Skills"], ["core skills", "Skills"],
        ["certifications", "Certifications"], ["certificates", "Certifications"], ["courses", "Courses"],
        ["projects", "Projects"], ["languages", "Languages"], ["hobbies", "Interests"], ["interests", "Interests"],
        ["details", "Contact"], ["contact", "Contact"], ["contact details", "Contact"],
        ["achievements", "Achievements"], ["awards", "Awards"], ["references", "References"]
    ])
    const sections = []
    let current = { title: "Profile", lines: [] }

    for (const line of lines) {
        const normalizedHeading = line.replace(/:$/, "").toLowerCase()
        const heading = sectionAliases.get(normalizedHeading)
        if (heading) {
            if (current.lines.length) sections.push(current)
            current = { title: heading, lines: [] }
        } else {
            current.lines.push(line)
        }
    }
    if (current.lines.length || sections.length === 0) sections.push(current)

    const renderLines = contentLines => {
        const output = []
        let bullets = []
        const flushBullets = () => {
            if (bullets.length) output.push(`<ul>${bullets.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`)
            bullets = []
        }
        for (const line of contentLines) {
            const bullet = line.match(/^(?:[•●▪*-]|\u2022)\s*(.+)$/)
            if (bullet) bullets.push(bullet[1])
            else {
                flushBullets()
                output.push(`<p>${escapeHtml(line)}</p>`)
            }
        }
        flushBullets()
        return output.join("")
    }
    const targetRole = getResumeRoleTitle({ title: roleLooksTracked ? "" : title, jobDescription })
    const roleLabel = targetRole || role
    const body = sections.map(section => `
        <section class="resume-section">
            <h2>${escapeHtml(section.title)}</h2>
            ${renderLines(section.lines)}
        </section>
    `).join("")

    const resumeTheme = `${RESUME_THEME}${getResumeLengthTheme(pageLength)}`
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">${resumeTheme}</head><body>
        <main class="resume-page">
            <header class="resume-header">
                <p class="resume-kicker">Professional Resume</p>
                <h1>${escapeHtml(name)}</h1>
                ${roleLabel ? `<p class="resume-role">${escapeHtml(roleLabel)}</p>` : ""}
            </header>
            ${body}
        </main>
    </body></html>`
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
async function getPdfPageCount(pdfBuffer) {
    const parser = new pdfParse.PDFParse({ data: pdfBuffer })
    try {
        const info = await parser.getInfo()
        return info.total
    } finally {
        await parser.destroy()
    }
}

async function generatePdfFromHtml(htmlContent, { pageLength = "two-pages" } = {}) {
    console.log(
        "[PDF] Starting PDF generation. HTML length:",
        htmlContent?.length ?? "NULL"
    );

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    });

    try {
        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            // Generated resume HTML may reference external assets that keep
            // networkidle0 from ever settling on hosted environments.
            waitUntil: "domcontentloaded"
        });

        console.log("[PDF] setContent OK");

        const pageLimit = pageLength === "one-page" ? 1 : pageLength === "two-pages" ? 2 : null
        const margins = pageLength === "one-page"
            ? { top: "8mm", bottom: "8mm", left: "10mm", right: "10mm" }
            : { top: "12mm", bottom: "12mm", left: "14mm", right: "14mm" }
        const pdfOptions = {
            format: "A4",
            printBackground: true,
            margin: margins
        }
        let scale = 1
        let layoutZoom = 1
        let pdfBuffer
        let pageCount = 0

        for (let attempt = 0; attempt < 24; attempt += 1) {
            // Chromium's PDF scale can shrink painted content without changing
            // the pagination in some generated HTML resumes. CSS zoom changes
            // the layout itself, so use it for the strict one-page option.
            if (pageLength === "one-page") {
                await page.evaluate(zoom => {
                    document.body.style.zoom = String(zoom)
                }, layoutZoom)
            }

            const pdfResult = await page.pdf({
                ...pdfOptions,
                ...(pageLimit && pageLength !== "one-page" ? { scale } : {})
            })
            pdfBuffer = Buffer.from(pdfResult)

            if (pdfBuffer.length === 0) {
                throw new Error("Puppeteer page.pdf() returned an empty buffer.")
            }

            if (!pageLimit) break
            pageCount = await getPdfPageCount(pdfBuffer)
            if (pageCount <= pageLimit) break
            if (pageLength === "one-page") {
                if (layoutZoom <= 0.1) break
                layoutZoom = Math.max(0.1, layoutZoom * 0.85)
            } else {
                if (scale <= 0.1) break
                scale = Math.max(0.1, scale * 0.85)
            }
        }

        if (pageLimit && pageCount > pageLimit) {
            throw new Error(`Could not fit the resume within ${pageLimit} page${pageLimit > 1 ? "s" : ""}. Shorten the source content or choose a longer layout.`)
        }

        console.log("[PDF] page.pdf() returned buffer length:", pdfBuffer.length, "pages:", pageCount || "flexible")
        return pdfBuffer

    } finally {
        await browser.close();
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription, title, pageLength = "two-pages" }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
        Target role title: ${title || "Not specified"}
        Page length preference: ${pageLength}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        Use a clean single-column ATS-friendly layout with a clear candidate name, concise role line, and standard section headings. Keep headings concise, avoid decorative letter spacing or all-caps body text, and use semantic h1, h2, p, ul, and li elements.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        ${pageLength === "one-page"
                            ? "Fit the resume on exactly one A4 page. Prioritize the most relevant facts, combine repetitive points, and use concise bullets. Do not spill onto a second page."
                            : pageLength === "two-pages"
                                ? "Keep the resume to no more than two A4 pages. Prefer one page when the relevant content fits comfortably; never add filler to use space."
                                : "Use as many pages as the candidate's relevant experience needs. Keep every page readable and avoid filler."}
                    `

    let resumeHtml
    try {
        const response = await ai.chat.completions.create({
            model: "openai/gpt-oss-20b:free",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })

        const rawContent = response.choices[0]?.message?.content
        const jsonContent = extractJson(rawContent)
        if (typeof jsonContent.html === "string" && jsonContent.html.trim()) {
            resumeHtml = applyResumeTheme(jsonContent.html, getResumeRoleTitle({ title, jobDescription }), pageLength)
        } else {
            throw new Error("AI response did not contain resume HTML.")
        }
    } catch (error) {
        // Resume downloads should still work when the AI provider is unavailable
        // or its free model returns an invalid response. Use only supplied facts.
        console.error("[AI] Resume generation failed; using source-text fallback:", error.message)
        const sourceText = resume || selfDescription || "No resume or profile details were provided."
        resumeHtml = buildFallbackResumeHtml({ sourceText, jobDescription, title, pageLength })
    }

    const pdfBuffer = await generatePdfFromHtml(resumeHtml, { pageLength })

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf, ai }

