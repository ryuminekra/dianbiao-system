const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    unique: true
  },
  area_id: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  floor_id: {
    type: String,
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  room_id: {
    type: String,
    required: true
  },
  room: {
    type: String,
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
deviceSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
