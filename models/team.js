// models/Team.model.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  sport: {
    type: String,
    required: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('Team', teamSchema);