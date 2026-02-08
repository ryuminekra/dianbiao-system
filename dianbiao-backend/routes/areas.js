const express = require('express');
const router = express.Router();
const Area = require('../models/Area');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 区域相关接口

// 获取所有区域
router.get('/', verifyToken, async (req, res) => {
  try {
    const areas = await Area.find();
    res.json(areas);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个区域
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const area = await Area.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ message: '区域不存在' });
    }
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加区域
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, remark } = req.body;
    console.log('添加区域请求数据:', req.body);
    
    // 检查区域是否已存在
    const existingArea = await Area.findOne({ name });
    if (existingArea) {
      console.log('区域已存在:', name);
      return res.status(400).json({ message: '区域已存在' });
    }
    
    // 创建区域，确保生成唯一的fullName
    const area = new Area({
      name: name,
      remark: remark,
      fullName: name + '-' + Date.now() // 确保fullName唯一
    });
    
    console.log('创建新区域:', area);
    await area.save();
    console.log('区域添加成功:', area);
    res.status(201).json(area);
  } catch (error) {
    console.error('添加区域错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新区域
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const area = await Area.findById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 检查区域是否已存在（排除当前区域）
    const existingArea = await Area.findOne({ name, _id: { $ne: req.params.id } });
    if (existingArea) {
      return res.status(400).json({ message: '区域已存在' });
    }
    
    area.name = name;
    await area.save();
    res.json(area);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除区域
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const areaId = req.params.id;
    
    // 检查区域是否存在
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 检查是否有楼层属于该区域
    const floors = await Floor.find({ area_id: areaId });
    if (floors.length > 0) {
      return res.status(400).json({ message: '该区域下还有楼层，无法删除' });
    }
    
    // 使用现代的Mongoose方法删除区域
    await Area.findByIdAndDelete(areaId);
    res.json({ message: '区域删除成功' });
  } catch (error) {
    console.error('删除区域错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 楼层相关接口

// 获取所有楼层
router.get('/:areaId/floors', verifyToken, async (req, res) => {
  try {
    const floors = await Floor.find({ area_id: req.params.areaId });
    res.json(floors);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个楼层
router.get('/floors/:id', verifyToken, async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    res.json(floor);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加楼层
router.post('/:areaId/floors', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const { areaId } = req.params;
    
    // 检查区域是否存在
    const area = await Area.findById(areaId);
    if (!area) {
      return res.status(404).json({ message: '区域不存在' });
    }
    
    // 检查楼层是否已存在
    const existingFloor = await Floor.findOne({ name, area_id: areaId });
    if (existingFloor) {
      return res.status(400).json({ message: '楼层已存在' });
    }
    
    const floor = new Floor({ name, area_id: areaId });
    await floor.save();
    res.status(201).json(floor);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新楼层
router.put('/floors/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const floor = await Floor.findById(req.params.id);
    
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    
    // 检查楼层是否已存在（排除当前楼层）
    const existingFloor = await Floor.findOne({ name, area_id: floor.area_id, _id: { $ne: req.params.id } });
    if (existingFloor) {
      return res.status(400).json({ message: '楼层已存在' });
    }
    
    floor.name = name;
    await floor.save();
    res.json(floor);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除楼层
router.delete('/floors/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const floorId = req.params.id;
    
    // 检查楼层是否存在
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    
    // 检查是否有房间属于该楼层
    const rooms = await Room.find({ floor_id: floorId });
    if (rooms.length > 0) {
      return res.status(400).json({ message: '该楼层下还有房间，无法删除' });
    }
    
    // 使用现代的Mongoose方法删除楼层
    await Floor.findByIdAndDelete(floorId);
    res.json({ message: '楼层删除成功' });
  } catch (error) {
    console.error('删除楼层错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 房间相关接口

// 获取所有房间
router.get('/:floorId/rooms', verifyToken, async (req, res) => {
  try {
    const rooms = await Room.find({ floor_id: req.params.floorId });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个房间
router.get('/rooms/:id', verifyToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加房间
router.post('/:floorId/rooms', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const { floorId } = req.params;
    
    // 检查楼层是否存在
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    
    // 检查房间是否已存在
    const existingRoom = await Room.findOne({ name, floor_id: floorId });
    if (existingRoom) {
      return res.status(400).json({ message: '房间已存在' });
    }
    
    const room = new Room({ name, floor_id: floorId });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新房间
router.put('/rooms/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    // 检查房间是否已存在（排除当前房间）
    const existingRoom = await Room.findOne({ name, floor_id: room.floor_id, _id: { $ne: req.params.id } });
    if (existingRoom) {
      return res.status(400).json({ message: '房间已存在' });
    }
    
    room.name = name;
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除房间
router.delete('/rooms/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const roomId = req.params.id;
    
    // 检查房间是否存在
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    // 使用现代的Mongoose方法删除房间
    await Room.findByIdAndDelete(roomId);
    res.json({ message: '房间删除成功' });
  } catch (error) {
    console.error('删除房间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;