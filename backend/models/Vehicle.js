// backend/models/Vehicle.js
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true, unique: true }, // e.g., VEH-1001
    
    // THIS IS THE FOREIGN KEY! It links directly to the Customer database
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: [true, 'Vehicle must be assigned to an owner'] 
    },
    
    licensePlate: { 
        type: String, 
        required: [true, 'License plate is required'], 
        unique: true 
    },
    make: { type: String, required: [true, 'Vehicle make is required'] }, // e.g., Toyota
    model: { type: String, required: [true, 'Vehicle model is required'] }, // e.g., Corolla
    year: { 
        type: Number, 
        required: [true, 'Manufacture year is required'],
        min: [1950, 'Year must be valid'],
        max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    transmission: { 
        type: String, 
        required: true,
        enum: ['Automatic', 'Manual', 'CVT', 'Electric'] // Strict dropdown options
    },
    mileage: { type: Number, required: true } // Current odometer reading
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);