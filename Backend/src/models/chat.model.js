const mongoose = require("mongoose")


const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: [ "user", "assistant" ],
        required: [ true, "Message role is required" ]
    },
    content: {
        type: String,
        required: [ true, "Message content is required" ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
})


const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    title: {
        type: String,
        default: ""
    },
    interviewReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        default: null
    },
    messages: {
        type: [ chatMessageSchema ],
        default: []
    }
}, {
    timestamps: true
})


/**
 * Trim the stored conversation to the last 20 messages
 * so the history sent to the AI stays bounded.
 */
chatSchema.methods.trimMessages = function () {
    if (this.messages.length > 20) {
        this.messages = this.messages.slice(-20)
    }
}


const chatModel = mongoose.model("Chat", chatSchema)

module.exports = chatModel

