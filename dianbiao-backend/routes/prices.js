const express = require('express');
const router = express.Router();
const ElectricityPrice = require('../models/ElectricityPrice');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有电价
router.get('/', verifyToken, async (req, res) => {
  try {
    const { area } = req.query;
    let query = {};
    
    if (area) {
      query.area = area;
    }
    
    const prices = await ElectricityPrice.find(query);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个电价
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const price = await ElectricityPrice.findById(req.params.id);
    if (!price) {
      return res.status(404).json({ message: '电价不存在' });
    }
    res.json(price);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加电价（仅管理员）
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { area, price } = req.body;
    
    // 检查区域电价是否已存在
    const existingPrice = await ElectricityPrice.findOne({ area });
    if (existingPrice) {
      return res.status(400).json({ message: '该区域电价已存在' });
    }
    
    const electricityPrice = new ElectricityPrice({
      area,
      price
    });
    
    await electricityPrice.save();
    res.status(201).json(electricityPrice);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑电价（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { area, price } = req.body;
    
    // 检查电价是否存在
    const electricityPrice = await ElectricityPrice.findById(req.params.id);
    if (!electricityPrice) {
      return res.status(404).json({ message: '电价不存在' });
    }
    
    // 检查区域是否已被其他电价使用
    if (area && area !== electricityPrice.area) {
      const existingPrice = await ElectricityPrice.findOne({ area });
      if (existingPrice) {
        return res.status(400).json({ message: '该区域电价已存在' });
      }
    }
    
    // 更新电价信息
    electricityPrice.area = area || electricityPrice.area;
    electricityPrice.price = price || electricityPrice.price;
    
    await electricityPrice.save();
    res.json(electricityPrice);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除电价（仅管理员）
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const electricityPrice = await ElectricityPrice.findById(req.params.id);
    if (!electricityPrice) {
      return res.status(404).json({ message: '电价不存在' });
    }
    
    await electricityPrice.deleteOne();
    res.json({ message: '电价删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
