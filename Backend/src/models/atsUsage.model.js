const mongoose = require("mongoose")

const atsUsageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    month: { type: String, required: true },
    checks: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

atsUsageSchema.index({ user: 1, month: 1 }, { unique: true })

module.exports = mongoose.model("AtsUsage", atsUsageSchema)
