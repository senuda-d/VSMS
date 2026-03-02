import SPAL from "../models/SPAL.js";

/* 1️ GET ALL SPAL ITEMS */
export const getSPALs = async (req, res) => {
  try {
    const spals = await SPAL.find().sort({ createdAt: -1 });
    res.status(200).json(spals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* 2️ GET SINGLE SPAL ITEM BY ID */
export const getSPALById = async (req, res) => {
  try {
    const spal = await SPAL.findById(req.params.id);

    if (!spal) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(spal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* 3️ CREATE NEW SPAL ITEM */
export const createSPAL = async (req, res) => {
  try {
    const newSPAL = new SPAL(req.body);
    await newSPAL.save();

    res.status(201).json(newSPAL);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/* 4️ UPDATE SPAL ITEM */
export const updateSPAL = async (req, res) => {
  try {
    const updatedSPAL = await SPAL.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedSPAL) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(updatedSPAL);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


/* 5️ DELETE SPAL ITEM */
export const deleteSPAL = async (req, res) => {
  try {
    const deletedSPAL = await SPAL.findByIdAndDelete(req.params.id);

    if (!deletedSPAL) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};