const jwt = require("jsonwebtoken");
const userModel = require('../modals/userModel')


const auth = async(req,res,next) => {
    try{
        if(!req.headers.authorization){
            throw new Error('authorization header not set');
        }
        const token = req.headers.authorization.split(" ")[1].trim();
        if(!token){
            throw new  Error("token not found in header");
        }
        const jwtVerify = jwt.verify(token, process.env.TOKENSECRET)
        const user = await userModel.findOne({$and: [{_id: jwtVerify.userID}, {"tokens.token": token}]});
        if(!user){
            throw new Error("please authenticate")
        }
        const userObj = user.toObject();
        delete userObj.tokens;
        delete userObj.password;
        req.user = userObj;
        next();
    }
    catch(error){
        if(error.message){
            res.send(error.message)
        }
        else {
            res.status(500).send(error)
        }
    } 
}

module.exports = auth;

