const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // This reads your .env file

// Import your module's routes
const serviceRecordRoutes = require("./routes/serviceRecordRoutes");

const app = express();
<<<<<<< HEAD
app.use(express.json());

// Mount the routes to a specific URL path
app.use("/api/service-records", serviceRecordRoutes);

const PORT = process.env.PORT || 5000;
=======

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
>>>>>>> f5052ca2dae81c9d76fdce639f3d2f54e7616a7a

connectDB();

// A simple test route just to make sure it works
app.get('/', (req, res) => {
    res.send('Vehicle Service Center API is running!');
});
app.use('/api/customers', require('./routes/customerRoutes'));

<<<<<<< HEAD
module.exports = connectDB;
=======


app.use('/api/vehicles', require('./routes/vehicleRoutes'));   


app.use('/api/inventory', require('./routes/inventoryRoutes'));


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
>>>>>>> f5052ca2dae81c9d76fdce639f3d2f54e7616a7a
