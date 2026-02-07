import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, message } from 'antd';
import { LogoutOutlined, HomeOutlined, SettingOutlined, DashboardOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// 导入页面组件（稍后创建）
import LoginPage from './pages/LoginPage';
import HardwareManagementPage from './pages/HardwareManagementPage';
import ElectricityPricePage from './pages/ElectricityPricePage';
import MeterOverviewPage from './pages/MeterOverviewPage';
import MeterDetailPage from './pages/MeterDetailPage';

const { Header, Sider, Content } = Layout;

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // 检查用户是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('http://localhost:5000/api/auth/me');
          setCurrentUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    message.success('登录成功');
  };

  // 处理注销
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    message.success('注销成功');
  };

  // 路由守卫组件
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
    if (isLoading) return <div>加载中...</div>;
    
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && currentUser.role !== requiredRole) {
      message.error('权限不足');
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  // 主布局组件
  const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>远程抄电表系统</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '16px' }}>欢迎, {currentUser?.username}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }} collapsible collapsed={collapsed} onCollapse={setCollapsed}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['overview']}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                {
                  key: 'overview',
                  icon: <DashboardOutlined />,
                  label: <a href="/">电表概览</a>
                },
                {
                  key: 'hardware',
                  icon: <AppstoreOutlined />,
                  label: <a href="/hardware">硬件管理</a>,
                  disabled: currentUser?.role !== 'admin'
                },
                {
                  key: 'price',
                  icon: <SettingOutlined />,
                  label: <a href="/price">电价设置</a>,
                  disabled: currentUser?.role !== 'admin'
                }
              ]}
            />
          </Sider>
          <Content style={{ margin: '16px', padding: '24px', background: '#fff', minHeight: 280, borderRadius: '8px' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    );
  };

  return (
    <Router>
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MeterOverviewPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout>
                  <HardwareManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/price"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout>
                  <ElectricityPricePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/meter/:deviceId"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MeterDetailPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} replace />} />
        </Routes>
      )}
    </Router>
  );
}

export default App
