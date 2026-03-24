// backend/controllers/serviceRecordController.js
const ServiceRecord = require('../models/ServiceRecord');
const Inventory = require('../models/Inventory');
const Booking = require('../models/Booking');

// 1. GET ALL RECORDS
const getServiceRecords = async (req, res) => {
    try {
        const records = await ServiceRecord.find().sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Error fetching records." });
    }
};

// 2. START A SERVICE (Creates an 'In Progress' record)
const startService = async (req, res) => {
    try {
        const { bookingId, vehicleNumber, customerName, serviceDate, bookingCost, servicesPerformed } = req.body;

        const newRecord = new ServiceRecord({
            bookingId, vehicleNumber, customerName, serviceDate, bookingCost, 
            servicesPerformed, finalTotal: bookingCost
        });

        await newRecord.save();

        // Update the original Booking status to 'In Progress'
        await Booking.findByIdAndUpdate(bookingId, { status: 'In Progress' }, { returnDocument: 'after' });

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. UPDATE ACTIVE SERVICE (Add parts, change charges, add notes)
const updateActiveService = async (req, res) => {
    try {
        const updatedRecord = await ServiceRecord.findByIdAndUpdate(
            req.params.id, req.body, { returnDocument: 'after', runValidators: true }
        );
        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. COMPLETE SERVICE & DEDUCT INVENTORY
const completeService = async (req, res) => {
    try {
        const record = await ServiceRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Record not found." });

        if (record.status === 'Completed') {
            return res.status(400).json({ message: "This service is already completed." });
        }

        // Loop through used parts and deduct from Inventory!
        for (let part of record.usedParts) {
            const inventoryItem = await Inventory.findById(part.partId);
            if (inventoryItem) {
                // Deduct the quantity
                inventoryItem.quantityInStock -= part.quantity;
                // Don't let stock drop below 0
                if(inventoryItem.quantityInStock < 0) inventoryItem.quantityInStock = 0; 
                await inventoryItem.save();
            }
        }

        // Mark Record as Completed
        record.status = 'Completed';
        await record.save();

        // Mark original Booking as Completed
        await Booking.findByIdAndUpdate(record.bookingId, { status: 'Completed' });

        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: "Error completing service.", error: error.message });
    }
};

module.exports = { getServiceRecords, startService, updateActiveService, completeService };