const express = require('express');
const router = express.Router();
const Floor = require('../models/Floor');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有楼层
router.get('/', verifyToken, async (req, res) => {
  try {
    const floors = await Floor.find();
    res.json(floors);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加楼层（仅管理员）
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, area_id } = req.body;
    
    // 验证必需字段
    if (!name || !area_id) {
      return res.status(400).json({ message: '缺少必需字段' });
    }
    
    // 检查楼层是否已存在
    const existingFloor = await Floor.findOne({ name, area_id });
    if (existingFloor) {
      return res.status(400).json({ message: '该楼层已存在' });
    }
    
    const floor = new Floor({
      name,
      area_id
    });
    
    await floor.save();
    res.status(201).json(floor);
  } catch (error) {
    console.error('添加楼层错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑楼层（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, area_id } = req.body;
    
    // 检查楼层是否存在
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    
    // 检查楼层是否已存在
    if (name || area_id) {
      const existingFloor = await Floor.findOne({
        name: name || floor.name,
        area_id: area_id || floor.area_id,
        _id: { $ne: req.params.id }
      });
      if (existingFloor) {
        return res.status(400).json({ message: '该楼层已存在' });
      }
    }
    
    // 更新楼层信息
    floor.name = name || floor.name;
    floor.area_id = area_id || floor.area_id;
    
    await floor.save();
    res.json(floor);
  } catch (error) {
    console.error('编辑楼层错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除楼层（仅管理员）
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ message: '楼层不存在' });
    }
    
    await floor.deleteOne();
    res.json({ message: '楼层删除成功' });
  } catch (error) {
    console.error('删除楼层错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;