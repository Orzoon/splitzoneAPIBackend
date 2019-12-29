const mongoose = require('mongoose');


const billSchema = new mongoose.Schema({
    paidById: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    paidAmount: {
        type: Number,
        required: true
    },
    splittedAmongNumber: {
        type: Number,
        required: true
    },
    paidDate: {
        type: Date,
        required: true,
        default: null
    },
    dividedEqually: {
        type: Boolean,
        required: true
    },
    splittedAmongMembers:[mongoose.Schema.ObjectId],
    paidCategory: {
        type: String,
        required: true,
        trim: true,
        default: null
    },
    ownerGroup: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    }
}, {timestamps: true})
const Bill = mongoose.model('Bill',billSchema);

module.exports = Bill;