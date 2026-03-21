// backend/controllers/inventoryController.js
const Inventory = require('../models/Inventory');

// Auto-generate INV-1001
const generateItemId = async () => {
    const lastItem = await Inventory.findOne().sort({ createdAt: -1 });
    if (!lastItem) return 'INV-1001';
    
    // Extract the number part from "INV-1001" and add 1
    const lastIdNumber = parseInt(lastItem.itemId.split('-')[1]);
    return `INV-${lastIdNumber + 1}`;
};

// 1. GET ALL INVENTORY ITEMS
const getInventory = async (req, res) => {
    try {
        // Sorts alphabetically by category, then by name
        const items = await Inventory.find().sort({ category: 1, name: 1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching inventory." });
    }
};

// 2. ADD NEW ITEM
const createInventoryItem = async (req, res) => {
    try {
        const { name, category, price, quantityInStock, reorderLevel } = req.body;

        // Strict Backend Validation
        if (!name || !category || price === undefined || quantityInStock === undefined) {
            return res.status(400).json({ message: "Please fill all required fields." });
        }

        const itemId = await generateItemId();

        const newItem = new Inventory({
            itemId, name, category, price, quantityInStock, reorderLevel
        });

        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. UPDATE ITEM (Edit details or Add/Remove Stock)
const updateInventoryItem = async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { returnDocument: 'after', runValidators: true } // FIXED DEPRECATION WARNING HERE
        );
        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. DELETE ITEM
const deleteInventoryItem = async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Item deleted from inventory." });
    } catch (error) {
        res.status(500).json({ message: "Server error while deleting item." });
    }
};

module.exports = { 
    getInventory, 
    createInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
};