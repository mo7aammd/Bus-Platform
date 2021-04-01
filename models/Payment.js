const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  from: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
  to: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
  amount: {
    type: mongoose.SchemaTypes.Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payments", PaymentSchema);
