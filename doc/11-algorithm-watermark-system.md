# 水印系统算法详解

## 概述

InkFlow 的水印系统支持图片和文字两种类型，实现了完整的交互功能：拖拽、旋转、缩放、透明度调整。本文档详解水印渲染算法和交互逻辑。

**相关文件**:

- `src/components/WatermarkOverlay.tsx`
- `src/App.tsx` (水印管理)
- `src/types.ts` (数据结构)

---

## 1. 数据结构设计

### 1.1 基础类型

```typescript
enum WatermarkType {
    TEXT = 'text',
    IMAGE = 'image'
}

interface BaseWatermark {
    id: string;             // 唯一标识
    type: WatermarkType;    // 类型
    x: number;              // X坐标（原图尺寸）
    y: number;              // Y坐标（原图尺寸）
    rotation: number;       // 旋转角度 0-360°
    opacity: number;        // 透明度 0-100
}
```

### 1.2 图片水印

```typescript
interface ImageWatermark extends BaseWatermark {
    type: WatermarkType.IMAGE;
    src: string;            // DataURL或路径
    width: number;          // 宽度（原图尺寸）
    height: number;         // 高度（原图尺寸）
    originalWidth: number;  // 原始宽度
    originalHeight: number; // 原始高度
    format: 'png' | 'jpeg' | 'svg';  // 格式
}
```

### 1.3 文字水印

```typescript
interface TextWatermark extends BaseWatermark {
    type: WatermarkType.TEXT;
    text: string;           // 文字内容
    fontSize: number;       // 字号（原图尺寸）
    fontFamily: string;     // 字体
    color: string;          // 颜色（Hex）
}
```

**设计思路**:

- 所有尺寸基于**原图坐标系**
- 渲染时动态缩放到显示尺寸
- 便于导出时保持精确坐标

---

## 2. 坐标系统

### 2.1 双坐标系

**原图坐标系 (Original)**:

```
用途: 水印数据存储
尺寸: originalWidth × originalHeight
示例: 3000 × 2000 像素
```

**显示坐标系 (Display)**:

```
用途: 屏幕渲染
尺寸: displayWidth × displayHeight
示例: 800 × 533 像素（自适应容器）
```

### 2.2 缩放比例计算

```typescript
// 计算显示尺寸（保持宽高比）
const imgRatio = imageWidth / imageHeight;
const containerRatio = containerWidth / containerHeight;

let displayW, displayH, offsetX, offsetY;

if (imgRatio > containerRatio) {
    // 图片更宽 - 以宽度为准
    displayW = containerWidth;
    displayH = containerWidth / imgRatio;
    offsetX = 0;
    offsetY = (containerHeight - displayH) / 2;
} else {
    // 图片更高 - 以高度为准
    displayH = containerHeight;
    displayW = containerHeight * imgRatio;
    offsetX = (containerWidth - displayW) / 2;
    offsetY = 0;
}

// 缩放比例
const scale = displayW / imageWidth;
```

**示例**:

```
原图: 3000 × 2000
容器: 900 × 600
比例: 3000/2000 = 1.5, 900/600 = 1.5

显示: 900 × 600
缩放: scale = 900/3000 = 0.3
```

### 2.3 坐标转换

**原图 → 显示**:

```typescript
const displayX = watermark.x * scale + offsetX;
const displayY = watermark.y * scale + offsetY;
const displayWidth = watermark.width * scale;
const displayHeight = watermark.height * scale;
```

**显示 → 原图**:

```typescript
const originalX = (displayX - offsetX) / scale;
const originalY = (displayY - offsetY) / scale;
```

---

## 3. 图片水印渲染

### 3.1 Canvas 2D渲染

```typescript
// 1. 加载图片
const img = new Image();
img.onload = () => {
    // 2. 设置变换矩阵
    ctx.save();
    ctx.globalAlpha = watermark.opacity / 100;
    
    // 3. 平移到水印中心
    ctx.translate(
        watermark.x * scale,
        watermark.y * scale
    );
    
    // 4. 旋转
    ctx.rotate(watermark.rotation * Math.PI / 180);
    
    // 5. 绘制图片（中心对齐）
    ctx.drawImage(
        img,
        -watermark.width * scale / 2,    // 左上角X
        -watermark.height * scale / 2,   // 左上角Y
        watermark.width * scale,         // 宽度
        watermark.height * scale         // 高度
    );
    
    // 6. 恢复上下文
    ctx.restore();
};
img.src = watermark.src;
```

### 3.2 变换矩阵推导

**变换顺序**: 平移 → 旋转 → 绘制

**为什么先平移再旋转?**

```
错误顺序（先旋转后平移）:
1. rotate(θ)
2. translate(x, y)
结果: 平移方向也被旋转了 ✗

正确顺序（先平移后旋转）:
1. translate(x, y)      // 移到旋转中心
2. rotate(θ)            // 原地旋转
3. drawImage(-w/2, -h/2) // 中心对齐
结果: 绕自身中心旋转 ✓
```

**数学证明**:

```
变换矩阵链:
M = T(x,y) × R(θ) × T(-w/2,-h/2)

其中:
T(x,y) = [1  0  x ]
         [0  1  y ]
         [0  0  1 ]

R(θ) = [cos(θ) -sin(θ) 0]
       [sin(θ)  cos(θ) 0]
       [0       0      1]

最终点 P' = M × P
```

### 3.3 SVG水印特殊处理

```typescript
if (watermark.format === 'svg') {
    // SVG需要转为DataURL
    const img = new Image();
    img.onload = () => {
        // 正常渲染
        ctx.drawImage(img, ...);
    };
    
    // SVG文本 → Blob → DataURL
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    img.src = URL.createObjectURL(blob);
}
```

---

## 4. 文字水印渲染

### 4.1 Canvas文字API

```typescript
ctx.save();

// 1. 透明度
ctx.globalAlpha = watermark.opacity / 100;

// 2. 平移+旋转
ctx.translate(
    watermark.x * scale,
    watermark.y * scale
);
ctx.rotate(watermark.rotation * Math.PI / 180);

// 3. 文字样式
ctx.font = `${watermark.fontSize * scale}px "${watermark.fontFamily}"`;
ctx.fillStyle = watermark.color;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// 4. 绘制文字
ctx.fillText(watermark.text, 0, 0);

ctx.restore();
```

### 4.2 字体处理

**支持字体**:

```typescript
const CHINESE_FONTS = [
    'ZCOOL QingKe HuangYou',  // 站酷庆科黄油
    'ZCOOL XiaoWei',          // 站酷小薇
    'Ma Shan Zheng',          // 马善政
    'Liu Jian Mao Cao',       // 刘建毛草
    'Long Cang'               // 龙藏
];

const ENGLISH_FONTS = [
    'Pacifico',
    'Dancing Script',
    'Permanent Marker',
    'Shadows Into Light',
    'Indie Flower'
];
```

**字体加载**:

```css
@import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
```

**字体测量**:

```typescript
// 获取文字宽度
const metrics = ctx.measureText(watermark.text);
const textWidth = metrics.width;

// 包围盒
const bbox = {
    width: textWidth,
    height: watermark.fontSize,
    x: watermark.x - textWidth / 2,
    y: watermark.y - watermark.fontSize / 2
};
```

---

## 5. 交互算法

### 5.1 点击检测

**命中检测算法**:

```typescript
function isPointInWatermark(
    px: number, py: number,      // 点击坐标（显示）
    watermark: Watermark,
    scale: number
): boolean {
    // 1. 转换到原图坐标
    const wx = watermark.x;
    const wy = watermark.y;
    
    // 2. 计算相对向量
    const dx = (px - offsetX) / scale - wx;
    const dy = (py - offsetY) / scale - wy;
    
    // 3. 反向旋转
    const angle = -watermark.rotation * Math.PI / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // 4. 检查是否在矩形内
    const halfW = watermark.width / 2;
    const halfH = watermark.height / 2;
    
    return Math.abs(rotatedX) <= halfW &&
           Math.abs(rotatedY) <= halfH;
}
```

**原理图**:

```
          旋转后矩形
         ╱─────────╲
        ╱           ╲
       │    点击点    │
        ╲           ╱
         ╲─────────╱

步骤:
1. 将点击点平移到水印中心
2. 反向旋转（抵消水印旋转）
3. 检查是否在未旋转矩形内
```

### 5.2 拖拽算法

```typescript
const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedWatermark) return;
    
    // 1. 计算鼠标移动距离（显示坐标）
    const displayDeltaX = e.clientX - dragStart.x;
    const displayDeltaY = e.clientY - dragStart.y;
    
    // 2. 转换到原图坐标
    const originalDeltaX = displayDeltaX / scale;
    const originalDeltaY = displayDeltaY / scale;
    
    // 3. 应用到水印位置
    const newX = dragStart.watermarkX + originalDeltaX;
    const newY = dragStart.watermarkY + originalDeltaY;
    
    // 4. 边界限制
    const boundedX = Math.max(
        watermark.width / 2,
        Math.min(imageWidth - watermark.width / 2, newX)
    );
    const boundedY = Math.max(
        watermark.height / 2,
        Math.min(imageHeight - watermark.height / 2, newY)
    );
    
    // 5. 更新水印
    onUpdateWatermark(selectedWatermark.id, {
        x: boundedX,
        y: boundedY
    });
    
    // 6. 更新拖拽起点
    setDragStart({
        x: e.clientX,
        y: e.clientY,
        watermarkX: newX,
        watermarkY: newY
    });
};
```

**增量更新优势**:

- 避免累积误差
- 平滑拖拽体验
- 支持边界限制

### 5.3 网格吸附算法

```typescript
function snapToGrid(value: number, gridSize: number): number {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
}

// 应用吸附
const snappedX = snapToGrid(newX, gridSize);
const snappedY = snapToGrid(newY, gridSize);
```

**吸附原理**:

```
gridSize = 50

原始值: 123
123 / 50 = 2.46
round(2.46) = 2
2 × 50 = 100  ✓ 吸附结果

原始值: 148
148 / 50 = 2.96
round(2.96) = 3
3 × 50 = 150  ✓ 吸附结果
```

### 5.4 旋转算法

**UI交互**:

```typescript
const handleRotationChange = (newRotation: number) => {
    onUpdateWatermark(selectedWatermark.id, {
        rotation: newRotation % 360  // 模360保持范围
    });
};
```

**快速角度**:

```typescript
const quickRotations = [0, 45, 90, 135, 180, 225, 270, 315];

quickRotations.map(angle => (
    <button onClick={() => handleRotationChange(angle)}>
        {angle}°
    </button>
));
```

### 5.5 透明度算法

**线性插值**:

```typescript
// opacity: 0-100
ctx.globalAlpha = opacity / 100;  // 转换到 0.0-1.0
```

**实时预览**:

```typescript
const handleOpacityChange = (newOpacity: number) => {
    // 立即更新状态
    onUpdateWatermark(selectedWatermark.id, {
        opacity: newOpacity
    });
    
    // 自动触发重绘（React）
};
```

---

## 6. 导出算法

### 6.1 合成流程

```typescript
function exportWithWatermarks(): string {
    const canvas = document.createElement('canvas');
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    const ctx = canvas.getContext('2d')!;
    
    // 1. 绘制背景
    if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 2. 绘制处理后的图像
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
        
        // 3. 按顺序绘制水印
        watermarks.forEach(watermark => {
            drawWatermark(ctx, watermark, 1.0);  // scale = 1 (原图尺寸)
        });
        
        // 4. 导出
        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl);
    };
    img.src = processedImage;
}
```

**关键点**:

- scale = 1.0（导出时使用原图尺寸）
- 严格按添加顺序绘制（z-index）
- 支持透明背景

### 6.2 格式转换

```typescript
// PNG (无损)
canvas.toDataURL('image/png');

// JPEG (有损，指定质量)
canvas.toDataURL('image/jpeg', 0.9);  // 90%质量

// WebP (现代格式)
canvas.toDataURL('image/webp', 0.9);

// Blob API (用于下载)
canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'inkflow-export.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}, 'image/png');
```

---

## 7. 性能优化

### 7.1 渲染优化

**React优化**:

```typescript
// 避免不必要的重渲染
const MemoizedWatermark = React.memo(({ watermark }) => {
    return <div>{/* 水印元素 */}</div>;
}, (prevProps, nextProps) => {
    return prevProps.watermark.id === nextProps.watermark.id &&
           prevProps.watermark.opacity === nextProps.watermark.opacity &&
           // ... 其他比较
});
```

**Canvas优化**:

```typescript
// 仅重绘变化的水印
function redrawWatermark(changedId: string) {
    // 1. 清除该水印区域
    const watermark = watermarks.find(w => w.id === changedId);
    ctx.clearRect(/* watermark bounds */);
    
    // 2. 重绘该水印
    drawWatermark(ctx, watermark);
}
```

### 7.2 内存管理

**图片缓存**:

```typescript
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!);
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}
```

**清理策略**:

```typescript
useEffect(() => {
    return () => {
        // 组件卸载时清理
        watermarks.forEach(w => {
            if (w.type === WatermarkType.IMAGE) {
                URL.revokeObjectURL(w.src);
            }
        });
    };
}, [watermarks]);
```

---

## 8. 边界情况处理

### 8.1 边界限制

```typescript
// 防止水印超出画布
const clampPosition = (watermark: Watermark): Watermark => {
    const halfW = watermark.width / 2;
    const halfH = watermark.height / 2;
    
    return {
        ...watermark,
        x: Math.max(halfW, Math.min(imageWidth - halfW, watermark.x)),
        y: Math.max(halfH, Math.min(imageHeight - halfH, watermark.y))
    };
};
```

### 8.2 角度归一化

```typescript
function normalizeAngle(angle: number): number {
    angle = angle % 360;
    return angle < 0 ? angle + 360 : angle;
}
```

### 8.3 空值检查

```typescript
if (!watermark || !ctx || !scale) {
    console.error('Invalid rendering context');
    return;
}
```

---

## 9. 算法复杂度

| 操作 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 添加水印 | O(1) | O(1) |
| 删除水印 | O(n) | O(1) |
| 渲染单个水印 | O(1) | O(wh) |
| 渲染所有水印 | O(n) | O(wh) |
| 点击检测 | O(n) | O(1) |
| 拖拽更新 | O(1) | O(1) |
| 导出 | O(n + wh) | O(wh) |

其中:

- n = 水印数量
- w, h = 图像宽高

---

## 总结

水印系统的核心算法包括：

1. **坐标变换**: 原图↔显示双坐标系
2. **Canvas 2D渲染**: 变换矩阵、透明度、旋转
3. **碰撞检测**: 旋转矩形点击测试
4. **拖拽交互**: 增量更新、边界限制
5. **网格吸附**: 四舍五入到最近网格点
6. **导出合成**: 多层叠加、格式转换

所有算法均在浏览器端运行，无需服务器，保证用户隐私和实时性。

---

**相关文档**:

- [WatermarkOverlay组件](./03-components-watermark.md)
- [App状态管理](./03-components-app.md)
