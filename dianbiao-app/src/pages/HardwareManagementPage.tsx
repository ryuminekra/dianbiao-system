import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, Select, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';

const { Title } = Typography;

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

interface Device {
  _id: string;
  device_id: string;
  area: string;
  area_id: string;
  floor: string;
  floor_id: string;
  room: string;
  room_id: string;
  remark?: string;
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [filterFloorId, setFilterFloorId] = useState<string>('');
  const [filterRoomId, setFilterRoomId] = useState<string>('');
  const [filterFloors, setFilterFloors] = useState<Floor[]>([]);
  const [filterRooms, setFilterRooms] = useState<Room[]>([]);

  // 获取设备列表
  const fetchDevices = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      if (searchKeyword) {
        params.append('keyword', searchKeyword);
      }
      if (filterAreaId) {
        params.append('area_id', filterAreaId);
      }
      if (filterFloorId) {
        params.append('floor_id', filterFloorId);
      }
      if (filterRoomId) {
        params.append('room_id', filterRoomId);
      }
      
      const queryString = params.toString();
      const url = `http://localhost:5000/api/devices${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      setDevices(response.data);
    } catch (error) {
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取区域列表
  const fetchAreas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/areas');
      setAreas(response.data);
    } catch (error) {
      message.error('获取区域列表失败');
    }
  };

  // 获取楼层列表
  const fetchFloors = async (areaId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/areas/${areaId}/floors`);
      setFloors(response.data);
    } catch (error) {
      message.error('获取楼层列表失败');
    }
  };

  // 获取房间列表
  const fetchRooms = async (floorId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/areas/${floorId}/rooms`);
      setRooms(response.data);
    } catch (error) {
      message.error('获取房间列表失败');
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchAreas();
  }, []);

  // 当选择区域变化时，获取对应楼层
  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    setSelectedFloorId('');
    if (areaId) {
      fetchFloors(areaId);
    }
    form.setFieldsValue({ floor_id: '', room_id: '' });
  };

  // 当选择楼层变化时，获取对应房间
  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    if (floorId) {
      fetchRooms(floorId);
    }
    form.setFieldsValue({ room_id: '' });
  };

  // 处理筛选区域变化
  const handleFilterAreaChange = async (areaId: string) => {
    setFilterAreaId(areaId);
    setFilterFloorId('');
    setFilterRoomId('');
    
    if (areaId) {
      try {
        const response = await axios.get(`http://localhost:5000/api/areas/${areaId}/floors`);
        setFilterFloors(response.data);
      } catch (error) {
        message.error('获取楼层列表失败');
      }
    } else {
      setFilterFloors([]);
    }
    fetchDevices();
  };

  // 处理筛选楼层变化
  const handleFilterFloorChange = async (floorId: string) => {
    setFilterFloorId(floorId);
    setFilterRoomId('');
    
    if (floorId) {
      try {
        const response = await axios.get(`http://localhost:5000/api/areas/${floorId}/rooms`);
        setFilterRooms(response.data);
      } catch (error) {
        message.error('获取房间列表失败');
      }
    } else {
      setFilterRooms([]);
    }
    fetchDevices();
  };

  // 处理筛选房间变化
  const handleFilterRoomChange = (roomId: string) => {
    setFilterRoomId(roomId);
    fetchDevices();
  };

  // 处理搜索
  const handleSearch = () => {
    fetchDevices();
  };

  // 重置筛选条件
  const resetFilters = () => {
    setSearchKeyword('');
    setFilterAreaId('');
    setFilterFloorId('');
    setFilterRoomId('');
    setFilterFloors([]);
    setFilterRooms([]);
    fetchDevices();
  };

  // 处理添加设备
  const handleAddDevice = async (values: { device_id: string; area_id: string; floor_id: string; room_id: string; remark?: string }) => {
    try {
      // 获取区域、楼层、房间的名称
      const area = areas.find(a => a._id === values.area_id);
      const floor = floors.find(f => f._id === values.floor_id);
      const room = rooms.find(r => r._id === values.room_id);
      
      const deviceData = {
        device_id: values.device_id,
        area_id: values.area_id,
        area: area?.name || '',
        floor_id: values.floor_id,
        floor: floor?.name || '',
        room_id: values.room_id,
        room: room?.name || '',
        remark: values.remark
      };
      
      console.log('添加设备请求参数:', deviceData);
      const response = await axios.post('http://localhost:5000/api/devices', deviceData);
      console.log('添加设备响应:', response.data);
      message.success('设备添加成功');
      setIsAddModalVisible(false);
      form.resetFields();
      fetchDevices();
    } catch (error: any) {
      console.error('添加设备失败:', error);
      console.error('错误响应:', error.response);
      message.error(error.response?.data?.message || '设备添加失败');
    }
  };

  // 处理编辑设备
  const handleEditDevice = async (values: { device_id: string; area_id: string; floor_id: string; room_id: string; remark?: string }) => {
    if (!editingDevice) return;
    
    try {
      // 获取区域、楼层、房间的名称
      const area = areas.find(a => a._id === values.area_id);
      const floor = floors.find(f => f._id === values.floor_id);
      const room = rooms.find(r => r._id === values.room_id);
      
      const deviceData = {
        device_id: values.device_id,
        area_id: values.area_id,
        area: area?.name || '',
        floor_id: values.floor_id,
        floor: floor?.name || '',
        room_id: values.room_id,
        room: room?.name || '',
        remark: values.remark
      };
      
      await axios.put(`http://localhost:5000/api/devices/${editingDevice._id}`, deviceData);
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
      area_id: device.area_id,
      floor_id: device.floor_id,
      room_id: device.room_id,
      remark: device.remark
    });
    // 设置选中的区域和楼层，获取对应的数据
    setSelectedAreaId(device.area_id);
    setSelectedFloorId(device.floor_id);
    if (device.area_id) {
      fetchFloors(device.area_id);
    }
    if (device.floor_id) {
      fetchRooms(device.floor_id);
    }
    setIsEditModalVisible(true);
  };

  // 导出Excel
  const handleExportExcel = () => {
    // 准备导出数据
    const exportData = devices.map(device => ({
      '设备编号': device.device_id,
      '区域': device.area,
      '楼层': device.floor,
      '房间': device.room,
      '备注': device.remark || ''
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '设备列表');
    // 生成Excel文件并下载
    XLSX.writeFile(wb, `设备列表_${new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}.xlsx`);
  };

  // 导入Excel
  const handleImportExcel = async (file: File) => {
    try {
      // 读取Excel文件
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          // 解析Excel数据
          const wb = XLSX.read(data, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          // 将Excel数据转换为JSON
          const excelData = XLSX.utils.sheet_to_json(ws);

          // 验证数据格式
          const validData = [];
          for (const item of excelData) {
            const device_id = item['设备编号'] || item['设备编号'] || item['device_id'];
            const area_name = item['区域'] || item['区域'] || item['area'];
            const floor_name = item['楼层'] || item['楼层'] || item['floor'];
            const room_name = item['房间'] || item['房间'] || item['room'];
            const remark = item['备注'] || item['备注'] || item['remark'] || '';

            if (!device_id || !area_name || !floor_name || !room_name) {
              message.error(`数据格式错误：缺少必要字段，设备编号: ${device_id}`);
              continue;
            }

            // 查找区域、楼层、房间的ID
            const area = areas.find(a => a.name === area_name);
            if (!area) {
              message.error(`区域不存在：${area_name}`);
              continue;
            }

            // 获取区域对应的楼层
            const areaFloors = await axios.get(`http://localhost:5000/api/areas/${area._id}/floors`);
            const floor = areaFloors.data.find((f: Floor) => f.name === floor_name);
            if (!floor) {
              message.error(`楼层不存在：${floor_name} (区域: ${area_name})`);
              continue;
            }

            // 获取楼层对应的房间
            const floorRooms = await axios.get(`http://localhost:5000/api/areas/${floor._id}/rooms`);
            const room = floorRooms.data.find((r: Room) => r.name === room_name);
            if (!room) {
              message.error(`房间不存在：${room_name} (楼层: ${floor_name}, 区域: ${area_name})`);
              continue;
            }

            validData.push({
              device_id,
              area_id: area._id,
              area: area.name,
              floor_id: floor._id,
              floor: floor.name,
              room_id: room._id,
              room: room.name,
              remark
            });
          }

          // 批量添加设备
          if (validData.length > 0) {
            const successCount = 0;
            for (const deviceData of validData) {
              try {
                await axios.post('http://localhost:5000/api/devices', deviceData);
              } catch (error: any) {
                message.error(`添加设备失败：${deviceData.device_id} - ${error.response?.data?.message || '未知错误'}`);
              }
            }
            message.success(`成功导入 ${validData.length} 个设备`);
            // 重新获取设备列表
            fetchDevices();
          }
        } catch (error) {
          message.error('解析Excel文件失败');
        }
      };
      reader.onerror = () => {
        message.error('读取文件失败');
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      message.error('导入Excel文件失败');
    }
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
      title: '备注',
      dataIndex: 'remark',
      key: 'remark'
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
        <Space>
          <Upload
            accept=".xlsx, .xls"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImportExcel(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>
              导入Excel
            </Button>
          </Upload>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            导出Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>
            添加设备
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选区域 */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px'
      }}>
        {/* 关键词搜索 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Input
            placeholder="关键词搜索"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={resetFilters}
          >
            重置
          </Button>
        </div>

        {/* 区域筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>区域:</span>
          <Select
            placeholder="请选择区域"
            options={areas.map(area => ({ label: area.name, value: area._id }))}
            value={filterAreaId || undefined}
            onChange={handleFilterAreaChange}
            style={{ width: 180 }}
            allowClear
          />
        </div>

        {/* 楼层筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>楼层:</span>
          <Select
            placeholder="请选择楼层"
            options={filterFloors.map(floor => ({ label: floor.name, value: floor._id }))}
            value={filterFloorId || undefined}
            onChange={handleFilterFloorChange}
            style={{ width: 180 }}
            allowClear
          />
        </div>

        {/* 房间筛选 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>房间:</span>
          <Select
            placeholder="请选择房间"
            options={filterRooms.map(room => ({ label: room.name, value: room._id }))}
            value={filterRoomId || undefined}
            onChange={handleFilterRoomChange}
            style={{ width: 120 }}
            allowClear
          />
        </div>
      </div>

      <div style={{ height: '600px', overflow: 'auto', marginBottom: '24px' }}>
        <Table 
          columns={columns} 
          dataSource={devices} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ y: true }}
        />
      </div>

      {/* 添加设备模态框 */}
      <Modal
        title="添加设备"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          form.resetFields();
          setSelectedAreaId('');
          setSelectedFloorId('');
        }}
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
            name="area_id"
            label="区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select
              placeholder="请选择区域"
              options={areas.map(area => ({ label: area.name, value: area._id }))}
              onChange={handleAreaChange}
            />
          </Form.Item>
          
          <Form.Item
            name="floor_id"
            label="楼层"
            rules={[{ required: true, message: '请选择楼层' }]}
          >
            <Select
              placeholder="请选择楼层"
              options={floors.map(floor => ({ label: floor.name, value: floor._id }))}
              onChange={handleFloorChange}
            />
          </Form.Item>
          
          <Form.Item
            name="room_id"
            label="房间"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select
              placeholder="请选择房间"
              options={rooms.map(room => ({ label: room.name, value: room._id }))}
            />
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
                setIsAddModalVisible(false);
                form.resetFields();
                setSelectedAreaId('');
                setSelectedFloorId('');
              }}>取消</Button>
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
          setSelectedAreaId('');
          setSelectedFloorId('');
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
            name="area_id"
            label="区域"
            rules={[{ required: true, message: '请选择区域' }]}
          >
            <Select
              placeholder="请选择区域"
              options={areas.map(area => ({ label: area.name, value: area._id }))}
              onChange={handleAreaChange}
            />
          </Form.Item>
          
          <Form.Item
            name="floor_id"
            label="楼层"
            rules={[{ required: true, message: '请选择楼层' }]}
          >
            <Select
              placeholder="请选择楼层"
              options={floors.map(floor => ({ label: floor.name, value: floor._id }))}
              onChange={handleFloorChange}
            />
          </Form.Item>
          
          <Form.Item
            name="room_id"
            label="房间"
            rules={[{ required: true, message: '请选择房间' }]}
          >
            <Select
              placeholder="请选择房间"
              options={rooms.map(room => ({ label: room.name, value: room._id }))}
            />
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
                setEditingDevice(null);
                setSelectedAreaId('');
                setSelectedFloorId('');
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
