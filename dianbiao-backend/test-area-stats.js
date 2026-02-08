const mongoose = require('mongoose');
const Device = require('./models/Device');
const Metric = require('./models/Metric');
const DefaultElectricityPrice = require('./models/DefaultElectricityPrice');
const ElectricityPrice = require('./models/ElectricityPrice');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/dianbiao')
  .then(async () => {
    console.log('数据库连接成功');
    
    // 模拟 area-stats 端点的计算逻辑
    const devices = await Device.find();
    console.log('设备数量:', devices.length);
    
    // 获取默认电价
    let defaultPrice = await DefaultElectricityPrice.findOne();
    if (!defaultPrice) {
      defaultPrice = new DefaultElectricityPrice({ price: 1.0 });
      await defaultPrice.save();
    }
    
    // 构建层级数据结构
    const hierarchyData = {};
    let totalUsage = 0;
    let totalCost = 0;
    
    console.log('\n开始计算每个设备的耗电量:');
    for (const device of devices) {
      // 获取该设备的最新电表读数
      const latestMetric = await Metric.findOne({
        device_id: device._id
      }).sort({ timestamp: 'desc' });
      
      // 直接使用最新的电表读数作为该设备的耗电量
      const usage = latestMetric ? latestMetric.value : 0;
      
      console.log(`设备 ${device.device_id} (${device.area}) - 最新读数: ${usage}`);
      
      // 获取设备对应的电价
      let devicePrice = defaultPrice.price;
      
      // 尝试获取房间级别的电价
      const roomPrice = await ElectricityPrice.findOne({ 
        area: { $regex: new RegExp(`^${device.area}_${device.floor}_${device.room}`) } 
      });
      if (roomPrice) {
        devicePrice = roomPrice.price;
      } 
      // 尝试获取楼层级别的电价
      else {
        const floorPrice = await ElectricityPrice.findOne({ 
          area: { $regex: new RegExp(`^${device.area}_${device.floor}`) } 
        });
        if (floorPrice) {
          devicePrice = floorPrice.price;
        } 
        // 尝试获取区域级别的电价
        else {
          const areaPrice = await ElectricityPrice.findOne({ 
            area: device.area 
          });
          if (areaPrice) {
            devicePrice = areaPrice.price;
          }
        }
      }
      
      // 计算设备电费
      const cost = usage * devicePrice;
      
      // 构建层级结构：区域 -> 楼层 -> 房间
      if (!hierarchyData[device.area]) {
        hierarchyData[device.area] = {
          usage: 0,
          cost: 0,
          floors: {}
        };
      }
      
      if (!hierarchyData[device.area].floors[device.floor]) {
        hierarchyData[device.area].floors[device.floor] = {
          usage: 0,
          cost: 0,
          rooms: {}
        };
      }
      
      if (!hierarchyData[device.area].floors[device.floor].rooms[device.room]) {
        hierarchyData[device.area].floors[device.floor].rooms[device.room] = {
          usage: 0,
          cost: 0,
          devices: []
        };
      }
      
      // 累加耗电量和电费
      hierarchyData[device.area].usage += usage;
      hierarchyData[device.area].cost += cost;
      hierarchyData[device.area].floors[device.floor].usage += usage;
      hierarchyData[device.area].floors[device.floor].cost += cost;
      hierarchyData[device.area].floors[device.floor].rooms[device.room].usage += usage;
      hierarchyData[device.area].floors[device.floor].rooms[device.room].cost += cost;
      
      // 添加设备信息
      hierarchyData[device.area].floors[device.floor].rooms[device.room].devices.push({
        device_id: device.device_id,
        usage,
        price: devicePrice,
        cost
      });
      
      totalUsage += usage;
      totalCost += cost;
    }
    
    console.log('\n计算结果:');
    console.log('总耗电量:', totalUsage);
    console.log('总费用:', totalCost);
    
    // 验证总耗电量是否正确
    if (totalUsage === 0) {
      console.log('\n错误: 总耗电量为0，这是不正确的！');
    } else {
      console.log('\n正确: 总耗电量不为0，计算成功！');
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });
