# InkFlow 书法处理工作台

墨韵流转 - 专业的书法作品数字化处理工作台

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 访问
http://localhost:8080
```

详细部署文档: [docker-deploy.md](./docker-deploy.md)

## 📖 项目文档

完整文档位于 `./doc/` 目录:

- [文档目录](./doc/init.md)
- [项目简介](./doc/01-overview.md)
- [系统架构](./doc/02-architecture.md)
- [组件详解](./doc/03-components-app.md)

## ✨ 核心功能

- 🎨 **双模式处理**: 墨迹模式 / 照片模式
- 🖼️ **水印系统**: 图片水印 + 文字水印
- 🤖 **AI修复**: Google Gemini 智能增强
- 📐 **网格对齐**: 精确定位辅助
- ⚡ **快捷键**: 7个高效快捷键
- 💾 **多格式导出**: PNG/JPEG/WebP/SVG
- 🎯 **预设系统**: 4个内置 + 自定义

## 🛠️ 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Canvas API
- Google Gemini AI

## 📦 Docker 部署

### 快速命令

```bash
# 构建
docker-compose build

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 配置文件

- `Dockerfile` - 多阶段构建
- `docker-compose.yml` - 容器编排
- `nginx.conf` - Web服务器配置

## 🔧 开发脚本

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 📝 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**InkFlow Team** © 2026
