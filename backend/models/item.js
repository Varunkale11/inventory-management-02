const mongoose = require("mongoose");

const itemSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categoryModel",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  hsnCode: {
    type: String,
    required: true,
  },
  sqFeet: {
    type: Number,
    required: false,
  },
});

const itemModel = mongoose.model("itemModel", itemSchema);

module.exports = itemModel;
