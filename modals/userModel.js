const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
        username : {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password : {
            type: String,
            trim: true,
        },
        dateCreated: {
            type: Date
        },
        groups: [mongoose.Schema.Types.ObjectId],
        verified: {
            type: Boolean,
            default: false
        },
        tokens:[{
            token: {
                type: String,
                trim: true,
            }
        }],
        tempUser: {
            type: Boolean
        } 
}, {timestamps:true});

const User = mongoose.model('User', userSchema);
module.exports = User;