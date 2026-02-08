import { useState, useEffect } from 'react';
import { Card, Button, Form, Select, InputNumber, message, Typography, Table, Input, Space, Row, Col, DatePicker, Modal } from 'antd';
import { ReloadOutlined, SaveOutlined, HomeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface Device {
  _id: string;
  device_id: string;
  area_id: string;
  area: string;
  floor_id: string;
  floor: string;
  room_id: string;
  room: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

interface Metric {
  _id: string;
  device_id: string;
  value: number;
  timestamp: string;
  month: string;
}

const ManualMeterReadingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [recentReadings, setRecentReadings] = useState<Metric[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 筛选条件状态
  const [filters, setFilters] = useState({
    area: '',
    floor: '',
    room: ''
  });
  
  // 唯一的区域、楼层、房间列表
  const [uniqueValues, setUniqueValues] = useState({
    areas: [] as string[],
    floors: [] as string[],
    rooms: [] as string[]
  });
  
  // 级联选择的选项
  const [cascadeOptions, setCascadeOptions] = useState({
    floors: [] as string[],
    rooms: [] as string[]
  });
  
  // 编辑相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReading, setEditingReading] = useState<Metric | null>(null);
  const [editForm] = Form.useForm();

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/devices');
      const deviceList = response.data;
      setDevices(deviceList);
      setFilteredDevices(deviceList);
      
      // 提取唯一的区域、楼层、房间列表
      const areas = Array.from(new Set(deviceList.map((d: Device) => d.area)));
      const floors = Array.from(new Set(deviceList.map((d: Device) => d.floor)));
      const rooms = Array.from(new Set(deviceList.map((d: Device) => d.room)));
      
      setUniqueValues({
        areas,
        floors,
        rooms
      });
      
      // 初始化级联选项
      setCascadeOptions({
        floors,
        rooms: []
      });
    } catch (error) {
      message.error('获取设备列表失败');
    }
  };

  // 获取设备的最近电表读数
  const fetchRecentReadings = async (deviceId: string) => {
    if (!deviceId) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/metrics/device/${deviceId}`);
      setRecentReadings(response.data.reverse()); // 显示所有记录，按时间倒序排列
    } catch (error) {
      message.error('获取电表读数失败');
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCurrentUser();
  }, []);
  
  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    fetchRecentReadings(selectedDevice);
  }, [selectedDevice]);

  // 处理设备选择变化
  const handleDeviceChange = (value: string) => {
    setSelectedDevice(value);
  };
  
  // 处理筛选条件变化
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    let newFilters = { ...filters, [key]: value };
    
    // 级联选择逻辑
    if (key === 'area') {
      // 选择区域后，重置楼层和房间号
      newFilters = { ...newFilters, floor: '', room: '' };
      
      // 更新楼层选项，只显示该区域下的楼层
      if (value) {
        const areaFloors = Array.from(new Set(
          devices.filter(d => d.area === value).map(d => d.floor)
        ));
        setCascadeOptions(prev => ({ ...prev, floors: areaFloors }));
      } else {
        setCascadeOptions(prev => ({ ...prev, floors: uniqueValues.floors }));
      }
      setCascadeOptions(prev => ({ ...prev, rooms: [] }));
    } else if (key === 'floor') {
      // 选择楼层后，重置房间号
      newFilters = { ...newFilters, room: '' };
      
      // 更新房间号选项，只显示该楼层下的房间号
      if (value && newFilters.area) {
        const floorRooms = Array.from(new Set(
          devices.filter(d => d.area === newFilters.area && d.floor === value).map(d => d.room)
        ));
        setCascadeOptions(prev => ({ ...prev, rooms: floorRooms }));
      } else if (newFilters.area) {
        setCascadeOptions(prev => ({ ...prev, rooms: [] }));
      }
    }
    
    setFilters(newFilters);
    
    // 根据筛选条件过滤设备
    const filtered = devices.filter(device => {
      const matchesArea = !newFilters.area || device.area === newFilters.area;
      const matchesFloor = !newFilters.floor || device.floor === newFilters.floor;
      const matchesRoom = !newFilters.room || device.room === newFilters.room;
      
      return matchesArea && matchesFloor && matchesRoom;
    });
    
    setFilteredDevices(filtered);
  };

  // 处理电表数字变化
  const handleMeterValueChange = (_value: number | null) => {
    // 不需要设置状态，表单会自动处理
  };

  // 处理提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/metrics', {
        device_id: values.device_id,
        value: values.value,
        timestamp: values.timestamp ? values.timestamp.toISOString() : new Date().toISOString()
      });
      message.success('电表度数录入成功');
      // 只重置电表度数和时间字段，保留设备选择
      form.resetFields(['value', 'timestamp']);
      fetchDevices();
      fetchRecentReadings(selectedDevice);
    } catch (error: any) {
      message.error(error.response?.data?.message || '电表度数录入失败');
    } finally {
      setLoading(false);
    }
  };

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
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Metric) => {
        if (currentUser?.role === 'admin') {
          return (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditReading(record)}
              >
                编辑
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteReading(record._id)}
              >
                删除
              </Button>
            </Space>
          );
        }
        return null;
      }
    }
  ];
  
  // 处理删除电表读数
  const handleDeleteReading = (readingId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条电表读数吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await axios.delete(`http://localhost:5000/api/metrics/${readingId}`);
          message.success('电表读数删除成功');
          fetchRecentReadings(selectedDevice);
        } catch (error) {
          message.error('电表读数删除失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };
  
  // 处理编辑电表读数
  const handleEditReading = (record: Metric) => {
    setEditingReading(record);
    editForm.setFieldsValue({
      value: record.value,
      timestamp: dayjs(record.timestamp)
    });
    setEditModalVisible(true);
  };
  
  // 处理编辑表单提交
  const handleEditSubmit = async (values: any) => {
    if (!editingReading) return;
    
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/metrics/${editingReading._id}`, {
        value: values.value,
        timestamp: values.timestamp.toISOString()
      });
      message.success('电表读数编辑成功');
      setEditModalVisible(false);
      fetchRecentReadings(selectedDevice);
    } catch (error) {
      message.error('电表读数编辑失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Button icon={<HomeOutlined />} onClick={() => navigate('/')} style={{ marginRight: '16px' }}>
          返回首页
        </Button>
        <Title level={3}>手动录入电表度数</Title>
      </div>

      <Card style={{ marginBottom: '24px', maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >

          

          
          <Form.Item label="选择设备">
            <div style={{ marginBottom: '16px' }}>已选择设备: {selectedDevice ? devices.find(d => d._id === selectedDevice)?.device_id : '无'}</div>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={6}>
                <Form.Item label="区域">
                  <Select
                    placeholder="请选择区域"
                    style={{ width: '100%' }}
                    onChange={(value) => handleFilterChange('area', value)}
                    options={[
                      { value: '', label: '全部区域' },
                      ...uniqueValues.areas.map(area => ({ value: area, label: area }))
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="楼层">
                  <Select
                    placeholder="请选择楼层"
                    style={{ width: '100%' }}
                    onChange={(value) => handleFilterChange('floor', value)}
                    options={[
                      { value: '', label: '全部楼层' },
                      ...cascadeOptions.floors.map(floor => ({ value: floor, label: floor }))
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="房间号">
                  <Select
                    placeholder="请选择房间号"
                    style={{ width: '100%' }}
                    onChange={(value) => handleFilterChange('room', value)}
                    options={[
                      { value: '', label: '全部房间' },
                      ...cascadeOptions.rooms.map(room => ({ value: room, label: room }))
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="device_id"
                  label="设备"
                  rules={[{ required: true, message: '请选择设备' }]}
                >
                  <Select
                    placeholder="请选择设备"
                    style={{ width: '100%' }}
                    onChange={(value) => {
                      setSelectedDevice(value);
                    }}
                    options={filteredDevices.map(device => ({
                      value: device._id,
                      label: device.device_id
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          
          {selectedDevice && (
            <Card title="历史电表数据" style={{ marginBottom: '24px' }}>
              {recentReadings.length > 0 ? (
                <Table 
                  columns={columns} 
                  dataSource={recentReadings} 
                  rowKey="_id" 
                  pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: false }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '16px' }}>暂无历史数据</div>
              )}
            </Card>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="value"
                label="电表度数"
                rules={[{ required: true, message: '请填写电表度数' }, { type: 'number', min: 0, message: '电表度数必须大于等于0' }]}
              >
                <InputNumber 
                  placeholder="请填写电表度数" 
                  style={{ width: '100%' }} 
                  onChange={handleMeterValueChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timestamp"
                label="选择时间"
                initialValue={dayjs()}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              htmlType="submit" 
              loading={loading}
            >
              提交
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDevices} 
              style={{ marginLeft: '16px' }}
            >
              刷新设备列表
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 编辑电表读数模态框 */}
      <Modal
        title="编辑电表读数"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="value"
            label="电表度数"
            rules={[{ required: true, message: '请填写电表度数' }, { type: 'number', min: 0, message: '电表度数必须大于等于0' }]}
          >
            <InputNumber 
              placeholder="请填写电表度数" 
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="timestamp"
            label="选择时间"
            rules={[{ required: true, message: '请选择时间' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              保存
            </Button>
            <Button 
              onClick={() => setEditModalVisible(false)} 
              style={{ marginLeft: '16px' }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
);

};

export default ManualMeterReadingPage;