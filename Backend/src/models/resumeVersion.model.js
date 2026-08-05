const mongoose = require("mongoose")


const resumeVersionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    version: {
        type: Number,
        default: 1
    },
    fileName: {
        type: String,
        default: ""
    },
    resumeText: {
        type: String,
        default: ""
    },
    jobTitle: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})


const resumeVersionModel = mongoose.model("ResumeVersion", resumeVersionSchema)

module.exports = resumeVersionModel

