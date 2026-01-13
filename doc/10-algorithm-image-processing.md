# 图像处理核心算法详解

## 概述

InkFlow 的核心算法基于 **Canvas ImageData API** 进行像素级图像处理。本文档详细讲解所有算法的数学原理、实现逻辑和优化策略。

**文件位置**: `src/services/processor.ts`

---

## 算法处理流程

### 整体Pipeline

```
原始图像
    ↓
1. 色彩调整 (亮度/对比度/饱和度)
    ↓
2. 模式分支判断
    ├─→ 照片模式: 保留背景 → 直接输出
    └─→ 墨迹模式: 背景去除
        ↓
    3. 灰度转换 (RGB → Luma)
        ↓
    4. 去噪 (中值滤波)
        ↓
    5. 锐化 (Unsharp Mask)
        ↓
    6. 二值化 (阈值处理)
        ├─→ 全局阈值
        └─→ 自适应阈值
        ↓
    7. 形态学操作 (膨胀/腐蚀)
        ↓
    8. 边缘增强
        ↓
    9. 平滑处理
        ↓
    10. Alpha合成
        ↓
    输出图像
```

---

## 1. 色彩调整算法

### 1.1 亮度调整 (Brightness)

**数学原理**:

```
对于每个像素 (R, G, B):
R' = R + shift
G' = G + shift
B' = B + shift

其中: shift = brightness × 2.55
范围: brightness ∈ [-100, 100]
```

**代码实现**:

```typescript
const bShift = Math.floor(brightness * 2.55);

for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] += bShift;     // R
    pixels[i + 1] += bShift; // G
    pixels[i + 2] += bShift; // B
}
```

**效果**:

- `brightness > 0`: 图像变亮
- `brightness < 0`: 图像变暗
- 线性变换，简单高效

---

### 1.2 对比度调整 (Contrast)

**数学原理**:

```
标准对比度公式:
factor = (259 × (contrast + 255)) / (255 × (259 - contrast))

对于每个通道:
V' = factor × (V - 128) + 128

其中: V ∈ {R, G, B}
contrast ∈ [-100, 100]
```

**推导过程**:

1. 将像素值中心化：`V - 128`（以128为中点）
2. 应用缩放因子：`factor × (V - 128)`
3. 还原中心点：`+ 128`

**代码实现**:

```typescript
const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

r = cFactor * (r - 128) + 128;
g = cFactor * (g - 128) + 128;
b = cFactor * (b - 128) + 128;
```

**效果分析**:

- `contrast > 0`: factor > 1, 拉大差异
- `contrast < 0`: factor < 1, 缩小差异
- `contrast = 0`: factor = 1, 无变化

---

### 1.3 饱和度调整 (Saturation)

**数学原理**:

```
1. 计算灰度值 (Luma):
   gray = 0.299×R + 0.587×G + 0.114×B

2. 饱和度因子:
   sFactor = 1 + (saturation / 100)

3. 新颜色值:
   R' = gray + sFactor × (R - gray)
   G' = gray + sFactor × (G - gray)
   B' = gray + sFactor × (B - gray)
```

**原理说明**:

- `gray` 是像素的感知亮度
- `(R - gray)` 是颜色偏离灰度的程度
- 乘以 `sFactor` 放大或缩小这个偏离

**代码实现**:

```typescript
const sFactor = 1 + (saturation / 100);
const gray = 0.299 * r + 0.587 * g + 0.114 * b;

if (saturation === -100) {
    // 完全去色
    r = g = b = gray;
} else {
    r = gray + sFactor * (r - gray);
    g = gray + sFactor * (g - gray);
    b = gray + sFactor * (b - gray);
}
```

**特殊情况**:

- `saturation = -100`: 完全灰度
- `saturation = 0`: 原始颜色
- `saturation = 100`: 颜色增强2倍

---

## 2. 灰度转换算法

### 2.1 Luma计算

**标准公式** (ITU-R BT.601):

```
Luma = 0.299×R + 0.587×G + 0.114×B
```

**权重说明**:

- **绿色 (0.587)**: 人眼对绿色最敏感
- **红色 (0.299)**: 中等敏感
- **蓝色 (0.114)**: 最不敏感

**代码实现**:

```typescript
const luma = new Uint8ClampedArray(width * height);
for (let i = 0; i < luma.length; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
}
```

**为什么不用平均值**?

```
简单平均: (R + G + B) / 3
问题: 不符合人眼感知

示例:
RGB(0, 255, 0) 纯绿
- 平均值: 85
- Luma: 149 ✓ (更亮，符合感知)
```

---

## 3. 去噪算法 - 中值滤波

### 3.1 算法原理

**定义**:
用邻域像素的中值替换当前像素，去除椒盐噪声。

**窗口大小**:

```
3×3 窗口 (radius = 1):
┌─┬─┬─┐
│·│·│·│
├─┼─┼─┤
│·│X│·│  X = 中心像素
├─┼─┼─┤
│·│·│·│
└─┴─┴─┘

5×5 窗口 (radius = 2):
更大的窗口，更强的去噪效果
```

**数学流程**:

```
1. 收集窗口内所有像素值
2. 排序: [v₁, v₂, ..., vₙ]
3. 取中值: median = v[n/2]
```

**代码实现**:

```typescript
function applyMedianFilter(
    data: Uint8ClampedArray, 
    w: number, 
    h: number, 
    radius: number
): Uint8ClampedArray {
    const output = new Uint8ClampedArray(data.length);
    const size = (2 * radius + 1) * (2 * radius + 1);
    const kernel = new Int32Array(size);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let count = 0;
            
            // 收集邻域像素
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // 边界处理：重复边缘
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        kernel[count++] = data[ny * w + nx];
                    } else {
                        kernel[count++] = data[y * w + x];
                    }
                }
            }
            
            // 排序并取中值
            const validKernel = kernel.subarray(0, count).sort();
            output[y * w + x] = validKernel[Math.floor(count / 2)];
        }
    }
    
    return output;
}
```

**优点**:

- ✅ 保留边缘
- ✅ 去除椒盐噪声效果好

**缺点**:

- ❌ 计算复杂度 O(n² × k²log k)
- ❌ 对高斯噪声效果一般

**优化策略**:

```typescript
// 根据去噪强度动态选择窗口大小
const radius = settings.denoise > 50 ? 2 : 1;
```

---

## 4. 锐化算法 - Unsharp Mask

### 4.1 原理

**核心思想**: 增强边缘细节

**数学公式**:

```
1. 模糊原图: blur = BoxBlur(original)
2. 计算差异: diff = original - blur
3. 增强边缘: sharpened = original + amount × diff
```

**展开式**:

```
sharpened = original + amount × (original - blur)
          = original × (1 + amount) - blur × amount
```

**代码实现**:

```typescript
function applyUnsharpMask(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    amount: number
): Uint8ClampedArray {
    // 1. 模糊处理
    const blurred = applyBoxBlurLuma(data, w, h, 2);
    const output = new Uint8ClampedArray(data.length);

    // 2. 增强边缘
    for (let i = 0; i < data.length; i++) {
        const orig = data[i];
        const blur = blurred[i];
        const diff = orig - blur;  // 高频细节
        output[i] = truncate(orig + diff * amount);
    }
    
    return output;
}
```

**参数 amount**:

- `amount = 0`: 无效果
- `amount = 1`: 标准锐化
- `amount > 1`: 强烈锐化（可能过度）

**示例**:

```
原始像素: 100
模糊像素: 80
差异: 100 - 80 = 20 (边缘信号)

amount = 0.5: 100 + 20×0.5 = 110
amount = 1.0: 100 + 20×1.0 = 120
amount = 2.0: 100 + 20×2.0 = 140
```

---

## 5. 二值化算法

### 5.1 全局阈值法

**最简单的二值化**:

```
mask[i] = luma[i] < threshold ? 255 : 0

阈值: threshold ∈ [0, 255]
```

**效果**:

- 像素 < 阈值 → 黑色 (墨迹, 255)
- 像素 ≥ 阈值 → 白色 (背景, 0)

**代码**:

```typescript
for (let i = 0; i < luma.length; i++) {
    mask[i] = luma[i] < settings.threshold ? 255 : 0;
}
```

**优点**: 极简，极快
**缺点**: 光照不均时效果差

---

### 5.2 自适应阈值法 (Advanced)

**原理**: 每个像素使用局部阈值

**算法步骤**:

```
1. 计算积分图 (Integral Image)
2. 对每个像素:
   a. 计算局部窗口均值
   b. 阈值 = 均值 - C
   c. 二值化当前像素
```

**积分图加速**:

```
积分图定义:
I(x, y) = Σ(i≤x, j≤y) pixel(i, j)

窗口和快速计算:
sum = I(x2, y2) - I(x1, y2) - I(x2, y1) + I(x1, y1)

复杂度: 从 O(w×h) 降至 O(1)
```

**代码实现**:

```typescript
function applyAdaptiveThreshold(
    data: Uint8ClampedArray,
    mask: Uint8Array,
    w: number,
    h: number,
    s: number,  // 窗口大小
    C: number   // 常数偏移
) {
    // 1. 计算积分图
    const integral = new Float64Array(w * h);
    
    for (let y = 0; y < h; y++) {
        let sum = 0;
        for (let x = 0; x < w; x++) {
            sum += data[y * w + x];
            const above = y > 0 ? integral[(y - 1) * w + x] : 0;
            integral[y * w + x] = sum + above;
        }
    }

    // 2. 自适应阈值
    const halfS = Math.floor(s / 2);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // 计算窗口边界
            const x1 = Math.max(0, x - halfS);
            const y1 = Math.max(0, y - halfS);
            const x2 = Math.min(w - 1, x + halfS);
            const y2 = Math.min(h - 1, y + halfS);
            
            // 窗口面积
            const count = (x2 - x1 + 1) * (y2 - y1 + 1);
            
            // 快速计算窗口和
            const sum = 
                integral[y2 * w + x2] -
                (x1 > 0 ? integral[y2 * w + x1 - 1] : 0) -
                (y1 > 0 ? integral[(y1 - 1) * w + x2] : 0) +
                (x1 > 0 && y1 > 0 ? integral[(y1 - 1) * w + x1 - 1] : 0);
            
            // 计算局部均值和阈值
            const mean = sum / count;
            const threshold = mean - C;
            
            // 二值化
            const idx = y * w + x;
            mask[idx] = data[idx] < threshold ? 255 : 0;
        }
    }
}
```

**参数说明**:

- `s (窗口大小)`: 通常设为 `width / 60`，自适应图像尺寸
- `C (偏移常数)`: 通常 5-15，调整敏感度

**优势**:

- ✅ 适应光照不均
- ✅ 细节保留更好
- ✅ 复杂度 O(n)（积分图优化）

---

## 6. 形态学操作

### 6.1 膨胀 (Dilation)

**定义**: 扩大前景区域

**规则**:

```
如果邻域内有任何前景像素 → 当前像素变为前景
```

**3×3结构元素**:

```
┌─┬─┬─┐
│1│1│1│
├─┼─┼─┤
│1│X│1│
├─┼─┼─┤
│1│1│1│
└─┴─┴─┘
```

**效果**:

- 填充小孔洞
- 连接断裂笔画
- 增粗线条

---

### 6.2 腐蚀 (Erosion)

**定义**: 收缩前景区域

**规则**:

```
只有邻域全是前景 → 当前像素才是前景
```

**效果**:

- 去除小噪点
- 分离粘连笔画
- 细化线条

---

### 6.3 代码实现

```typescript
function applyMorphology(
    mask: Uint8Array,
    width: number,
    height: number,
    strength: number
): Uint8Array {
    let result = mask;
    const absStrength = Math.abs(strength);
    
    if (strength > 0) {
        // 膨胀 (Dilation)
        for (let i = 0; i < absStrength; i++) {
            result = dilate(result, width, height);
        }
    } else if (strength < 0) {
        // 腐蚀 (Erosion)
        for (let i = 0; i < absStrength; i++) {
            result = erode(result, width, height);
        }
    }
    
    return result;
}

function dilate(mask: Uint8Array, w: number, h: number): Uint8Array {
    const output = new Uint8Array(mask.length);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            
            // 检查8邻域是否有前景
            if (hasNeighborValue(mask, w, h, x, y, 255)) {
                output[idx] = 255;
            } else {
                output[idx] = mask[idx];
            }
        }
    }
    
    return output;
}

function erode(mask: Uint8Array, w: number, h: number): Uint8Array {
    const output = new Uint8Array(mask.length);
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            
            // 检查8邻域是否全是前景
            if (allNeighborsAre(mask, w, h, x, y, 255)) {
                output[idx] = 255;
            } else {
                output[idx] = 0;
            }
        }
    }
    
    return output;
}
```

**组合操作**:

```typescript
// 边缘增强 = 膨胀 + 腐蚀
if (settings.edgeEnhance) {
    mask = applyMorphology(mask, w, h, 1);  // 膨胀
    mask = applyMorphology(mask, w, h, -1); // 腐蚀
}
```

**效果**: 平滑边缘，去除小噪点，保留主体

---

## 7. 平滑处理 - Box Blur

### 7.1 算法原理

**均值滤波**:

```
output[x, y] = Σ(窗口内像素) / 窗口大小
```

**Box Blur 优化**:
使用可分离卷积（Separable Convolution）

**数学证明**:

```
2D Box Blur = 水平Blur × 垂直Blur

复杂度:
- 直接法: O(n² × k²)
- 可分离: O(n² × k)
```

**代码实现**:

```typescript
function applyBoxBlur(
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number
): Uint8Array {
    // 水平模糊
    let temp = new Uint8Array(mask.length);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                if (nx >= 0 && nx < width) {
                    sum += mask[y * width + nx];
                    count++;
                }
            }
            
            temp[y * width + x] = Math.round(sum / count);
        }
    }
    
    // 垂直模糊
    const output = new Uint8Array(mask.length);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let sum = 0;
            let count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                const ny = y + dy;
                if (ny >= 0 && ny < height) {
                    sum += temp[ny * width + x];
                    count++;
                }
            }
            
            output[y * width + x] = Math.round(sum / count);
        }
    }
    
    return output;
}
```

**效果**:

- 平滑锯齿
- 柔化边缘
- 抗锯齿处理

---

## 8. Alpha合成算法

### 8.1 Porter-Duff 合成

**Source Over 模式**:

```
Result = Source × αₛ + Background × (1 - αₛ)
```

**代码实现**:

```typescript
for (let i = 0; i < mask.length; i++) {
    const inkAlpha = mask[i];  // 0..255
    const alphaNorm = inkAlpha / 255;
    const invAlpha = 1 - alphaNorm;
    const idx = i * 4;
    
    if (inkAlpha > 0) {
        // 墨迹颜色
        let inkR, inkG, inkB;
        
        if (settings.monochrome) {
            inkR = inkG = inkB = 0;  // 纯黑
        } else {
            // 保留原色
            inkR = originalPixels[idx];
            inkG = originalPixels[idx + 1];
            inkB = originalPixels[idx + 2];
        }
        
        if (bgAlpha === 0) {
            // 透明背景
            outputPixels[idx] = inkR;
            outputPixels[idx + 1] = inkG;
            outputPixels[idx + 2] = inkB;
            outputPixels[idx + 3] = inkAlpha;
        } else {
            // 实色背景
            outputPixels[idx] = inkR * alphaNorm + bgR * invAlpha;
            outputPixels[idx + 1] = inkG * alphaNorm + bgG * invAlpha;
            outputPixels[idx + 2] = inkB * alphaNorm + bgB * invAlpha;
            outputPixels[idx + 3] = 255;
        }
    } else {
        // 纯背景
        outputPixels[idx] = bgR;
        outputPixels[idx + 1] = bgG;
        outputPixels[idx + 2] = bgB;
        outputPixels[idx + 3] = bgAlpha;
    }
}
```

---

## 9. 性能优化策略

### 9.1 算法复杂度

| 算法 | 复杂度 | 优化方法 |
|------|--------|----------|
| 色彩调整 | O(n) | SIMD向量化 |
| 灰度转换 | O(n) | 无需优化 |
| 中值滤波 | O(n×k²logk) | 限制窗口大小 |
| Unsharp Mask | O(n×k) | 可分离卷积 |
| 自适应阈值 | O(n) | 积分图优化 |
| 形态学 | O(n×k²) | 快速算法 |
| Box Blur | O(n×k) | 可分离卷积 |

### 9.2 内存优化

```typescript
// 复用数组，避免频繁分配
let processedLuma = luma;  // 复用

// TypedArray 性能更好
const luma = new Uint8ClampedArray(size);  // ✓
const luma = new Array(size);              // ✗
```

### 9.3 防抖处理

```typescript
// App.tsx 中的防抖
useEffect(() => {
    const timeoutId = setTimeout(() => {
        runProcessing();
    }, 150);  // 150ms 防抖
    
    return () => clearTimeout(timeoutId);
}, [settings]);
```

---

## 10. 算法选择指南

### 照片模式

```
✓ 色彩调整 (Brightness/Contrast/Saturation)
✗ 二值化
✗ 形态学
✗ 去噪/锐化
```

### 墨迹模式

```
✓ 全部算法
✓ 推荐: 自适应阈值 + 边缘增强
```

### 性能优先

```
✗ 中值滤波 (慢)
✓ Box Blur (快)
✓ 全局阈值 (极快)
```

### 质量优先

```
✓ 自适应阈值 (精细)
✓ 中值滤波 (去噪好)
✓ Unsharp Mask (锐化好)
```

---

## 总结

InkFlow 的算法pipeline综合运用了：

- 📐 **色彩空间理论** (RGB ↔ Luma)
- 🔬 **空间域滤波** (中值、Box Blur)
- 📊 **二值化理论** (全局/自适应阈值)
- 🎨 **形态学** (膨胀/腐蚀)
- 🖼️ **Alpha合成** (Porter-Duff)

所有算法均为**纯JavaScript实现**，无需外部库，性能经过优化，适合Web环境运行。

---

**相关文档**:

- [系统架构](./02-architecture.md)
- [服务层详解](./04-services-processor.md)
