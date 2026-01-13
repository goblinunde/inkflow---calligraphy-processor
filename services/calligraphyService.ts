/**
 * 书法专用处理服务
 * 💡 提供印章分离、飞白保留、墨迹边缘平滑等专业功能
 */

// ==================== 类型定义 ====================

export interface SealExtractionResult {
    sealLayer: ImageData;      // 印章层（红色区域）
    inkLayer: ImageData;       // 墨迹层（非红色区域）
    hasSeal: boolean;          // 是否检测到印章
    sealBounds: { x: number; y: number; width: number; height: number } | null;
}

export interface FlyingWhiteResult {
    mask: Uint8Array;          // 飞白区域掩膜 (0-255)
    coverage: number;          // 飞白覆盖率 (0-1)
}

// ==================== 工具函数 ====================

/**
 * RGB 转 HSV
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [h * 360, s * 100, v * 100];
}

/**
 * 检测像素是否为红色（印章颜色）
 * 💡 红色范围：H 0-20 或 340-360, S > 40%, V > 25%
 */
function isRedPixel(r: number, g: number, b: number): boolean {
    const [h, s, v] = rgbToHsv(r, g, b);
    const isRedHue = (h >= 0 && h <= 25) || (h >= 335 && h <= 360);
    return isRedHue && s > 40 && v > 25;
}

/**
 * 形态学膨胀（3x3 核）
 */
function dilate(mask: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(mask.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let maxVal = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    maxVal = Math.max(maxVal, mask[idx]);
                }
            }
            result[y * width + x] = maxVal;
        }
    }

    return result;
}

/**
 * 形态学腐蚀（3x3 核）
 */
function erode(mask: Uint8Array, width: number, height: number): Uint8Array {
    const result = new Uint8Array(mask.length);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let minVal = 255;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    minVal = Math.min(minVal, mask[idx]);
                }
            }
            result[y * width + x] = minVal;
        }
    }

    return result;
}

/**
 * 形态学开运算（先腐蚀后膨胀，去除小噪点）
 */
function morphOpen(mask: Uint8Array, width: number, height: number): Uint8Array {
    return dilate(erode(mask, width, height), width, height);
}

/**
 * 形态学闭运算（先膨胀后腐蚀，填充小孔洞）
 */
function morphClose(mask: Uint8Array, width: number, height: number): Uint8Array {
    return erode(dilate(mask, width, height), width, height);
}

// ==================== 印章红色分离 ====================

/**
 * 自动提取红色印章区域
 * @param imageData 原始图像数据
 * @returns 分离后的印章层和墨迹层
 */
export function extractRedSeal(imageData: ImageData): SealExtractionResult {
    const { width, height, data } = imageData;
    const pixelCount = width * height;

    // 创建红色掩膜
    const sealMask = new Uint8Array(pixelCount);
    let redPixelCount = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];

            if (isRedPixel(r, g, b)) {
                sealMask[y * width + x] = 255;
                redPixelCount++;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // 判断是否检测到印章（红色像素占比 > 0.5%）
    const hasSeal = redPixelCount / pixelCount > 0.005;

    if (!hasSeal) {
        // 无印章，返回原图作为墨迹层
        return {
            sealLayer: new ImageData(width, height),
            inkLayer: new ImageData(new Uint8ClampedArray(data), width, height),
            hasSeal: false,
            sealBounds: null
        };
    }

    // 形态学处理：开运算去噪 + 闭运算填充
    let processedMask = morphOpen(sealMask, width, height);
    processedMask = morphClose(processedMask, width, height);

    // 创建分离后的图层
    const sealData = new Uint8ClampedArray(data.length);
    const inkData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const maskVal = processedMask[y * width + x];

            if (maskVal > 128) {
                // 印章区域
                sealData[i] = data[i];
                sealData[i + 1] = data[i + 1];
                sealData[i + 2] = data[i + 2];
                sealData[i + 3] = 255;
                // 墨迹层该位置透明
                inkData[i + 3] = 0;
            } else {
                // 非印章区域
                inkData[i] = data[i];
                inkData[i + 1] = data[i + 1];
                inkData[i + 2] = data[i + 2];
                inkData[i + 3] = data[i + 3];
                // 印章层该位置透明
                sealData[i + 3] = 0;
            }
        }
    }

    return {
        sealLayer: new ImageData(sealData, width, height),
        inkLayer: new ImageData(inkData, width, height),
        hasSeal: true,
        sealBounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    };
}

// ==================== 飞白效果保留 ====================

/**
 * 检测飞白（干笔）区域
 * 💡 飞白特征：笔画边缘有断续的白色间隙
 * @param imageData 灰度或二值化后的图像
 * @returns 飞白区域掩膜
 */
export function detectFlyingWhite(imageData: ImageData): FlyingWhiteResult {
    const { width, height, data } = imageData;
    const pixelCount = width * height;

    // 转换为灰度
    const gray = new Uint8Array(pixelCount);
    for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    }

    // 计算局部方差（5x5 窗口）
    const variance = new Float32Array(pixelCount);
    const windowSize = 2; // 半径

    for (let y = windowSize; y < height - windowSize; y++) {
        for (let x = windowSize; x < width - windowSize; x++) {
            let sum = 0, sumSq = 0, count = 0;

            for (let dy = -windowSize; dy <= windowSize; dy++) {
                for (let dx = -windowSize; dx <= windowSize; dx++) {
                    const val = gray[(y + dy) * width + (x + dx)];
                    sum += val;
                    sumSq += val * val;
                    count++;
                }
            }

            const mean = sum / count;
            variance[y * width + x] = sumSq / count - mean * mean;
        }
    }

    // 飞白区域：高方差 + 中等灰度值（非纯黑非纯白）
    const flyingWhiteMask = new Uint8Array(pixelCount);
    let flyingWhiteCount = 0;
    const varianceThreshold = 800; // 方差阈值

    for (let i = 0; i < pixelCount; i++) {
        const grayVal = gray[i];
        const isMiddleGray = grayVal > 50 && grayVal < 200;
        const isHighVariance = variance[i] > varianceThreshold;

        if (isMiddleGray && isHighVariance) {
            flyingWhiteMask[i] = 255;
            flyingWhiteCount++;
        }
    }

    // 形态学处理
    const processedMask = morphClose(morphOpen(flyingWhiteMask, width, height), width, height);

    return {
        mask: processedMask,
        coverage: flyingWhiteCount / pixelCount
    };
}

/**
 * 在二值化处理中保留飞白效果
 * @param imageData 原始图像
 * @param threshold 二值化阈值
 * @param flyingWhiteMask 飞白掩膜
 * @returns 保留飞白的二值化结果
 */
export function binarizeWithFlyingWhite(
    imageData: ImageData,
    threshold: number,
    flyingWhiteMask: Uint8Array
): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);

        if (flyingWhiteMask[i] > 128) {
            // 飞白区域：保留原始灰度值的渐变
            const preservedGray = gray < threshold ? gray : 255;
            result[idx] = result[idx + 1] = result[idx + 2] = preservedGray;
        } else {
            // 非飞白区域：标准二值化
            const binaryVal = gray < threshold ? 0 : 255;
            result[idx] = result[idx + 1] = result[idx + 2] = binaryVal;
        }
        result[idx + 3] = data[idx + 3];
    }

    return new ImageData(result, width, height);
}

// ==================== 墨迹边缘平滑 ====================

/**
 * 边缘平滑处理
 * 💡 使用高斯模糊 + 边缘保持的方法平滑锯齿
 * @param imageData 二值化后的图像
 * @param smoothness 平滑强度 (0-100)
 * @returns 平滑后的图像
 */
export function smoothInkEdges(imageData: ImageData, smoothness: number): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    // 归一化平滑强度
    const sigma = (smoothness / 100) * 2 + 0.5; // 0.5 - 2.5
    const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
    const halfKernel = Math.floor(kernelSize / 2);

    // 生成高斯核
    const kernel: number[] = [];
    let kernelSum = 0;
    for (let i = -halfKernel; i <= halfKernel; i++) {
        const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
        kernel.push(weight);
        kernelSum += weight;
    }
    // 归一化
    for (let i = 0; i < kernel.length; i++) {
        kernel[i] /= kernelSum;
    }

    // 转换为灰度
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        gray[i] = data[i * 4];
    }

    // 水平高斯卷积
    const tempH = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let k = -halfKernel; k <= halfKernel; k++) {
                const nx = Math.max(0, Math.min(width - 1, x + k));
                sum += gray[y * width + nx] * kernel[k + halfKernel];
            }
            tempH[y * width + x] = sum;
        }
    }

    // 垂直高斯卷积
    const smoothed = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let sum = 0;
            for (let k = -halfKernel; k <= halfKernel; k++) {
                const ny = Math.max(0, Math.min(height - 1, y + k));
                sum += tempH[ny * width + x] * kernel[k + halfKernel];
            }
            smoothed[y * width + x] = sum;
        }
    }

    // 边缘增强：使用原始边缘信息混合
    // 💡 在笔画内部保持平滑，在边缘保持锐利
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        const originalVal = data[idx];
        const smoothedVal = smoothed[i];

        // 边缘权重：越接近边缘（中间灰度值），保留越多原始信息
        const edgeWeight = 1 - Math.abs(originalVal - 128) / 128;
        const finalVal = smoothedVal * (1 - edgeWeight * 0.3) + originalVal * (edgeWeight * 0.3);

        // 重新二值化（软阈值）
        let binaryVal: number;
        if (finalVal < 100) {
            binaryVal = 0;
        } else if (finalVal > 155) {
            binaryVal = 255;
        } else {
            // 渐变过渡区
            binaryVal = Math.round((finalVal - 100) * (255 / 55));
        }

        result[idx] = result[idx + 1] = result[idx + 2] = binaryVal;
        result[idx + 3] = data[idx + 3];
    }

    return new ImageData(result, width, height);
}

/**
 * 高级边缘平滑：使用双边滤波保持边缘
 * @param imageData 图像数据
 * @param smoothness 平滑强度 (0-100)
 * @returns 平滑后的图像
 */
export function bilateralEdgeSmooth(imageData: ImageData, smoothness: number): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    const spatialSigma = (smoothness / 100) * 3 + 1; // 空间 sigma
    const rangeSigma = 30; // 强度 sigma（固定，保护边缘）
    const radius = Math.ceil(spatialSigma * 2);

    // 转换为灰度
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        gray[i] = data[i * 4];
    }

    // 双边滤波
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const centerIdx = y * width + x;
            const centerVal = gray[centerIdx];

            let sum = 0, weightSum = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const ny = y + dy, nx = x + dx;
                    if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;

                    const neighborIdx = ny * width + nx;
                    const neighborVal = gray[neighborIdx];

                    // 空间权重
                    const spatialDist = dx * dx + dy * dy;
                    const spatialWeight = Math.exp(-spatialDist / (2 * spatialSigma * spatialSigma));

                    // 强度权重
                    const rangeDist = (centerVal - neighborVal) ** 2;
                    const rangeWeight = Math.exp(-rangeDist / (2 * rangeSigma * rangeSigma));

                    const weight = spatialWeight * rangeWeight;
                    sum += neighborVal * weight;
                    weightSum += weight;
                }
            }

            const smoothedVal = weightSum > 0 ? sum / weightSum : centerVal;
            const idx = centerIdx * 4;
            result[idx] = result[idx + 1] = result[idx + 2] = Math.round(smoothedVal);
            result[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(result, width, height);
}
