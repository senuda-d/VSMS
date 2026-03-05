const express = require('express');
const router = express.Router();
const {
  createServiceRecord,
  getAllServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
  deleteServiceRecord
} = require('../controllers/serviceRecordController');

// Define API endpoints for CRUD
router.post('/add', createServiceRecord);           // Create
router.get('/', getAllServiceRecords);              // Read All
router.get('/:id', getServiceRecordById);           // Read Single
router.put('/update/:id', updateServiceRecord);     // Update
router.delete('/delete/:id', deleteServiceRecord);  // Delete

module.exports = router;