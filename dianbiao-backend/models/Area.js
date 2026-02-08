const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  remark: {
    type: String
  },
  fullName: {
    type: String,
    unique: true
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

// 更新updated_at字段和生成fullName
areaSchema.pre('save', function() {
  this.updated_at = Date.now();
  
  // 如果没有设置fullName，生成一个基于name的唯一fullName
  if (!this.fullName) {
    this.fullName = this.name + '-' + Date.now();
  }
});

const Area = mongoose.model('Area', areaSchema);

module.exports = Area;