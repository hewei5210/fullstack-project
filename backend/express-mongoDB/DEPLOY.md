# 阿里云服务器部署说明

## 文件说明

- `ecosystem.config.js` - PM2 配置文件
- `nginx.conf` - Nginx 配置文件
- `deploy.sh` - 自动部署脚本
- `env.example` - 环境变量配置模板

## 部署步骤

### 1. 上传文件到服务器

将整个 `backend/express-mongoDB` 文件夹上传到服务器的 `/var/www/backend/`

### 2. 执行部署脚本

```bash
# 连接到服务器
ssh root@59.110.136.229

# 进入后端目录
cd /var/www/backend

# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署脚本
./deploy.sh
```

### 3. 手动部署（如果脚本有问题）

```bash
# 安装依赖
npm install

# 创建环境配置文件
cp env.example .env

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 配置 Nginx
cp nginx.conf /etc/nginx/conf.d/i18n.conf
nginx -t
systemctl restart nginx

# 配置防火墙
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

## 访问地址

- 前端应用: http://59.110.136.229
- API 接口: http://59.110.136.229/api

## 常用命令

```bash
# 查看后端状态
pm2 status
pm2 logs i18n-backend

# 重启后端
pm2 restart i18n-backend

# 查看 Nginx 状态
systemctl status nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 注意事项

1. 确保 MongoDB 容器正在运行
2. 确保端口 3000 没有被其他服务占用
3. 确保 Nginx 有权限访问前端文件
4. 根据实际情况修改 `.env` 文件中的配置
