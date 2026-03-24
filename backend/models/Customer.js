const mongoose = require('mongoose');

const phoneRegex = /^(?:\+94|0)?7\d{8}$/;
const vehicleNumberRegex = /^(?:[A-Z]{2,3}-\d{4}|[A-Z]{2,3}\s\d{4}|[A-Z]{2,3}\d{4}|\d{2,3}-\d{4})$/i;
const nameRegex = /^[A-Za-z ]+$/;

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      validate: {
        validator(value) {
          return nameRegex.test(value);
        },
        message: 'Name can contain letters and spaces only'
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator(value) {
          return phoneRegex.test(value);
        },
        message: 'Enter a valid Sri Lankan mobile number'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [5, 'Address must be at least 5 characters long'],
      maxlength: [120, 'Address cannot exceed 120 characters']
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
      validate: {
        validator(value) {
          return vehicleNumberRegex.test(value);
        },
        message: 'Enter a valid vehicle number like CAB-1234'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Customer', customerSchema);
