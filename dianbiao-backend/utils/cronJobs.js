const cron = require('node-cron');
const Device = require('../models/Device');
const Metric = require('../models/Metric');
const Log = require('../models/Log');

// 定时任务管理
const cronJobs = {
  // 启动所有定时任务
  start: () => {
    console.log('启动定时任务...');
    
    // 每天凌晨0点执行自动抄表
    cron.schedule('0 0 * * *', async () => {
      await cronJobs.autoMeterReading();
    });
    
    // 每周日凌晨2点执行数据备份
    cron.schedule('0 2 * * 0', async () => {
      await cronJobs.backupData();
    });
    
    // 每小时执行一次设备状态检查
    cron.schedule('0 * * * *', async () => {
      await cronJobs.checkDeviceStatus();
    });
    
    console.log('定时任务启动完成');
  },
  
  // 自动抄表任务
  autoMeterReading: async () => {
    try {
      console.log('执行自动抄表任务...');
      
      // 获取所有设备
      const devices = await Device.find();
      
      // 为每个设备生成随机的电表读数
      for (const device of devices) {
        // 获取设备的最新读数
        const latestMetric = await Metric.findOne({ device_id: device._id })
          .sort({ timestamp: 'desc' });
        
        // 生成新的读数（基于最新读数，随机增加0-10度）
        const baseValue = latestMetric ? latestMetric.value : 0;
        const newValue = baseValue + Math.random() * 10;
        
        // 创建新的电表读数记录
        const newMetric = new Metric({
          device_id: device._id,
          value: Math.round(newValue * 100) / 100,
          timestamp: new Date(),
          month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        });
        
        await newMetric.save();
      }
      
      console.log('自动抄表任务执行完成');
      
      // 记录日志
      await Log.create({
        action: '自动抄表任务执行',
        details: {
          deviceCount: devices.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('自动抄表任务执行失败:', error);
      
      // 记录错误日志
      await Log.create({
        action: '自动抄表任务失败',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  
  // 数据备份任务
  backupData: async () => {
    try {
      console.log('执行数据备份任务...');
      
      // 这里可以实现数据备份逻辑
      // 例如：将数据导出到文件、复制到其他数据库等
      
      console.log('数据备份任务执行完成');
      
      // 记录日志
      await Log.create({
        action: '数据备份任务执行',
        details: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('数据备份任务执行失败:', error);
      
      // 记录错误日志
      await Log.create({
        action: '数据备份任务失败',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  },
  
  // 设备状态检查任务
  checkDeviceStatus: async () => {
    try {
      console.log('执行设备状态检查任务...');
      
      // 获取所有设备
      const devices = await Device.find();
      
      // 检查每个设备的最新读数时间
      for (const device of devices) {
        // 获取设备的最新读数
        const latestMetric = await Metric.findOne({ device_id: device._id })
          .sort({ timestamp: 'desc' });
        
        // 检查读数是否超过24小时未更新
        if (latestMetric) {
          const hoursSinceLastUpdate = (new Date() - new Date(latestMetric.timestamp)) / (1000 * 60 * 60);
          
          if (hoursSinceLastUpdate > 24) {
            console.log(`设备 ${device.device_id} 超过24小时未更新读数`);
            
            // 记录日志
            await Log.create({
              action: '设备状态异常',
              details: {
                device_id: device.device_id,
                device_number: device.device_id,
                area: device.area,
                floor: device.floor,
                room: device.room,
                lastUpdate: latestMetric.timestamp,
                hoursSinceLastUpdate: Math.round(hoursSinceLastUpdate * 10) / 10,
                timestamp: new Date().toISOString()
              }
            });
          }
        }
      }
      
      console.log('设备状态检查任务执行完成');
    } catch (error) {
      console.error('设备状态检查任务执行失败:', error);
      
      // 记录错误日志
      await Log.create({
        action: '设备状态检查任务失败',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
};

module.exports = cronJobs;