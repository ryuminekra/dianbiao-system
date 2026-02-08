const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  floor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
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
roomSchema.pre('save', function() {
  this.updated_at = Date.now();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;