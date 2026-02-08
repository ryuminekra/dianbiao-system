import { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Card, Input, Select, DatePicker } from 'antd';
import { ReloadOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Log {
  _id: string;
  action: string;
  username: string;
  ip: string;
  details: any;
  timestamp: string;
}

const SystemLogPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<[Date, Date] | null>(null);
  const navigate = useNavigate();

  // 获取系统日志
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      if (timeRange) {
        params.startTime = timeRange[0].toISOString();
        params.endTime = timeRange[1].toISOString();
      }

      const response = await axios.get('http://localhost:5000/api/logs', { params });
      setLogs(response.data.logs);
    } catch (error) {
      message.error('获取系统日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, timeRange]);

  // 列定义
  const columns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 200
    },
    {
      title: '操作用户',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {JSON.stringify(details)}
        </div>
      )
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (text: string) => new Date(text).toLocaleString()
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginRight: '16px' }}>
            返回首页
          </Button>
          <Title level={3}>系统日志</Title>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchLogs} 
          loading={loading}
        >
          刷新日志
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Search
          placeholder="搜索操作或用户"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />
        <RangePicker
          style={{ width: 300 }}
          onChange={(dates) => setTimeRange(dates as [Date, Date] | null)}
          placeholder={['开始时间', '结束时间']}
        />
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={logs} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default SystemLogPage;