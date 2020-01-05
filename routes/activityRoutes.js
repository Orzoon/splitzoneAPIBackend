const express = require('express');
const activityRoutes = express.Router();
const auth = require("../auth/auth")
const activityController = require('../controllers/activityController')

activityRoutes.get('app/activity/useractivity', auth, activityController.getUserActivity);
activityRoutes.get('app/activity/friendactivity', auth, activityController.getFriendActivity);
activityRoutes.get('app/activity/groupactivity', auth, activityController.getGroupActivity);
activityRoutes.get('app/activity/billactivity', auth, activityController.getBillActivity);

module.exports = activityRoutes;