const jwt = require('jsonwebtoken');

// 验证JWT令牌
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: '访问被拒绝，未提供令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '无效的令牌' });
  }
};

// 验证管理员权限
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '访问被拒绝，需要管理员权限' });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };
