const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
        userName : {
            type: String,
            trim: true,
            required: true
        },
        password : {
            type: String,
            trim: true,
            required: true
        },
        dateCreated: {
            type: Date
        },
        groups: [mongoose.Schema.Types.ObjectId],
        verified: {
            type: Boolean
        },
        tokens:[{
            type: Array,
            trim: true,
            required: true
        }] 
}, {timestamps:true});

const User = mongoose.models('User', userSchema);
module.exports = User;