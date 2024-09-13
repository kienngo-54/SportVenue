const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'gift', 'other'], // Loại khuyến mãi: giảm giá %, giảm giá cố định, quà tặng, khác
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null, // Giới hạn số lần sử dụng (nếu có)
  },
  usedCount: {
    type: Number,
    default: 0, // Số lần khuyến mãi đã được sử dụng
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive',
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Promotion', promotionSchema);
