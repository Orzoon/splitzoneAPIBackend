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
                trim: true
            }
        }
    ]
})

const friendModel = new module("Friend", friendSchema);


module.exports = friendModel;