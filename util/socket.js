
let io;

const init = (httpServer) => {
    io = require("socket.io")(httpServer)
    return io
}

const getIO = () => {
    if(!io){
        throw new Error('socket io is not initialised')
    }
    else {
        return io;
    }
}

module.exports = {
    init,
    getIO
}