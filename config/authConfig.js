const passport = require("passport");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
/* Strategies */
const facebookStrategy = require("passport-facebook");
const googleStrategy = require("passport-google-oauth2").Strategy;
/* Keys */
const keys = require("./authKeys");

/* MODEL */
const userModel = require('../modals/userModel')
const userActivityModel = require("../modals/userActivityModel");

passport.serializeUser((user,cb) => {
    cb(null,user);
})
passport.deserializeUser((user,cb) => {
    cb(null,user)
})

// /* facebook Strategy */
// passport.use(new facebookStrategy({
//         clientID: keys.facebook.clientID,
//         clientSecret: keys.facebook.clientSecret,
//         callbackURL: keys.facebook.callbackURL},
//     function(accessToken, refreshToken, profile, cb ){
//         console.log("prfileInformation", JSON.stringify(profile))
//         user = {...profile}
//         return cb(null,profile)
//     }
// ))


passport.use(new googleStrategy({
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret,
    callbackURL: 'https://splitzone.herokuapp.com/auth/google/callback'
    },
    async function (accessToken, refreshToken, profile, cb){
        // get email
        try{
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const userExists = await userModel.findOne({email: email});
            let userObj = {};
            /* UserExists */
            if(userExists){
                const token = jwt.sign({userID: userExists._id}, process.env.TOKENSECRET);
                const user = await userModel.findByIdAndUpdate(userExists._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
                // send token back
                userObj._id = user._id;
                userObj.createdToken = token
            }else {
                const user = new userModel({email: email, password: null, username: name});
                await user.save();
                const token = jwt.sign({userID: user._id}, process.env.TOKENSECRET);
                await userModel.findByIdAndUpdate(user._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
                // updating user activity
                // send token back
                userObj._id = user._id;
                userObj.createdToken = token;
            }
            const userActivity = new userActivityModel({
                activityUserId:  userObj._id, 
                activity: `signedIn`,
                invokedBy: {
                    _id: mongoose.Types.ObjectId( userObj._id)
                }
            });
            await userActivity.save();
            cb(null, userObj)
        }catch(error){
            console.log("error", error)
        }
    }
))


