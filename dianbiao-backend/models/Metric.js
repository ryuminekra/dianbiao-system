const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  device_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  month: {
    type: String,
    required: true
  }
});

const Metric = mongoose.model('Metric', metricSchema);

module.exports = Metric;
