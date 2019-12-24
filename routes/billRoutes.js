const express = require('express');
const billRoutes = express.Router();
const billController = require('../controllers/billController')
/*------------BILLS----------*/
billRoutes.get('/bills', billController.getBills)
billRoutes.get('bill', billController.getBill)
module.exports = billRoutes;