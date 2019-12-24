const express = require('express');
const activityRoutes = express.Router();

const activityController = require('../controllers/activityController')

activityRoutes.get('/activity', activityController.getActivity);
module.exports = activityRoutes;