import { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, message, Typography, Space, Tree, Row, Col, Table, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined, HomeOutlined, AppstoreOutlined, FieldTimeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface Area {
  _id: string;
  name: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

interface Floor {
  _id: string;
  name: string;
  area_id: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

interface Room {
  _id: string;
  name: string;
  floor_id: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

interface TreeNode {
  title: string;
  key: string;
  icon: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
  data?: any;
}

const AreaSettingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'area' | 'floor' | 'room'>('area');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'floors' | 'rooms'>('areas');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 获取区域列表
  const fetchAreas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/areas');
      setAreas(response.data);
      return response.data;
    } catch (error) {
      message.error('获取区域列表失败');
      return [];
    }
  };

  // 获取楼层列表
  const fetchFloors = async (areasData: Area[]) => {
    try {
      // 遍历所有区域，获取对应的楼层
      const allFloors: Floor[] = [];
      for (const area of areasData) {
        const response = await axios.get(`http://localhost:5000/api/areas/${area._id}/floors`);
        allFloors.push(...response.data);
      }
      setFloors(allFloors);
      return allFloors;
    } catch (error) {
      message.error('获取楼层列表失败');
      return [];
    }
  };

  // 获取房间列表
  const fetchRooms = async (floorsData: Floor[]) => {
    try {
      // 遍历所有楼层，获取对应的房间
      const allRooms: Room[] = [];
      for (const floor of floorsData) {
        const response = await axios.get(`http://localhost:5000/api/areas/${floor._id}/rooms`);
        allRooms.push(...response.data);
      }
      setRooms(allRooms);
      return allRooms;
    } catch (error) {
      message.error('获取房间列表失败');
      return [];
    }
  };

  // 构建树形数据
  const buildTreeData = () => {
    const tree: TreeNode[] = [];
    
    // 遍历所有区域
    areas.forEach(area => {
      const areaNode: TreeNode = {
        title: area.name,
        key: `area-${area._id}`,
        icon: <AppstoreOutlined />,
        data: area,
        children: []
      };
      
      // 查找该区域下的楼层
      const areaFloors = floors.filter(floor => floor.area_id === area._id);
      areaFloors.forEach(floor => {
        const floorNode: TreeNode = {
          title: floor.name,
          key: `floor-${floor._id}`,
          icon: <FieldTimeOutlined />,
          data: floor,
          children: []
        };
        
        // 查找该楼层下的房间
        const floorRooms = rooms.filter(room => room.floor_id === floor._id);
        floorRooms.forEach(room => {
          const roomNode: TreeNode = {
            title: room.name,
            key: `room-${room._id}`,
            icon: <HomeOutlined />,
            data: room,
            isLeaf: true
          };
          floorNode.children?.push(roomNode);
        });
        
        areaNode.children?.push(floorNode);
      });
      
      tree.push(areaNode);
    });
    
    setTreeData(tree);
  };

  // 初始化数据
  const initializeData = async () => {
    setLoading(true);
    try {
      const areasData = await fetchAreas();
      const floorsData = await fetchFloors(areasData);
      await fetchRooms(floorsData);
      // 树形结构会通过useEffect自动构建
    } catch (error) {
      message.error('初始化数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // 当数据变化时自动重新构建树形结构
  useEffect(() => {
    buildTreeData();
  }, [areas, floors, rooms]);

  // 处理树节点选择
  const handleTreeSelect = (keys: any[], info: any) => {
    setSelectedKeys(keys as string[]);
    setSelectedNode(info.node);
  };

  // 处理添加按钮点击
  const handleAddClick = () => {
    if (!selectedKeys.length) {
      // 没有选择节点，默认添加区域
      setModalType('area');
      setIsAddModalVisible(true);
      form.resetFields();
      return;
    }
    
    const selectedKey = selectedKeys[0];
    if (selectedKey.startsWith('area-')) {
      // 选择了区域，添加楼层
      setModalType('floor');
      setIsAddModalVisible(true);
      form.resetFields();
    } else if (selectedKey.startsWith('floor-')) {
      // 选择了楼层，添加房间
      setModalType('room');
      setIsAddModalVisible(true);
      form.resetFields();
    }
  };

  // 处理编辑按钮点击
  const handleEditClick = () => {
    if (!selectedKeys.length) {
      message.warning('请选择要编辑的节点');
      return;
    }
    
    const selectedKey = selectedKeys[0];
    if (selectedKey.startsWith('area-')) {
      // 编辑区域
      setModalType('area');
      setEditingItem(selectedNode.data);
      form.setFieldsValue({ 
        name: selectedNode.data.name,
        remark: selectedNode.data.remark 
      });
      setIsEditModalVisible(true);
    } else if (selectedKey.startsWith('floor-')) {
      // 编辑楼层
      setModalType('floor');
      setEditingItem(selectedNode.data);
      form.setFieldsValue({ 
        name: selectedNode.data.name,
        area_id: selectedNode.data.area_id,
        remark: selectedNode.data.remark 
      });
      setIsEditModalVisible(true);
    } else if (selectedKey.startsWith('room-')) {
      // 编辑房间
      setModalType('room');
      setEditingItem(selectedNode.data);
      form.setFieldsValue({ 
        name: selectedNode.data.name,
        floor_id: selectedNode.data.floor_id,
        remark: selectedNode.data.remark 
      });
      setIsEditModalVisible(true);
    }
  };

  // 处理删除按钮点击
  const handleDeleteClick = async () => {
    if (!selectedKeys.length) {
      message.warning('请选择要删除的节点');
      return;
    }
    
    setLoading(true);
    try {
      const selectedKey = selectedKeys[0];
      if (selectedKey.startsWith('area-')) {
        // 删除区域
        await axios.delete(`http://localhost:5000/api/areas/${selectedNode.data._id}`);
        message.success('区域删除成功');
      } else if (selectedKey.startsWith('floor-')) {
        // 删除楼层
        await axios.delete(`http://localhost:5000/api/areas/floors/${selectedNode.data._id}`);
        message.success('楼层删除成功');
      } else if (selectedKey.startsWith('room-')) {
        // 删除房间
        await axios.delete(`http://localhost:5000/api/areas/rooms/${selectedNode.data._id}`);
        message.success('房间删除成功');
      }
      
      // 重新初始化数据
      await initializeData();
      setSelectedKeys([]);
      setSelectedNode(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理添加提交
  const handleAddSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('添加区域请求数据:', values);
      console.log('认证令牌:', token);
      
      if (modalType === 'area') {
        // 添加区域
        const response = await axios.post('http://localhost:5000/api/areas', values, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('添加区域响应:', response);
        message.success('区域添加成功');
      } else if (modalType === 'floor') {
        // 添加楼层
        const areaId = values.area_id;
        const response = await axios.post(`http://localhost:5000/api/areas/${areaId}/floors`, values, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('添加楼层响应:', response);
        message.success('楼层添加成功');
      } else if (modalType === 'room') {
        // 添加房间
        const floorId = values.floor_id;
        const response = await axios.post(`http://localhost:5000/api/areas/${floorId}/rooms`, values, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('添加房间响应:', response);
        message.success('房间添加成功');
      }
      
      // 重新初始化数据
      await initializeData();
      setIsAddModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('添加失败错误:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      message.error(error.response?.data?.message || '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理编辑提交
  const handleEditSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (modalType === 'area') {
        // 更新区域
        await axios.put(`http://localhost:5000/api/areas/${editingItem._id}`, values);
        message.success('区域更新成功');
      } else if (modalType === 'floor') {
        // 更新楼层
        await axios.put(`http://localhost:5000/api/areas/floors/${editingItem._id}`, values);
        message.success('楼层更新成功');
      } else if (modalType === 'room') {
        // 更新房间
        await axios.put(`http://localhost:5000/api/areas/rooms/${editingItem._id}`, values);
        message.success('房间更新成功');
      }
      
      // 重新初始化数据
      await initializeData();
      setIsEditModalVisible(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
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
        <Title level={3}>区域设置</Title>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddClick}
        >
          添加
        </Button>
        <Button 
          icon={<EditOutlined />} 
          onClick={handleEditClick}
          style={{ marginLeft: '16px' }}
        >
          编辑
        </Button>
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleDeleteClick}
          style={{ marginLeft: '16px' }}
        >
          删除
        </Button>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={initializeData}
          loading={loading}
          style={{ marginLeft: '16px' }}
        >
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="区域层级">
            <Tree
              treeData={treeData}
              selectedKeys={selectedKeys}
              onSelect={handleTreeSelect}
              showIcon
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="所有单位">
            <div style={{ marginBottom: '16px' }}>
              <Button type="default" onClick={() => setActiveTab('areas')}>
                区域
              </Button>
              <Button type="default" onClick={() => setActiveTab('floors')} style={{ marginLeft: '8px' }}>
                楼层
              </Button>
              <Button type="default" onClick={() => setActiveTab('rooms')} style={{ marginLeft: '8px' }}>
                房间
              </Button>
            </div>
            {activeTab === 'areas' && (
              <Table
                dataSource={areas}
                rowKey="_id"
                columns={[
                  { title: '区域名称', dataIndex: 'name', key: 'name' },
                  { title: '备注', dataIndex: 'remark', key: 'remark' },
                  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() }
                ]}
              />
            )}
            {activeTab === 'floors' && (
              <Table
                dataSource={floors}
                rowKey="_id"
                columns={[
                  { title: '楼层名称', dataIndex: 'name', key: 'name' },
                  { title: '所属区域', dataIndex: 'area_id', key: 'area_id', render: (areaId: string) => {
                    const area = areas.find(a => a._id === areaId);
                    return area ? area.name : '未知区域';
                  }},
                  { title: '备注', dataIndex: 'remark', key: 'remark' },
                  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() }
                ]}
              />
            )}
            {activeTab === 'rooms' && (
              <Table
                dataSource={rooms}
                rowKey="_id"
                columns={[
                  { title: '房间号', dataIndex: 'name', key: 'name' },
                  { title: '所属楼层', dataIndex: 'floor_id', key: 'floor_id', render: (floorId: string) => {
                    const floor = floors.find(f => f._id === floorId);
                    return floor ? floor.name : '未知楼层';
                  }},
                  { title: '备注', dataIndex: 'remark', key: 'remark' },
                  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() }
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 添加模态框 */}
      <Modal
        title={modalType === 'area' ? '添加区域' : modalType === 'floor' ? '添加楼层' : '添加房间'}
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSubmit}
        >
          {modalType === 'floor' && (
            <Form.Item
              name="area_id"
              label="所属区域"
              rules={[{ required: true, message: '请选择所属区域' }]}
            >
              <Select
                placeholder="请选择所属区域"
                options={areas.map(area => ({ label: area.name, value: area._id }))}
              />
            </Form.Item>
          )}
          {modalType === 'room' && (
            <Form.Item
              name="floor_id"
              label="所属楼层"
              rules={[{ required: true, message: '请选择所属楼层' }]}
            >
              <Select
                placeholder="请选择所属楼层"
                options={floors.map(floor => ({ label: floor.name, value: floor._id }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label={modalType === 'area' ? '区域名称' : modalType === 'floor' ? '楼层名称' : '房间号'}
            rules={[{ required: true, message: `请输入${modalType === 'area' ? '区域' : modalType === 'floor' ? '楼层' : '房间号'}名称` }]}
          >
            <Input placeholder={`请输入${modalType === 'area' ? '区域' : modalType === 'floor' ? '楼层' : '房间号'}名称`} />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title={modalType === 'area' ? '编辑区域' : modalType === 'floor' ? '编辑楼层' : '编辑房间'}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          form.resetFields();
          setEditingItem(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          {modalType === 'floor' && (
            <Form.Item
              name="area_id"
              label="所属区域"
              rules={[{ required: true, message: '请选择所属区域' }]}
            >
              <Select
                placeholder="请选择所属区域"
                options={areas.map(area => ({ label: area.name, value: area._id }))}
              />
            </Form.Item>
          )}
          {modalType === 'room' && (
            <Form.Item
              name="floor_id"
              label="所属楼层"
              rules={[{ required: true, message: '请选择所属楼层' }]}
            >
              <Select
                placeholder="请选择所属楼层"
                options={floors.map(floor => ({ label: floor.name, value: floor._id }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label={modalType === 'area' ? '区域名称' : modalType === 'floor' ? '楼层名称' : '房间号'}
            rules={[{ required: true, message: `请输入${modalType === 'area' ? '区域' : modalType === 'floor' ? '楼层' : '房间号'}名称` }]}
          >
            <Input placeholder={`请输入${modalType === 'area' ? '区域' : modalType === 'floor' ? '楼层' : '房间号'}名称`} />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                form.resetFields();
                setEditingItem(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
);

};

export default AreaSettingPage;