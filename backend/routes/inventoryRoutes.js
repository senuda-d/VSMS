// backend/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getInventory, 
    createInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
} = require('../controllers/inventoryController');

// Standard CRUD routes
router.get('/', getInventory);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

module.exports = router;