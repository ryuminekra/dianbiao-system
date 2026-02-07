import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

interface ElectricityPrice {
  _id: string;
  area: string;
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

  // 获取电价列表
  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/prices');
      setPrices(response.data);
    } catch (error) {
      message.error('获取电价列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // 处理添加电价
  const handleAddPrice = async (values: { area: string; price: number }) => {
    try {
      await axios.post('http://localhost:5000/api/prices', values);
      message.success('电价添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      fetchPrices();
    } catch (error: any) {
      message.error(error.response?.data?.message || '电价添加失败');
    }
  };

  // 处理编辑电价
  const handleEditPrice = async (values: { area: string; price: number }) => {
    if (!editingPrice) return;
    
    try {
      await axios.put(`http://localhost:5000/api/prices/${editingPrice._id}`, values);
      message.success('电价编辑成功');
      setIsEditModalVisible(false);
      form.resetFields();
      setEditingPrice(null);
      fetchPrices();
    } catch (error: any) {
      message.error(error.response?.data?.message || '电价编辑失败');
    }
  };

  // 处理删除电价
  const handleDeletePrice = async (priceId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/prices/${priceId}`);
      message.success('电价删除成功');
      fetchPrices();
    } catch (error) {
      message.error('电价删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (price: ElectricityPrice) => {
    setEditingPrice(price);
    form.setFieldsValue({
      area: price.area,
      price: price.price
    });
    setIsEditModalVisible(true);
  };

  // 列定义
  const columns = [
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3}>电价设置</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
          添加电价
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={prices} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加电价模态框 */}
      <Modal
        title="添加电价"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
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
            rules={[{ required: true, message: '请输入区域' }]}
          >
            <Input placeholder="请输入区域" />
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
              <Button onClick={() => setIsAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
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
            rules={[{ required: true, message: '请输入区域' }]}
          >
            <Input placeholder="请输入区域" />
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
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ElectricityPricePage;
