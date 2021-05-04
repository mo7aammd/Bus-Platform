const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  trip: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Trip',
    required: true,
  },
  customer: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Customer",
    required: true,
  },
  payment: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Payment',
    required: true,
  },
  seats: {
    type: mongoose.SchemaTypes.Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reservations", ReservationSchema);
