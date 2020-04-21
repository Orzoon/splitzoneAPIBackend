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
   groupId: {
       type: mongoose.Schema.Types.ObjectId
   },
    activity: {
        type: String,
        trim: true
    },
    createdOn: {
        type: String,
        trim: true,
        default: Date.now()
    }
}, {timestamps: true})

const billActivityModel = mongoose.model("billActivity", billActivitySchema)

module.exports = billActivityModel;