const mongoose = require('mongoose');

const electricityPriceSchema = new mongoose.Schema({
  area: {
    type: String,
    required: true
  },
  floor: {
    type: String
  },
  room: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  effective_date: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 更新updated_at字段
electricityPriceSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const ElectricityPrice = mongoose.model('ElectricityPrice', electricityPriceSchema);

module.exports = ElectricityPrice;
