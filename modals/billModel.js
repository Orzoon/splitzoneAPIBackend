const mongoose = require('mongoose');


const billSchema = new mongoose.Schema({
    paidBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    addedBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        name: {
            type: String,
            trim: true
        }
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
    divided: [
        {
            _id: {
                type: mongoose.Schema.ObjectId,
                trim: true
            },
            name: {
                type: String,
                trim: true
            },
            amount: {
                type: Number
            }
        }
    ],
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