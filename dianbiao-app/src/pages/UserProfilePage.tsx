import { useState, useEffect } from 'react';
import { Card, Button, Form, Input, message, Typography, Avatar, Upload, Modal } from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Password } = Input;
const { Dragger } = Upload;

const UserProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUserInfo(response.data);
      setAvatar(response.data.avatar || '');
      form.setFieldsValue({
        username: response.data.username,
        avatar: response.data.avatar
      });
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // 处理头像上传
  const handleAvatarUpload = async (values: any) => {
    try {
      setLoading(true);
      const response = await axios.put('http://localhost:5000/api/auth/profile', {
        avatar: values.avatar
      });
      setUserInfo(response.data);
      setAvatar(response.data.avatar);
      setAvatarModalVisible(false);
      message.success('头像修改成功');
    } catch (error) {
      message.error('头像修改失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码修改
  const handlePasswordChange = async (values: any) => {
    try {
      setLoading(true);
      await axios.put('http://localhost:5000/api/auth/password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success('密码修改成功');
      form.resetFields(['oldPassword', 'newPassword', 'confirmPassword']);
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传配置
  const uploadProps = {
    name: 'avatar',
    action: 'https://api.example.com/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info: any) {
      if (info.file.status === 'uploading') {
        setLoading(true);
        return;
      }
      if (info.file.status === 'done') {
        // 假设上传成功后返回的URL在info.file.response.url中
        // 这里使用一个占位符URL，实际项目中需要根据上传接口的返回值进行调整
        setAvatar(`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait&image_size=square`);
        setLoading(false);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
        setLoading(false);
      }
    },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <Button icon={<UserOutlined />} onClick={() => navigate('/')} style={{ marginRight: '16px' }}>
          返回首页
        </Button>
        <Title level={3}>个人资料</Title>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Avatar 
            size={128} 
            icon={<UserOutlined />} 
            src={avatar} 
            style={{ marginRight: '24px' }}
          />
          <Button 
            type="primary" 
            icon={<UploadOutlined />} 
            onClick={() => setAvatarModalVisible(true)}
          >
            修改头像
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleAvatarUpload}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
          >
            <Input placeholder="角色" value={userInfo?.role} disabled />
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>修改密码</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Password
              placeholder="请输入旧密码"
              iconRender={() => <EyeOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少为6位' }]}
          >
            <Password
              placeholder="请输入新密码"
              iconRender={() => <EyeOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Password
              placeholder="请确认新密码"
              iconRender={() => <EyeOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 头像上传模态框 */}
      <Modal
        title="修改头像"
        open={avatarModalVisible}
        onCancel={() => setAvatarModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAvatarModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={() => handleAvatarUpload({ avatar })}
            loading={loading}
          >
            确定
          </Button>
        ]}
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">
            支持 JPG、PNG 格式，文件大小不超过 2MB
          </p>
        </Dragger>
        {avatar && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Avatar size={128} src={avatar} />
            <Text style={{ display: 'block', marginTop: '8px' }}>预览</Text>
          </div>
        )}
      </Modal>
    </div>
);

};

export default UserProfilePage;