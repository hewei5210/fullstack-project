const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testExcelOnly() {
  try {
    console.log('🧪 测试只接受Excel文件功能...');
    
    // 先登录获取token
    console.log('正在登录...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'watermelon'
    });
    
    console.log('登录成功，获取到token');
    const token = loginResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // 测试1: 尝试上传CSV文件到批量新增接口
    console.log('\n📋 测试1: 尝试上传CSV文件到批量新增接口...');
    try {
      const csvContent = '翻译项,翻译项-英文,翻译项-繁体\n测试项,Test Item,測試項';
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', csvBuffer, {
        filename: 'test.csv',
        contentType: 'text/csv'
      });
      
      await axios.post(`${BASE_URL}/api/batchUpload`, formData, {
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      });
      
      console.log('❌ 测试失败：CSV文件应该被拒绝');
    } catch (error) {
      if (error.response?.data?.message?.includes('只支持Excel文件')) {
        console.log('✅ 测试通过：CSV文件被正确拒绝');
      } else {
        console.log('❌ 测试失败：错误信息不正确', error.response?.data?.message);
      }
    }
    
    // 测试2: 尝试上传CSV文件到批量修改接口
    console.log('\n📋 测试2: 尝试上传CSV文件到批量修改接口...');
    try {
      const csvContent = '翻译项ID,翻译项,翻译项-英文,翻译项-繁体\nccfe-000000001,测试项,Test Item,測試項';
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', csvBuffer, {
        filename: 'test.csv',
        contentType: 'text/csv'
      });
      
      await axios.post(`${BASE_URL}/api/batchUpdate`, formData, {
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      });
      
      console.log('❌ 测试失败：CSV文件应该被拒绝');
    } catch (error) {
      if (error.response?.data?.message?.includes('只支持Excel文件')) {
        console.log('✅ 测试通过：CSV文件被正确拒绝');
      } else {
        console.log('❌ 测试失败：错误信息不正确', error.response?.data?.message);
      }
    }
    
    // 测试3: 尝试上传CSV文件到批量获取ID接口
    console.log('\n📋 测试3: 尝试上传CSV文件到批量获取ID接口...');
    try {
      const csvContent = '翻译项,翻译项-英文,翻译项-繁体\n测试项,Test Item,測試項';
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', csvBuffer, {
        filename: 'test.csv',
        contentType: 'text/csv'
      });
      
      await axios.post(`${BASE_URL}/api/batchGetIds`, formData, {
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      });
      
      console.log('❌ 测试失败：CSV文件应该被拒绝');
    } catch (error) {
      if (error.response?.data?.message?.includes('只支持Excel文件')) {
        console.log('✅ 测试通过：CSV文件被正确拒绝');
      } else {
        console.log('❌ 测试失败：错误信息不正确', error.response?.data?.message);
      }
    }
    
    // 测试4: 上传Excel文件验证功能正常
    console.log('\n📋 测试4: 上传Excel文件验证功能正常...');
    try {
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
        'zh-CN': 'Excel测试项1',
        'en-US': 'Excel Test Item 1',
        'zh-HK': 'Excel測試項1'
      });
      
      // 保存到临时文件
      const tempFilePath = path.join(__dirname, 'test_excel_only.xlsx');
      await workbook.xlsx.writeFile(tempFilePath);
      
      const fileBuffer = fs.readFileSync(tempFilePath);
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: 'test_excel_only.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const response = await axios.post(`${BASE_URL}/api/batchUpload`, formData, {
        headers: {
          ...headers,
          ...formData.getHeaders()
        }
      });
      
      console.log('✅ 测试通过：Excel文件上传成功');
      console.log('响应:', response.data.message);
      
      // 清理临时文件
      fs.unlinkSync(tempFilePath);
      
    } catch (error) {
      console.log('❌ 测试失败：Excel文件上传失败', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testExcelOnly();
