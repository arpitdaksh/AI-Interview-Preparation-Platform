const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
// app.use(cors({
//     origin(origin, callback) {
//         // Allow requests with no origin (e.g. curl, Postman) and any localhost dev
//         // server (5173, 5174, 127.0.0.1, etc.). In production, replace with the
//         // exact frontend origin(s).
//         if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
//             return callback(null, true)
//         }
//         return callback(new Error("Not allowed by CORS"))
//     },
//     credentials: true
// }))

app.use(cors({
    origin(origin, callback) {

        const allowedOrigins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://ai-interview-preparation-platform-kappa.vercel.app"
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const chatRouter = require("./routes/chat.routes")
const mockInterviewRouter = require("./routes/mockInterview.routes")
const codingInterviewRouter = require("./routes/codingInterview.routes")
const roadmapRouter = require("./routes/roadmap.routes")
const resumeVersionRouter = require("./routes/resumeVersion.routes")
const dashboardRouter = require("./routes/dashboard.routes")
const analyticsRouter = require("./routes/analytics.routes")
const notificationRouter = require("./routes/notification.routes")
const aiSuggestionRouter = require("./routes/aiSuggestion.routes")
const exportRouter = require("./routes/export.routes")
const userRouter = require("./routes/user.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/chat", chatRouter)
app.use("/api/mock-interview", mockInterviewRouter)
app.use("/api/coding-interview", codingInterviewRouter)
app.use("/api/roadmap", roadmapRouter)
app.use("/api/resumes", resumeVersionRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/ai-suggestions", aiSuggestionRouter)
app.use("/api/export", exportRouter)
app.use("/api/user", userRouter)


/* global error handler - convert errors (incl. multer) into JSON responses */
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)

    const status = err.status || err.statusCode || 500
    const message = err.message || "Internal server error"

    res.status(status).json({ message })
})


module.exports = app

