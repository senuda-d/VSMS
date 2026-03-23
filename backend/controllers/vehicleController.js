// backend/controllers/vehicleController.js
const Vehicle = require('../models/Vehicle');

// Auto-generate VEH-1001
const generateVehicleId = async () => {
    const lastVehicle = await Vehicle.findOne().sort({ createdAt: -1 });
    if (!lastVehicle) return 'VEH-1001';
    const lastIdNumber = parseInt(lastVehicle.vehicleId.split('-')[1]);
    return `VEH-${lastIdNumber + 1}`;
};

// 1. CREATE VEHICLE
const createVehicle = async (req, res) => {
    try {
        const { owner, licensePlate, make, model, year, transmission, mileage } = req.body;

        // Strict Backend Validation
        if (!owner || !licensePlate || !make || !model || !year || !transmission || mileage === undefined) {
            return res.status(400).json({ message: 'All vehicle fields are required.' });
        }

        const vehicleId = await generateVehicleId();

        const newVehicle = new Vehicle({
            vehicleId, owner,
            licensePlate: licensePlate.toUpperCase(), // Standardize license plates
            make, model, year, transmission, mileage
        });

        await newVehicle.save();
        res.status(201).json(newVehicle);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A vehicle with this License Plate already exists!' });
        }
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Add this to vehicleController.js
const getAllVehicles = async (req, res) => {
    try {
        // .populate() tells MongoDB to fetch the Customer details linked to the owner ID!
        const vehicles = await Vehicle.find()
            .populate('owner', 'firstName lastName nic phone') 
            .sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch vehicles.' });
    }
};

// 2. GET VEHICLES BY OWNER ID
//want to see vehicles for the customer we searched for!
const getVehiclesByOwner = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.params.ownerId }).sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch vehicles.' });
    }
};

// 3. UPDATE VEHICLE
const updateVehicle = async (req, res) => {
    try {
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id, req.body, { new: true, runValidators: true }
        );
        res.status(200).json(updatedVehicle);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update vehicle.', error: error.message });
    }
};

// 4. DELETE VEHICLE
const deleteVehicle = async (req, res) => {
    try {
        await Vehicle.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Vehicle deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete vehicle.' });
    }
};



module.exports = { createVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle, getAllVehicles };