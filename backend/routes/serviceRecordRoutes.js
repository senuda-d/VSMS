// backend/routes/serviceRecordRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getServiceRecords, startService, updateActiveService, completeService 
} = require('../controllers/serviceRecordController');

router.get('/', getServiceRecords);
router.post('/start', startService);
router.put('/:id', updateActiveService);
router.put('/:id/complete', completeService); // Special route for the Inventory deduction

module.exports = router;