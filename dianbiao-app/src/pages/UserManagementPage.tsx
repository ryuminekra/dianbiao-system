import { useState, useEffect } from 'react';
import { Table, Button, message, Typography, Space, Select, Avatar, Card } from 'antd';
import { ReloadOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface User {
  _id: string;
  username: string;
  role: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理角色更新
  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await axios.put(`http://localhost:5000/api/auth/users/${userId}/role`, {
        role: newRole
      });
      message.success('角色更新成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '角色更新失败');
    }
  };

  // 列定义
  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (text: string) => (
        <Avatar size={48} icon={<UserOutlined />} src={text} />
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: string, record: User) => (
        <Select
          value={text}
          onChange={(value) => handleRoleUpdate(record._id, value)}
          style={{ width: 120 }}
          options={[
            { value: 'admin', label: '管理员' },
            { value: 'user', label: '普通用户' }
          ]}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/user/${record._id}`)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<UserOutlined />} onClick={() => navigate('/')} style={{ marginRight: '16px' }}>
            返回首页
          </Button>
          <Title level={3}>用户管理</Title>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchUsers} 
          loading={loading}
        >
          刷新用户列表
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="_id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
);

};

export default UserManagementPage;