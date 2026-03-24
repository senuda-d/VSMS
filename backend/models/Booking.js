// backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Relational Links
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    
    // Quick-access strings (Keeps your Chatbot working perfectly!)
    vehicleNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    
    selectedServices: { type: [String], required: true },
    totalPrice: { type: Number, required: true },
    estimatedTime: { type: String, required: true },

    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, default: "Pending" }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);