const express = require("express");
const friendRoutes = express.Router();
const auth = require('../auth/auth');
const friendController = require('../controllers/friendController');


friendRoutes.get('/app/friends', auth, friendController.getFriends);
friendRoutes.post('/app/friend', auth, friendController.postFriend);
friendRoutes.delete('/app/friend/:id', auth, friendController.deleteFriend);


module.exports = friendRoutes;