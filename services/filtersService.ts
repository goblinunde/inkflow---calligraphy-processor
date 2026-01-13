/**
 * 艺术滤镜服务 - 扩展版
 * 💡 提供 20+ 专业级艺术效果，支持叠加
 */

// ==================== 复古效果 ====================

/**
 * 复古/老照片效果
 */
export function applyVintageFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        const saturation = 0.4;
        let newR = gray + (r - gray) * saturation;
        let newG = gray + (g - gray) * saturation;
        let newB = gray + (b - gray) * saturation;

        newR = newR * 1.1 + 20;
        newG = newG * 0.9 + 10;
        newB = newB * 0.7;

        result[i] = Math.max(0, Math.min(255, newR));
        result[i + 1] = Math.max(0, Math.min(255, newG));
        result[i + 2] = Math.max(0, Math.min(255, newB));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 水墨效果 ====================

export function applyInkWashFilter(imageData: ImageData, intensity: number = 50): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const threshold = 128 - (intensity - 50) * 0.5;
    const spread = intensity / 100;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            let inkValue: number;
            if (gray < threshold * 0.5) {
                inkValue = gray * 0.5;
            } else if (gray < threshold) {
                const t = (gray - threshold * 0.5) / (threshold * 0.5);
                inkValue = gray * (0.5 + t * 0.5);
            } else {
                const t = (gray - threshold) / (255 - threshold);
                inkValue = threshold + t * (255 - threshold) * (0.8 + spread * 0.2);
            }

            result[i] = result[i + 1] = result[i + 2] = Math.max(0, Math.min(255, inkValue));
            result[i + 3] = data[i + 3];
        }
    }

    return new ImageData(result, width, height);
}

// ==================== 褐色调 ====================

export function applySepiaFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        result[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        result[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        result[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 高对比度黑白 ====================

export function applyHighContrastBW(imageData: ImageData, contrast: number = 50): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const adjusted = factor * (gray - 128) + 128;
        const clamped = Math.max(0, Math.min(255, adjusted));
        result[i] = result[i + 1] = result[i + 2] = clamped;
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 反转 ====================

export function applyInvertFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        result[i] = 255 - data[i];
        result[i + 1] = 255 - data[i + 1];
        result[i + 2] = 255 - data[i + 2];
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 暖色调 ====================

export function applyWarmFilter(imageData: ImageData, intensity: number = 30): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.min(255, data[i] + intensity);
        result[i + 1] = Math.min(255, data[i + 1] + intensity * 0.5);
        result[i + 2] = Math.max(0, data[i + 2] - intensity * 0.3);
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 冷色调 ====================

export function applyCoolFilter(imageData: ImageData, intensity: number = 30): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.max(0, data[i] - intensity * 0.3);
        result[i + 1] = Math.min(255, data[i + 1] + intensity * 0.2);
        result[i + 2] = Math.min(255, data[i + 2] + intensity);
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 胶片颗粒 ====================

export function applyFilmGrainFilter(imageData: ImageData, intensity: number = 30): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const grainAmount = intensity * 0.5;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * grainAmount;
        result[i] = Math.max(0, Math.min(255, data[i] + noise));
        result[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        result[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== LOMO 效果 ====================

export function applyLomoFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const centerX = width / 2, centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            // 增加对比度和饱和度
            let r = data[i], g = data[i + 1], b = data[i + 2];

            // S 曲线对比度
            r = 255 * (1 / (1 + Math.exp(-0.02 * (r - 128))));
            g = 255 * (1 / (1 + Math.exp(-0.02 * (g - 128))));
            b = 255 * (1 / (1 + Math.exp(-0.02 * (b - 128))));

            // 增强色彩
            r = Math.min(255, r * 1.1);
            b = Math.max(0, b * 0.9);

            // 暗角
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distRatio = Math.sqrt(dx * dx + dy * dy);
            const vignette = 1 - distRatio * 0.4;

            result[i] = Math.max(0, Math.min(255, r * vignette));
            result[i + 1] = Math.max(0, Math.min(255, g * vignette));
            result[i + 2] = Math.max(0, Math.min(255, b * vignette));
            result[i + 3] = data[i + 3];
        }
    }

    return new ImageData(result, width, height);
}

// ==================== 交叉冲印 ====================

export function applyCrossProcessFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 交叉处理特有的色偏
        result[i] = Math.min(255, r * 1.2 + g * 0.1);
        result[i + 1] = Math.min(255, g * 0.8 + b * 0.2);
        result[i + 2] = Math.min(255, b * 1.3);
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== HDR 模拟 ====================

export function applyHDRFilter(imageData: ImageData, intensity: number = 50): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const strength = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        // 局部对比度增强
        const boost = lum < 0.5 ? (1 + strength * (0.5 - lum)) : (1 - strength * (lum - 0.5) * 0.5);

        // 饱和度增强
        const gray = (r + g + b) / 3;
        r = gray + (r - gray) * (1 + strength * 0.5);
        g = gray + (g - gray) * (1 + strength * 0.5);
        b = gray + (b - gray) * (1 + strength * 0.5);

        result[i] = Math.max(0, Math.min(255, r * boost));
        result[i + 1] = Math.max(0, Math.min(255, g * boost));
        result[i + 2] = Math.max(0, Math.min(255, b * boost));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 电影色调 ====================

export function applyCinematicFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 青橙色调 (电影常用)
        const lum = (r * 0.299 + g * 0.587 + b * 0.114);

        if (lum < 128) {
            // 阴影偏青
            r = r * 0.9;
            g = g * 1.0;
            b = Math.min(255, b * 1.15);
        } else {
            // 高光偏橙
            r = Math.min(255, r * 1.1);
            g = g * 0.95;
            b = b * 0.85;
        }

        // 降低饱和度
        const gray = (r + g + b) / 3;
        r = gray + (r - gray) * 0.85;
        g = gray + (g - gray) * 0.85;
        b = gray + (b - gray) * 0.85;

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 漫画效果 ====================

export function applyComicFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 色彩量化
        r = Math.round(r / 32) * 32;
        g = Math.round(g / 32) * 32;
        b = Math.round(b / 32) * 32;

        // 增强对比
        r = r < 128 ? r * 0.7 : Math.min(255, r * 1.3);
        g = g < 128 ? g * 0.7 : Math.min(255, g * 1.3);
        b = b < 128 ? b * 0.7 : Math.min(255, b * 1.3);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 油画效果 ====================

export function applyOilPaintFilter(imageData: ImageData, radius: number = 3): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const buckets: number[][] = Array(20).fill(null).map(() => [0, 0, 0, 0]);

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx));
                    const ny = Math.max(0, Math.min(height - 1, y + dy));
                    const ni = (ny * width + nx) * 4;

                    const lum = Math.floor((data[ni] + data[ni + 1] + data[ni + 2]) / 3 / 13);
                    buckets[lum][0] += data[ni];
                    buckets[lum][1] += data[ni + 1];
                    buckets[lum][2] += data[ni + 2];
                    buckets[lum][3]++;
                }
            }

            let maxBucket = 0, maxCount = 0;
            for (let b = 0; b < 20; b++) {
                if (buckets[b][3] > maxCount) {
                    maxCount = buckets[b][3];
                    maxBucket = b;
                }
            }

            if (maxCount > 0) {
                result[i] = buckets[maxBucket][0] / maxCount;
                result[i + 1] = buckets[maxBucket][1] / maxCount;
                result[i + 2] = buckets[maxBucket][2] / maxCount;
            } else {
                result[i] = data[i];
                result[i + 1] = data[i + 1];
                result[i + 2] = data[i + 2];
            }
            result[i + 3] = data[i + 3];
        }
    }

    return new ImageData(result, width, height);
}

// ==================== 素描效果 ====================

export function applySketchFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    // 边缘检测
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;

            const c = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const l = data[i - 4] * 0.299 + data[i - 3] * 0.587 + data[i - 2] * 0.114;
            const r = data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114;
            const t = data[i - width * 4] * 0.299 + data[i - width * 4 + 1] * 0.587 + data[i - width * 4 + 2] * 0.114;
            const b = data[i + width * 4] * 0.299 + data[i + width * 4 + 1] * 0.587 + data[i + width * 4 + 2] * 0.114;

            const edge = Math.abs(l - r) + Math.abs(t - b);
            const sketch = 255 - Math.min(255, edge * 2);

            result[i] = result[i + 1] = result[i + 2] = sketch;
            result[i + 3] = data[i + 3];
        }
    }

    return new ImageData(result, width, height);
}

// ==================== 霓虹效果 ====================

export function applyNeonFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;

            // 边缘检测
            const gx = -data[i - 4] + data[i + 4] - data[i - width * 4 - 4] + data[i - width * 4 + 4] - data[i + width * 4 - 4] + data[i + width * 4 + 4];
            const gy = -data[i - width * 4] + data[i + width * 4] - data[i - width * 4 - 4] + data[i + width * 4 - 4] - data[i - width * 4 + 4] + data[i + width * 4 + 4];
            const edge = Math.min(255, Math.sqrt(gx * gx + gy * gy));

            // 霓虹色彩
            const hue = (data[i] + data[i + 1] * 2) % 360;
            const rgb = hslToRgb(hue / 360, 1, 0.5);

            result[i] = rgb[0] * edge / 255;
            result[i + 1] = rgb[1] * edge / 255;
            result[i + 2] = rgb[2] * edge / 255;
            result[i + 3] = data[i + 3];
        }
    }

    return new ImageData(result, width, height);
}

// ==================== 梦幻/柔光 ====================

export function applyDreamyFilter(imageData: ImageData, intensity: number = 50): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const blur = intensity / 10;

    for (let i = 0; i < data.length; i += 4) {
        // 提亮 + 降低对比度
        let r = data[i], g = data[i + 1], b = data[i + 2];

        r = r + (255 - r) * 0.2;
        g = g + (255 - g) * 0.2;
        b = b + (255 - b) * 0.2;

        // 轻微粉色调
        r = Math.min(255, r * 1.05);
        b = Math.min(255, b * 1.02);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 波普艺术 ====================

export function applyPopArtFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const colors = [
        [255, 0, 100], [255, 200, 0], [0, 200, 255], [150, 0, 255]
    ];

    for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const colorIndex = Math.floor(gray / 64) % 4;

        result[i] = colors[colorIndex][0];
        result[i + 1] = colors[colorIndex][1];
        result[i + 2] = colors[colorIndex][2];
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 日系小清新 ====================

export function applyJapaneseFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 提亮 + 降低对比度
        r = 128 + (r - 128) * 0.85 + 15;
        g = 128 + (g - 128) * 0.85 + 15;
        b = 128 + (b - 128) * 0.85 + 20;

        // 略微青色调
        g = Math.min(255, g * 1.02);
        b = Math.min(255, b * 1.05);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 黄昏/日落 ====================

export function applySunsetFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 橙红色调
        r = Math.min(255, r * 1.2 + 30);
        g = g * 0.85 + 20;
        b = Math.max(0, b * 0.6);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 紫调 ====================

export function applyPurpleFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        r = Math.min(255, r * 1.1 + 20);
        g = Math.max(0, g * 0.8);
        b = Math.min(255, b * 1.2 + 30);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 柔焦效果 ====================

export function applySoftFocusFilter(imageData: ImageData, intensity: number = 40): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const softness = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 降低对比度 + 轻微提亮
        r = 128 + (r - 128) * (1 - softness * 0.3) + softness * 10;
        g = 128 + (g - 128) * (1 - softness * 0.3) + softness * 10;
        b = 128 + (b - 128) * (1 - softness * 0.3) + softness * 10;

        // 添加温暖光晕
        r = Math.min(255, r * (1 + softness * 0.05));

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 低对比度（莫兰迪色调） ====================

export function applyMorandiFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 降低饱和度
        const gray = (r + g + b) / 3;
        r = gray + (r - gray) * 0.4;
        g = gray + (g - gray) * 0.4;
        b = gray + (b - gray) * 0.4;

        // 降低对比度
        r = 128 + (r - 128) * 0.6;
        g = 128 + (g - 128) * 0.6;
        b = 128 + (b - 128) * 0.6;

        // 添加米灰色调
        r = r * 0.95 + 15;
        g = g * 0.93 + 13;
        b = b * 0.90 + 10;

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 胶片褪色 ====================

export function applyFadedFilmFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 提亮暗部（模拟褪色）
        r = r + (255 - r) * 0.15;
        g = g + (255 - g) * 0.12;
        b = b + (255 - b) * 0.18;

        // 降低对比度
        r = 128 + (r - 128) * 0.75;
        g = 128 + (g - 128) * 0.75;
        b = 128 + (b - 128) * 0.75;

        // 偏暖褐色
        r = Math.min(255, r * 1.05 + 5);
        g = g * 0.98;
        b = Math.max(0, b * 0.92 - 5);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 青橙色调 (Teal & Orange) ====================

export function applyTealOrangeFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = r * 0.299 + g * 0.587 + b * 0.114;

        if (lum < 128) {
            // 阴影偏青色
            r = r * 0.85;
            g = Math.min(255, g * 1.02);
            b = Math.min(255, b * 1.2 + 10);
        } else {
            // 高光偏橙色
            r = Math.min(255, r * 1.15 + 10);
            g = g * 0.95;
            b = Math.max(0, b * 0.75 - 10);
        }

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 奶油色调 ====================

export function applyCreamFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 降低饱和度
        const gray = (r + g + b) / 3;
        r = gray + (r - gray) * 0.6;
        g = gray + (g - gray) * 0.6;
        b = gray + (b - gray) * 0.6;

        // 添加奶油色（暖黄）
        r = Math.min(255, r + 20);
        g = Math.min(255, g + 15);
        b = Math.max(0, b - 10);

        // 轻微提亮
        r = Math.min(255, r * 1.02 + 5);
        g = Math.min(255, g * 1.02 + 5);
        b = Math.min(255, b * 1.0);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 森林绿 ====================

export function applyForestFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 增强绿色通道
        r = Math.max(0, r * 0.85 - 10);
        g = Math.min(255, g * 1.1 + 5);
        b = Math.max(0, b * 0.8 - 5);

        // 降低对比度，添加雾感
        r = 128 + (r - 128) * 0.85;
        g = 128 + (g - 128) * 0.9;
        b = 128 + (b - 128) * 0.85;

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 黑金效果 ====================

export function applyBlackGoldFilter(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = r * 0.299 + g * 0.587 + b * 0.114;

        // 高对比度
        const contrast = 1.3;
        lum < 128
            ? (r = r * 0.7, g = g * 0.7, b = b * 0.7)
            : (r = Math.min(255, r * 1.2), g = Math.min(255, g * 1.1), b = b * 0.8);

        // 金色调
        r = Math.min(255, r * 1.1 + 15);
        g = g * 0.95 + 8;
        b = Math.max(0, b * 0.7 - 10);

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 辅助函数 ====================

function hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ==================== 滤镜列表 ====================

export type FilterType =
    | 'vintage' | 'inkwash' | 'sepia' | 'highcontrast' | 'invert' | 'warm' | 'cool'
    | 'filmgrain' | 'lomo' | 'crossprocess' | 'hdr' | 'cinematic' | 'comic'
    | 'oilpaint' | 'sketch' | 'neon' | 'dreamy' | 'popart' | 'japanese' | 'sunset' | 'purple'
    | 'softfocus' | 'morandi' | 'fadedfilm' | 'tealorange' | 'cream' | 'forest' | 'blackgold';

export interface FilterInfo {
    id: FilterType;
    name: string;
    nameEn: string;
    icon: string;
    category: 'classic' | 'artistic' | 'color' | 'special';
}

export const FILTERS: FilterInfo[] = [
    // 经典
    { id: 'vintage', name: '复古', nameEn: 'Vintage', icon: '📷', category: 'classic' },
    { id: 'sepia', name: '怀旧', nameEn: 'Sepia', icon: '🌅', category: 'classic' },
    { id: 'filmgrain', name: '胶片', nameEn: 'Film Grain', icon: '🎞️', category: 'classic' },
    { id: 'lomo', name: 'LOMO', nameEn: 'LOMO', icon: '📸', category: 'classic' },
    { id: 'fadedfilm', name: '褰色胶片', nameEn: 'Faded Film', icon: '✨', category: 'classic' },

    // 艺术
    { id: 'inkwash', name: '水墨', nameEn: 'Ink Wash', icon: '🖌️', category: 'artistic' },
    { id: 'oilpaint', name: '油画', nameEn: 'Oil Paint', icon: '🎨', category: 'artistic' },
    { id: 'sketch', name: '素描', nameEn: 'Sketch', icon: '✏️', category: 'artistic' },
    { id: 'comic', name: '漫画', nameEn: 'Comic', icon: '💥', category: 'artistic' },
    { id: 'popart', name: '波普', nameEn: 'Pop Art', icon: '🔴', category: 'artistic' },
    { id: 'neon', name: '霓虹', nameEn: 'Neon', icon: '🌈', category: 'artistic' },

    // 色调
    { id: 'warm', name: '暖色调', nameEn: 'Warm', icon: '🌞', category: 'color' },
    { id: 'cool', name: '冷色调', nameEn: 'Cool', icon: '❄️', category: 'color' },
    { id: 'sunset', name: '日落', nameEn: 'Sunset', icon: '🌇', category: 'color' },
    { id: 'purple', name: '紫调', nameEn: 'Purple', icon: '💜', category: 'color' },
    { id: 'japanese', name: '小清新', nameEn: 'Japanese', icon: '🌸', category: 'color' },
    { id: 'tealorange', name: '青橙', nameEn: 'Teal Orange', icon: '🎬', category: 'color' },
    { id: 'cream', name: '奶油', nameEn: 'Cream', icon: '🧊', category: 'color' },
    { id: 'forest', name: '森林绿', nameEn: 'Forest', icon: '🌲', category: 'color' },
    { id: 'morandi', name: '莫兰迪', nameEn: 'Morandi', icon: '🧑‍🎨', category: 'color' },

    // 特效
    { id: 'highcontrast', name: '高对比', nameEn: 'High Contrast', icon: '⚫', category: 'special' },
    { id: 'invert', name: '反转', nameEn: 'Invert', icon: '🔄', category: 'special' },
    { id: 'crossprocess', name: '交叉冲印', nameEn: 'Cross Process', icon: '🔀', category: 'special' },
    { id: 'hdr', name: 'HDR', nameEn: 'HDR', icon: '✨', category: 'special' },
    { id: 'cinematic', name: '电影', nameEn: 'Cinematic', icon: '🎬', category: 'special' },
    { id: 'dreamy', name: '梦幻', nameEn: 'Dreamy', icon: '💫', category: 'special' },
    { id: 'softfocus', name: '柔焦', nameEn: 'Soft Focus', icon: '☁️', category: 'special' },
    { id: 'blackgold', name: '黑金', nameEn: 'Black Gold', icon: '🌟', category: 'special' },
];

/**
 * 应用滤镜
 */
export function applyFilter(imageData: ImageData, filterType: FilterType, intensity: number = 50): ImageData {
    switch (filterType) {
        case 'vintage': return applyVintageFilter(imageData);
        case 'inkwash': return applyInkWashFilter(imageData, intensity);
        case 'sepia': return applySepiaFilter(imageData);
        case 'highcontrast': return applyHighContrastBW(imageData, intensity);
        case 'invert': return applyInvertFilter(imageData);
        case 'warm': return applyWarmFilter(imageData, intensity);
        case 'cool': return applyCoolFilter(imageData, intensity);
        case 'filmgrain': return applyFilmGrainFilter(imageData, intensity);
        case 'lomo': return applyLomoFilter(imageData);
        case 'crossprocess': return applyCrossProcessFilter(imageData);
        case 'hdr': return applyHDRFilter(imageData, intensity);
        case 'cinematic': return applyCinematicFilter(imageData);
        case 'comic': return applyComicFilter(imageData);
        case 'oilpaint': return applyOilPaintFilter(imageData);
        case 'sketch': return applySketchFilter(imageData);
        case 'neon': return applyNeonFilter(imageData);
        case 'dreamy': return applyDreamyFilter(imageData, intensity);
        case 'popart': return applyPopArtFilter(imageData);
        case 'japanese': return applyJapaneseFilter(imageData);
        case 'sunset': return applySunsetFilter(imageData);
        case 'purple': return applyPurpleFilter(imageData);
        case 'softfocus': return applySoftFocusFilter(imageData, intensity);
        case 'morandi': return applyMorandiFilter(imageData);
        case 'fadedfilm': return applyFadedFilmFilter(imageData);
        case 'tealorange': return applyTealOrangeFilter(imageData);
        case 'cream': return applyCreamFilter(imageData);
        case 'forest': return applyForestFilter(imageData);
        case 'blackgold': return applyBlackGoldFilter(imageData);
        default: return imageData;
    }
}

/**
 * 应用多个滤镜（叠加）
 * 💡 按顺序应用滤镜，支持叠加效果
 */
export function applyMultipleFilters(
    imageData: ImageData,
    filters: { type: FilterType; intensity: number }[]
): ImageData {
    let result = imageData;
    for (const filter of filters) {
        result = applyFilter(result, filter.type, filter.intensity);
    }
    return result;
}
