const mongoose = require("mongoose")


const aiSuggestionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    interviewReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: [ true, "Interview report is required" ]
    },
    topCompanies: {
        type: [ String ],
        default: []
    },
    topMissingSkills: {
        type: [ String ],
        default: []
    },
    recommendedCourses: {
        type: [ String ],
        default: []
    },
    recommendedProjects: {
        type: [ String ],
        default: []
    },
    recommendedCertifications: {
        type: [ String ],
        default: []
    }
}, {
    timestamps: true
})


const aiSuggestionModel = mongoose.model("AISuggestion", aiSuggestionSchema)

module.exports = aiSuggestionModel

