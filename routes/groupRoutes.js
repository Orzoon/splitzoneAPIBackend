const express = require('express');
const groupRoutes = express.Router();
const auth = require("../auth/auth");

const groupController = require('../controllers/groupController')

/*----------GROUP--------*/
groupRoutes.get('/app/groups', auth, groupController.getGroups);
groupRoutes.get('/app/group/:groupId', auth, groupController.getGroup);
groupRoutes.post('/app/group', auth, groupController.postGroup);

groupRoutes.patch('/app/group/:groupId/:memberId', auth, groupController.removeGroupMember);
groupRoutes.patch('/app/group/:groupId', auth, groupController.updateGroup);

groupRoutes.delete('/app/group/:groupId', auth, groupController.deleteGroup);


// summary Routes
groupRoutes.get('/app/summary/:groupId', auth, groupController.getGroupSummary);

module.exports= groupRoutes;