// backend/controllers/bookingController.js
const Booking = require('../models/Booking');

const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ date: 1, timeSlot: 1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching bookings." });
    }
};

const createBooking = async (req, res) => {
    try {
        const { customer, vehicle, vehicleNumber, customerName, selectedServices, totalPrice, estimatedTime, date, timeSlot } = req.body;

        if (!customer || !vehicle || !date || !timeSlot) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        if (!selectedServices || selectedServices.length === 0) {
            return res.status(400).json({ message: "At least one service must be selected." });
        }

        // 3-Month Security Rule
        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);

        if (bookingDate < today) return res.status(400).json({ message: "Security Block: Cannot book in the past." });
        if (bookingDate > maxDate) return res.status(400).json({ message: "Security Block: Max 3 months in advance." });

        const newBooking = new Booking(req.body);
        await newBooking.save();
        res.status(201).json(newBooking);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Time slot already booked!" });
        }
        res.status(400).json({ message: error.message });
    }
};

const updateBooking = async (req, res) => {
    try {
        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Booking cancelled." });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getBookings, createBooking, updateBooking, deleteBooking };