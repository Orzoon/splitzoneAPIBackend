const mongoose = require('mongoose');


const socketSchema = new mongoose.Schema({
        socketId: {
            type: String,
            trim: true
        },
        userId: {
            type: String,
            trim: true
        },
        userEmail: {
            type: String,
            trim: true
        }
}, {timestamps:true});

const Socket = mongoose.model('Socket', socketSchema);
module.exports = Socket;

