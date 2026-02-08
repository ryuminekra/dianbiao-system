const Log = require('../models/Log');

// 记录系统操作日志的中间件
const logger = async (req, res, next) => {
  // 跳过某些不需要记录的路由
  const skipRoutes = ['/api/auth/login', '/api/metrics/device', '/api/metrics/overview'];
  if (skipRoutes.includes(req.path)) {
    return next();
  }

  // 记录请求开始时间
  const start = Date.now();

  // 拦截响应结束事件
  const originalSend = res.send;
  res.send = function(body) {
    // 计算响应时间
    const duration = Date.now() - start;

    // 构建日志对象
    const logData = {
      action: `${req.method} ${req.path}`,
      ip: req.ip,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        status: res.statusCode,
        duration: `${duration}ms`
      }
    };

    // 添加用户信息（如果存在）
    if (req.user) {
      logData.user = req.user._id;
      logData.username = req.user.username;
    }

    // 添加设备信息（如果存在）
    if (req.params.deviceId) {
      logData.device_id = req.params.deviceId;
    }

    // 保存日志到数据库
    Log.create(logData).catch(err => {
      console.error('日志记录失败:', err);
    });

    // 调用原始的send方法
    return originalSend.call(this, body);
  };

  next();
};

// 手动记录日志的工具函数
const logAction = async (action, user, details = {}) => {
  try {
    const logData = {
      action,
      details
    };

    if (user) {
      logData.user = user._id;
      logData.username = user.username;
    }

    await Log.create(logData);
  } catch (error) {
    console.error('手动日志记录失败:', error);
  }
};

module.exports = {
  logger,
  logAction
};