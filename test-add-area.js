const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTg2Y2YwMjEzODJkMjQxYjlmMTdlZWIiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzcwNTIwOTUxLCJleHAiOjE3NzA2MDczNTF9.FhN_UroY2GJRMmqITxmy1mUcdsmfhsNqppWWnRSvScY'; // 新的JWT令牌

async function testAddArea() {
  try {
    // 测试添加第一个区域
    console.log('添加第一个区域...');
    const response1 = await axios.post('http://localhost:5000/api/areas', 
      { name: '测试区域1', remark: '测试用区域1' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('第一个区域添加成功:', response1.data);
    
    // 测试添加第二个区域
    console.log('\n添加第二个区域...');
    const response2 = await axios.post('http://localhost:5000/api/areas', 
      { name: '测试区域2', remark: '测试用区域2' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('第二个区域添加成功:', response2.data);
    
    // 测试添加第三个区域
    console.log('\n添加第三个区域...');
    const response3 = await axios.post('http://localhost:5000/api/areas', 
      { name: '测试区域3', remark: '测试用区域3' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('第三个区域添加成功:', response3.data);
    
    console.log('\n所有区域添加测试完成！');
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      console.error('请求已发送但没有收到响应:', error.request);
    }
  }
}

testAddArea();
