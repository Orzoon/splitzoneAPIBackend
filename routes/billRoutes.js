const express = require("express");
const billRoutes = express.Router();
const auth = require('../auth/auth');
const billController = require('../controllers/billController');


billRoutes.get('/app/bills/:groupId/:limit/:skip', auth, billController.getBills);
billRoutes.get('/app/bill/:billId',auth, billController.getBill);
billRoutes.post('/app/bill/:groupId', auth, billController.postBill);
billRoutes.patch('/app/bill/:groupId/:billId', billController.updateBill);
billRoutes.delete('/app/bill/:groupId/:billId', billController.deleteBill);

module.exports = billRoutes;