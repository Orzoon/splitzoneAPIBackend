const express = require('express');
const userRoutes = express.Router();
const auth = require('../auth/auth');
const userController = require('../controllers/userController')
const { check, validationResult } = require('express-validator');


/*------USER---------*/
userRoutes.post('/user/signin', userController.validateUser('userSignIn'), userController.userSignin);
userRoutes.post('/user/signup',userController.validateUser('userSignUp'), userController.userSignup);
userRoutes.post('/user/logout', auth, userController.logoutUser);
userRoutes.get('/app/user', auth, userController.getUser);

/* users summary */
userRoutes.get('/app/summary', auth, userController.getUserSummary)
/* users MISC */
userRoutes.get('/app/misc', auth, userController.getUserMisc)
/* users Activity */
userRoutes.get('/app/activitysummary', auth, userController.getActivitySummary)

module.exports = userRoutes;

