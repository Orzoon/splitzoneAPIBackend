const mongoose = require("mongoose");


const userActivitySchema = new mongoose.Schema({
    activityUserId: {
        type: mongoose.Schema.Types.ObjectId
    },
    activity: {
        type: String,
        trim: true
    }
},{timestamps: true})

const userActivityModel = mongoose.model("userActivity", userActivitySchema)

module.exports = userActivityModel;