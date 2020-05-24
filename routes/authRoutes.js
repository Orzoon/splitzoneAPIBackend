const express = require("express");
const authRoutes = express.Router();
const passport = require("passport");

/* Strategies */


// authRoutes.get('/facebook', passport.authenticate('facebook'));
// authRoutes.get('/facebook/callback', passport.authenticate('facebook'), (req,res) => {
//     console.log("successfully done integrating")
// })
authRoutes.get('/google', passport.authenticate('google', {scope: ['profile', 'email']}));
// authRoutes.get('/google/callback',  passport.authenticate("google", { failureRedirect: "/", session: false }), (req,res) => {
//     console.log("profile", req.profile)
//     res.redirect('/somethingnew')
// });
authRoutes.get("/google/callback", passport.authenticate("google", { failureRedirect: "/", session: false }),
    function(req, res) {
        //NOTE if token is not present redirect to login page
        const token = req.user.createdToken;
        return res.redirect("/social?token=" + token);
       // return res.redirect("/social?token=" + token);
        
    }
);

module.exports = authRoutes;