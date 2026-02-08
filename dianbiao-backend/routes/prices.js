const express = require('express');
const router = express.Router();
const ElectricityPrice = require('../models/ElectricityPrice');
const DefaultElectricityPrice = require('../models/DefaultElectricityPrice');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// 获取所有电价
router.get('/', verifyToken, async (req, res) => {
  try {
    const { area, floor, room } = req.query;
    let query = {};
    
    // 构建模糊搜索条件
    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }
    
    if (floor) {
      query.floor = { $regex: floor, $options: 'i' };
    }
    
    if (room) {
      query.room = { $regex: room, $options: 'i' };
    }
    
    const prices = await ElectricityPrice.find(query);
    res.json(prices);
  } catch (error) {
    console.error('获取电价列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});



// 获取默认电价
router.get('/default', async (req, res) => {
  try {
    // 查找默认电价记录
    let defaultPrice = await DefaultElectricityPrice.findOne();
    
    // 如果没有默认电价记录，创建一个
    if (!defaultPrice) {
      defaultPrice = new DefaultElectricityPrice({ price: 1.0 });
      await defaultPrice.save();
    }
    
    // 返回默认电价
    res.json({ price: defaultPrice.price });
  } catch (error) {
    console.error('获取默认电价错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 设置默认电价（仅管理员）
router.post('/default', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { price } = req.body;
    
    // 验证必需字段
    if (!price) {
      return res.status(400).json({ message: '缺少必需字段' });
    }
    
    console.log('设置默认电价请求:', price);
    
    // 查找默认电价记录
    let defaultPrice = await DefaultElectricityPrice.findOne();
    
    console.log('查找默认电价记录:', defaultPrice);
    
    // 如果没有默认电价记录，创建一个
    if (!defaultPrice) {
      defaultPrice = new DefaultElectricityPrice({ price });
      console.log('创建默认电价记录:', defaultPrice);
    } else {
      // 更新默认电价
      defaultPrice.price = price;
      console.log('更新默认电价记录:', defaultPrice);
    }
    
    // 保存默认电价
    await defaultPrice.save();
    console.log('保存默认电价成功:', defaultPrice);
    
    // 返回默认电价
    res.json({ price: defaultPrice.price });
  } catch (error) {
    console.error('设置默认电价错误:', error);
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
    console.log('添加电价请求体:', req.body);
    const { area, floor, room, price } = req.body;
    
    // 验证必需字段
    if (!area || !price) {
      return res.status(400).json({ message: '缺少必需字段' });
    }
    
    // 检查该区域、楼层和房间组合的电价是否已存在
    const query = { area };
    
    // 只在floor有值且不为空字符串时添加到查询中
    if (floor && floor.trim() !== '') {
      query.floor = floor;
    }
    
    // 只在room有值且不为空字符串时添加到查询中
    if (room && room.trim() !== '') {
      query.room = room;
    }
    
    const existingPrice = await ElectricityPrice.findOne(query);
    if (existingPrice) {
      console.log('该组合电价已存在:', existingPrice);
      if (room && room.trim() !== '') {
        return res.status(400).json({ message: '该房间电价已存在' });
      } else if (floor && floor.trim() !== '') {
        return res.status(400).json({ message: '该楼层电价已存在' });
      } else {
        return res.status(400).json({ message: '该区域电价已存在' });
      }
    }
    
    // 构建电价实例，只包含有值的字段
    // 为了避免area字段的唯一索引冲突，我们构建一个唯一的area值
    let uniqueArea = area;
    if (floor && floor.trim() !== '') {
      uniqueArea += `_${floor.trim()}`;
    }
    if (room && room.trim() !== '') {
      uniqueArea += `_${room.trim()}`;
    }
    
    const priceData = { 
      area: uniqueArea, 
      price 
    };
    if (floor && floor.trim() !== '') {
      priceData.floor = floor;
    }
    if (room && room.trim() !== '') {
      priceData.room = room;
    }
    
    const electricityPrice = new ElectricityPrice(priceData);
    
    console.log('创建电价实例:', electricityPrice);
    await electricityPrice.save();
    console.log('电价保存成功:', electricityPrice._id);
    
    res.status(201).json(electricityPrice);
  } catch (error) {
    console.error('添加电价错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 编辑电价（仅管理员）
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { area, floor, room, price } = req.body;
    
    // 检查电价是否存在
    const electricityPrice = await ElectricityPrice.findById(req.params.id);
    if (!electricityPrice) {
      return res.status(404).json({ message: '电价不存在' });
    }
    
    // 检查区域、楼层和房间组合是否已被其他电价使用
    if ((area || floor || room) && (area !== electricityPrice.area || floor !== electricityPrice.floor || room !== electricityPrice.room)) {
      const query = {
        area: area || electricityPrice.area,
        _id: { $ne: req.params.id }
      };
      
      // 只在floor有值且不为空字符串时添加到查询中
      if (floor && floor.trim() !== '') {
        query.floor = floor;
      }
      
      // 只在room有值且不为空字符串时添加到查询中
      if (room && room.trim() !== '') {
        query.room = room;
      }
      
      const existingPrice = await ElectricityPrice.findOne(query);
      if (existingPrice) {
        if (room && room.trim() !== '') {
          return res.status(400).json({ message: '该房间电价已存在' });
        } else if (floor && floor.trim() !== '') {
          return res.status(400).json({ message: '该楼层电价已存在' });
        } else {
          return res.status(400).json({ message: '该区域电价已存在' });
        }
      }
    }
    
    // 更新电价信息
    electricityPrice.area = area || electricityPrice.area;
    
    // 只在floor有值且不为空字符串时更新
    if (floor !== undefined) {
      if (floor.trim() !== '') {
        electricityPrice.floor = floor;
      } else {
        electricityPrice.floor = null;
      }
    }
    
    // 只在room有值且不为空字符串时更新
    if (room !== undefined) {
      if (room.trim() !== '') {
        electricityPrice.room = room;
      } else {
        electricityPrice.room = null;
      }
    }
    
    electricityPrice.price = price || electricityPrice.price;
    
    await electricityPrice.save();
    res.json(electricityPrice);
  } catch (error) {
    console.error('编辑电价错误:', error);
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
