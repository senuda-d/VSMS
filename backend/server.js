require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

// Import your module's routes
const serviceRecordRoutes = require("./routes/serviceRecordRoutes");

const app = express();
app.use(express.json());

// Mount the routes to a specific URL path
app.use("/api/service-records", serviceRecordRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = connectDB;