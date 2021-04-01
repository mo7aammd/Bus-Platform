const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Trip',
    required: true,
  },
  customerId: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
  paymentId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Payment',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Reservations", ReservationSchema);
