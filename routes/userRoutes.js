const express = require('express');
const router = express.Router();


// importing from controller

const userController = require('../controllers/userController')

router.get('/user', userController.getUsers)

module.exports = router;

