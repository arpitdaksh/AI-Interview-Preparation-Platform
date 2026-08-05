const mongoose = require("mongoose")


const mockQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Question is required" ]
    },
    answer: {
        type: String,
        default: ""
    },
    evaluation: {
        score: {
            type: Number,
            min: 0,
            max: 10,
            default: null
        },
        strengths: {
            type: [ String ],
            default: []
        },
        weaknesses: {
            type: [ String ],
            default: []
        },
        betterAnswer: {
            type: String,
            default: ""
        },
        tips: {
            type: [ String ],
            default: []
        }
    }
}, {
    _id: true
})


const mockInterviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    type: {
        type: String,
        enum: [ "HR", "Technical", "Behavioral", "DSA", "System Design" ],
        required: [ true, "Interview type is required" ]
    },
    durationMin: {
        type: Number,
        required: [ true, "Duration is required" ],
        min: 5,
        max: 120
    },
    status: {
        type: String,
        enum: [ "in-progress", "completed" ],
        default: "in-progress"
    },
    questions: {
        type: [ mockQuestionSchema ],
        default: []
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})


const mockInterviewModel = mongoose.model("MockInterview", mockInterviewSchema)

module.exports = mockInterviewModel

