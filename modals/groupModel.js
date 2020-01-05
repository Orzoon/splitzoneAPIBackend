const mongoose  = require('mongoose');


const GroupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        trim: true,
        required: true
    },
    createdBy: {
        type: String,
        required: true,
        trim: true
    },
    members: [{
        _id:{
            type: mongoose.Schema.Types.ObjectId
        },
        name: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        }
    }],
    activity: {
        type: String,
        trim: true
    },
    createdById: {
        type: mongoose.Schema.Types.ObjectId
    },
    createdOn: {
        type: Date,
    }
}, {timestamps: true})
const Group = mongoose.model("Group", GroupSchema)

module.exports = Group;