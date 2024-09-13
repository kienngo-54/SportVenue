const mongoose = require('mongoose');

const matchingSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    maxlength: 500 // Giới hạn số ký tự cho message, bạn có thể điều chỉnh
  },
  max_number: {
    type: Number,
    required: true
  },
  matchedUser: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  matchedCount:{
    type:Number,
    require:true
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

module.exports = mongoose.model('Matching', matchingSchema);
