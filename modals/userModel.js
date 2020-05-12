const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
        username : {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password : {
            type: String,
            trim: true,
        },
        groups: [mongoose.Schema.Types.ObjectId],
        verified: {
            type: Boolean,
            default: false
        },
        userType: {
            type: String,
            enum: ["PREMIUM", "NORMAL"],
            default: "NORMAL"
        },
        links: {
          passwordReset: [String, String],
          verification: [String],
          referral: [String],
          referralFrom: [String]
        },
        settings: {
            groups: [String],
            friends: [String],
            bills: [String],
            summary: [String],
            updates: [String]
        },
        tokens:[{
            token: {
                type: String,
                trim: true,
            }
        }]
}, {timestamps:true});

const User = mongoose.model('User', userSchema);
module.exports = User;