const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  from: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Company",
    required: true,
  },
  to: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Customer",
    required: true,
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payments", PaymentSchema);
