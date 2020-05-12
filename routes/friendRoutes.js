const express = require("express");
const friendRoutes = express.Router();
const auth = require('../auth/auth');
const { check} = require('express-validator');
const friendController = require('../controllers/friendController');


friendRoutes.get('/app/friends', auth, friendController.getFriends);
friendRoutes.post('/app/friend', auth,check('email', 'invalid email format').isEmail(), friendController.postFriend);
friendRoutes.patch('/app/friend', auth, check('email', 'invalid email format').isEmail(), friendController.updateFriend);
friendRoutes.delete('/app/friend/:id', auth, friendController.deleteFriend);


module.exports = friendRoutes;