const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有设备
router.get('/', verifyToken, async (req, res) => {
  try {
    const { keyword, area_id, floor_id, room_id } = req.query;
    let query = {};
    
    // 按区域、楼层、房间筛选
    if (area_id) {
      query.area_id = area_id;
    }
    if (floor_id) {
      query.floor_id = floor_id;
    }
    if (room_id) {
      query.room_id = room_id;
    }
    
    // 关键词模糊搜索
    if (keyword) {
      const keywordRegex = new RegExp(keyword, 'i');
      query.$or = [
        { device_id: keywordRegex },
        { area: keywordRegex },
        { floor: keywordRegex },
        { room: keywordRegex },
        { remark: keywordRegex }
      ];
    }
    
    console.log('获取设备列表查询条件:', query);
    const devices = await Device.find(query);
    console.log('获取设备列表成功:', devices.length);
    res.json(devices);
  } catch (error) {
    console.error('获取设备列表失败:', error);
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
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('添加设备请求:', req.body);
    const { device_id, area_id, area, floor_id, floor, room_id, room, remark } = req.body;
    
    // 检查请求参数
    if (!device_id || !area_id || !area || !floor_id || !floor || !room_id || !room) {
      return res.status(400).json({ message: '缺少必要的请求参数' });
    }
    
    // 检查设备编号是否已存在
    const existingDevice = await Device.findOne({ device_id });
    console.log('检查设备编号是否已存在:', existingDevice);
    if (existingDevice) {
      return res.status(400).json({ message: '设备编号已存在' });
    }
    
    const device = new Device({
      device_id,
      area_id,
      area,
      floor_id,
      floor,
      room_id,
      room,
      remark
    });
    
    console.log('创建新设备:', device);
    await device.save();
    console.log('设备保存成功:', device);
    res.status(201).json(device);
  } catch (error) {
    console.error('添加设备失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑设备（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { device_id, area_id, area, floor_id, floor, room_id, room, remark } = req.body;
    
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
    device.area_id = area_id || device.area_id;
    device.area = area || device.area;
    device.floor_id = floor_id || device.floor_id;
    device.floor = floor || device.floor;
    device.room_id = room_id || device.room_id;
    device.room = room || device.room;
    device.remark = remark !== undefined ? remark : device.remark;
    
    await device.save();
    res.json(device);
  } catch (error) {
    console.error('编辑设备失败:', error);
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
