const express = require('express');
const groupRoutes = express.Router();
const auth = require("../auth/auth");
const {body} = require('express-validator');
const groupController = require('../controllers/groupController')

/*----------GROUP--------*/
groupRoutes.get('/app/groups', auth, groupController.getGroups);
groupRoutes.get('/app/group/:groupId', auth, groupController.getGroup);
groupRoutes.post('/app/group', auth,[
                                    body('groupName')
                                        .exists()
                                        .notEmpty()
                                        .withMessage('Group name cannot be empty')
                                        .isLength({min: 4})
                                        .withMessage('Group name should be at least 4 characters long')
                                        .isLength({max: 15})
                                        .withMessage('Group name should not exceed 15 characters')
                                    ],
                                    groupController.postGroup);
groupRoutes.patch('/app/group/:groupId/:memberId', auth, groupController.removeGroupMember);
groupRoutes.patch('/app/group/:groupId', auth, groupController.updateGroup);

groupRoutes.delete('/app/group/:groupId', auth, groupController.deleteGroup);
// summary Routes
groupRoutes.get('/app/summary/:groupId', auth, groupController.getGroupSummary);

module.exports= groupRoutes;