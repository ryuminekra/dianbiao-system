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

// 中间件
app.use(cors());
app.use(express.json());

// 路由
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const priceRoutes = require('./routes/prices');
const metricRoutes = require('./routes/metrics');

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/metrics', metricRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
