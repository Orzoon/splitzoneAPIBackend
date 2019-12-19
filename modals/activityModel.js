const mongoose = require("mongoose");


const ActivitySchema = new mongoose.Schema({
    activity: {
        type: String,
        trim: true
    }
})

const Activity = mongoose.model("Activity", ActivitySchema)

module.exports = Activity;