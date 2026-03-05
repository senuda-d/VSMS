const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema({
  // recordId: Logical PK (Unique) - e.g., "REC-5022"
  recordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // bookingId: Foreign Key linking to Service Booking
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', // Assuming your booking model is named 'Booking'
    required: true 
  },
  // usedParts: Array of Objects linking to products/inventory
  usedParts: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Part' // Assuming your parts/inventory model is named 'Part'
    },
    quantityUsed: { 
      type: Number, 
      required: true,
      default: 1
    }
  }],
  // mechanicName: The staff member performing the service
  mechanicName: { 
    type: String, 
    required: true 
  },
  // actualDate: Date the service was completed (YYYY-MM-DD)
  actualDate: { 
    type: String, 
    required: true 
  },
  // status: Default is "In-Progress"
  status: { 
    type: String, 
    default: 'In-Progress',
    enum: ['Pending', 'In-Progress', 'QC', 'Completed'] // Optional: restrict status values
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);