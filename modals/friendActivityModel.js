const mongoose = require("mongoose");
const friendActivitySchema = new mongoose.Schema({
    invokedBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String,
            trim: true
        }
    },
    invokedTo: {
        _id: {
            type: mongoose.Schema.Types.ObjectId
        },
        email: {
            type: String,
            trim: true
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
})

const friendActivityModel = mongoose.model("friendActivity", friendActivitySchema)

module.exports = friendActivityModel;