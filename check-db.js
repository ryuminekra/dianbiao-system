const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/dianbiao')
.then(async () => {
  console.log('数据库连接成功');
  
  // 定义Area模型
  const Area = mongoose.model('Area', new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    remark: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  }));
  
  // 查询所有区域
  console.log('查询所有区域...');
  const areas = await Area.find();
  console.log('当前区域列表:', areas);
  
  // 尝试创建一个新区域
  console.log('\n尝试创建新区域...');
  try {
    const newArea = new Area({ name: '测试区域1', remark: '测试用区域1' });
    console.log('创建新区域:', newArea);
    await newArea.save();
    console.log('区域创建成功:', newArea);
  } catch (error) {
    console.error('区域创建失败:', error.message);
  }
  
  // 再次查询所有区域
  console.log('\n再次查询所有区域...');
  const updatedAreas = await Area.find();
  console.log('更新后的区域列表:', updatedAreas);
  
  mongoose.disconnect();
  console.log('数据库连接已关闭');
})
.catch(err => {
  console.error('数据库连接失败:', err);
  mongoose.disconnect();
});
