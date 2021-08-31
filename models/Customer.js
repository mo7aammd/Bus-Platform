const mongoose = require('mongoose');
const Joi = require('joi');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  firebaseToken: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
})

function validateCustomer(customer) {
  const schema = {
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    firebaseToken: Joi.string()
  };

  return Joi.validate(customer, schema);
}

exports.Customer = mongoose.model('Customer', CustomerSchema)
exports.validate = validateCustomer;