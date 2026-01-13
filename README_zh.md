<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# InkFlow 书法处理工作台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF)](https://vitejs.dev/)

InkFlow 是一个专业的 Web 端书法图像处理工具，专为书法爱好者和设计师打造。它不仅能将纸质书法作品转化为高质量的数字资产（去背、矢量化预处理），还提供了类似照片后期的修图模式。

## ✨ 核心功能

### 🖌️ 水墨模式 (Ink Mode) - 默认

专注于书法作品的数字化提取。

- **背景移除**: 智能阈值算法，一键去除纸张纹理。
- **自适应阈值**: 完美处理光照不均匀的拍摄图片。
- **笔触增强**:
  - **加粗/细化**: 模拟积墨效果或瘦金体风格。
  - **边缘平滑**: 消除数字锯齿。
  - **边缘增强**: 修复断墨飞白。

### 📸 照片模式 (Photo Mode)

像修图软件一样处理您的书法照片，保留纸张质感。

- **保留背景**: 不强制去背，保留作品原貌。
- **黑白转换**: 一键将彩色照片转为黑白（通过 Saturation -100）。
- **色彩调整**: 亮度 (Brightness)、饱和度 (Saturation)、对比度 (Contrast)。

### 🧠 AI 智能修复

- 集成 Google Gemini AI，智能补全缺失笔画，修复残缺字迹（需配置 API Key）。

### 🎨 全新 UI 设计

- **毛玻璃效果 (Glassmorphism)**: 现代、深邃的视觉体验。
- **沉浸式交互**: 实时预览处理结果。

## 🛠️ 技术栈

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS (with Glassmorphism)
- **Image Processing**: Canvas API (Pixel manipulation), Custom Algorithms
- **AI Integration**: Google Generative AI SDK

## 🚀 快速开始 (本地部署)

### 前置要求

- [Node.js](https://nodejs.org/) (v18+)

### 安装步骤

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd inkflow---calligraphy-processor
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置 AI 功能 (可选)**
   如需使用 AI 修复，请在 `.env.local` 中配置 API Key：

   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **启动应用**

   ```bash
   npm run dev
   ```

5. **访问**
   打开浏览器访问: **`http://localhost:9999`**

## 📖 使用指南

### 基础操作

1. **上传**: 拖拽图片到主区域或点击 "Upload New"。
2. **下载**: 满意后点击右上角 "Download PNG"。

### 进阶技巧

- **拍摄光线不均？**
  切换到 **Ink Mode**，开启 **Adaptive Threshold** 开关。
- **想要黑白照片？**
  切换到 **Photo Mode**，将 **Saturation** 滑块拉至底部 (-100)。
- **字迹模糊？**
  适量增加 **Sharpness** (约 30) 和 **Contrast**。

## 📅 未来规划 (Roadmap)

我们正在探索以下功能，欢迎反馈：

- [ ] 🔴 **印章提取**: 专门提取红色印章。
- [ ] ⚫ **拓片模式**: 一键反选颜色（黑底白字）。
- [ ] 📐 **矢量导出**: 导出 SVG 格式供设计使用。
- [ ] ✂️ **裁剪旋转**: 基础几何变换。

---

<div align="center">
Made with ❤️ for Calligraphy
</div>
