const mongoose = require('mongoose');

const electricityPriceSchema = new mongoose.Schema({
  area: {
    type: String,
    required: true
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
electricityPriceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const ElectricityPrice = mongoose.model('ElectricityPrice', electricityPriceSchema);

module.exports = ElectricityPrice;
