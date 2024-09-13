// models/Equipment.model.js
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  sport: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  Price: {
    type: Number,
    required: true
  },
  
});




module.exports = mongoose.model('Equipment', equipmentSchema);