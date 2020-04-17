const express = require("express");
const authRoutes = express.Router();
const passport = require("passport");

/* Strategies */


// authRoutes.get('/facebook', passport.authenticate('facebook'));
// authRoutes.get('/facebook/callback', passport.authenticate('facebook'), (req,res) => {
//     console.log("successfully done integrating")
// })

authRoutes.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));
authRoutes.get('/google/callback', passport.authenticate('google'), (req,res) => {
    res.redirect('/somethingnew')
});


module.exports = authRoutes;