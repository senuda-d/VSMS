const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // This reads your .env file

const app = express();

// Middleware: These let your backend understand JSON and talk to your frontend
app.use(cors());
app.use(express.json());

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Stops the server if the database fails
    }
};

connectDB();

// A simple test route just to make sure it works
app.get('/', (req, res) => {
    res.send('Vehicle Service Center API is running!');
});
app.use('/api/customers', require('./routes/customerRoutes'));


app.use('/api/vehicles', require('./routes/vehicleRoutes'));   

app.use('/api/bookings', require('./routes/bookingRoutes'));

app.use('/api/inventory', require('./routes/inventoryRoutes'));

app.use('/api/service-records', require('./routes/serviceRecordRoutes'));

app.use('/api/bills', require('./routes/billRoutes'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));