const mongoose = require('mongoose');
const Device = require('./models/Device');
const Metric = require('./models/Metric');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/dianbiao')
  .then(async () => {
    console.log('数据库连接成功');
    
    // 检查设备数量
    const devices = await Device.find();
    console.log('设备数量:', devices.length);
    
    if (devices.length > 0) {
      console.log('第一个设备信息:', {
        _id: devices[0]._id,
        device_id: devices[0].device_id,
        area: devices[0].area,
        floor: devices[0].floor,
        room: devices[0].room
      });
      
      // 检查该设备的电表读数
      const metrics = await Metric.find({ device_id: devices[0]._id });
      console.log('该设备的电表读数数量:', metrics.length);
      
      if (metrics.length > 0) {
        console.log('最新的电表读数:', metrics[metrics.length - 1]);
      } else {
        console.log('该设备没有电表读数');
      }
    } else {
      console.log('没有设备数据');
    }
    
    // 检查所有电表读数
    const allMetrics = await Metric.find();
    console.log('所有电表读数数量:', allMetrics.length);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });
