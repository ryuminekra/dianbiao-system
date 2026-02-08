const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  remark: {
    type: String
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
floorSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor;