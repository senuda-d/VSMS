import mongoose from "mongoose";

const SPALSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true
    },

    itemType: {
      type: String,
      required: true,
      enum: ["Spare Part", "Lubricant"]
    },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    dateUsed: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Used", "Replaced"]
    }
  },
  { timestamps: true }
);

export default mongoose.model("SPAL", SPALSchema);