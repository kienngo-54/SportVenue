// models/Referee.model.js
const mongoose = require('mongoose');

const refereeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  pricePerMatch: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Referee', refereeSchema);