const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const Device = require('../models/Device');
const ElectricityPrice = require('../models/ElectricityPrice');
const { verifyToken } = require('../middleware/auth');

// 获取设备的电表数据
router.get('/device/:deviceId', verifyToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { month } = req.query;
    
    let query = { device_id: deviceId };
    
    if (month) {
      query.month = month;
    }
    
    const metrics = await Metric.find(query).sort({ timestamp: 'asc' });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有电表的最新数据（概览）
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const { area } = req.query;
    
    // 获取所有设备
    let deviceQuery = {};
    if (area) {
      deviceQuery.area = area;
    }
    
    const devices = await Device.find(deviceQuery);
    
    // 对每个设备获取最新的电表数据
    const overviewData = await Promise.all(
      devices.map(async (device) => {
        const latestMetric = await Metric.findOne({ device_id: device._id })
          .sort({ timestamp: 'desc' });
        
        return {
          device_id: device._id,
          device_number: device.device_id,
          area: device.area,
          address: device.address,
          current_reading: latestMetric ? latestMetric.value : 0,
          last_updated: latestMetric ? latestMetric.timestamp : null
        };
      })
    );
    
    res.json(overviewData);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 计算月度用电量和费用
router.get('/monthly/:deviceId', verifyToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ message: '必须提供月份参数' });
    }
    
    // 获取设备信息
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 获取该月份的电表数据
    const metrics = await Metric.find({ device_id: deviceId, month }).sort({ timestamp: 'asc' });
    
    if (metrics.length < 2) {
      return res.json({ usage: 0, cost: 0, data: metrics });
    }
    
    // 计算月度用电量
    const firstReading = metrics[0].value;
    const lastReading = metrics[metrics.length - 1].value;
    const usage = lastReading - firstReading;
    
    // 获取该区域的电价
    const electricityPrice = await ElectricityPrice.findOne({ area: device.area });
    const price = electricityPrice ? electricityPrice.price : 0;
    
    // 计算费用
    const cost = usage * price;
    
    res.json({ usage, cost, price, data: metrics });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加电表数据（模拟硬件上传）
router.post('/', verifyToken, async (req, res) => {
  try {
    const { device_id, value } = req.body;
    
    // 验证设备是否存在
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 生成月份字符串 (YYYY-MM)
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const metric = new Metric({
      device_id,
      value,
      month
    });
    
    await metric.save();
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
