import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

interface Area {
  _id: string;
  name: string;
}

interface Floor {
  _id: string;
  name: string;
  area_id: string;
}

interface Room {
  _id: string;
  name: string;
  floor_id: string;
}

interface Area {
  _id: string;
  name: string;
}

interface Floor {
  _id: string;
  name: string;
}

interface Room {
  _id: string;
  name: string;
}

interface ElectricityPrice {
  _id: string;
  area: string;
  floor?: string;
  room?: string;
  price: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

const ElectricityPricePage: React.FC = () => {
  const [prices, setPrices] = useState<ElectricityPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ElectricityPrice | null>(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  
  // 区域数据
  const [areas, setAreas] = useState<Area[]>([]);
  // 楼层数据
  const [floors, setFloors] = useState<Floor[]>([]);
  // 房间数据
  const [rooms, setRooms] = useState<Room[]>([]);
  // 当前选择的值
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    area: '',
    floor: '',
    room: ''
  });
  
  // 默认电价
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  // 默认电价模态框
  const [isDefaultPriceModalVisible, setIsDefaultPriceModalVisible] = useState(false);
  // 默认电价表单
  const [defaultPriceForm] = Form.useForm();

  // 获取区域列表
  const fetchAreas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/areas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAreas(response.data);
    } catch (error: any) {
      console.error('获取区域列表错误:', error);
      message.error(error.response?.data?.message || '获取区域列表失败');
    }
  };

  // 获取楼层列表
  const fetchFloors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/floors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFloors(response.data);
    } catch (error: any) {
      console.error('获取楼层列表错误:', error);
      message.error(error.response?.data?.message || '获取楼层列表失败');
    }
  };

  // 获取房间列表
  const fetchRooms = async (floorId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/rooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          floor_id: floorId
        }
      });
      setRooms(response.data);
    } catch (error: any) {
      console.error('获取房间列表错误:', error);
      message.error(error.response?.data?.message || '获取房间列表失败');
    }
  };

  // 获取电价列表
  const fetchPrices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/prices', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: searchParams
      });
      setPrices(response.data);
    } catch (error: any) {
      console.error('获取电价列表错误:', error);
      message.error(error.response?.data?.message || '获取电价列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取默认电价
  const fetchDefaultPrice = async () => {
    try {
      // 不需要认证令牌来获取默认电价
      const response = await axios.get('http://localhost:5000/api/prices/default');
      setDefaultPrice(response.data.price || 0);
    } catch (error: any) {
      console.error('获取默认电价错误:', error);
      // 默认电价获取失败时，不显示错误消息，使用默认值0
    }
  };

  // 设置默认电价
  const setDefaultPriceHandler = () => {
    // 打开默认电价模态框
    defaultPriceForm.setFieldsValue({ price: defaultPrice });
    setIsDefaultPriceModalVisible(true);
  };

  // 处理设置默认电价
  const handleSetDefaultPrice = async (values: { price: number }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/prices/default', values, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setDefaultPrice(response.data.price);
      message.success('默认电价设置成功');
      setIsDefaultPriceModalVisible(false);
      defaultPriceForm.resetFields();
    } catch (error: any) {
      console.error('设置默认电价错误:', error);
      message.error(error.response?.data?.message || '默认电价设置失败');
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchFloors();
    fetchDefaultPrice();
    fetchPrices();
  }, []);

  // 处理搜索
  const handleSearch = (values: { area: string; floor: string; room: string }) => {
    setSearchParams(values);
    fetchPrices();
  };

  // 处理重置
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      area: '',
      floor: '',
      room: ''
    });
    fetchPrices();
  };

  // 处理添加电价
  const handleAddPrice = async (values: { area: string; floor?: string; room?: string; price: number }) => {
    try {
      console.log('添加电价请求体:', values);
      const token = localStorage.getItem('token');
      console.log('认证令牌:', token);
      
      const response = await axios.post('http://localhost:5000/api/prices', values, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('添加电价响应:', response);
      message.success('电价添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      fetchPrices();
    } catch (error: any) {
      console.error('添加电价错误:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      message.error(error.response?.data?.message || '电价添加失败');
    }
  };

  // 处理编辑电价
  const handleEditPrice = async (values: { area: string; floor?: string; room?: string; price: number }) => {
    if (!editingPrice) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/prices/${editingPrice._id}`, values, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('电价编辑成功');
      setIsEditModalVisible(false);
      form.resetFields();
      setEditingPrice(null);
      fetchPrices();
    } catch (error: any) {
      console.error('编辑电价错误:', error);
      message.error(error.response?.data?.message || '电价编辑失败');
    }
  };

  // 处理删除电价
  const handleDeletePrice = async (priceId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/prices/${priceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      message.success('电价删除成功');
      fetchPrices();
    } catch (error: any) {
      console.error('删除电价错误:', error);
      message.error(error.response?.data?.message || '电价删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = async (price: ElectricityPrice) => {
    setEditingPrice(price);
    
    // 从组合的area值中提取原始区域名称
    let originalArea = price.area;
    if (originalArea.includes('_')) {
      originalArea = originalArea.split('_')[0];
    }
    
    form.setFieldsValue({
      area: originalArea,
      floor: price.floor,
      room: price.room,
      price: price.price
    });
    setIsEditModalVisible(true);
  };

  // 列定义
  const columns = [
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      render: (text: string) => {
        // 从组合的area值中提取原始区域名称
        if (text.includes('_')) {
          return text.split('_')[0];
        }
        return text;
      }
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor'
    },
    {
      title: '房间',
      dataIndex: 'room',
      key: 'room'
    },
    {
      title: '电价（元/度）',
      dataIndex: 'price',
      key: 'price',
      render: (text: number) => text.toFixed(2)
    },
    {
      title: '生效日期',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (text: string) => new Date(text).toLocaleDateString()
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ElectricityPrice) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeletePrice(record._id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 默认电价设置 */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        backgroundColor: '#e6f7ff', 
        borderRadius: '8px', 
        border: '1px solid #91d5ff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: '#1890ff' }}>默认电价</h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>¥{defaultPrice.toFixed(2)}/度</p>
          </div>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={setDefaultPriceHandler}
          >
            设置默认电价
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3}>房间电价设置</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
          添加电价
        </Button>
      </div>

      {/* 搜索表单 */}
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}
      >
        <Form.Item
          name="area"
          label="区域"
        >
          <Select placeholder="请选择区域" style={{ width: 200 }} allowClear>
            {areas.map(area => (
              <Option key={area.name} value={area.name}>{area.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="floor"
          label="楼层"
        >
          <Select placeholder="请选择楼层" style={{ width: 200 }} allowClear>
            {floors.map(floor => (
              <Option key={floor.name} value={floor.name}>{floor.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="room"
          label="房间"
        >
          <Select placeholder="请选择房间" style={{ width: 200 }} allowClear>
            {rooms.map(room => (
              <Option key={room.name} value={room.name}>{room.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Space size="middle">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table 
        columns={columns} 
        dataSource={prices} 
        rowKey="_id" 
        loading={loading}
        pagination={{ 
          pageSize: 5,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        style={{ maxHeight: 400, overflow: 'auto' }}
      />

      {/* 添加电价模态框 */}
      <Modal
        title="添加电价"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddPrice}
        >
          <Form.Item
            name="area"
            label="区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select placeholder="请选择区域" style={{ width: '100%' }}>
              {areas.map(area => (
                <Option key={area.name} value={area.name}>{area.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="floor"
            label="楼层"
            rules={[]}
          >
            <Select 
              placeholder="请选择楼层（可选）" 
              style={{ width: '100%' }} 
              allowClear
              onChange={(value, option) => {
                setSelectedFloor(value);
                if (option && option.key) {
                  setSelectedFloorId(option.key);
                  fetchRooms(option.key);
                } else {
                  setSelectedFloorId('');
                  setRooms([]);
                }
              }}
            >
              {floors.map(floor => (
                <Option key={floor._id} value={floor.name}>{floor.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="room"
            label="房间"
            rules={[]}
          >
            <Select 
              placeholder="请选择房间（可选）" 
              style={{ width: '100%' }} 
              allowClear
              disabled={!selectedFloor}
            >
              {rooms.map(room => (
                <Option key={room.name} value={room.name}>{room.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="price"
            label="电价（元/度）"
            rules={[{ required: true, message: '请输入电价' }]}
          >
            <InputNumber 
              placeholder="请输入电价" 
              min={0} 
              step={0.01} 
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsAddModalVisible(false);
                form.resetFields();
              }}>取消</Button>
              <Button type="primary" onClick={() => form.submit()}>确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑电价模态框 */}
      <Modal
        title="编辑电价"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
          setEditingPrice(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditPrice}
        >
          <Form.Item
            name="area"
            label="区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select placeholder="请选择区域" style={{ width: '100%' }}>
              {areas.map(area => (
                <Option key={area.name} value={area.name}>{area.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="floor"
            label="楼层"
            rules={[]}
          >
            <Select 
              placeholder="请选择楼层（可选）" 
              style={{ width: '100%' }} 
              allowClear
              onChange={(value, option) => {
                setSelectedFloor(value);
                if (option && option.key) {
                  setSelectedFloorId(option.key);
                  fetchRooms(option.key);
                } else {
                  setSelectedFloorId('');
                  setRooms([]);
                }
              }}
            >
              {floors.map(floor => (
                <Option key={floor._id} value={floor.name}>{floor.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="room"
            label="房间"
            rules={[]}
          >
            <Select 
              placeholder="请选择房间（可选）" 
              style={{ width: '100%' }} 
              allowClear
              disabled={!selectedFloor}
            >
              {rooms.map(room => (
                <Option key={room.name} value={room.name}>{room.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="price"
            label="电价（元/度）"
            rules={[{ required: true, message: '请输入电价' }]}
          >
            <InputNumber 
              placeholder="请输入电价" 
              min={0} 
              step={0.01} 
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                form.resetFields();
                setEditingPrice(null);
              }}>取消</Button>
              <Button type="primary" onClick={() => form.submit()}>确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 默认电价模态框 */}
      <Modal
        title="设置默认电价"
        open={isDefaultPriceModalVisible}
        onCancel={() => {
          setIsDefaultPriceModalVisible(false);
          defaultPriceForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={defaultPriceForm}
          layout="vertical"
          onFinish={handleSetDefaultPrice}
        >
          <Form.Item
            name="price"
            label="默认电价（元/度）"
            rules={[{ required: true, message: '请输入默认电价' }]}
          >
            <InputNumber 
              placeholder="请输入默认电价"
              min={0} 
              step={0.01} 
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsDefaultPriceModalVisible(false);
                defaultPriceForm.resetFields();
              }}>取消</Button>
              <Button type="primary" onClick={() => defaultPriceForm.submit()}>确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ElectricityPricePage;
