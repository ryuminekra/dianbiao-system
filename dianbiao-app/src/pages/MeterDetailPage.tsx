import { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Typography, Space, DatePicker, Row, Col, Statistic, Table } from 'antd';
import { ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Metric {
  _id: string;
  device_id: string;
  value: number;
  timestamp: string;
  month: string;
}

interface MonthlyData {
  usage: number;
  cost: number;
  price: number;
  data: Metric[];
}

const MeterDetailPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({ usage: 0, cost: 0, price: 0, data: [] });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const navigate = useNavigate();

  // 获取当前月份 (YYYY-MM)
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // 获取设备信息
  const fetchDeviceInfo = async () => {
    if (!deviceId) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/devices/${deviceId}`);
      setDeviceInfo(response.data);
    } catch (error: any) {
      console.error('获取设备信息失败:', error);
      message.error(error.response?.data?.message || '获取设备信息失败');
      // 即使出错也确保页面能够正常显示
      setDeviceInfo({ device_id: '未知', area: '未知', address: '未知' });
    }
  };

  // 获取月度数据
  const fetchMonthlyData = async () => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/metrics/monthly/${deviceId}`, {
        params: { month: selectedMonth }
      });
      const data = response.data;
      
      // 确保数据格式正确
      const formattedData = {
        usage: Number(data.usage),
        cost: Number(data.cost),
        price: Number(data.price),
        data: (data.data || []).map((item: any) => ({
          _id: String(item._id),
          device_id: String(item.device_id),
          value: Number(item.value),
          timestamp: item.timestamp,
          month: item.month
        }))
      };
      
      setMonthlyData(formattedData);
      updateChart(formattedData.data);
    } catch (error: any) {
      console.error('获取月度数据失败:', error);
      message.error(error.response?.data?.message || '获取月度数据失败');
      // 即使出错也确保页面能够正常显示
      setMonthlyData({ usage: 0, cost: 0, price: 0, data: [] });
      updateChart([]);
    } finally {
      setLoading(false);
    }
  };

  // 更新图表
  const updateChart = (data: Metric[]) => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    const dates = data.map(item => new Date(item.timestamp).toLocaleDateString());
    const values = data.map(item => item.value);
    
    const option = {
      title: {
        text: '电表读数趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>读数: {c}'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '读数'
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff'
        }
      }]
    };
    
    chartInstance.current.setOption(option);
  };

  // 处理月份变化
  const handleMonthChange = (date: any) => {
    if (date) {
      const year = date.year();
      const month = String(date.month() + 1).padStart(2, '0');
      setSelectedMonth(`${year}-${month}`);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchDeviceInfo();
      fetchMonthlyData();
    }
  }, [deviceId, selectedMonth]);

  // 响应式调整图表大小
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  // 列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '读数',
      dataIndex: 'value',
      key: 'value'
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginRight: '16px' }}>
          返回概览
        </Button>
        <Title level={3}>电表详细数据</Title>
      </div>

      {deviceInfo && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic title="设备编号" value={deviceInfo.device_id} />
            </Col>
            <Col span={8}>
              <Statistic title="区域" value={deviceInfo.area} />
            </Col>
            <Col span={8}>
              <Statistic title="门牌号" value={deviceInfo.address} />
            </Col>
          </Row>
        </Card>
      )}

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Space>
            <Text strong>选择月份:</Text>
            <DatePicker 
              picker="month" 
              format="YYYY-MM" 
              value={selectedMonth ? dayjs(selectedMonth + '-01') : null}
              onChange={handleMonthChange}
            />
          </Space>
          <Button type="default" icon={<ReloadOutlined />} onClick={fetchMonthlyData} loading={loading}>
            刷新数据
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card>
              <Statistic title="月度用电量（度）" value={monthlyData.usage} precision={2} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="电价（元/度）" value={monthlyData.price} precision={2} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="月度费用（元）" value={monthlyData.cost} precision={2} />
            </Card>
          </Col>
        </Row>

        <div ref={chartRef} style={{ width: '100%', height: 400, marginBottom: '24px' }} />

        <Table 
          columns={columns} 
          dataSource={monthlyData.data} 
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MeterDetailPage;
