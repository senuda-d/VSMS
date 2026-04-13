// backend/models/ServiceRecord.js
const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
    // Link back to the original booking
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    
    vehicleNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    serviceDate: { type: String, required: true },
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['In Progress', 'Completed'], 
        default: 'In Progress' 
    },
    
    // The services they actually completed
    servicesPerformed: [{ type: String }],
    
    // The parts pulled from Inventory
    usedParts: [{
        partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
        partName: { type: String },
        quantity: { type: Number },
        unitPrice: { type: Number },
        totalPrice: { type: Number }
    }],
    
    // Live Financial Tracking
    bookingCost: { type: Number, required: true }, // The original quote
    partsCost: { type: Number, default: 0 },       // Calculated from usedParts
    additionalCharges: { type: Number, default: 0 }, // E.g., found a leak, charged 2000 extra
    finalTotal: { type: Number, required: true },  // bookingCost + partsCost + additionalCharges
    
    mechanicNotes: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);