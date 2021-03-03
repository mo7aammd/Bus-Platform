const mongoose = require('mongoose')

const TripSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.SchemaTypes.ObjectId,
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
  count: {
    type: mongoose.SchemaTypes.Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
})

module.exports = mongoose.model('Trips', TripSchema)