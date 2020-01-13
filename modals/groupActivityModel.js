const mongoose = require("mongoose");


const groupActivitySchema = new mongoose.Schema({
    activityGroupId: {
        type: mongoose.Types.Schema.ObjectId
    },
    invokedBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String,
            trim: true
        }
    },
    member: {
        _id: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        }
    },
    groupParties: [],
    activity: {
        type: String,
        trim: true
    },
    createdOn: {
        type: String,
        trim: true,
        default: Date.now()
    }
}, {timestamps: true});

const groupActivityModel = mongoose.model("groupActivity", groupActivitySchema)
module.exports = groupActivityModel;