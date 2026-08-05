const mongoose = require("mongoose")


const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [ true, "User is required" ]
    },
    type: {
        type: String,
        enum: [ "todayGoal", "tomorrowGoal", "revision" ],
        required: [ true, "Notification type is required" ]
    },
    title: {
        type: String,
        required: [ true, "Title is required" ]
    },
    message: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})


const notificationModel = mongoose.model("Notification", notificationSchema)

module.exports = notificationModel

