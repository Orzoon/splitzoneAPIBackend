const express = require('express');
const groupRoutes = express.Router();
const auth = require("../auth/auth");

const groupController = require('../controllers/groupController')

/*----------GROUP--------*/
groupRoutes.get('/app/groups', auth, groupController.getGroups);
groupRoutes.post('/app/group', auth, groupController.postGroup);
groupRoutes.patch('/app/group/:groupId', auth, groupController.updateGroup);
groupRoutes.patch('/app/group/:groupId/:memberId', auth, groupController.removeGroupMember);
groupRoutes.delete('/app/group/:groupId', auth, groupController.deleteGroup);

module.exports= groupRoutes;