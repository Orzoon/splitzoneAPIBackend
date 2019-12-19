const express = require('express');
const router = express.Router();


// importing from controller
const userController = require('../controllers/userController')
const groupController = require('../controllers/groupController')
const billController = require('../controllers/billController')
const activityController = require('../controllers/activityController')

/*------USER---------*/
router.get('/user', userController.getUsers);


/*----------GROUP--------*/
router.get('/groups', groupController.getGroups);
router.get('/group', groupController.getGroup);


/*------------BILLS----------*/
router.get('/bills', billController.getBills)
router.get('bill', billController.getBill)

/*---------ACTIVITY-------*/
router.get('/activity', activityController.getActivity)



module.exports = router;

