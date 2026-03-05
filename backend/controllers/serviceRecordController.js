const ServiceRecord = require('../models/ServiceRecord');

// 1. CREATE a new Service Record
const createServiceRecord = async (req, res) => {
  try {
    const newRecord = new ServiceRecord(req.body);
    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: 'Error creating record', error: error.message });
  }
};

// 2. READ all Service Records
const getAllServiceRecords = async (req, res) => {
  try {
    // .populate() pulls in the actual data from the Foreign Keys if needed
    const records = await ServiceRecord.find()
      .populate('bookingId')
      .populate('usedParts.productId'); 
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
};

// 3. READ a single Service Record by its _id
const getServiceRecordById = async (req, res) => {
  try {
    const record = await ServiceRecord.findById(req.params.id)
      .populate('bookingId')
      .populate('usedParts.productId');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching record', error: error.message });
  }
};

// 4. UPDATE a Service Record (e.g., adding parts used or changing status to Completed)
const updateServiceRecord = async (req, res) => {
  try {
    const updatedRecord = await ServiceRecord.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true } // new: true returns the updated document
    );
    if (!updatedRecord) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: 'Error updating record', error: error.message });
  }
};

// 5. DELETE a Service Record (Voiding)
const deleteServiceRecord = async (req, res) => {
  try {
    const deletedRecord = await ServiceRecord.findByIdAndDelete(req.params.id);
    if (!deletedRecord) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({ message: 'Service record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
};

module.exports = {
  createServiceRecord,
  getAllServiceRecords,
  getServiceRecordById,
  updateServiceRecord,
  deleteServiceRecord
};