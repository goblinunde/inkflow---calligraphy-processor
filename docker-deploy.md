# InkFlow Docker 部署指南

## 📦 文件说明

- **Dockerfile**: 多阶段构建配置
- **docker-compose.yml**: 容器编排配置
- **nginx.conf**: Nginx 服务器配置
- **.dockerignore**: 构建忽略文件

---

## 🚀 快速部署

### 1. 构建镜像

```bash
docker-compose build
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 访问应用

浏览器打开: <http://localhost:8080>

### 4. 查看日志

```bash
docker-compose logs -f
```

### 5. 停止服务

```bash
docker-compose down
```

---

## 🔧 详细说明

### Dockerfile 架构

**Stage 1: Builder**

- 基础镜像: `node:18-alpine`
- 安装依赖
- 构建生产版本

**Stage 2: Production**

- 基础镜像: `nginx:alpine`
- 复制构建产物
- 配置 Nginx
- 轻量化部署

### 端口配置

默认端口映射: `8080:80`

修改端口:

```yaml
# docker-compose.yml
ports:
  - "你的端口:80"
```

### 环境变量

在 `docker-compose.yml` 中添加:

```yaml
environment:
  - NODE_ENV=production
  - VITE_API_URL=https://your-api.com
  - VITE_GEMINI_KEY=your-key
```

---

## 📋 常用命令

### 构建相关

```bash
# 强制重新构建
docker-compose build --no-cache

# 仅构建不启动
docker-compose build

# 查看构建历史
docker images inkflow-calligraphy
```

### 运行相关

```bash
# 后台运行
docker-compose up -d

# 前台运行（查看日志）
docker-compose up

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器+镜像
docker-compose down --rmi all
```

### 调试相关

```bash
# 进入容器
docker exec -it inkflow-calligraphy sh

# 查看实时日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100

# 检查容器状态
docker-compose ps

# 健康检查
docker inspect --format='{{json .State.Health}}' inkflow-calligraphy
```

---

## 🔍 故障排查

### 问题1: 构建失败

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 问题2: 端口被占用

```bash
# 检查端口占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/Mac

# 修改 docker-compose.yml 中的端口
```

### 问题3: 访问403/404

```bash
# 检查 nginx 配置
docker exec inkflow-calligraphy cat /etc/nginx/conf.d/default.conf

# 检查文件是否存在
docker exec inkflow-calligraphy ls -la /usr/share/nginx/html
```

### 问题4: 内存不足

```yaml
# 在 docker-compose.yml 中限制资源
services:
  inkflow:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 🌐 生产环境部署

### 1. 使用自定义域名

更新 `nginx.conf`:

```nginx
server_name your-domain.com www.your-domain.com;
```

### 2. 启用 HTTPS

```yaml
# docker-compose.yml
services:
  inkflow:
    ports:
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
```

更新 `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

### 3. 反向代理 (推荐)

使用 Nginx 或 Caddy 作为主反向代理:

```nginx
# 主 Nginx 配置
upstream inkflow {
    server localhost:8080;
}

server {
    listen 80;
    server_name inkflow.example.com;
    
    location / {
        proxy_pass http://inkflow;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 性能优化

### 1. 镜像大小优化

当前镜像大小: ~25MB (nginx:alpine)

### 2. 构建缓存

利用 Docker 层缓存:

```dockerfile
# 先复制 package.json
COPY package*.json ./
RUN npm ci

# 再复制源码
COPY . .
```

### 3. Gzip 压缩

已在 `nginx.conf` 中启用，压缩率 ~70%

---

## 🔒 安全建议

1. **定期更新基础镜像**

   ```bash
   docker pull node:18-alpine
   docker pull nginx:alpine
   docker-compose build --no-cache
   ```

2. **使用非 root 用户**（未来改进）

3. **限制资源使用**

   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

4. **配置防火墙**

   ```bash
   # 仅开放必要端口
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

---

## 📈 监控和日志

### 日志位置

```bash
# 容器日志
docker-compose logs inkflow

# Nginx 访问日志（如映射）
./logs/access.log

# Nginx 错误日志
./logs/error.log
```

### 健康检查

访问: <http://localhost:8080/health>

应返回: `healthy`

---

## 🎯 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker Image
        run: docker-compose build
      
      - name: Push to Registry
        run: |
          docker tag inkflow-calligraphy:latest your-registry/inkflow:latest
          docker push your-registry/inkflow:latest
      
      - name: Deploy to Server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

---

## 📝 备份和恢复

### 备份

```bash
# 导出镜像
docker save inkflow-calligraphy:latest > inkflow-backup.tar

# 备份配置
tar -czf inkflow-config.tar.gz nginx.conf docker-compose.yml
```

### 恢复

```bash
# 导入镜像
docker load < inkflow-backup.tar

# 恢复配置
tar -xzf inkflow-config.tar.gz

# 启动
docker-compose up -d
```

---

## ✅ 检查清单

部署前检查:

- [ ] 修改 `docker-compose.yml` 中的端口
- [ ] 更新 `nginx.conf` 中的 server_name
- [ ] 配置环境变量（如 API keys）
- [ ] 准备 SSL 证书（生产环境）
- [ ] 测试构建: `docker-compose build`
- [ ] 测试运行: `docker-compose up`
- [ ] 访问测试: <http://localhost:8080>
- [ ] 健康检查: <http://localhost:8080/health>

---

## 🆘 获取帮助

问题反馈:

- GitHub Issues
- Email: <support@inkflow.com>
- Documentation: ./doc/

---

**部署愉快！** 🎉
