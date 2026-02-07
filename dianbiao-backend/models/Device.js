const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true
  },
  area: {
    type: String,
    required: true
  },
  address: {
    type: String,
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
deviceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
