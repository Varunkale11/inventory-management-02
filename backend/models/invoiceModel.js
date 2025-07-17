const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema({
  customerBillTo: {
    name: {
      type: String,
      uppercase: true,
      required: true,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
  },
  customerShipTo: {
    name: {
      type: String,
      uppercase: true,
      required: false,
    },
    gstNumber: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    panNumber: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
  },
  packaging: {
    type: Number,
    required: true,
  },
  transportationAndOthers: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  gstRate: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: String,
    required: true,
  },
  items: [
    {
      id: String,
      name: String,
      quantity: Number,
      price: Number,
      hsnCode: String,
      sqFeet: Number,
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categoryModel",
      },
    },
  ],
  companyDetails: {
    name: String,
    address: String,
    cityState: String,
    phone: String,
    email: String,
  },
  qrCode: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  challanNo: { type: String, match: /^[a-zA-Z0-9]+$/, maxlength: 6 },
  poNo: { type: Number },
  eWayNo: { type: String, maxlength: 14 },
  challanDate: { type: String },
  showPcsInQty: { type: Boolean, default: false },
  showSqFeet: { type: Boolean, default: false },
});

const invoiceModel = mongoose.model("invoiceModel", invoiceSchema);

module.exports = invoiceModel;
