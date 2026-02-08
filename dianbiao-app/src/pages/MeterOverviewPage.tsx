import { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Space, Select, Card, Row, Col, Statistic, DatePicker } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface MeterOverview {
  device_id: string;
  device_number: string;
  area: string;
  address: string;
  current_reading: number;
  last_updated: string | null;
}

interface DeviceStat {
  device_id: string;
  usage: number;
  price: number;
  cost: number;
}

interface RoomStat {
  room: string;
  usage: number;
  cost: number;
  percentage: number;
  devices: DeviceStat[];
}

interface FloorStat {
  floor: string;
  usage: number;
  cost: number;
  percentage: number;
  rooms: RoomStat[];
}

interface AreaStat {
  area: string;
  usage: number;
  cost: number;
  percentage: number;
  floors: FloorStat[];
}

const MeterOverviewPage: React.FC = () => {
  const [meters, setMeters] = useState<MeterOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [areaStats, setAreaStats] = useState<AreaStat[]>([]);
  const [totalUsage, setTotalUsage] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const navigate = useNavigate();

  // 获取默认电价
  const fetchDefaultPrice = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/prices/default');
      setDefaultPrice(response.data.price || 0);
    } catch (error) {
      console.error('获取默认电价失败:', error);
      setDefaultPrice(0);
    }
  };

  // 获取区域统计数据
  const fetchAreaStats = async () => {
    try {
      // 构建日期参数
      const params: any = {};
      if (dateRange) {
        const startDate = dateRange[0];
        params.year = startDate.getFullYear();
        params.month = startDate.getMonth() + 1;
        params.day = startDate.getDate();
      }
      
      const response = await axios.get('http://localhost:5000/api/metrics/area-stats', { params });
      setAreaStats(response.data.stats || []);
      setTotalUsage(response.data.totalUsage || 0);
      setTotalCost(response.data.totalCost || 0);
    } catch (error) {
      console.error('获取区域统计数据失败:', error);
      setAreaStats([]);
      setTotalUsage(0);
      setTotalCost(0);
    }
  };

  // 获取电表概览数据
  const fetchMeters = async () => {
    setLoading(true);
    try {
      const params = selectedArea ? { area: selectedArea } : {};
      const response = await axios.get('http://localhost:5000/api/metrics/overview', { params });
      const data = response.data;
      
      // 确保数据格式正确
      const formattedData = data.map((item: any) => ({
        device_id: String(item.device_id),
        device_number: item.device_number,
        area: item.area,
        address: item.address,
        current_reading: Number(item.current_reading),
        last_updated: item.last_updated ? new Date(item.last_updated).toISOString() : null
      }));
      
      setMeters(formattedData);
      
      // 提取所有区域
      const uniqueAreas = Array.from(new Set(formattedData.map((item: MeterOverview) => item.area))) as string[];
      setAreas(uniqueAreas);
    } catch (error: any) {
      console.error('获取电表概览数据失败:', error);
      message.error(error.response?.data?.message || '获取电表概览数据失败');
      // 即使出错也显示空数据，避免页面空白
      setMeters([]);
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchMeters();
    fetchDefaultPrice();
    fetchAreaStats();
  }, [selectedArea]);

  // 日期变化时重新获取区域统计数据
  useEffect(() => {
    fetchAreaStats();
  }, [dateRange]);



  // 处理区域选择
  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
  };

  // 处理日期变化
  const handleDateChange = (_dates: any, dateStrings: [string, string]) => {
    if (_dates) {
      const dates: [Date, Date] = [_dates[0].toDate(), _dates[1].toDate()];
      setDateRange(dates);
    } else {
      setDateRange(null);
    }
  };

  // 查看电表详情
  const handleViewDetails = (deviceId: string) => {
    navigate(`/meter/${deviceId}`);
  };

  // 列定义
  const columns = [
    {
      title: '设备编号',
      dataIndex: 'device_number',
      key: 'device_number'
    },
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area'
    },
    {
      title: '门牌号',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '当前读数',
      dataIndex: 'current_reading',
      key: 'current_reading'
    },
    {
      title: '最后更新时间',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (text: string | null) => text ? new Date(text).toLocaleString() : '未更新'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MeterOverview) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record.device_id)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  // 饼图颜色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3}>电表概览</Title>
        <Space>
          <Select
            placeholder="选择区域"
            style={{ width: 200 }}
            value={selectedArea}
            onChange={handleAreaChange}
            allowClear
            options={areas.map(area => ({ label: area, value: area }))}
          />
          <RangePicker 
            onChange={handleDateChange} 
            style={{ width: 300 }} 
            picker="date"
          />
          <Button type="default" icon={<ReloadOutlined />} onClick={fetchMeters} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic title="总电表数" value={meters.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="总读数" 
              value={meters.reduce((sum, meter) => sum + meter.current_reading, 0)}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="平均读数" 
              value={meters.length > 0 ? meters.reduce((sum, meter) => sum + meter.current_reading, 0) / meters.length : 0}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* 仪表盘部分 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* 区域耗电量分布 */}
        <Col span={24}>
          <Card title="区域耗电量分布">
            <Row gutter={[16, 16]}>
              {/* 区域耗电百分比 */}
              <Col span={8}>
                <Card size="small" title="区域耗电百分比">
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={areaStats.map(area => ({
                            ...area,
                            name: area.area
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={(props) => {
                            const { payload } = props;
                            return `${payload.name}: ${payload.percentage.toFixed(2)}%`;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="usage"
                        >
                          {areaStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, _name, props) => [`${value} 度`, props.payload.area]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
              
              {/* 楼层耗电百分比 */}
              <Col span={8}>
                <Card size="small" title="楼层耗电百分比">
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={areaStats.flatMap(area => 
                            area.floors.map(floor => ({
                              name: floor.floor,
                              usage: floor.usage,
                              percentage: floor.percentage
                            }))
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={(props) => {
                            const { payload } = props;
                            return `${payload.name}: ${payload.percentage.toFixed(2)}%`;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="usage"
                        >
                          {areaStats.flatMap(area => area.floors).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, _name, props) => [`${value} 度`, props.payload.name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
              
              {/* 房间耗电百分比 */}
              <Col span={8}>
                <Card size="small" title="房间耗电百分比">
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={areaStats.flatMap(area => 
                            area.floors.flatMap(floor => 
                              floor.rooms.map(room => ({
                                name: room.room,
                                usage: room.usage,
                                percentage: room.percentage
                              }))
                            )
                          )}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={(props) => {
                            const { payload } = props;
                            return `${payload.name}: ${payload.percentage.toFixed(2)}%`;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="usage"
                        >
                          {areaStats.flatMap(area => 
                            area.floors.flatMap(floor => floor.rooms)
                          ).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, _name, props) => [`${value} 度`, props.payload.name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 园区电费 */}
        <Col span={24}>
          <Card title="园区电费">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic 
                  title="总耗电量" 
                  value={totalUsage} 
                  precision={2}
                  suffix="度"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="默认电价" 
                  value={defaultPrice} 
                  precision={2}
                  suffix="元/度"
                />
              </Col>
              <Col span={8}>
                <Card style={{ marginTop: 0 }}>
                  <Statistic 
                    title="总费用" 
                    value={totalCost} 
                    precision={2}
                    suffix="元"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <div style={{ height: '600px', overflow: 'auto', marginBottom: '24px' }}>
        <Table 
          columns={columns} 
          dataSource={meters} 
          rowKey="device_id" 
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ y: 600 }}
        />
      </div>
    </div>
  );
};

export default MeterOverviewPage;
