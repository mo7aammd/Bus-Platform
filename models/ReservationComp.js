const mongoose = require("mongoose");
const Joi = require("joi");

const ReservationCompSchema = new mongoose.Schema({
  trip: {
    type: mongoose.SchemaTypes.ObjectId,
    ref:'Trip',
    required: true,
  },
  customerName: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  phone: {
    type: mongoose.SchemaTypes.String,
    required: true,
  },
  amount: {
    type: mongoose.Types.Decimal128,
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

function validateReservation(reservation, avaliableSeats) {
  const schema = {
    customerName: Joi.string().min(5).max(50).required(),
    phone: Joi.string().length(9).regex(/^[0-9]+$/).required(),
    seats: Joi.number().integer().min(1).max(avaliableSeats).required(),
    
  };

  return Joi.validate(reservation, schema);
}

exports.ReservationComp = mongoose.model("ReservationsComp", ReservationCompSchema);
exports.validateReservationComp = validateReservation;
