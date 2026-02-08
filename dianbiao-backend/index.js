const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dianbiao')
.then(() => {
  console.log('数据库连接成功');
}).catch(err => {
  console.error('数据库连接失败:', err);
});

// 创建Express应用
const app = express();

// 导入中间件
const { logger } = require('./middleware/logger');

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(logger);

// 路由
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const priceRoutes = require('./routes/prices');
const metricRoutes = require('./routes/metrics');
const areaRoutes = require('./routes/areas');
const floorRoutes = require('./routes/floors');
const roomRoutes = require('./routes/rooms');
const logRoutes = require('./routes/logs');

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/logs', logRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 测试添加区域的简单路由
app.post('/api/test-add-area', async (req, res) => {
  try {
    const { name, remark } = req.body;
    console.log('测试添加区域请求数据:', req.body);
    
    const Area = require('./models/Area');
    
    // 检查区域是否已存在
    const existingArea = await Area.findOne({ name });
    if (existingArea) {
      console.log('区域已存在:', name);
      return res.status(400).json({ message: '区域已存在' });
    }
    
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
    console.error('测试添加区域错误:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  console.error('错误堆栈:', err.stack);
  res.status(500).json({ message: '服务器错误', error: err.message, stack: err.stack });
});

// 导入定时任务
const cronJobs = require('./utils/cronJobs');

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  
  // 启动定时任务
  cronJobs.start();
});
