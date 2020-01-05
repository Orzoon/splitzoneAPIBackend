const userModel = require('../modals/userModel');
const userActivityModel = require("../modals/userActivityModel");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

// single User API
const userSignin = async(req,res) => {
    const {email, password} = req.body;
    // check validation
    try{
        const userExists = await userModel.findOne({email: email});
        if(!userExists){
            throw new Error('User does not exist');
        }
        const passwordCheck = await bcrypt.compare(password, userExists.password);
        if(!passwordCheck){
            throw new Error('Invalid username or password');
        }
        const token = jwt.sign({userID: userExists._id}, process.env.TOKENSECRET);
        const user = await userModel.findByIdAndUpdate(userExists._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.tokens;
        const userActivity = new userActivityModel({activityUserId: req.user._id, activity: `you signed-in on ${new Date().toDateString} at ${new Date().getHours()}:${new Date().getMinutes()} `});
        await userActivity.save();
        res.status(200).json({userObj, token});
    }
    catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
}

const userSignup = async(req,res) => {
    const {email,password, name} = req.body;
    // validate email and password
    //check for pre-exsisting data
    try{
        const exists = await userModel.findOne({email: email});
        if(exists){
            throw new Error ('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = new userModel({email: email, password: hashedPassword, username: name});
        await user.save();
        const token = jwt.sign({userID: user._id}, process.env.TOKENSECRET);
        await userModel.findByIdAndUpdate(user._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.tokens;
        delete userObj.password;
        const userActivity = new userActivityModel({activityUserId: req.user._id, activity: `you created your Account on ${new Date().toDateString} at ${new Date().getHours()}:${new Date().getMinutes()} `});
        await userActivity.save();
        res.status(200).json({userObj, token});
    }
    catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    
    }

}
const getUser = async(req,res) => {
    try{
      res.json(req.user);
    }
    catch(error){
        res.status(500).send();
    }
}
module.exports = {
    userSignin,
    userSignup,
    getUser
}