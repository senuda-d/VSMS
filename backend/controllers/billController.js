const Bill = require('../models/Bill');

const getBills = async (req, res) => {
    try {
        const bills = await Bill.find().sort({ createdAt: -1 });
        res.status(200).json(bills);
    } catch (error) { res.status(500).json({ message: "Error fetching bills." }); }
};

const createDraftBill = async (req, res) => {
    try {
        const newBill = new Bill(req.body);
        await newBill.save();
        res.status(201).json(newBill);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const updateBill = async (req, res) => {
    try {
        const updatedBill = await Bill.findByIdAndUpdate(
            req.params.id, req.body, { returnDocument: 'after', runValidators: true }
        );
        res.status(200).json(updatedBill);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const deleteBill = async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Bill deleted." });
    } catch (error) { res.status(500).json({ message: "Error deleting bill." }); }
};

module.exports = { getBills, createDraftBill, updateBill, deleteBill };