const mongoose = require('mongoose');

const defaultElectricityPriceSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true,
    default: 1.0
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 更新updated_at字段
defaultElectricityPriceSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const DefaultElectricityPrice = mongoose.model('DefaultElectricityPrice', defaultElectricityPriceSchema);

module.exports = DefaultElectricityPrice;