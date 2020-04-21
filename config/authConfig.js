const passport = require("passport");
const jwt = require("jsonwebtoken");
/* Strategies */
const facebookStrategy = require("passport-facebook");
const googleStrategy = require("passport-google-oauth2").Strategy;
/* Keys */
const keys = require("./authKeys");

/* MODEL */
const userModel = require('../modals/userModel')

passport.serializeUser((user,cb) => {
    cb(null,user);
})
passport.deserializeUser((user,cb) => {
    cb(null,user)
})

/* facebook Strategy */
passport.use(new facebookStrategy({
        clientID: keys.facebook.clientID,
        clientSecret: keys.facebook.clientSecret,
        callbackURL: keys.facebook.callbackURL},
    function(accessToken, refreshToken, profile, cb ){
        console.log("prfileInformation", JSON.stringify(profile))
        user = {...profile}
        return cb(null,profile)
    }
))


passport.use(new googleStrategy({
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret,
    callbackURL: 'http://localhost:5000/auth/google/callback'
    },
    async function (accessToken, refreshToken, profile, cb){
        // get email
        try{
            console.log("async Function")
            const email = profile.emails[0].value;
            const name = profile.displayName;
            const userExists = await userModel.findOne({email: email});
            let userObj = {};
            /* UserExists */
            if(userExists){
                const token = jwt.sign({userID: userExists._id}, process.env.TOKENSECRET);
                const user = await userModel.findByIdAndUpdate(userExists._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
                // send token back
                userObj.createdToken = token;
                cb(null, userObj)
            }else {
                const user = new userModel({email: email, password: null, username: name});
                await user.save();
                const token = jwt.sign({userID: user._id}, process.env.TOKENSECRET);
                await userModel.findByIdAndUpdate(user._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
                // send token back
                userObj.createdToken = token;
                cb(null, userObj)
            }
        }catch(error){
        }
    }
))


