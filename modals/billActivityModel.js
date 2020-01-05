const mongoose = require("mongoose");

const billActivitySchema = new mongoose.Schema({
    invokedBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String,
            trim: true
        }
    },
    activityParties: [mongoose.Schema.Types.ObjectId],
    activityPartiesEmail: [String],
    activity: {
        type: String,
        trim: true
    },
    createdOn: {
        type: String,
        trim: true
    }
}, {timestamps: true})

const billActivityModel = mongoose.model("billActivity", billActivitySchema)

module.exports = billActivityModel;