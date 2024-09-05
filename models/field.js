// models/Field.model.js
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  
  sport: {
    type: String,
    enum: ['Bóng đá', 'Bóng chuyền', 'Bóng bàn', 'cầu lông', 'quần vợt','khác'],
    required: true
  },
  location:{
    type:String,
    required:true
  },
  capacity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Field', fieldSchema);