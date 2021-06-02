const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  owner: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Company",
    required: true,
    unique: true
  },
  total: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0.00,
  },
  inAccount: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0.00,
  },
  internalPayments: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0.00,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Account", AccountSchema);
