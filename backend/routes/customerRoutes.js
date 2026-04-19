const express = require('express');
const router = express.Router();

// Import the brain functions we just wrote in the controller
const {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');

// Map the HTTP methods to the correct controller functions
router.post('/', createCustomer);          // POST /api/customers -> Create
router.get('/', getCustomers);             // GET /api/customers -> Read all
router.put('/:id', updateCustomer);        // PUT /api/customers/:id -> Update one by ID
router.delete('/:id', deleteCustomer);     // DELETE /api/customers/:id -> Delete one by ID

module.exports = router;