# InkFlow 部署安装指南（中文版）

## 📋 目录

1. [系统要求](#系统要求)
2. [本地开发部署](#本地开发部署)
3. [Linux服务器部署](#linux服务器部署)
4. [Docker容器部署](#docker容器部署)
5. [故障排查](#故障排查)

---

## 系统要求

### 基础要求

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **内存**: 最低 2GB RAM
- **磁盘空间**: 最低 500MB

### 浏览器支持

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

---

## 本地开发部署

### Windows 系统

#### 1. 安装 Node.js

访问 [Node.js官网](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装：

```powershell
node --version
npm --version
```

#### 2. 克隆项目

```powershell
# 使用 Git
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor

# 或解压下载的 ZIP 文件
```

#### 3. 安装依赖

```powershell
npm install
```

#### 4. 启动开发服务器

```powershell
npm run dev
```

#### 5. 访问应用

打开浏览器访问：`http://localhost:5173`

#### 6. 构建生产版本

```powershell
npm run build
```

构建产物位于 `dist/` 目录。

---

### macOS 系统

#### 1. 安装 Homebrew（如未安装）

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. 安装 Node.js

```bash
brew install node@18
```

验证安装：

```bash
node --version
npm --version
```

#### 3. 克隆项目

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 4. 安装依赖

```bash
npm install
```

#### 5. 启动开发服务器

```bash
npm run dev
```

#### 6. 访问应用

打开浏览器访问：`http://localhost:5173`

---

### Linux 系统（Ubuntu/Debian）

#### 1. 更新系统

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. 安装 Node.js

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 3. 克隆项目

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 4. 安装依赖

```bash
npm install
```

#### 5. 启动开发服务器

```bash
npm run dev
```

#### 6. 访问应用

打开浏览器访问：`http://localhost:5173`

---

## Linux服务器部署

### 方案一：使用 Nginx + PM2（推荐）

#### 1. 准备服务器

```bash
# 连接到服务器
ssh user@your-server-ip

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y git curl build-essential
```

#### 2. 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. 安装 PM2

```bash
sudo npm install -g pm2
```

#### 4. 克隆并构建项目

```bash
# 创建应用目录
sudo mkdir -p /var/www
cd /var/www

# 克隆项目
sudo git clone https://github.com/your-repo/inkflow.git
cd inkflow

# 设置权限
sudo chown -R $USER:$USER /var/www/inkflow

# 安装依赖
npm install

# 构建生产版本
npm run build
```

#### 5. 安装配置 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/inkflow
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/inkflow/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss image/svg+xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

保存并退出（Ctrl+X, Y, Enter）。

#### 6. 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/inkflow /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 7. 配置防火墙

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 8. 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

#### 9. 设置自动更新（可选）

创建更新脚本：

```bash
nano /var/www/inkflow/update.sh
```

添加内容：

```bash
#!/bin/bash
cd /var/www/inkflow
git pull
npm install
npm run build
sudo systemctl reload nginx
echo "InkFlow updated successfully at $(date)"
```

设置权限并添加到 crontab：

```bash
chmod +x /var/www/inkflow/update.sh

# 每天凌晨2点自动更新
crontab -e
# 添加：0 2 * * * /var/www/inkflow/update.sh >> /var/log/inkflow-update.log 2>&1
```

---

### 方案二：使用 Serve（简单快速）

```bash
# 安装 serve
sudo npm install -g serve

# 构建项目
npm run build

# 启动服务（端口 3000）
serve -s dist -l 3000

# 使用 PM2 保持运行
pm2 start "serve -s dist -l 3000" --name inkflow
pm2 save
pm2 startup
```

---

## Docker容器部署

### 前置条件

#### 安装 Docker

**Ubuntu/Debian:**

```bash
# 卸载旧版本
sudo apt-get remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 验证安装
sudo docker --version
sudo docker compose version
```

**CentOS/RHEL:**

```bash
# 安装依赖
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
sudo docker --version
```

**Windows:**
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**macOS:**
下载并安装 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

---

### 快速部署

#### 1. 克隆项目

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 2. 构建镜像

```bash
docker compose build
```

#### 3. 启动容器

```bash
docker compose up -d
```

#### 4. 查看状态

```bash
docker compose ps
```

#### 5. 访问应用

打开浏览器访问：`http://localhost:8080`

---

### 生产环境部署

#### 1. 自定义配置

编辑 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  inkflow:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: inkflow-prod
    restart: always
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    networks:
      - inkflow-network
    volumes:
      - ./logs:/var/log/nginx
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

networks:
  inkflow-network:
    driver: bridge
```

#### 2. 使用环境变量

创建 `.env` 文件：

```env
# 端口配置
PORT=8080

# 环境
NODE_ENV=production

# Gemini API（可选）
VITE_GEMINI_API_KEY=your-api-key-here
```

#### 3. 启用 HTTPS

创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  inkflow:
    build: .
    container_name: inkflow-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx-https.conf:/etc/nginx/conf.d/default.conf
    networks:
      - inkflow-network

networks:
  inkflow-network:
    driver: bridge
```

创建 `nginx-https.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    # ... 其他配置同 nginx.conf
}
```

启动：

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

### Docker 常用命令

#### 容器管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 查看日志
docker compose logs -f

# 查看实时日志（最近100行）
docker compose logs --tail=100 -f

# 进入容器
docker exec -it inkflow-calligraphy sh

# 查看容器状态
docker compose ps
```

#### 镜像管理

```bash
# 构建镜像
docker compose build

# 强制重新构建（无缓存）
docker compose build --no-cache

# 查看镜像
docker images

# 删除镜像
docker rmi inkflow-calligraphy-processor-inkflow

# 清理未使用的镜像
docker image prune -a
```

#### 系统维护

```bash
# 查看磁盘使用
docker system df

# 清理系统（删除未使用资源）
docker system prune -a

# 查看容器资源使用
docker stats
```

---

## 故障排查

### 常见问题

#### 1. 端口被占用

**症状**: `Error: listen EADDRINUSE: address already in use :::5173`

**解决方案**:

**Windows**:

```powershell
# 查找占用端口的进程
netstat -ano | findstr :5173

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

**Linux/macOS**:

```bash
# 查找占用端口的进程
lsof -i :5173

# 结束进程
kill -9 <PID>
```

#### 2. npm install 失败

**症状**: 依赖安装出错

**解决方案**:

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 3. 构建失败

**症状**: `npm run build` 报错

**解决方案**:

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.x

# 清除构建缓存
rm -rf dist .vite

# 重新构建
npm run build
```

#### 4. Docker 容器无法访问

**症状**: `http://localhost:8080` 无法打开

**解决方案**:

```bash
# 检查容器状态
docker compose ps

# 查看日志
docker compose logs

# 检查端口映射
docker port inkflow-calligraphy

# 重启容器
docker compose restart
```

#### 5. Nginx 403 错误

**症状**: 访问显示 403 Forbidden

**解决方案**:

```bash
# 检查文件权限
ls -la /var/www/inkflow/dist

# 修复权限
sudo chown -R www-data:www-data /var/www/inkflow/dist
sudo chmod -R 755 /var/www/inkflow/dist

# 检查 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 6. 内存不足

**症状**: 构建或运行时内存溢出

**解决方案**:

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Docker 限制资源
# 在 docker-compose.yml 中添加：
deploy:
  resources:
    limits:
      memory: 1G
```

---

## 性能优化建议

### 1. 启用 Gzip 压缩

已在 `nginx.conf` 中配置，压缩率约 70%。

### 2. 启用浏览器缓存

静态资源缓存 1 年：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN 加速

将 `dist/` 目录部署到 CDN（如 Cloudflare, AWS S3）。

### 4. 服务器优化

```bash
# 增加文件描述符限制
ulimit -n 65535

# Nginx 工作进程数
# 在 nginx.conf 中：
worker_processes auto;
```

---

## 监控和维护

### 日志管理

```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# Docker 日志
docker compose logs -f --tail=100

# 系统日志
journalctl -u nginx -f
```

### 自动备份

创建备份脚本：

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/inkflow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /etc/nginx/sites-available/inkflow \
    /var/www/inkflow/docker-compose.yml

# 保留最近7天的备份
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +7 -delete

echo "Backup completed at $DATE"
```

添加到 crontab：

```bash
0 3 * * * /backup/backup.sh >> /var/log/inkflow-backup.log 2>&1
```

---

## 安全建议

### 1. 防火墙配置

```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 定期更新

```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# Docker 镜像更新
docker pull nginx:alpine
docker compose build --no-cache
docker compose up -d
```

### 3. SSL/TLS 配置

使用 Let's Encrypt 免费证书（已在上文说明）。

---

## 总结

三种部署方式对比：

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 本地开发 | 简单快速 | 仅限开发 | 开发测试 |
| Linux+Nginx | 灵活可控 | 配置复杂 | 生产环境 |
| Docker | 一致性好 | 资源占用 | 快速部署 |

**推荐方案**:

- **开发**: 本地 npm run dev
- **生产**: Docker + Nginx 反向代理
- **小型项目**: Linux + Nginx + PM2

---

**部署愉快！如有问题，请查阅完整文档或提交 Issue。** 🚀
