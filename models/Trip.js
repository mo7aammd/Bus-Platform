const mongoose = require('mongoose')

const TripSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Company",
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  price: {
    type: mongoose.SchemaTypes.Number,
    required: true,
  },
  seatsCount: {
    type: [mongoose.SchemaTypes.Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
})

module.exports = mongoose.model('Trips', TripSchema)