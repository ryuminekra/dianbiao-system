import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

interface Device {
  _id: string;
  device_id: string;
  area: string;
  address: string;
  created_at: string;
  updated_at: string;
}

const HardwareManagementPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();

  // 获取设备列表
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/devices');
      setDevices(response.data);
    } catch (error) {
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // 处理添加设备
  const handleAddDevice = async (values: { device_id: string; area: string; address: string }) => {
    try {
      await axios.post('http://localhost:5000/api/devices', values);
      message.success('设备添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      fetchDevices();
    } catch (error: any) {
      message.error(error.response?.data?.message || '设备添加失败');
    }
  };

  // 处理编辑设备
  const handleEditDevice = async (values: { device_id: string; area: string; address: string }) => {
    if (!editingDevice) return;
    
    try {
      await axios.put(`http://localhost:5000/api/devices/${editingDevice._id}`, values);
      message.success('设备编辑成功');
      setIsEditModalVisible(false);
      form.resetFields();
      setEditingDevice(null);
      fetchDevices();
    } catch (error: any) {
      message.error(error.response?.data?.message || '设备编辑失败');
    }
  };

  // 处理删除设备
  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/devices/${deviceId}`);
      message.success('设备删除成功');
      fetchDevices();
    } catch (error) {
      message.error('设备删除失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue({
      device_id: device.device_id,
      area: device.area,
      address: device.address
    });
    setIsEditModalVisible(true);
  };

  // 列定义
  const columns = [
    {
      title: '设备编号',
      dataIndex: 'device_id',
      key: 'device_id'
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
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
            onClick={() => handleDeleteDevice(record._id)}
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
        <Title level={3}>硬件管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
          添加设备
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={devices} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 添加设备模态框 */}
      <Modal
        title="添加设备"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDevice}
        >
          <Form.Item
            name="device_id"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          
          <Form.Item
            name="area"
            label="区域"
            rules={[{ required: true, message: '请输入区域' }]}
          >
            <Input placeholder="请输入区域" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="门牌号"
            rules={[{ required: true, message: '请输入门牌号' }]}
          >
            <Input placeholder="请输入门牌号" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑设备模态框 */}
      <Modal
        title="编辑设备"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
          setEditingDevice(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditDevice}
        >
          <Form.Item
            name="device_id"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          
          <Form.Item
            name="area"
            label="区域"
            rules={[{ required: true, message: '请输入区域' }]}
          >
            <Input placeholder="请输入区域" />
          </Form.Item>
          
          <Form.Item
            name="address"
            label="门牌号"
            rules={[{ required: true, message: '请输入门牌号' }]}
          >
            <Input placeholder="请输入门牌号" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                form.resetFields();
                setEditingDevice(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HardwareManagementPage;
