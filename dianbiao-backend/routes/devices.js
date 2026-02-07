const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有设备
router.get('/', verifyToken, async (req, res) => {
  try {
    const { area } = req.query;
    let query = {};
    
    if (area) {
      query.area = area;
    }
    
    const devices = await Device.find(query);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个设备
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加设备（仅管理员）
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { device_id, area, address } = req.body;
    
    // 检查设备编号是否已存在
    const existingDevice = await Device.findOne({ device_id });
    if (existingDevice) {
      return res.status(400).json({ message: '设备编号已存在' });
    }
    
    const device = new Device({
      device_id,
      area,
      address
    });
    
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑设备（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { device_id, area, address } = req.body;
    
    // 检查设备是否存在
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 检查设备编号是否已被其他设备使用
    if (device_id && device_id !== device.device_id) {
      const existingDevice = await Device.findOne({ device_id });
      if (existingDevice) {
        return res.status(400).json({ message: '设备编号已存在' });
      }
    }
    
    // 更新设备信息
    device.device_id = device_id || device.device_id;
    device.area = area || device.area;
    device.address = address || device.address;
    
    await device.save();
    res.json(device);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除设备（仅管理员）
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    await device.deleteOne();
    res.json({ message: '设备删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
