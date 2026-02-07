const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

async function initData() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/dianbiao');
    console.log('数据库连接成功');

    // 定义模型
    const User = mongoose.model('User', new mongoose.Schema({
      username: { type: String, unique: true },
      password: String,
      role: String
    }));

    const Device = mongoose.model('Device', new mongoose.Schema({
      device_id: { type: String, unique: true },
      area: String,
      address: String
    }));

    const ElectricityPrice = mongoose.model('ElectricityPrice', new mongoose.Schema({
      area: { type: String, unique: true },
      price: Number
    }));

    const Metric = mongoose.model('Metric', new mongoose.Schema({
      device_id: mongoose.Schema.Types.ObjectId,
      value: Number,
      timestamp: Date,
      month: String
    }));

    // 创建用户
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('123456', salt);
    const userPass = await bcrypt.hash('123456', salt);

    // 检查并创建admin用户
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      await User.create({ username: 'admin', password: adminPass, role: 'admin' });
      console.log('管理员用户创建成功');
    } else {
      console.log('管理员用户已存在');
    }

    // 检查并创建user用户
    const existingUser = await User.findOne({ username: 'user' });
    if (!existingUser) {
      await User.create({ username: 'user', password: userPass, role: 'user' });
      console.log('普通用户创建成功');
    } else {
      console.log('普通用户已存在');
    }

    // 检查并创建设备
    let devices = [];
    const existingDevices = await Device.find();
    if (existingDevices.length === 0) {
      devices = await Device.create([
        { device_id: 'M001', area: 'A区', address: '101室' },
        { device_id: 'M002', area: 'A区', address: '102室' },
        { device_id: 'M003', area: 'B区', address: '201室' },
        { device_id: 'M004', area: 'B区', address: '202室' }
      ]);
      console.log('设备创建成功');
    } else {
      devices = existingDevices;
      console.log('设备已存在');
    }

    // 检查并创建电价
    const existingPrices = await ElectricityPrice.find();
    if (existingPrices.length === 0) {
      await ElectricityPrice.create([
        { area: 'A区', price: 0.6 },
        { area: 'B区', price: 0.8 }
      ]);
      console.log('电价创建成功');
    } else {
      console.log('电价已存在');
    }

    // 检查并创建电表数据
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const device of devices) {
      const existingMetrics = await Metric.find({ device_id: device._id, month: currentMonth });
      if (existingMetrics.length === 0) {
        await Metric.create([
          {
            device_id: device._id,
            value: 100 + Math.random() * 50,
            timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            month: currentMonth
          },
          {
            device_id: device._id,
            value: 150 + Math.random() * 50,
            timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            month: currentMonth
          },
          {
            device_id: device._id,
            value: 200 + Math.random() * 50,
            timestamp: now,
            month: currentMonth
          }
        ]);
        console.log(`设备 ${device.device_id} 的电表数据创建成功`);
      } else {
        console.log(`设备 ${device.device_id} 的电表数据已存在`);
      }
    }

    console.log('初始数据创建完成');
    mongoose.disconnect();
  } catch (error) {
    console.error('错误:', error);
    mongoose.disconnect();
  }
}

initData();
