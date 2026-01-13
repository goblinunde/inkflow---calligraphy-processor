/**
 * Retouch Service - 高级修图服务
 * 💡 提供减淡、加深、锐化、降噪等笔刷工具
 */

export interface BrushSettings {
    size: number;        // 笔刷大小
    hardness: number;    // 硬度 0-100
    opacity: number;     // 不透明度 0-100
    flow: number;        // 流量 0-100
}

const defaultBrush: BrushSettings = {
    size: 30,
    hardness: 50,
    opacity: 50,
    flow: 50
};

/**
 * 生成笔刷蒙版（圆形渐变）
 */
const createBrushMask = (size: number, hardness: number): number[] => {
    const mask: number[] = [];
    const center = size / 2;
    const innerRadius = (hardness / 100) * center;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
            let alpha: number;

            if (dist <= innerRadius) {
                alpha = 1;
            } else if (dist <= center) {
                alpha = 1 - (dist - innerRadius) / (center - innerRadius);
            } else {
                alpha = 0;
            }
            mask.push(alpha);
        }
    }
    return mask;
};

/**
 * 减淡工具 (Dodge) - 局部提亮
 * 💡 提升高光和中间调
 */
export const dodge = (
    imageData: ImageData,
    x: number,
    y: number,
    brush: Partial<BrushSettings> = {},
    range: 'highlights' | 'midtones' | 'shadows' = 'midtones'
): ImageData => {
    const settings = { ...defaultBrush, ...brush };
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const mask = createBrushMask(settings.size, settings.hardness);
    const half = Math.floor(settings.size / 2);

    const exposure = settings.opacity / 100 * 0.3; // 最大提亮 30%

    for (let dy = 0; dy < settings.size; dy++) {
        for (let dx = 0; dx < settings.size; dx++) {
            const px = x - half + dx;
            const py = y - half + dy;

            if (px < 0 || px >= width || py < 0 || py >= height) continue;

            const maskValue = mask[dy * settings.size + dx];
            if (maskValue === 0) continue;

            const idx = (py * width + px) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            // 根据范围调整影响
            let rangeMult = 1;
            if (range === 'highlights' && luminance < 0.5) rangeMult = luminance * 2;
            else if (range === 'shadows' && luminance > 0.5) rangeMult = (1 - luminance) * 2;

            const strength = maskValue * exposure * rangeMult * (settings.flow / 100);

            result[idx] = Math.min(255, r + (255 - r) * strength);
            result[idx + 1] = Math.min(255, g + (255 - g) * strength);
            result[idx + 2] = Math.min(255, b + (255 - b) * strength);
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 加深工具 (Burn) - 局部压暗
 * 💡 加深阴影和中间调
 */
export const burn = (
    imageData: ImageData,
    x: number,
    y: number,
    brush: Partial<BrushSettings> = {},
    range: 'highlights' | 'midtones' | 'shadows' = 'midtones'
): ImageData => {
    const settings = { ...defaultBrush, ...brush };
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const mask = createBrushMask(settings.size, settings.hardness);
    const half = Math.floor(settings.size / 2);

    const exposure = settings.opacity / 100 * 0.3;

    for (let dy = 0; dy < settings.size; dy++) {
        for (let dx = 0; dx < settings.size; dx++) {
            const px = x - half + dx;
            const py = y - half + dy;

            if (px < 0 || px >= width || py < 0 || py >= height) continue;

            const maskValue = mask[dy * settings.size + dx];
            if (maskValue === 0) continue;

            const idx = (py * width + px) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            let rangeMult = 1;
            if (range === 'highlights' && luminance < 0.5) rangeMult = luminance * 2;
            else if (range === 'shadows' && luminance > 0.5) rangeMult = (1 - luminance) * 2;

            const strength = maskValue * exposure * rangeMult * (settings.flow / 100);

            result[idx] = Math.max(0, r - r * strength);
            result[idx + 1] = Math.max(0, g - g * strength);
            result[idx + 2] = Math.max(0, b - b * strength);
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 锐化笔刷 - 局部增强清晰度
 * 💡 使用 Unsharp Mask 算法
 */
export const sharpenBrush = (
    imageData: ImageData,
    x: number,
    y: number,
    brush: Partial<BrushSettings> = {}
): ImageData => {
    const settings = { ...defaultBrush, ...brush };
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const half = Math.floor(settings.size / 2);
    const mask = createBrushMask(settings.size, settings.hardness);

    const amount = (settings.opacity / 100) * 2;

    for (let dy = 0; dy < settings.size; dy++) {
        for (let dx = 0; dx < settings.size; dx++) {
            const px = x - half + dx;
            const py = y - half + dy;

            if (px < 1 || px >= width - 1 || py < 1 || py >= height - 1) continue;

            const maskValue = mask[dy * settings.size + dx];
            if (maskValue === 0) continue;

            const idx = (py * width + px) * 4;

            // 拉普拉斯锐化核
            for (let c = 0; c < 3; c++) {
                const center = data[idx + c];
                const top = data[((py - 1) * width + px) * 4 + c];
                const bottom = data[((py + 1) * width + px) * 4 + c];
                const left = data[(py * width + px - 1) * 4 + c];
                const right = data[(py * width + px + 1) * 4 + c];

                const laplacian = 4 * center - top - bottom - left - right;
                const sharpened = center + laplacian * amount * maskValue * (settings.flow / 100);

                result[idx + c] = Math.max(0, Math.min(255, sharpened));
            }
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 降噪笔刷 - 局部平滑
 * 💡 使用双边滤波思想
 */
export const denoiseBrush = (
    imageData: ImageData,
    x: number,
    y: number,
    brush: Partial<BrushSettings> = {}
): ImageData => {
    const settings = { ...defaultBrush, ...brush };
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const half = Math.floor(settings.size / 2);
    const mask = createBrushMask(settings.size, settings.hardness);

    const blurRadius = Math.max(1, Math.floor(settings.opacity / 20));

    for (let dy = 0; dy < settings.size; dy++) {
        for (let dx = 0; dx < settings.size; dx++) {
            const px = x - half + dx;
            const py = y - half + dy;

            if (px < blurRadius || px >= width - blurRadius ||
                py < blurRadius || py >= height - blurRadius) continue;

            const maskValue = mask[dy * settings.size + dx];
            if (maskValue === 0) continue;

            const idx = (py * width + px) * 4;
            const centerR = data[idx], centerG = data[idx + 1], centerB = data[idx + 2];

            let sumR = 0, sumG = 0, sumB = 0, weight = 0;

            // 双边滤波：空间距离 + 颜色差异
            for (let ky = -blurRadius; ky <= blurRadius; ky++) {
                for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                    const nIdx = ((py + ky) * width + (px + kx)) * 4;
                    const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];

                    const spatialDist = Math.sqrt(kx * kx + ky * ky);
                    const colorDist = Math.sqrt((nr - centerR) ** 2 + (ng - centerG) ** 2 + (nb - centerB) ** 2);

                    const w = Math.exp(-spatialDist / blurRadius) * Math.exp(-colorDist / 50);

                    sumR += nr * w;
                    sumG += ng * w;
                    sumB += nb * w;
                    weight += w;
                }
            }

            const blendFactor = maskValue * (settings.flow / 100);
            result[idx] = Math.round(centerR * (1 - blendFactor) + (sumR / weight) * blendFactor);
            result[idx + 1] = Math.round(centerG * (1 - blendFactor) + (sumG / weight) * blendFactor);
            result[idx + 2] = Math.round(centerB * (1 - blendFactor) + (sumB / weight) * blendFactor);
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 饱和度笔刷 - 局部调整饱和度
 */
export const saturateBrush = (
    imageData: ImageData,
    x: number,
    y: number,
    brush: Partial<BrushSettings> = {},
    desaturate: boolean = false
): ImageData => {
    const settings = { ...defaultBrush, ...brush };
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const half = Math.floor(settings.size / 2);
    const mask = createBrushMask(settings.size, settings.hardness);

    const amount = (settings.opacity / 100) * (desaturate ? -1 : 1);

    for (let dy = 0; dy < settings.size; dy++) {
        for (let dx = 0; dx < settings.size; dx++) {
            const px = x - half + dx;
            const py = y - half + dy;

            if (px < 0 || px >= width || py < 0 || py >= height) continue;

            const maskValue = mask[dy * settings.size + dx];
            if (maskValue === 0) continue;

            const idx = (py * width + px) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // RGB to HSL
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const l = (max + min) / 2 / 255;
            let s = 0, h = 0;

            if (max !== min) {
                const d = (max - min) / 255;
                s = l > 0.5 ? d / (2 - max / 255 - min / 255) : d / (max / 255 + min / 255);

                switch (max) {
                    case r: h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / (max - min) + 2) / 6; break;
                    case b: h = ((r - g) / (max - min) + 4) / 6; break;
                }
            }

            // 调整饱和度
            s = Math.max(0, Math.min(1, s + amount * maskValue * (settings.flow / 100)));

            // HSL to RGB
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

            result[idx] = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
            result[idx + 1] = Math.round(hue2rgb(p, q, h) * 255);
            result[idx + 2] = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 红眼消除
 * 💡 检测红色区域并替换为黑色
 */
export const removeRedEye = (
    imageData: ImageData,
    x: number,
    y: number,
    radius: number = 10
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const px = x + dx;
            const py = y + dy;

            if (px < 0 || px >= width || py < 0 || py >= height) continue;
            if (Math.sqrt(dx * dx + dy * dy) > radius) continue;

            const idx = (py * width + px) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];

            // 检测是否为红色
            const isRed = r > 100 && r > g * 1.5 && r > b * 1.5;

            if (isRed) {
                // 替换为灰色（保持亮度）
                const lum = (r * 0.299 + g * 0.587 + b * 0.114);
                result[idx] = lum * 0.3;
                result[idx + 1] = lum * 0.3;
                result[idx + 2] = lum * 0.3;
            }
        }
    }

    return new ImageData(result, width, height);
};

export default {
    dodge,
    burn,
    sharpenBrush,
    denoiseBrush,
    saturateBrush,
    removeRedEye
};
