const express = require('express');
const userRoutes = express.Router();
const auth = require('../auth/auth');

// importing from controller
const userController = require('../controllers/userController')


/*------USER---------*/
userRoutes.post('/user/signin', userController.userSignin);
userRoutes.post('/user/signup', userController.userSignup);
userRoutes.get('/app/user', auth, userController.getUser);


module.exports = userRoutes;

