const mongoose = require("mongoose")


const codingQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [ true, "Question is required" ]
    },
    topic: {
        type: String,
        enum: [ "Arrays", "Strings", "Trees", "Graphs", "DP", "SQL", "OOPs" ],
        default: "Arrays"
    },
    language: {
        type: String,
        default: "javascript"
    },
    code: {
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
        betterSolution: {
            type: String,
            default: ""
        },
        timeComplexity: {
            type: String,
            default: ""
        },
        spaceComplexity: {
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


const codingInterviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    topic: {
        type: String,
        enum: [ "Arrays", "Strings", "Trees", "Graphs", "DP", "SQL", "OOPs" ],
        required: [ true, "Topic is required" ]
    },
    status: {
        type: String,
        enum: [ "in-progress", "completed" ],
        default: "in-progress"
    },
    questions: {
        type: [ codingQuestionSchema ],
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


const codingInterviewModel = mongoose.model("CodingInterview", codingInterviewSchema)

module.exports = codingInterviewModel

