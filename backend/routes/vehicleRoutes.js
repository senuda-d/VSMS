// backend/routes/vehicleRoutes.js
const express = require('express');
const router = express.Router();

// 1. We added getAllVehicles to this import list at the top!
const { 
    createVehicle, 
    getVehiclesByOwner, 
    updateVehicle, 
    deleteVehicle,
    getAllVehicles 
} = require('../controllers/vehicleController');

// 2. Here are the routes
router.post('/', createVehicle);
router.get('/owner/:ownerId', getVehiclesByOwner);


router.get('/', getAllVehicles); 

router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;