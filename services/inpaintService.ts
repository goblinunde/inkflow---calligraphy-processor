/**
 * Inpainting Service - 内容感知填充/去水印服务
 * 💡 使用 OpenCV.js 的 inpaint 算法实现专业级内容修复
 */
import cv from '@techstark/opencv-js';
import { initOpenCV, isCvReady } from './opencvService';

export type InpaintMethod = 'telea' | 'ns';

interface InpaintOptions {
    method: InpaintMethod;
    radius: number;
}

/**
 * 内容感知填充 - 使用 OpenCV inpaint
 * 💡 支持 Telea 和 Navier-Stokes 两种算法
 * @param imageData - 原始图像数据
 * @param mask - 选区 Mask (白色区域将被填充)
 * @param options - inpaint 选项
 */
export const inpaint = async (
    imageData: ImageData,
    mask: Uint8Array,
    options: InpaintOptions = { method: 'telea', radius: 3 }
): Promise<ImageData> => {
    // 确保 OpenCV 已加载
    if (!isCvReady()) {
        await initOpenCV();
    }

    const { width, height } = imageData;
    const { method, radius } = options;

    // 创建 OpenCV Mat
    const src = cv.matFromImageData(imageData);
    const maskMat = new cv.Mat(height, width, cv.CV_8UC1);
    const dst = new cv.Mat();

    // 转换 mask 到 OpenCV 格式
    for (let i = 0; i < mask.length; i++) {
        maskMat.data[i] = mask[i];
    }

    // 转换为 RGB（inpaint 需要 3 通道）
    const srcRgb = new cv.Mat();
    cv.cvtColor(src, srcRgb, cv.COLOR_RGBA2RGB);

    // 选择 inpaint 算法
    // cv.INPAINT_TELEA: 基于快速行进方法
    // cv.INPAINT_NS: 基于 Navier-Stokes 方程
    const flag = method === 'telea' ? cv.INPAINT_TELEA : cv.INPAINT_NS;

    // 执行 inpainting
    cv.inpaint(srcRgb, maskMat, dst, radius, flag);

    // 转换回 RGBA
    const dstRgba = new cv.Mat();
    cv.cvtColor(dst, dstRgba, cv.COLOR_RGB2RGBA);

    // 转换为 ImageData
    const resultData = new Uint8ClampedArray(dstRgba.data);
    const result = new ImageData(resultData, width, height);

    // 清理
    src.delete();
    maskMat.delete();
    srcRgb.delete();
    dst.delete();
    dstRgba.delete();

    return result;
};

/**
 * 简单的区域模糊修复（当 OpenCV 不可用时的备选）
 * 💡 使用周围像素的平均值填充选区
 */
export const simpleInpaint = (
    imageData: ImageData,
    mask: Uint8Array,
    iterations: number = 5
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    for (let iter = 0; iter < iterations; iter++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;

                // 只处理 mask 区域
                if (mask[idx] === 0) continue;

                const pixelIdx = idx * 4;

                // 收集邻居像素
                let sumR = 0, sumG = 0, sumB = 0, count = 0;

                const neighbors = [
                    [-1, 0], [1, 0], [0, -1], [0, 1],
                    [-1, -1], [1, -1], [-1, 1], [1, 1]
                ];

                for (const [dx, dy] of neighbors) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const nIdx = ny * width + nx;
                    const nPixelIdx = nIdx * 4;

                    // 优先使用非 mask 区域的像素
                    if (mask[nIdx] === 0 || iter > 0) {
                        sumR += result[nPixelIdx];
                        sumG += result[nPixelIdx + 1];
                        sumB += result[nPixelIdx + 2];
                        count++;
                    }
                }

                if (count > 0) {
                    result[pixelIdx] = Math.round(sumR / count);
                    result[pixelIdx + 1] = Math.round(sumG / count);
                    result[pixelIdx + 2] = Math.round(sumB / count);
                    result[pixelIdx + 3] = 255;
                }
            }
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 克隆图章工具
 * 💡 从源点采样并绘制到目标位置
 */
export const cloneStamp = (
    imageData: ImageData,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    brushSize: number,
    opacity: number = 1
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);
    const halfBrush = Math.floor(brushSize / 2);

    for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
            // 圆形笔刷
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > halfBrush) continue;

            const sx = sourceX + dx;
            const sy = sourceY + dy;
            const tx = targetX + dx;
            const ty = targetY + dy;

            // 边界检查
            if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
            if (tx < 0 || tx >= width || ty < 0 || ty >= height) continue;

            const srcIdx = (sy * width + sx) * 4;
            const tgtIdx = (ty * width + tx) * 4;

            // 计算边缘衰减
            const falloff = 1 - (dist / halfBrush) * 0.5;
            const alpha = opacity * falloff;

            // 混合
            result[tgtIdx] = Math.round(data[srcIdx] * alpha + result[tgtIdx] * (1 - alpha));
            result[tgtIdx + 1] = Math.round(data[srcIdx + 1] * alpha + result[tgtIdx + 1] * (1 - alpha));
            result[tgtIdx + 2] = Math.round(data[srcIdx + 2] * alpha + result[tgtIdx + 2] * (1 - alpha));
        }
    }

    return new ImageData(result, width, height);
};

/**
 * 污点修复 - 小区域快速 inpaint
 * 💡 使用周围纹理快速填充小瑕疵
 */
export const spotHeal = (
    imageData: ImageData,
    centerX: number,
    centerY: number,
    brushSize: number
): ImageData => {
    const { width, height } = imageData;

    // 生成圆形 mask
    const mask = new Uint8Array(width * height);
    const halfBrush = Math.floor(brushSize / 2);

    for (let dy = -halfBrush; dy <= halfBrush; dy++) {
        for (let dx = -halfBrush; dx <= halfBrush; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= halfBrush) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    mask[y * width + x] = 255;
                }
            }
        }
    }

    // 使用简单 inpaint（快速）
    return simpleInpaint(imageData, mask, 10);
};

/**
 * 局部高斯模糊
 */
export const localBlur = (
    imageData: ImageData,
    mask: Uint8Array,
    radius: number = 5
): ImageData => {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data);

    // 简单的 box blur
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            if (mask[idx] === 0) continue;

            let sumR = 0, sumG = 0, sumB = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = (ny * width + nx) * 4;
                        sumR += data[nIdx];
                        sumG += data[nIdx + 1];
                        sumB += data[nIdx + 2];
                        count++;
                    }
                }
            }

            const pixelIdx = idx * 4;
            result[pixelIdx] = Math.round(sumR / count);
            result[pixelIdx + 1] = Math.round(sumG / count);
            result[pixelIdx + 2] = Math.round(sumB / count);
        }
    }

    return new ImageData(result, width, height);
};

export default {
    inpaint,
    simpleInpaint,
    cloneStamp,
    spotHeal,
    localBlur
};
