/**
 * 色阶调整服务 (Levels) - PS 级别色调控制
 * 💡 实现输入/输出黑白点映射，类似 Photoshop 的 Levels 功能
 */

export interface LevelsSettings {
    inputBlack: number;   // 0-255, 输入黑点
    inputWhite: number;   // 0-255, 输入白点
    gamma: number;        // 0.1-10, 中间调 Gamma
    outputBlack: number;  // 0-255, 输出黑点
    outputWhite: number;  // 0-255, 输出白点
}

export interface CurvesPoint {
    x: number; // 0-255 输入值
    y: number; // 0-255 输出值
}

/**
 * 应用色阶调整
 */
export const applyLevels = (
    pixels: Uint8ClampedArray,
    settings: LevelsSettings
): void => {
    const { inputBlack, inputWhite, gamma, outputBlack, outputWhite } = settings;

    // 💡 预计算 256 个值的 LUT（查找表）以提高性能
    const lut = new Uint8ClampedArray(256);

    for (let i = 0; i < 256; i++) {
        // 1. 输入范围映射
        let value = (i - inputBlack) / (inputWhite - inputBlack);
        value = Math.max(0, Math.min(1, value));

        // 2. Gamma 校正
        value = Math.pow(value, 1 / gamma);

        // 3. 输出范围映射
        value = outputBlack + value * (outputWhite - outputBlack);

        lut[i] = Math.round(Math.max(0, Math.min(255, value)));
    }

    // 应用 LUT 到所有像素
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = lut[pixels[i]];         // R
        pixels[i + 1] = lut[pixels[i + 1]]; // G
        pixels[i + 2] = lut[pixels[i + 2]]; // B
        // Alpha 通道保持不变
    }
};

/**
 * 应用曲线调整 (Curves)
 * 💡 使用三次样条插值实现平滑曲线
 */
export const applyCurves = (
    pixels: Uint8ClampedArray,
    points: CurvesPoint[]
): void => {
    // 确保包含端点
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    if (sortedPoints[0].x !== 0) {
        sortedPoints.unshift({ x: 0, y: 0 });
    }
    if (sortedPoints[sortedPoints.length - 1].x !== 255) {
        sortedPoints.push({ x: 255, y: 255 });
    }

    // 💡 构建 LUT 使用分段线性插值（简化版）
    // 完整版应使用 Catmull-Rom 样条
    const lut = new Uint8ClampedArray(256);

    for (let i = 0; i < 256; i++) {
        // 找到当前值所在的区间
        let p1 = sortedPoints[0];
        let p2 = sortedPoints[sortedPoints.length - 1];

        for (let j = 0; j < sortedPoints.length - 1; j++) {
            if (i >= sortedPoints[j].x && i <= sortedPoints[j + 1].x) {
                p1 = sortedPoints[j];
                p2 = sortedPoints[j + 1];
                break;
            }
        }

        // 线性插值
        const t = (i - p1.x) / (p2.x - p1.x || 1);
        lut[i] = Math.round(p1.y + t * (p2.y - p1.y));
    }

    // 应用 LUT
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = lut[pixels[i]];
        pixels[i + 1] = lut[pixels[i + 1]];
        pixels[i + 2] = lut[pixels[i + 2]];
    }
};

/**
 * 自动色阶 - 自动拉伸直方图
 */
export const autoLevels = (pixels: Uint8ClampedArray): void => {
    // 统计直方图
    const histogram = new Uint32Array(256);
    for (let i = 0; i < pixels.length; i += 4) {
        const luma = Math.round(
            0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
        );
        histogram[luma]++;
    }

    const totalPixels = pixels.length / 4;
    const clipPercent = 0.01; // 裁剪 1% 的极值
    const clipCount = Math.floor(totalPixels * clipPercent);

    // 找到黑点和白点
    let inputBlack = 0;
    let inputWhite = 255;
    let count = 0;

    for (let i = 0; i < 256; i++) {
        count += histogram[i];
        if (count > clipCount) {
            inputBlack = i;
            break;
        }
    }

    count = 0;
    for (let i = 255; i >= 0; i--) {
        count += histogram[i];
        if (count > clipCount) {
            inputWhite = i;
            break;
        }
    }

    // 应用自动色阶
    applyLevels(pixels, {
        inputBlack,
        inputWhite,
        gamma: 1,
        outputBlack: 0,
        outputWhite: 255,
    });
};

/**
 * 默认色阶设置
 */
export const defaultLevelsSettings: LevelsSettings = {
    inputBlack: 0,
    inputWhite: 255,
    gamma: 1,
    outputBlack: 0,
    outputWhite: 255,
};

export default {
    applyLevels,
    applyCurves,
    autoLevels,
    defaultLevelsSettings,
};
