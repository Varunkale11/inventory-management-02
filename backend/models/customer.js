const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "customer name is required"],
    trim: true,
    uppercase: true,
    minlenght: [1, "Customer name must be at least 1 character"],
  },
  gstNumber: {
    type: String,
    unique: true,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  panNumber: {
    type: String,
    // unique: true,
    required: false,
  },
  phoneNumber: {
    type: String,
    maxLength: 10,
    minLength: 10,
    required: false,
  },
});

customerSchema.index({ gstNumber: 1 }, { unique: true });
const customerModel = mongoose.model("Customer", customerSchema);

module.exports = customerModel;
