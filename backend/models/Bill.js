const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    serviceRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRecord', required: true, unique: true },
    vehicleNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    
    // Financials
    serviceTotal: { type: Number, required: true }, // The finalTotal from the Service Record
    additionalBillingCharges: { type: Number, default: 0 }, // Admin fees, late fees, etc.
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }, // serviceTotal + additional - discount
    
    // Workflow tracking
    status: { type: String, enum: ['Draft', 'Finalized'], default: 'Draft' },
    finalizedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);