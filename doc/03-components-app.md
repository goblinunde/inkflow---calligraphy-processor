# App 主应用组件

## 概述

`App.tsx` 是 InkFlow 的核心组件，负责：

- 全局状态管理
- 组件协调
- 业务逻辑实现
- 生命周期管理

**文件**: `src/App.tsx`

---

## 核心职责

### 1. 状态管理中枢

```typescript
export default function App() {
  // 语言设置
  const [lang, setLang] = useState<Language>('zh');
  
  // 图像数据
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState({ width: 0, height: 0 });
  
  // 处理状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // 处理设置
  const [settings, setSettings] = useState<ProcessSettings>({
    threshold: 180,
    strength: 1,
    contrast: 0,
    // ... 更多参数
  });
  
  // 水印系统
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [selectedWatermarkId, setSelectedWatermarkId] = useState<string | null>(null);
  
  // 网格对齐
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [snapEnabled, setSnapEnabled] = useState(true);
  
  // 预设系统
  const [userPresets, setUserPresets] = useState<Preset[]>([]);
}
```

---

## 关键功能实现

### 1. 图像上传处理

```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 保存原始尺寸
        setOriginalDims({ 
          width: img.width, 
          height: img.height 
        });
        
        // 设置原始图像
        setOriginalImage(event.target?.result as string);
        
        // 初始化输出尺寸
        setSettings(prev => ({
          ...prev,
          outputWidth: img.width,
          outputHeight: img.height,
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};
```

**流程**:

1. 读取文件
2. 转换为 DataURL
3. 创建 Image 对象
4. 获取尺寸信息
5. 更新状态触发处理

---

### 2. 图像处理核心

```typescript
const runProcessing = useCallback(async () => {
  if (!originalImage) return;
  
  setIsProcessing(true);
  setError(null);
  
  try {
    // 创建临时 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 加载原始图像
    const img = new Image();
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // 调用处理服务
      const processed = await processImage(imageData, settings);
      
      // 写回 Canvas
      ctx.putImageData(processed, 0, 0);
      
      // 转换为 DataURL
      setProcessedImage(canvas.toDataURL('image/png'));
    };
    
    img.src = originalImage;
  } catch (err) {
    setError(err.message);
  } finally {
    setIsProcessing(false);
  }
}, [originalImage, settings]);
```

**关键点**:

- 使用 `useCallback` 避免重复创建
- 异步处理大图
- 错误处理
- Loading 状态管理

---

### 3. 防抖优化

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    runProcessing();
  }, 150); // 150ms 防抖
  
  return () => clearTimeout(timeoutId);
}, [runProcessing]);
```

**作用**:

- 避免频繁处理
- 提升性能
- 改善用户体验

---

### 4. 水印管理

#### 添加图片水印

```typescript
const handleImageWatermarkUpload = (file: File) => {
  // 验证是否已上传原图
  if (!originalImage) {
    setUploadStatus({
      type: 'error',
      message: '请先上传书法作品图片'
    });
    return;
  }
  
  // 验证文件类型
  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    setUploadStatus({
      type: 'error',
      message: '仅支持 PNG, JPEG, SVG 格式'
    });
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // 创建水印对象
      const newWatermark: ImageWatermark = {
        id: Date.now().toString(),
        type: WatermarkType.IMAGE,
        src: e.target?.result as string,
        x: originalDims.width / 2 - baseSize / 2,  // 居中
        y: originalDims.height / 2 - baseSize / 2,
        width: baseSize,
        height: baseSize / ratio,
        rotation: 0,
        opacity: 100,
        format: file.type.split('/')[1] as 'png' | 'jpeg' | 'svg'
      };
      
      setWatermarks(prev => [...prev, newWatermark]);
      setUploadStatus({
        type: 'success',
        message: '水印上传成功'
      });
    };
    img.src = e.target?.result as string;
  };
  
  // SVG 特殊处理
  if (file.type === 'image/svg+xml') {
    reader.readAsText(file);
  } else {
    reader.readAsDataURL(file);
  }
};
```

#### 添加文字水印

```typescript
const handleAddTextWatermark = (
  text: string,
  fontSize: number,
  fontFamily: string,
  color: string
) => {
  const newWatermark: TextWatermark = {
    id: Date.now().toString(),
    type: WatermarkType.TEXT,
    text,
    fontSize,
    fontFamily,
    color,
    x: originalDims.width / 2,  // 居中
    y: originalDims.height / 2,
    rotation: 0,
    opacity: 100
  };
  
  setWatermarks(prev => [...prev, newWatermark]);
};
```

#### 更新水印

```typescript
const handleUpdateWatermark = (id: string, changes: Partial<Watermark>) => {
  setWatermarks(prev =>
    prev.map(w => w.id === id ? { ...w, ...changes } : w)
  );
};
```

#### 删除水印

```typescript
const handleRemoveWatermark = (id: string) => {
  setWatermarks(prev => prev.filter(w => w.id !== id));
  if (selectedWatermarkId === id) {
    setSelectedWatermarkId(null);
  }
};
```

---

### 5. 预设系统

```typescript
// 应用预设
const handleApplyPreset = (preset: Preset) => {
  console.log('Applying preset:', preset.name);
  setSettings(preset.settings);
};

// 保存预设
const handleSavePreset = (name: string, description: string) => {
  const newPreset = addPreset({
    name,
    nameEn: name,
    description,
    descriptionEn: description,
    settings: { ...settings }
  });
  setUserPresets(loadUserPresets());
  console.log('Preset saved:', name);
};

// 删除预设
const handleDeletePreset = (id: string) => {
  deletePreset(id);
  setUserPresets(loadUserPresets());
};
```

---

### 6. 色彩预设

```typescript
const handleApplyColorPreset = (presetId: string) => {
  const { colorPresets } = require('./services/colorPresets');
  const preset = colorPresets.find((p: any) => p.id === presetId);
  
  if (preset) {
    console.log('Applying color preset:', preset.name);
    const newSettings = applyColorPreset(preset, settings);
    setSettings(newSettings);
    // 图像自动重新处理（通过 useEffect）
  } else {
    console.error('Color preset not found:', presetId);
  }
};
```

---

### 7. 历史管理集成

```typescript
// 导入 Hook
const { pushState, undo, redo, canUndo, canRedo } = useHistory(settings, watermarks);

// 自动追踪状态
useEffect(() => {
  if (originalImage) {
    pushState(settings, watermarks);
  }
}, [settings, watermarks]);

// 快捷键绑定
useKeyboardShortcuts({
  onUndo: () => {
    const prevState = undo();
    if (prevState) {
      setSettings(prevState.settings);
      setWatermarks(prevState.watermarks);
      setSelectedWatermarkId(null);
    }
  },
  onRedo: () => {
    const nextState = redo();
    if (nextState) {
      setSettings(nextState.settings);
      setWatermarks(nextState.watermarks);
      setSelectedWatermarkId(null);
    }
  },
  // ... 其他快捷键
});
```

---

### 8. 导出功能

```typescript
const handleDownload = () => {
  if (!processedImage) return;
  
  // 创建导出 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = settings.outputWidth;
  canvas.height = settings.outputHeight;
  
  // 绘制背景
  if (settings.backgroundColor !== 'transparent') {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 绘制处理后的图像
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 绘制水印
    watermarks.forEach(watermark => {
      if (watermark.type === WatermarkType.IMAGE) {
        // 图片水印
        const wmImg = new Image();
        wmImg.onload = () => {
          ctx.save();
          ctx.globalAlpha = watermark.opacity / 100;
          ctx.translate(watermark.x, watermark.y);
          ctx.rotate(watermark.rotation * Math.PI / 180);
          ctx.drawImage(wmImg, -watermark.width / 2, -watermark.height / 2, 
                       watermark.width, watermark.height);
          ctx.restore();
        };
        wmImg.src = watermark.src;
      } else {
        // 文字水印
        ctx.save();
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.translate(watermark.x, watermark.y);
        ctx.rotate(watermark.rotation * Math.PI / 180);
        ctx.font = `${watermark.fontSize}px "${watermark.fontFamily}"`;
        ctx.fillStyle = watermark.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(watermark.text, 0, 0);
        ctx.restore();
      }
    });
    
    // 根据格式导出
    const filename = `inkflow-${settings.outputWidth}x${settings.outputHeight}`;
    
    if (exportFormat === 'svg') {
      // SVG 导出
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const svgString = vectorizer.toSVG(imageData);
      // ... 下载 SVG
    } else if (exportFormat === 'jpeg') {
      // JPEG 导出
      canvas.toBlob((blob) => {
        // ... 下载 JPEG
      }, 'image/jpeg', jpegQuality / 100);
    } else if (exportFormat === 'webp') {
      // WebP 导出
      canvas.toBlob((blob) => {
        // ... 下载 WebP
      }, 'image/webp', 0.9);
    } else {
      // PNG 导出
      canvas.toBlob((blob) => {
        // ... 下载 PNG
      }, 'image/png');
    }
  };
  
  img.src = processedImage;
};
```

---

## 组件渲染结构

```typescript
return (
  <div className="flex h-screen flex-col">
    {/* Header */}
    <header>
      {/* Logo, Language, Help, Download */}
    </header>
    
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        settings={settings}
        watermarks={watermarks}
        selectedWatermarkId={selectedWatermarkId}
        onUpdateWatermark={handleUpdateWatermark}
        gridEnabled={gridEnabled}
        // ... 所有 props
      />
      
      {/* Main Canvas */}
      <MainCanvas
        originalImage={originalImage}
        processedImage={processedImage}
        watermarks={watermarks}
        selectedWatermarkId={selectedWatermarkId}
        onSelectWatermark={setSelectedWatermarkId}
        gridEnabled={gridEnabled}
        gridSize={gridSize}
        snapEnabled={snapEnabled}
        // ... 其他 props
      />
    </div>
    
    {/* Modals */}
    {showHelp && <Modal>{/* Help content */}</Modal>}
    {showAbout && <Modal>{/* About content */}</Modal>}
  </div>
);
```

---

## 性能优化点

### 1. useCallback 优化

```typescript
const runProcessing = useCallback(async () => {
  // ... 处理逻辑
}, [originalImage, settings]);
```

### 2. 条件渲染

```typescript
{originalImage && (
  <div>
    {/* 仅在有图像时渲染 */}
  </div>
)}
```

### 3. 防抖处理

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    runProcessing();
  }, 150);
  return () => clearTimeout(timeoutId);
}, [runProcessing]);
```

---

## 下一步

继续阅读: [Sidebar 侧边栏 →](./03-components-sidebar.md)
