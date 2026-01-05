# 服务器迁移指南

## 迁移概述

从旧服务器 `59.110.136.229` 迁移到新服务器 `223.6.250.152`

## 迁移步骤

### 1. DNS解析配置（最重要）

**必须首先完成此步骤，否则域名无法访问！**

1. 登录您的域名管理平台（如阿里云域名控制台）
2. 找到域名 `frontendtool.top` 的DNS解析设置
3. 修改A记录，将IP地址从 `59.110.136.229` 改为 `223.6.250.152`
4. 等待DNS解析生效（通常5-30分钟，最长48小时）

**验证DNS解析：**
```bash
# 在本地命令行执行
nslookup frontendtool.top
# 或
dig frontendtool.top
# 应该显示新IP: 223.6.250.152
```

### 2. SSL证书迁移

SSL证书文件需要从旧服务器复制到新服务器：

**在旧服务器上：**
```bash
# 备份证书文件
scp /etc/pki/tls/certs/frontendtool.top.pem root@223.6.250.152:/etc/pki/tls/certs/
scp /etc/pki/tls/certs/frontendtool.top.key root@223.6.250.152:/etc/pki/tls/certs/
```

**在新服务器上验证证书：**
```bash
# 检查证书文件是否存在
ls -la /etc/pki/tls/certs/frontendtool.top.*

# 验证证书权限（确保nginx可以读取）
chmod 644 /etc/pki/tls/certs/frontendtool.top.pem
chmod 600 /etc/pki/tls/certs/frontendtool.top.key
chown root:root /etc/pki/tls/certs/frontendtool.top.*
```

**如果证书已过期或丢失：**
- 需要重新申请SSL证书（Let's Encrypt或阿里云SSL证书）
- 或使用旧服务器上的证书备份

### 3. 服务器环境准备

**在新服务器上安装必要软件：**

```bash
# 更新系统
yum update -y  # CentOS/RHEL
# 或
apt update && apt upgrade -y  # Ubuntu/Debian

# 安装Node.js和npm（如果未安装）
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx
yum install -y nginx  # CentOS/RHEL
# 或
apt install -y nginx  # Ubuntu/Debian

# 安装MongoDB（如果使用本地MongoDB）
# 参考MongoDB官方安装文档
```

### 4. 部署应用代码

**上传代码到新服务器：**

```bash
# 方式1: 使用scp从旧服务器复制
scp -r /var/www/backend root@223.6.250.152:/var/www/
scp -r /var/www/frontend root@223.6.250.152:/var/www/

# 方式2: 使用rsync（推荐，支持断点续传）
rsync -avz --progress /var/www/backend root@223.6.250.152:/var/www/
rsync -avz --progress /var/www/frontend root@223.6.250.152:/var/www/
```

**或从本地重新部署：**
```bash
# 在本地项目目录
scp -r backend/express-mongoDB root@223.6.250.152:/var/www/backend
scp -r frontend/vite-vue3-ts/dist root@223.6.250.152:/var/www/frontend/dist
```

### 5. 配置Nginx

**在新服务器上：**

```bash
# 复制nginx配置文件
cp /var/www/backend/nginx.conf /etc/nginx/conf.d/i18n.conf

# 测试nginx配置
nginx -t

# 如果测试通过，重启nginx
systemctl restart nginx

# 设置nginx开机自启
systemctl enable nginx
```

**验证nginx配置：**
```bash
# 检查nginx状态
systemctl status nginx

# 查看nginx错误日志
tail -f /var/log/nginx/error.log

# 查看nginx访问日志
tail -f /var/log/nginx/access.log
```

### 6. 配置防火墙

**开放必要端口：**

```bash
# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# 或 Ubuntu/Debian (ufw)
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# 验证端口是否开放
netstat -tlnp | grep -E ':(80|443)'
```

### 7. 启动后端服务

**在新服务器上：**

```bash
# 进入后端目录
cd /var/www/backend

# 安装依赖
npm install

# 创建环境配置文件（如果还没有）
cp env.example .env
# 编辑.env文件，配置数据库连接等信息

# 编译TypeScript
npm run build

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启

# 查看服务状态
pm2 status
pm2 logs i18n-backend
```

### 8. 数据库迁移（如果使用远程数据库可跳过）

**如果MongoDB也在本地：**

```bash
# 在旧服务器上备份数据库
mongodump --uri="mongodb://i18n_user:i18n_password_123@localhost:27017/i18n_project" --out=/tmp/mongodb_backup

# 将备份传输到新服务器
scp -r /tmp/mongodb_backup root@223.6.250.152:/tmp/

# 在新服务器上恢复数据库
mongorestore --uri="mongodb://i18n_user:i18n_password_123@localhost:27017/i18n_project" /tmp/mongodb_backup/i18n_project
```

### 9. 验证服务

**检查各项服务：**

```bash
# 1. 检查后端服务
curl http://localhost:3000/health

# 2. 检查nginx
curl -I http://localhost
curl -I https://localhost

# 3. 检查域名解析（从外部）
curl -I https://frontendtool.top

# 4. 检查API接口
curl https://frontendtool.top/api/health
```

### 10. 常见问题排查

#### 问题1: 域名无法访问
- **检查DNS解析**：`nslookup frontendtool.top` 应该返回新IP
- **检查防火墙**：确保80和443端口已开放
- **检查nginx状态**：`systemctl status nginx`

#### 问题2: SSL证书错误
- **检查证书文件**：确保证书文件已正确复制到新服务器
- **检查证书权限**：nginx用户需要读取权限
- **检查证书路径**：确认nginx.conf中的证书路径正确

#### 问题3: 502 Bad Gateway
- **检查后端服务**：`pm2 status` 确认服务正在运行
- **检查端口**：确认后端服务监听在3000端口
- **检查nginx代理**：确认nginx配置中的proxy_pass正确

#### 问题4: CORS错误
- **检查server.ts**：确认CORS配置包含新IP地址
- **重启后端服务**：`pm2 restart i18n-backend`

#### 问题5: 静态资源404
- **检查前端文件**：确认 `/var/www/frontend/dist` 目录存在
- **检查文件权限**：nginx用户需要读取权限
- **重新构建前端**：如果文件缺失，需要重新构建

### 11. 回滚方案（如果迁移失败）

如果需要回滚到旧服务器：

1. **恢复DNS解析**：将A记录改回 `59.110.136.229`
2. **等待DNS生效**：通常5-30分钟
3. **检查旧服务器服务**：确保旧服务器上的服务仍在运行

### 12. 迁移后清理

迁移成功并验证无误后：

1. **停止旧服务器上的服务**（可选，节省资源）
2. **备份旧服务器数据**（建议保留一段时间）
3. **更新文档**：更新所有相关文档中的IP地址

## 快速检查清单

- [ ] DNS解析已更新到新IP
- [ ] SSL证书已复制到新服务器
- [ ] 应用代码已部署到新服务器
- [ ] Nginx配置已更新并重启
- [ ] 防火墙端口已开放
- [ ] 后端服务已启动（PM2）
- [ ] 数据库已迁移（如适用）
- [ ] 域名可以正常访问
- [ ] HTTPS可以正常访问
- [ ] API接口可以正常访问

## 联系支持

如果遇到问题，请检查：
1. 服务器日志：`/var/log/nginx/error.log`
2. 应用日志：`pm2 logs i18n-backend`
3. 系统日志：`journalctl -u nginx`

