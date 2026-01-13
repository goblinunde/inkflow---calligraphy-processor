/**
 * Selection Service - 选区服务
 * 💡 提供选区 Mask 生成、羽化、边缘检测等功能
 */

export interface SelectionPoint {
    x: number;
    y: number;
}

export interface SelectionPath {
    points: SelectionPoint[];
    closed: boolean;
}

/**
 * 从路径点生成选区 Mask
 * 💡 使用扫描线填充算法
 */
export const generateMaskFromPath = (
    path: SelectionPath,
    width: number,
    height: number
): Uint8Array => {
    const mask = new Uint8Array(width * height);

    if (!path.closed || path.points.length < 3) {
        return mask;
    }

    // 💡 扫描线填充算法
    const points = path.points;

    for (let y = 0; y < height; y++) {
        const intersections: number[] = [];

        // 找出与扫描线相交的边
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            // 检查边是否与当前扫描线相交
            if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
                // 计算交点的 x 坐标
                const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
                intersections.push(x);
            }
        }

        // 排序交点
        intersections.sort((a, b) => a - b);

        // 填充交点之间的区域
        for (let i = 0; i < intersections.length; i += 2) {
            if (i + 1 < intersections.length) {
                const xStart = Math.max(0, Math.ceil(intersections[i]));
                const xEnd = Math.min(width - 1, Math.floor(intersections[i + 1]));
                for (let x = xStart; x <= xEnd; x++) {
                    mask[y * width + x] = 255;
                }
            }
        }
    }

    return mask;
};

/**
 * 对 Mask 进行羽化处理
 * 💡 使用高斯模糊实现边缘柔化
 */
export const featherMask = (
    mask: Uint8Array,
    width: number,
    height: number,
    radius: number
): Uint8Array => {
    if (radius <= 0) return mask;

    const result = new Uint8Array(mask.length);

    // 简化的高斯模糊
    const sigma = radius / 3;
    const kernelSize = Math.ceil(radius * 2) + 1;
    const kernel: number[] = [];
    let kernelSum = 0;

    // 生成一维高斯核
    for (let i = 0; i < kernelSize; i++) {
        const x = i - Math.floor(kernelSize / 2);
        const g = Math.exp(-(x * x) / (2 * sigma * sigma));
        kernel.push(g);
        kernelSum += g;
    }

    // 归一化
    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= kernelSum;
    }

    // 水平方向模糊
    const temp = new Float32Array(mask.length);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let k = 0; k < kernelSize; k++) {
                const nx = Math.min(width - 1, Math.max(0, x + k - halfKernel));
                sum += mask[y * width + nx] * kernel[k];
            }
            temp[y * width + x] = sum;
        }
    }

    // 垂直方向模糊
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let k = 0; k < kernelSize; k++) {
                const ny = Math.min(height - 1, Math.max(0, y + k - halfKernel));
                sum += temp[ny * width + x] * kernel[k];
            }
            result[y * width + x] = Math.round(sum);
        }
    }

    return result;
};

/**
 * 扩展选区
 */
export const expandMask = (
    mask: Uint8Array,
    width: number,
    height: number,
    pixels: number
): Uint8Array => {
    if (pixels === 0) return mask;

    let current = new Uint8Array(mask);
    const expand = pixels > 0;
    const iterations = Math.abs(pixels);

    for (let iter = 0; iter < iterations; iter++) {
        const next = new Uint8Array(current);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const val = current[idx];

                if (expand) {
                    // 膨胀：如果周围有白色像素，则变白
                    if (val === 0) {
                        const neighbors = [
                            y > 0 ? current[(y - 1) * width + x] : 0,
                            y < height - 1 ? current[(y + 1) * width + x] : 0,
                            x > 0 ? current[y * width + x - 1] : 0,
                            x < width - 1 ? current[y * width + x + 1] : 0
                        ];
                        if (neighbors.some(n => n > 0)) {
                            next[idx] = 255;
                        }
                    }
                } else {
                    // 收缩：如果周围有黑色像素，则变黑
                    if (val > 0) {
                        const neighbors = [
                            y > 0 ? current[(y - 1) * width + x] : 0,
                            y < height - 1 ? current[(y + 1) * width + x] : 0,
                            x > 0 ? current[y * width + x - 1] : 0,
                            x < width - 1 ? current[y * width + x + 1] : 0
                        ];
                        if (neighbors.some(n => n === 0)) {
                            next[idx] = 0;
                        }
                    }
                }
            }
        }

        current = next;
    }

    return current;
};

/**
 * 反选 Mask
 */
export const invertMask = (mask: Uint8Array): Uint8Array => {
    const result = new Uint8Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
        result[i] = 255 - mask[i];
    }
    return result;
};

/**
 * 从矩形生成 Mask
 */
export const generateMaskFromRect = (
    x: number,
    y: number,
    rectWidth: number,
    rectHeight: number,
    canvasWidth: number,
    canvasHeight: number
): Uint8Array => {
    const mask = new Uint8Array(canvasWidth * canvasHeight);

    const x1 = Math.max(0, Math.min(x, canvasWidth));
    const y1 = Math.max(0, Math.min(y, canvasHeight));
    const x2 = Math.max(0, Math.min(x + rectWidth, canvasWidth));
    const y2 = Math.max(0, Math.min(y + rectHeight, canvasHeight));

    for (let py = y1; py < y2; py++) {
        for (let px = x1; px < x2; px++) {
            mask[py * canvasWidth + px] = 255;
        }
    }

    return mask;
};

/**
 * 将 Mask 转换为 ImageData（用于显示）
 */
export const maskToImageData = (
    mask: Uint8Array,
    width: number,
    height: number,
    color: { r: number; g: number; b: number; a: number } = { r: 255, g: 0, b: 0, a: 128 }
): ImageData => {
    const imageData = new ImageData(width, height);
    for (let i = 0; i < mask.length; i++) {
        const idx = i * 4;
        if (mask[i] > 0) {
            const alpha = (mask[i] / 255) * color.a;
            imageData.data[idx] = color.r;
            imageData.data[idx + 1] = color.g;
            imageData.data[idx + 2] = color.b;
            imageData.data[idx + 3] = alpha;
        }
    }
    return imageData;
};

export default {
    generateMaskFromPath,
    generateMaskFromRect,
    featherMask,
    expandMask,
    invertMask,
    maskToImageData
};
