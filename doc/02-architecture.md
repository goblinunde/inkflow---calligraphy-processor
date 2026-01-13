# 系统架构

## 整体架构

InkFlow 采用经典的 MVC 架构模式，结合 React 的组件化设计。

```
┌─────────────────────────────────────────┐
│              用户界面层                    │
│   ┌─────────┐  ┌──────────┐  ┌────────┐│
│   │ Sidebar │  │MainCanvas│  │ Header ││
│   └─────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
                  ↓ Props ↑ Events
┌─────────────────────────────────────────┐
│           应用状态层 (App.tsx)            │
│  ┌─────────────────────────────────┐   │
│  │ State:                          │   │
│  │ - originalImage                 │   │
│  │ - processedImage                │   │
│  │ - settings                      │   │
│  │ - watermarks                    │   │
│  │ - history                       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  ↓ Calls
┌─────────────────────────────────────────┐
│              服务层                       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │Processor │  │ Gemini   │  │Presets ││
│  │ Service  │  │ Service  │  │Service ││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          底层API/存储                     │
│  Canvas API | LocalStorage | Gemini AI │
└─────────────────────────────────────────┘
```

---

## 数据流

### 1. 图像上传流程

```
User Upload
    ↓
handleFileUpload()
    ↓
FileReader.readAsDataURL()
    ↓
setOriginalImage(dataURL)
    ↓
Trigger Processing
    ↓
displayProcessedImage
```

### 2. 图像处理流程

```
原始图像 (originalImage)
    ↓
读取到Canvas
    ↓
getImageData()
    ↓
━━━━━━━━━━━━━━━━━━━
    ↓
processor.processImage(imageData, settings)
    ↓
应用各种算法:
  - 颜色调整
  - 二值化
  - 去噪
  - 锐化
  - 形态学操作
    ↓
━━━━━━━━━━━━━━━━━━━
    ↓
putImageData()
    ↓
toDataURL()
    ↓
setProcessedImage(result)
```

### 3. 参数变化流程

```
User 调整 Slider
    ↓
handleSettingsChange(key, value)
    ↓
setSettings(newSettings)
    ↓
useEffect 监听 settings
    ↓
触发 runProcessing()
    ↓
防抖 150ms
    ↓
重新处理图像
```

### 4. 水印添加流程

```
User 点击添加水印
    ↓
handleAddTextWatermark() / handleImageWatermarkUpload()
    ↓
创建 Watermark 对象
    ↓
setWatermarks([...watermarks, newWatermark])
    ↓
WatermarkOverlay 渲染
    ↓
用户交互 (拖拽/旋转/调整)
    ↓
handleUpdateWatermark()
    ↓
更新 watermarks 数组
```

---

## 组件层次

```
App
├── Header
│   ├── Logo
│   ├── Language Selector
│   ├── Help Button
│   └── Download Button
├── Sidebar
│   ├── Mode Selector
│   ├── Adjustments
│   │   ├── Brightness Slider
│   │   ├── Saturation Slider
│   │   └── Contrast Slider
│   ├── Color Presets
│   ├── Ink Controls (conditional)
│   │   ├── Threshold Slider
│   │   ├── Strength Slider
│   │   └── Toggles
│   ├── Watermarks
│   │   ├── Selected Watermark Editor
│   │   ├── Image Upload
│   │   └── Text Creator
│   ├── Grid Controls
│   └── Background Settings
└── MainCanvas
    ├── Image Display
    │   ├── Original Preview
    │   └── Processed Preview
    ├── WatermarkOverlay
    │   ├── Grid SVG (conditional)
    │   └── Watermark Items
    │       ├── Image Watermarks
    │       └── Text Watermarks
    └── Texture Overlay (conditional)
```

---

## 状态管理

### 核心状态 (App.tsx)

```typescript
// 图像状态
const [originalImage, setOriginalImage] = useState<string | null>(null);
const [processedImage, setProcessedImage] = useState<string | null>(null);
const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });

// 处理设置
const [settings, setSettings] = useState<ProcessSettings>({...});

// 水印状态
const [watermarks, setWatermarks] = useState<Watermark[]>([]);
const [selectedWatermarkId, setSelectedWatermarkId] = useState<string | null>(null);

// 历史管理
const { pushState, undo, redo, canUndo, canRedo } = useHistory(settings, watermarks);

// 网格设置
const [gridEnabled, setGridEnabled] = useState(false);
const [gridSize, setGridSize] = useState(50);
const [snapEnabled, setSnapEnabled] = useState(true);
```

### 状态同步机制

```typescript
// 自动处理
useEffect(() => {
  if (originalImage) {
    runProcessing();
  }
}, [originalImage, settings]);

// 防抖处理
useEffect(() => {
  const timeoutId = setTimeout(() => {
    runProcessing();
  }, 150);
  return () => clearTimeout(timeoutId);
}, [runProcessing]);

// 历史追踪
useEffect(() => {
  if (originalImage) {
    pushState(settings, watermarks);
  }
}, [settings, watermarks]);
```

---

## 服务层架构

### Processor Service

```typescript
// 核心处理函数
export async function processImage(
  imageData: ImageData,
  settings: ProcessSettings
): Promise<ImageData>

// 处理流程:
1. 色彩调整 (brightness, saturation, contrast)
2. 墨迹模式处理:
   a. 灰度转换
   b. 去噪 (denoising)
   c. 二值化 (thresholding)
   d. 形态学操作 (morphology)
   e. 边缘增强 (edge enhancement)
3. 照片模式处理:
   a. 保留色彩
   b. 锐化处理
4. 返回处理结果
```

### Gemini AI Service

```typescript
// AI修复
export async function restoreImageWithAI(
  imageDataUrl: string
): Promise<string>

// 流程:
1. 初始化 Gemini API
2. 发送图像 + Prompt
3. 接收修复结果
4. 返回修复图像
```

### Presets Service

```typescript
// 预设管理
export const builtInPresets: Preset[]
export function loadUserPresets(): Preset[]
export function saveUserPresets(presets: Preset[]): void
export function addPreset(preset): Preset
export function deletePreset(id: string): void
```

---

## 自定义Hooks

### useHistory

```typescript
// 历史管理
interface HistoryState {
  settings: ProcessSettings;
  watermarks: Watermark[];
}

// 功能:
- 保存最近20步历史
- pushState() - 添加新状态
- undo() - 撤销
- redo() - 重做
- canUndo/canRedo - 状态标志
```

### useKeyboardShortcuts

```typescript
// 快捷键绑定
interface KeyboardShortcuts {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onCopy?: () => void;
}

// 实现:
- 监听 keydown 事件
- 防止默认行为
- 调用回调函数
```

---

## 性能优化策略

### 1. 防抖处理

```typescript
// 参数调整防抖
const timeoutId = setTimeout(() => {
  runProcessing();
}, 150);
```

### 2. Canvas 优化

- 复用 Canvas 元素
- 减少 getImageData 调用
- 异步处理大图

### 3. 状态更新优化

- 最小化重渲染
- 使用 useCallback
- 条件渲染

---

## 安全性考虑

### 1. 文件上传验证

```typescript
const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
if (!validTypes.includes(file.type)) {
  // 拒绝
}
```

### 2. 数据隔离

- 用户数据仅存本地
- 无服务器上传
- LocalStorage 限制

---

## 扩展性设计

### 1. 插件化预设

- 易于添加新预设
- JSON 导入/导出
- 用户自定义

### 2. 服务解耦

- 处理算法独立
- AI 服务可替换
- 存储策略可切换

### 3. 组件化 UI

- 独立可复用组件
- Props 接口清晰
- 易于主题定制

---

下一步: [App 主应用 →](./03-components-app.md)
