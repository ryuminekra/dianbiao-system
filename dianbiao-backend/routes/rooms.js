const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有房间
router.get('/', verifyToken, async (req, res) => {
  try {
    const { floor_id } = req.query;
    let query = {};
    if (floor_id) {
      query.floor_id = floor_id;
    }
    const rooms = await Room.find(query);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加房间（仅管理员）
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, floor_id } = req.body;
    
    // 验证必需字段
    if (!name || !floor_id) {
      return res.status(400).json({ message: '缺少必需字段' });
    }
    
    // 检查房间是否已存在
    const existingRoom = await Room.findOne({ name, floor_id });
    if (existingRoom) {
      return res.status(400).json({ message: '该房间已存在' });
    }
    
    const room = new Room({
      name,
      floor_id
    });
    
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('添加房间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑房间（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, floor_id } = req.body;
    
    // 检查房间是否存在
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    // 检查房间是否已存在
    if (name || floor_id) {
      const existingRoom = await Room.findOne({
        name: name || room.name,
        floor_id: floor_id || room.floor_id,
        _id: { $ne: req.params.id }
      });
      if (existingRoom) {
        return res.status(400).json({ message: '该房间已存在' });
      }
    }
    
    // 更新房间信息
    room.name = name || room.name;
    room.floor_id = floor_id || room.floor_id;
    
    await room.save();
    res.json(room);
  } catch (error) {
    console.error('编辑房间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除房间（仅管理员）
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }
    
    await room.deleteOne();
    res.json({ message: '房间删除成功' });
  } catch (error) {
    console.error('删除房间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;