import { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Space, Select, Card, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface MeterOverview {
  device_id: string;
  device_number: string;
  area: string;
  address: string;
  current_reading: number;
  last_updated: string | null;
}

const MeterOverviewPage: React.FC = () => {
  const [meters, setMeters] = useState<MeterOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [areas, setAreas] = useState<string[]>([]);
  const navigate = useNavigate();

  // 获取电表概览数据
  const fetchMeters = async () => {
    setLoading(true);
    try {
      const params = selectedArea ? { area: selectedArea } : {};
      const response = await axios.get('http://localhost:5000/api/metrics/overview', { params });
      setMeters(response.data);
      
      // 提取所有区域
      const uniqueAreas = Array.from(new Set(response.data.map((item: MeterOverview) => item.area)));
      setAreas(uniqueAreas);
    } catch (error) {
      message.error('获取电表概览数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, [selectedArea]);

  // 处理区域选择
  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
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

      <Table 
        columns={columns} 
        dataSource={meters} 
        rowKey="device_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default MeterOverviewPage;
