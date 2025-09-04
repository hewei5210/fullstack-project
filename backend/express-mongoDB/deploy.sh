#!/bin/bash

echo "开始部署 i18n 后端服务..."

# 进入后端目录
cd /var/www/backend

# 安装依赖
echo "安装依赖..."
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

# 配置 Nginx
echo "配置 Nginx..."
cp nginx.conf /etc/nginx/conf.d/i18n.conf

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# 配置防火墙
echo "配置防火墙..."
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 创建SSL证书目录
echo "创建SSL证书目录..."
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# 生成自签名SSL证书（生产环境请使用正式证书）
echo "生成SSL证书..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/frontendtool.top.key \
    -out /etc/ssl/certs/frontendtool.top.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=YourCompany/OU=IT/CN=frontendtool.top"

# 设置证书权限
chmod 600 /etc/ssl/private/frontendtool.top.key
chmod 644 /etc/ssl/certs/frontendtool.top.crt

echo "部署完成！"
echo "前端地址: https://frontendtool.top (推荐)"
echo "前端地址: http://59.110.136.229 (调试用)"
echo "API 地址: https://frontendtool.top/api"
echo ""
echo "注意："
echo "1. 域名访问会自动重定向到HTTPS"
echo "2. 当前使用自签名证书，浏览器会显示安全警告"
echo "3. 生产环境建议使用Let's Encrypt等正式SSL证书"

# 显示服务状态
echo "服务状态："
pm2 status
systemctl status nginx
