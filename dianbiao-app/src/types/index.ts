// 用户类型
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

// 设备类型
export interface Device {
  id: string;
  device_id: string;
  area: string;
  address: string;
  created_at: Date;
  updated_at: Date;
}

// 电表数据类型
export interface Metric {
  id: string;
  device_id: string;
  value: number;
  timestamp: Date;
  month: string;
}

// 电价类型
export interface ElectricityPrice {
  id: string;
  area: string;
  price: number;
  effective_date: Date;
  created_at: Date;
  updated_at: Date;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型
export interface LoginResponse {
  token: string;
  user: User;
}
