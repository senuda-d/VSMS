import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv"; // <-- 1. Import dotenv
import spareRoutes from "./routes/SPAL.js";


dotenv.config(); // <-- 2. Tell it to read the hidden .env file


const app = express();
// <-- 3. Get the port from the .env file
const PORT = process.env.PORT || 5000; 

app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---

mongoose
  .connect(process.env.MONGODB_URI, {
    family: 4, // Forces IPv4
  })
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// --- ROUTES ---
app.use("/api/spare-items", spareRoutes);

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});