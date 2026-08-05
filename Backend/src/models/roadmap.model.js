const mongoose = require("mongoose")


const roadmapWeekSchema = new mongoose.Schema({
    week: {
        type: Number,
        required: [ true, "Week number is required" ]
    },
    title: {
        type: String,
        required: [ true, "Week title is required" ]
    },
    focus: {
        type: String,
        required: [ true, "Focus is required" ]
    },
    tasks: {
        type: [ String ],
        default: []
    },
    resources: {
        type: [ String ],
        default: []
    }
}, {
    _id: false
})


const roadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    interviewReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        default: null
    },
    title: {
        type: String,
        default: "My Career Roadmap"
    },
    summary: {
        type: String,
        default: ""
    },
    weeks: {
        type: [ roadmapWeekSchema ],
        default: []
    }
}, {
    timestamps: true
})


const roadmapModel = mongoose.model("Roadmap", roadmapSchema)

module.exports = roadmapModel

