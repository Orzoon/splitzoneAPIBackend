const mongoose = require('mongoose');


const billSchema = new mongoose.Schema({
    paidById: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    splittedAmongNumber: {
        type: Number,
        required: true
    },
    splittedAmongMembers: {
        type: [mongoose.Schema.Types.ObjectId]
    },
    dividedEqually: {
        type: Boolean,
        required: true
    },
    paidDate: {
        type: Date,
        required: true,
        default: null
    },
    paidAmount: {
        type: Number,
        required: true
    },
    paidCategory: {
        type: String,
        required: true,
        trim: true,
        default: null
    },
    owners: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    }
}, {timestamps: true})
const Bill = mongoose.model('Bill',billSchema);

module.exports = Bill;