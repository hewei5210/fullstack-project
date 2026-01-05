#!/bin/bash

echo "开始部署 i18n 全栈服务..."

# 进入后端目录
cd /var/www/backend

# 安装依赖
echo "安装后端依赖..."
npm install

# 创建环境配置文件
echo "创建环境配置文件..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://i18n_user:i18n_password_123@localhost:27017/i18n_project
JWT_SECRET=your_jwt_secret_key_here_123456789
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_123456789
EOF

# 创建日志目录
echo "创建日志目录..."
mkdir -p logs

# 启动应用
echo "启动后端应用..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "后端服务部署完成！"

# 配置防火墙
echo "配置防火墙..."
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
# 注释掉3000端口，增强安全性（通过Nginx代理访问）
# firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 配置 Nginx（使用正确的证书路径）
echo "配置 Nginx..."
cp /var/www/backend/nginx.conf /etc/nginx/conf.d/i18n.conf

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

echo "部署完成！"
echo "前端地址: https://frontendtool.top (推荐)"
echo "前端地址: http://223.6.250.152 (调试用)"
echo "API 地址: https://frontendtool.top/api"
echo ""
echo "注意："
echo "1. 域名访问会自动重定向到HTTPS"
echo "2. 已使用阿里云正式SSL证书，安全警告已解决"

# 显示服务状态
echo "服务状态："
pm2 status
systemctl status nginx