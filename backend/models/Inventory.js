// backend/models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemId: { 
        type: String, 
        required: true, 
        unique: true 
    }, // e.g., INV-1001
    
    name: { 
        type: String, 
        required: [true, 'Item name is required'] 
    }, // e.g., "Mobil 1 Synthetic Oil 4L" or "Toyota Brake Pads"
    
    category: { 
        type: String, 
        required: true,
        // The updated professional categories based on your services!
        enum: [
            'Lubricants & Fluids', 
            'Filters', 
            'Cleaning & Detailing', 
            'Engine & Ignition', 
            'Brakes & Suspension', 
            'Electrical', 
            'General Consumables'
        ]
    },
    
    price: { 
        type: Number, 
        required: [true, 'Selling price is required'],
        min: [0, 'Price cannot be negative']
    },
    
    quantityInStock: { 
        type: Number, 
        required: true, 
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    
    // Low Stock Alert Trigger
    reorderLevel: { 
        type: Number, 
        required: true, 
        default: 5 
    } 

}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);