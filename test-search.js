const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSearch() {
  try {
    console.log('🧪 测试搜索功能...');
    
    // 先登录获取token
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'watermelon'
    });
    
    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    
    // 测试搜索功能
    const searchParams = {
      searchContent: '测试',
      searchSelect: 'zh-CN',
      page: 1,
      pageSize: 10
    };
    
    console.log('搜索参数:', searchParams);
    
    const searchResponse = await axios.get(`${BASE_URL}/api/search`, { 
      params: searchParams,
      headers 
    });
    
    console.log('✅ 搜索成功:', {
      status: searchResponse.data.status,
      total: searchResponse.data.data.total,
      dataCount: searchResponse.data.data.data.length,
      data: searchResponse.data.data.data.slice(0, 2) // 只显示前2条
    });
    
  } catch (error) {
    console.error('❌ 搜索失败:', error.response?.data || error.message);
  }
}

// 运行测试
testSearch();
