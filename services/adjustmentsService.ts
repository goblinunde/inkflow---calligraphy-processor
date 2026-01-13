/**
 * Advanced Adjustments Service - 高级调整服务
 * 💡 提供曲线、HSL、色温等专业级调色功能
 */

export interface CurvePoint {
    x: number;  // 输入值 0-255
    y: number;  // 输出值 0-255
}

export interface HSLAdjustment {
    hue: number;        // -180 to 180
    saturation: number; // -100 to 100
    lightness: number;  // -100 to 100
}

/**
 * 应用曲线调整
 * 💡 使用三次样条插值
 */
export const applyCurves = (
    imageData: ImageData,
    curvePoints: CurvePoint[],
    channel: 'rgb' | 'red' | 'green' | 'blue' = 'rgb'
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    // 生成查找表 (LUT)
    const lut = generateCurveLUT(curvePoints);

    for (let i = 0; i < data.length; i += 4) {
        if (channel === 'rgb' || channel === 'red') {
            result[i] = lut[data[i]];
        }
        if (channel === 'rgb' || channel === 'green') {
            result[i + 1] = lut[data[i + 1]];
        }
        if (channel === 'rgb' || channel === 'blue') {
            result[i + 2] = lut[data[i + 2]];
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 生成曲线查找表
 */
const generateCurveLUT = (points: CurvePoint[]): Uint8Array => {
    const lut = new Uint8Array(256);

    // 确保有起点和终点
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    if (sortedPoints[0].x !== 0) sortedPoints.unshift({ x: 0, y: 0 });
    if (sortedPoints[sortedPoints.length - 1].x !== 255) sortedPoints.push({ x: 255, y: 255 });

    // 简单线性插值
    for (let i = 0; i < 256; i++) {
        let lower = sortedPoints[0];
        let upper = sortedPoints[sortedPoints.length - 1];

        for (let j = 0; j < sortedPoints.length - 1; j++) {
            if (sortedPoints[j].x <= i && sortedPoints[j + 1].x >= i) {
                lower = sortedPoints[j];
                upper = sortedPoints[j + 1];
                break;
            }
        }

        if (upper.x === lower.x) {
            lut[i] = Math.round(lower.y);
        } else {
            const t = (i - lower.x) / (upper.x - lower.x);
            lut[i] = Math.round(lower.y + t * (upper.y - lower.y));
        }
    }

    return lut;
};

/**
 * HSL 调整
 * 💡 精细控制色相、饱和度、明度
 */
export const applyHSL = (
    imageData: ImageData,
    adjustment: HSLAdjustment
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        // RGB to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        // 应用调整
        h = (h + adjustment.hue / 360 + 1) % 1;
        s = Math.max(0, Math.min(1, s + adjustment.saturation / 100));
        l = Math.max(0, Math.min(1, l + adjustment.lightness / 100));

        // HSL to RGB
        let rOut, gOut, bOut;

        if (s === 0) {
            rOut = gOut = bOut = l;
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

            rOut = hue2rgb(p, q, h + 1 / 3);
            gOut = hue2rgb(p, q, h);
            bOut = hue2rgb(p, q, h - 1 / 3);
        }

        result[i] = Math.round(rOut * 255);
        result[i + 1] = Math.round(gOut * 255);
        result[i + 2] = Math.round(bOut * 255);
    }

    return new ImageData(result, width, height);
};

/**
 * 色温调整
 * 💡 模拟白平衡效果
 */
export const applyColorTemperature = (
    imageData: ImageData,
    temperature: number  // -100 (冷) to 100 (暖)
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const t = temperature / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (t > 0) {
            // 暖色调：增加红黄，减少蓝
            r = Math.min(255, r + t * 30);
            g = Math.min(255, g + t * 15);
            b = Math.max(0, b - t * 20);
        } else {
            // 冷色调：增加蓝，减少红黄
            r = Math.max(0, r + t * 20);
            g = Math.max(0, g + t * 10);
            b = Math.min(255, b - t * 30);
        }

        result[i] = Math.round(r);
        result[i + 1] = Math.round(g);
        result[i + 2] = Math.round(b);
    }

    return new ImageData(result, width, height);
};

/**
 * 色调调整 (Tint)
 * 💡 绿色-品红轴
 */
export const applyTint = (
    imageData: ImageData,
    tint: number  // -100 (绿) to 100 (品红)
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const t = tint / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (t > 0) {
            // 品红：增加红蓝，减少绿
            r = Math.min(255, r + t * 15);
            g = Math.max(0, g - t * 20);
            b = Math.min(255, b + t * 15);
        } else {
            // 绿色：减少红蓝，增加绿
            r = Math.max(0, r + t * 15);
            g = Math.min(255, g - t * 20);
            b = Math.max(0, b + t * 15);
        }

        result[i] = Math.round(r);
        result[i + 1] = Math.round(g);
        result[i + 2] = Math.round(b);
    }

    return new ImageData(result, width, height);
};

/**
 * 清晰度 (Clarity)
 * 💡 局部对比度增强
 */
export const applyClarity = (
    imageData: ImageData,
    amount: number  // 0 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const radius = 15;
    const strength = amount / 100;

    // 简化的局部对比度增强
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const idx = (y * width + x) * 4;

            // 计算局部平均
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let ky = -radius; ky <= radius; ky += 3) {
                for (let kx = -radius; kx <= radius; kx += 3) {
                    const nIdx = ((y + ky) * width + (x + kx)) * 4;
                    sumR += data[nIdx];
                    sumG += data[nIdx + 1];
                    sumB += data[nIdx + 2];
                    count++;
                }
            }

            const avgR = sumR / count;
            const avgG = sumG / count;
            const avgB = sumB / count;

            // 增强与局部平均的差异
            result[idx] = Math.max(0, Math.min(255, data[idx] + (data[idx] - avgR) * strength));
            result[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + (data[idx + 1] - avgG) * strength));
            result[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + (data[idx + 2] - avgB) * strength));
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 高光/阴影恢复
 */
export const adjustHighlightsShadows = (
    imageData: ImageData,
    highlights: number,  // -100 to 100
    shadows: number      // -100 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        let factor = 1;

        // 高光调整 (亮度 > 0.5)
        if (lum > 0.5 && highlights !== 0) {
            const highlightAmount = (lum - 0.5) * 2;
            factor *= 1 + (highlights / 100) * highlightAmount * -0.3;
        }

        // 阴影调整 (亮度 < 0.5)
        if (lum < 0.5 && shadows !== 0) {
            const shadowAmount = (0.5 - lum) * 2;
            factor *= 1 + (shadows / 100) * shadowAmount * 0.3;
        }

        result[i] = Math.max(0, Math.min(255, r * factor));
        result[i + 1] = Math.max(0, Math.min(255, g * factor));
        result[i + 2] = Math.max(0, Math.min(255, b * factor));
    }

    return new ImageData(result, width, height);
};

/**
 * 晕影效果
 */
export const applyVignette = (
    imageData: ImageData,
    amount: number,     // 0 to 100
    roundness: number = 50  // 0 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
    const strength = amount / 100;
    const round = roundness / 100;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // 计算到中心的距离
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const dist = Math.sqrt(dx * dx * (1 + (1 - round)) + dy * dy * (1 + round));

            // 晕影因子
            const vignette = 1 - Math.pow(Math.min(1, dist), 2) * strength;

            result[idx] = Math.round(data[idx] * vignette);
            result[idx + 1] = Math.round(data[idx + 1] * vignette);
            result[idx + 2] = Math.round(data[idx + 2] * vignette);
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 曝光调整
 * 💡 模拟相机曝光补偿
 */
export const applyExposure = (
    imageData: ImageData,
    exposure: number  // -100 to 100 (EV)
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const factor = Math.pow(2, exposure / 50);

    for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.max(0, Math.min(255, data[i] * factor));
        result[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
        result[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

/**
 * 自然饱和度 (Vibrance)
 * 💡 智能饱和度，保护已饱和区域
 */
export const applyVibrance = (
    imageData: ImageData,
    vibrance: number  // -100 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const v = vibrance / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        // 低饱和区域增加更多，高饱和区域保护
        const boost = v * (1 - saturation);
        const gray = (r + g + b) / 3;

        result[i] = Math.max(0, Math.min(255, gray + (r - gray) * (1 + boost)));
        result[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * (1 + boost)));
        result[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * (1 + boost)));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

/**
 * 黑色/白色点调整
 * 💡 调整色阶端点
 */
export const adjustBlacksWhites = (
    imageData: ImageData,
    blacks: number,   // -100 to 100
    whites: number    // -100 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const blackPoint = -blacks * 0.5;
    const whitePoint = 255 + whites * 0.5;
    const range = whitePoint - blackPoint;

    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const val = ((data[i + c] - blackPoint) / range) * 255;
            result[i + c] = Math.max(0, Math.min(255, val));
        }
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

/**
 * 去雾效果
 * 💡 增加对比度和清晰度，减少朦胧感
 */
export const applyDehaze = (
    imageData: ImageData,
    amount: number  // 0 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const strength = amount / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // 增强对比度
        r = 128 + (r - 128) * (1 + strength * 0.5);
        g = 128 + (g - 128) * (1 + strength * 0.5);
        b = 128 + (b - 128) * (1 + strength * 0.5);

        // 减少蓝色雾感
        b = b - strength * 15;

        result[i] = Math.max(0, Math.min(255, r));
        result[i + 1] = Math.max(0, Math.min(255, g));
        result[i + 2] = Math.max(0, Math.min(255, b));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

/**
 * 颗粒效果
 */
export const applyGrain = (
    imageData: ImageData,
    amount: number,   // 0 to 100
    size: number = 1  // 1-3
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const grainStrength = amount * 0.5;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * grainStrength;
        result[i] = Math.max(0, Math.min(255, data[i] + noise));
        result[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        result[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

/**
 * 分离色调
 * 💡 高光和阴影分别着色
 */
export const applySplitToning = (
    imageData: ImageData,
    highlightHue: number,     // 0-360
    highlightSaturation: number, // 0-100
    shadowHue: number,        // 0-360
    shadowSaturation: number, // 0-100
    balance: number = 0       // -100 to 100
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
        h = h / 360;
        s = s / 100;
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

        return [r * 255, g * 255, b * 255];
    };

    const balancePoint = (50 + balance / 2) / 100;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

        let tintR = 0, tintG = 0, tintB = 0, tintStrength = 0;

        if (lum > balancePoint) {
            // 高光
            const [hr, hg, hb] = hslToRgb(highlightHue, highlightSaturation, 0.5);
            const amount = (lum - balancePoint) / (1 - balancePoint);
            tintR = hr; tintG = hg; tintB = hb;
            tintStrength = amount * (highlightSaturation / 100) * 0.3;
        } else {
            // 阴影
            const [sr, sg, sb] = hslToRgb(shadowHue, shadowSaturation, 0.5);
            const amount = (balancePoint - lum) / balancePoint;
            tintR = sr; tintG = sg; tintB = sb;
            tintStrength = amount * (shadowSaturation / 100) * 0.3;
        }

        result[i] = Math.max(0, Math.min(255, r + (tintR - 128) * tintStrength));
        result[i + 1] = Math.max(0, Math.min(255, g + (tintG - 128) * tintStrength));
        result[i + 2] = Math.max(0, Math.min(255, b + (tintB - 128) * tintStrength));
        result[i + 3] = data[i + 3];
    }

    return new ImageData(result, width, height);
};

export default {
    applyCurves,
    applyHSL,
    applyColorTemperature,
    applyTint,
    applyClarity,
    adjustHighlightsShadows,
    applyVignette,
    applyExposure,
    applyVibrance,
    adjustBlacksWhites,
    applyDehaze,
    applyGrain,
    applySplitToning
};
