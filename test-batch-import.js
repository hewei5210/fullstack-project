const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testBatchImport() {
  try {
    console.log('🧪 测试批量新增翻译项功能...');
    
    // 先登录获取token
    console.log('正在登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'watermelon'
    });
    
    console.log('登录成功，获取到token');
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // 创建一个简单的Excel文件进行测试
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('翻译模板');
    
    // 设置表头
    worksheet.columns = [
      { header: "翻译项", key: "zh-CN", width: 30 },
      { header: "翻译项-英文", key: "en-US", width: 30 },
      { header: "翻译项-繁体", key: "zh-HK", width: 30 },
    ];
    
    // 添加测试数据
    worksheet.addRow({
      'zh-CN': '测试翻译项1',
      'en-US': 'Test Translation 1',
      'zh-HK': '測試翻譯項1'
    });
    
    worksheet.addRow({
      'zh-CN': '测试翻译项2',
      'en-US': 'Test Translation 2',
      'zh-HK': '測試翻譯項2'
    });
    
    // 保存到临时文件
    const tempFilePath = path.join(__dirname, 'test_batch_import.xlsx');
    await workbook.xlsx.writeFile(tempFilePath);
    
    console.log('创建测试Excel文件:', tempFilePath);
    
    // 读取文件并上传
    const fileBuffer = fs.readFileSync(tempFilePath);
    
    // 创建FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'test_batch_import.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('正在上传文件...');
    
    const uploadResponse = await axios.post(`${BASE_URL}/api/batchUpload`, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ 批量上传成功:', {
      status: uploadResponse.data.status,
      message: uploadResponse.data.message,
      data: uploadResponse.data.data
    });
    
    // 清理临时文件
    fs.unlinkSync(tempFilePath);
    console.log('临时文件已清理');
    
  } catch (error) {
    console.error('❌ 批量上传失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
}

// 运行测试
testBatchImport();
