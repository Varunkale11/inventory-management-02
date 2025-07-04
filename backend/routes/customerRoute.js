const express = require("express");
const customerModel = require("../models/customer");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { name, gstNumber, address, panNumber, phoneNumber } = req.body;

    if (!name || !gstNumber || !address ) {
      return res.status(400).json({ error: "fields is required" });
    }



    const existingCustomer = await customerModel.findOne({ gstNumber });
    console.log(existingCustomer);
    if (existingCustomer ) {
      return res.status(400).json({ error: "Customer already exists" });
    }
    const customer = new customerModel({ name, gstNumber, address, panNumber, phoneNumber });
    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    // console.log(e)
    // res.status(500).json({error:"Internal server error"})

    if (error.name === "MongoServerError" && error.code === 11000) {
      console.log(error);
      return res.status(400).json({ error: "Customer already exists" });
    }
    console.error("Error in POST /customer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await customerModel.find({});
    res.status(200).json(data);
  } catch (error) {
    console.log("Error in GET /customer", error);
    res.status(500).json({ message: error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await customerModel.findByIdAndUpdate(id, { name: req.body.name, gstNumber: req.body.gstNumber, address: req.body.address, panNumber: req.body.panNumber, phoneNumber: req.body.phoneNumber }, { new: true });
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }else{
      return res.status(200).json({ message: "Customer updated successfully" });
    }
  } catch (error) {
    console.log("Error in PUT /customer/:id", error);
    res.status(500).json({ message: error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const dbRes = await customerModel.deleteOne({ _id: id });
    res.status(200).json({ dbRes, message: "Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
