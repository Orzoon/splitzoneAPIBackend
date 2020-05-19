const express = require("express");
const friendRoutes = express.Router();
const auth = require('../auth/auth');
const {body} = require('express-validator');
const friendController = require('../controllers/friendController');


friendRoutes.get('/app/friends', auth, friendController.getFriends);
friendRoutes.post('/app/friend', auth,[ 
                                        body('name')
                                            .exists()
                                            .notEmpty()
                                            .withMessage('Name cannot be empty')
                                            .isLength({min: 4})
                                            .withMessage('Name should be at least 4 characters long'),
                                        body('email')
                                            .exists()
                                            .optional({checkFalsy: true})
                                            .isEmail()
                                            .withMessage('Invalid email')
                                            .normalizeEmail()
                                        ], 
                                        friendController.postFriend);
friendRoutes.patch('/app/friend', auth, [
                                        body('email')
                                            .exists()
                                            .isEmail()
                                            .withMessage('Invalid email')
                                            .normalizeEmail()
                                        ], 
                                        friendController.updateFriend);
friendRoutes.delete('/app/friend/:id', auth, friendController.deleteFriend);


module.exports = friendRoutes;