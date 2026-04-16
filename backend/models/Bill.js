const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    serviceRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRecord', required: true },
    vehicleNumber: { type: String, required: true },
    customerName: { type: String, required: true },
    serviceTotal: { type: Number, required: true },
    additionalBillingCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Finalized'], default: 'Draft' },
    finalizedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
