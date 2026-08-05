const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
    },

    password: {
        type: String,
        required: true
    },
    skills: {
        type: [ String ],
        default: []
    },
    experience: {
        type: String,
        default: ""
    },
    theme: {
        type: String,
        enum: [ "light", "dark" ],
        default: "light"
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel