// models/Equipment.model.js
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['ball', 'net', 'shoes', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number
  }
});

equipmentSchema.virtual('totalValue').get(function() {
  return this.quantity * this.unitPrice;
});

module.exports = mongoose.model('Equipment', equipmentSchema);