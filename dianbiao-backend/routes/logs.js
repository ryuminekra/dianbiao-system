const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { verifyToken } = require('../middleware/auth');

// 获取系统日志列表
router.get('/', verifyToken, async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    const { search, startTime, endTime, page = 1, limit = 10 } = req.query;

    // 构建查询条件
    const query = {};

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } }
      ];
    }

    if (startTime && endTime) {
      query.timestamp = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    } else if (startTime) {
      query.timestamp = {
        $gte: new Date(startTime)
      };
    } else if (endTime) {
      query.timestamp = {
        $lte: new Date(endTime)
      };
    }

    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询日志
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Log.countDocuments(query);

    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单条日志详情
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '权限不足' });
    }

    const log = await Log.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    res.json(log);
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;