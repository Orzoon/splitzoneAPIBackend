const mongoose = require('mongoose');


const friendSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId
    },
    friends: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                trim: true
            },
            name: {
                type: String,
                trim: true
            },
            email: {
                type : String,
                unique: true,
                default: null
            },
            registered: {
                type: Boolean,
                trim: true,
                default: false
            }
        }
    ]
})

const friendModel = mongoose.model("Friend", friendSchema);


module.exports = friendModel;