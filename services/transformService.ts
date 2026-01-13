/**
 * Transform Service - 图像变换服务
 * 💡 提供旋转、翻转、缩放等变换功能
 */

/**
 * 旋转图像
 * @param angle 旋转角度 (90, 180, 270 / -90)
 */
export function rotateImage(imageData: ImageData, angle: number): ImageData {
    const { width, height, data } = imageData;

    // 归一化角度
    angle = ((angle % 360) + 360) % 360;

    if (angle === 0) return imageData;

    if (angle === 180) {
        // 180度旋转
        const result = new Uint8ClampedArray(data.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * 4;
                const dstIdx = ((height - 1 - y) * width + (width - 1 - x)) * 4;
                result[dstIdx] = data[srcIdx];
                result[dstIdx + 1] = data[srcIdx + 1];
                result[dstIdx + 2] = data[srcIdx + 2];
                result[dstIdx + 3] = data[srcIdx + 3];
            }
        }
        return new ImageData(result, width, height);
    }

    // 90度 或 270度旋转 - 需要交换宽高
    const newWidth = height;
    const newHeight = width;
    const result = new Uint8ClampedArray(newWidth * newHeight * 4);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            let newX: number, newY: number;

            if (angle === 90) {
                newX = height - 1 - y;
                newY = x;
            } else { // 270
                newX = y;
                newY = width - 1 - x;
            }

            const dstIdx = (newY * newWidth + newX) * 4;
            result[dstIdx] = data[srcIdx];
            result[dstIdx + 1] = data[srcIdx + 1];
            result[dstIdx + 2] = data[srcIdx + 2];
            result[dstIdx + 3] = data[srcIdx + 3];
        }
    }

    return new ImageData(result, newWidth, newHeight);
}

/**
 * 水平翻转
 */
export function flipHorizontal(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = (y * width + (width - 1 - x)) * 4;
            result[dstIdx] = data[srcIdx];
            result[dstIdx + 1] = data[srcIdx + 1];
            result[dstIdx + 2] = data[srcIdx + 2];
            result[dstIdx + 3] = data[srcIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}

/**
 * 垂直翻转
 */
export function flipVertical(imageData: ImageData): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const dstIdx = ((height - 1 - y) * width + x) * 4;
            result[dstIdx] = data[srcIdx];
            result[dstIdx + 1] = data[srcIdx + 1];
            result[dstIdx + 2] = data[srcIdx + 2];
            result[dstIdx + 3] = data[srcIdx + 3];
        }
    }

    return new ImageData(result, width, height);
}

/**
 * 缩放图像
 * 💡 使用双线性插值
 */
export function resizeImage(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const { width, height, data } = imageData;
    const result = new Uint8ClampedArray(newWidth * newHeight * 4);

    const xRatio = width / newWidth;
    const yRatio = height / newHeight;

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = x * xRatio;
            const srcY = y * yRatio;

            const x0 = Math.floor(srcX);
            const y0 = Math.floor(srcY);
            const x1 = Math.min(x0 + 1, width - 1);
            const y1 = Math.min(y0 + 1, height - 1);

            const xWeight = srcX - x0;
            const yWeight = srcY - y0;

            const idx00 = (y0 * width + x0) * 4;
            const idx01 = (y0 * width + x1) * 4;
            const idx10 = (y1 * width + x0) * 4;
            const idx11 = (y1 * width + x1) * 4;

            const dstIdx = (y * newWidth + x) * 4;

            for (let c = 0; c < 4; c++) {
                const top = data[idx00 + c] * (1 - xWeight) + data[idx01 + c] * xWeight;
                const bottom = data[idx10 + c] * (1 - xWeight) + data[idx11 + c] * xWeight;
                result[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
            }
        }
    }

    return new ImageData(result, newWidth, newHeight);
}

/**
 * 裁剪图像
 */
export function cropImage(
    imageData: ImageData,
    x: number,
    y: number,
    cropWidth: number,
    cropHeight: number
): ImageData {
    const { width, height, data } = imageData;

    // 边界检查
    x = Math.max(0, Math.min(x, width - 1));
    y = Math.max(0, Math.min(y, height - 1));
    cropWidth = Math.min(cropWidth, width - x);
    cropHeight = Math.min(cropHeight, height - y);

    const result = new Uint8ClampedArray(cropWidth * cropHeight * 4);

    for (let cy = 0; cy < cropHeight; cy++) {
        for (let cx = 0; cx < cropWidth; cx++) {
            const srcIdx = ((y + cy) * width + (x + cx)) * 4;
            const dstIdx = (cy * cropWidth + cx) * 4;
            result[dstIdx] = data[srcIdx];
            result[dstIdx + 1] = data[srcIdx + 1];
            result[dstIdx + 2] = data[srcIdx + 2];
            result[dstIdx + 3] = data[srcIdx + 3];
        }
    }

    return new ImageData(result, cropWidth, cropHeight);
}

export default {
    rotateImage,
    flipHorizontal,
    flipVertical,
    resizeImage,
    cropImage
};
