const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
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
buildingSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;