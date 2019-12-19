const mongoose  = require('mongoose');


const GroupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        trim: true,
        required: true
    },
    createdBy: {
        type: string,
        required: true,
        trim: true
    },
    createdById: {
        type: mongoose.Schema.Types.ObjectId
    },
    color: {
        type: string
    }
})
const Group = mongoose.model("Group", GroupSchema)

module.exports = Group;