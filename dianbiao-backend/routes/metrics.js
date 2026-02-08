const express = require('express');
const router = express.Router();
const Metric = require('../models/Metric');
const Device = require('../models/Device');
const ElectricityPrice = require('../models/ElectricityPrice');
const DefaultElectricityPrice = require('../models/DefaultElectricityPrice');
const { verifyToken } = require('../middleware/auth');

// 获取设备的电表数据
router.get('/device/:deviceId', verifyToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { month } = req.query;
    
    let query = { device_id: deviceId };
    
    if (month) {
      query.month = month;
    }
    
    const metrics = await Metric.find(query).sort({ timestamp: 'asc' });
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有电表的最新数据（概览）
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const { area } = req.query;
    
    // 获取所有设备
    let deviceQuery = {};
    if (area) {
      deviceQuery.area = area;
    }
    
    const devices = await Device.find(deviceQuery);
    
    // 对每个设备获取最新的电表数据
    const overviewData = await Promise.all(
      devices.map(async (device) => {
        const latestMetric = await Metric.findOne({ device_id: device._id })
          .sort({ timestamp: 'desc' });
        
        return {
          device_id: device._id,
          device_number: device.device_id,
          area: device.area,
          address: device.address,
          current_reading: latestMetric ? latestMetric.value : 0,
          last_updated: latestMetric ? latestMetric.timestamp : null
        };
      })
    );
    
    res.json(overviewData);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 计算月度用电量和费用
router.get('/monthly/:deviceId', verifyToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ message: '必须提供月份参数' });
    }
    
    // 获取设备信息
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 获取该月份的电表数据
    const metrics = await Metric.find({ device_id: deviceId, month }).sort({ timestamp: 'asc' });
    
    if (metrics.length < 2) {
      return res.json({ usage: 0, cost: 0, data: metrics });
    }
    
    // 计算月度用电量
    const firstReading = metrics[0].value;
    const lastReading = metrics[metrics.length - 1].value;
    const usage = lastReading - firstReading;
    
    // 获取电价（按照房间 > 楼层 > 区域 > 默认的优先级）
    let electricityPrice = null;
    
    // 1. 尝试查找房间级别的电价
    if (device.room) {
      electricityPrice = await ElectricityPrice.findOne({ 
        area: { $regex: new RegExp(`^${device.area}_${device.floor}_${device.room}`) } 
      });
    }
    
    // 2. 如果没有房间级别的电价，尝试查找楼层级别的电价
    if (!electricityPrice && device.floor) {
      electricityPrice = await ElectricityPrice.findOne({ 
        area: { $regex: new RegExp(`^${device.area}_${device.floor}`) } 
      });
    }
    
    // 3. 如果没有楼层级别的电价，尝试查找区域级别的电价
    if (!electricityPrice) {
      electricityPrice = await ElectricityPrice.findOne({ 
        area: device.area 
      });
    }
    
    // 4. 如果没有找到任何级别的电价，使用默认电价
    let price = 0;
    if (electricityPrice) {
      price = electricityPrice.price;
    } else {
      // 获取默认电价
      let defaultPrice = await DefaultElectricityPrice.findOne();
      if (!defaultPrice) {
        defaultPrice = new DefaultElectricityPrice({ price: 1.0 });
        await defaultPrice.save();
      }
      price = defaultPrice.price;
    }
    
    // 计算费用
    const cost = usage * price;
    
    res.json({ usage, cost, price, data: metrics });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加电表数据（模拟硬件上传）
router.post('/', verifyToken, async (req, res) => {
  try {
    const { device_id, value, timestamp } = req.body;
    
    // 验证设备是否存在
    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({ message: '设备不存在' });
    }
    
    // 生成月份字符串 (YYYY-MM)
    const now = timestamp ? new Date(timestamp) : new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const metric = new Metric({
      device_id,
      value,
      timestamp: timestamp || now,
      month
    });
    
    await metric.save();
    res.status(201).json(metric);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除电表数据
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const metric = await Metric.findByIdAndDelete(id);
    if (!metric) {
      return res.status(404).json({ message: '电表读数不存在' });
    }
    
    res.json({ message: '电表读数删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新电表数据
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, timestamp } = req.body;
    
    const metric = await Metric.findById(id);
    if (!metric) {
      return res.status(404).json({ message: '电表读数不存在' });
    }
    
    // 更新字段
    metric.value = value;
    if (timestamp) {
      metric.timestamp = new Date(timestamp);
      // 更新月份
      const now = new Date(timestamp);
      metric.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    await metric.save();
    res.json(metric);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取区域耗电量统计数据（支持年月日筛选）
router.get('/area-stats', async (req, res) => {
  try {
    const { year, month, day } = req.query;
    
    // 构建时间查询条件
    let timeQuery = {};
    if (year) {
      timeQuery.$expr = {
        $eq: [{ $year: '$timestamp' }, parseInt(year)]
      };
      
      if (month) {
        timeQuery.$expr = {
          ...timeQuery.$expr,
          $and: [
            { $eq: [{ $year: '$timestamp' }, parseInt(year)] },
            { $eq: [{ $month: '$timestamp' }, parseInt(month)] }
          ]
        };
        
        if (day) {
          timeQuery.$expr = {
            ...timeQuery.$expr,
            $and: [
              { $eq: [{ $year: '$timestamp' }, parseInt(year)] },
              { $eq: [{ $month: '$timestamp' }, parseInt(month)] },
              { $eq: [{ $dayOfMonth: '$timestamp' }, parseInt(day)] }
            ]
          };
        }
      }
    }
    
    // 获取默认电价
    let defaultPrice = await DefaultElectricityPrice.findOne();
    if (!defaultPrice) {
      defaultPrice = new DefaultElectricityPrice({ price: 1.0 });
      await defaultPrice.save();
    }
    
    // 获取所有设备
    const devices = await Device.find();
    
    // 构建层级数据结构
    const hierarchyData = {};
    let totalUsage = 0;
    let totalCost = 0;
    
    for (const device of devices) {
      // 获取该设备的最新电表读数（忽略日期范围，始终获取最新的）
      const latestMetric = await Metric.findOne({
        device_id: device._id
      }).sort({ timestamp: 'desc' });
      
      // 直接使用最新的电表读数作为该设备的耗电量
      const usage = latestMetric ? latestMetric.value : 0;
      
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
    
    // 转换为数组格式并计算百分比
    const statsArray = Object.entries(hierarchyData).map(([area, areaData]) => {
      const floorsArray = Object.entries(areaData.floors).map(([floor, floorData]) => {
        const roomsArray = Object.entries(floorData.rooms).map(([room, roomData]) => ({
          room,
          usage: roomData.usage,
          cost: roomData.cost,
          percentage: totalUsage > 0 ? (roomData.usage / totalUsage) * 100 : 0,
          devices: roomData.devices
        }));
        
        return {
          floor,
          usage: floorData.usage,
          cost: floorData.cost,
          percentage: totalUsage > 0 ? (floorData.usage / totalUsage) * 100 : 0,
          rooms: roomsArray
        };
      });
      
      return {
        area,
        usage: areaData.usage,
        cost: areaData.cost,
        percentage: totalUsage > 0 ? (areaData.usage / totalUsage) * 100 : 0,
        floors: floorsArray
      };
    });
    
    res.json({
      totalUsage,
      totalCost,
      stats: statsArray
    });
  } catch (error) {
    console.error('获取区域耗电量统计数据失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
