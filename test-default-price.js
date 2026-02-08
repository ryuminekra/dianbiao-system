const axios = require('axios');

// 测试默认电价API
async function testDefaultPrice() {
  try {
    // 首先获取默认电价
    console.log('获取默认电价...');
    const getResponse = await axios.get('http://localhost:5000/api/prices/default', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjU4YjVjNjUyMTZhYzAwMTlkZGRlY2EyIiwibmFtZSI6IuW8oOS4iSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AY29tLmNvbSIsInR5cGUiOiJBZG1pbiJ9LCJpYXQiOjE3NTAyMzM3MzQsImV4cCI6MTc1MDIzNzMzNH0.2Q3Q7f9e3f8e3f7e3f6e3f5e3f4e3f3e3f2e3f1e3f0'
      }
    });
    console.log('获取默认电价响应:', getResponse.data);
    
    // 然后设置默认电价
    console.log('设置默认电价...');
    const setResponse = await axios.post('http://localhost:5000/api/prices/default', { price: 2.5 }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjU4YjVjNjUyMTZhYzAwMTlkZGRlY2EyIiwibmFtZSI6IuW8oOS4iSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AY29tLmNvbSIsInR5cGUiOiJBZG1pbiJ9LCJpYXQiOjE3NTAyMzM3MzQsImV4cCI6MTc1MDIzNzMzNH0.2Q3Q7f9e3f8e3f7e3f6e3f5e3f4e3f3e3f2e3f1e3f0',
        'Content-Type': 'application/json'
      }
    });
    console.log('设置默认电价响应:', setResponse.data);
    
    // 再次获取默认电价，验证是否设置成功
    console.log('再次获取默认电价...');
    const getResponse2 = await axios.get('http://localhost:5000/api/prices/default', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjU4YjVjNjUyMTZhYzAwMTlkZGRlY2EyIiwibmFtZSI6IuW8oOS4iSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AY29tLmNvbSIsInR5cGUiOiJBZG1pbiJ9LCJpYXQiOjE3NTAyMzM3MzQsImV4cCI6MTc1MDIzNzMzNH0.2Q3Q7f9e3f8e3f7e3f6e3f5e3f4e3f3e3f2e3f1e3f0'
      }
    });
    console.log('再次获取默认电价响应:', getResponse2.data);
    
  } catch (error) {
    console.error('测试默认电价API错误:', error);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testDefaultPrice();
