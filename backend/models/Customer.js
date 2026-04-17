const mongoose = require('mongoose');

// This defines the strict rules for a Customer
const customerSchema = new mongoose.Schema({
    // We generate a custom ID for the UI like CUST-1001
    customerId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    firstName: { 
        type: String, 
        required: [true, 'First name is required'] // The message helps with error handling later
    },
    lastName: { 
        type: String, 
        required: [true, 'Last name is required'] 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true // Prevents duplicate accounts
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        unique: true
    },
    nic: { 
        type: String, 
        required: [true, 'NIC is required'], 
        unique: true 
    },
    address: { 
        type: String, 
        required: [true, 'Address is required'] 
    }
}, { 
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt' dates!
});

// We export this so we can use it in our Controllers later
module.exports = mongoose.model('Customer', customerSchema);