const Address = require("../../models/address");
const mongoose = require("mongoose");
const addAddress = async (req, res) => {
  try {
    const { userId,name, address, city, pincode, phone, notes } = req.body;
    console.log(name,address)
    if (!userId ||!name|| !city || !address || !pincode || !phone || !notes)
      return res.status(400).json({ message: "Please fill all the fields" });
    const newlyCreateAddress = new Address({
      userId,
      name,
      address,
      city,
      pincode,
      phone,
    });
    await newlyCreateAddress.save();
    res.status(201).json({ success: true, data: newlyCreateAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error" });
  }
};

const fetchAllAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Please provide user id" });
    }
    const addressList = await Address.find({ userId });
    res.status(200).json({ success: true, data: addressList });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error" });
  }
};


const isValidObjectId = mongoose.Types.ObjectId.isValid;
const editAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const formData = req.body;
    if (!userId || !isValidObjectId(addressId)) {
      return res
        .status(400)
        .json({ message: "Please provide user id and Address id" });
    }
    const address = await Address.findByIdAndUpdate(
      {
        _id: addressId,
        userId,
      },
      formData,
      { new: true }
    );
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message:error});
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    if (!userId || !addressId) {
      return res
        .status(400)
        .json({ message: "Please provide user id and Address id" });
    }
    const address = await Address.findByIdAndDelete({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.status(200).json({ message: " Address Successully Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error" });
  }
};

module.exports = { addAddress, editAddress, deleteAddress, fetchAllAddress };



