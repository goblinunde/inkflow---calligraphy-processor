/**
 * OpenCV.js Service Wrapper
 * 💡 提供对 OpenCV WebAssembly 库的封装，实现 PS 级别图像处理
 */

type OpenCVModule = typeof import('@techstark/opencv-js');

let cvModule: OpenCVModule | null = null;
let cvReady = false;
let cvReadyPromise: Promise<void> | null = null;

const loadOpenCVModule = async (): Promise<OpenCVModule> => {
    if (cvModule) {
        return cvModule;
    }

    const module = await import('@techstark/opencv-js');
    cvModule = module;
    return cvModule;
};

const getOpenCVSync = (): OpenCVModule => {
    if (!cvModule) {
        throw new Error('OpenCV is not initialized yet. Call initOpenCV() before using it.');
    }

    return cvModule;
};

export const initOpenCV = async (): Promise<void> => {
    if (cvReady) return;
    if (cvReadyPromise) return cvReadyPromise;

    cvReadyPromise = loadOpenCVModule().then((cv) => new Promise<void>((resolve) => {
        if (cv.Mat) {
            cvReady = true;
            resolve();
            return;
        }

        cv.onRuntimeInitialized = () => {
            cvReady = true;
            resolve();
        };
    }));

    return cvReadyPromise;
};

export const isCvReady = (): boolean => cvReady;

// === 图像处理算法 ===

/**
 * 高斯模糊 - 比 Box Blur 更自然的模糊效果
 */
export const gaussianBlur = (
    imageData: ImageData,
    sigma: number = 2
): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const dst = new cv.Mat();

    // 💡 ksize 必须是奇数，sigma 用于控制模糊程度
    const ksize = new cv.Size(0, 0); // 0 表示自动从 sigma 计算
    cv.GaussianBlur(src, dst, ksize, sigma, sigma);

    const result = imageDataFromMat(dst);
    src.delete();
    dst.delete();
    return result;
};

/**
 * 双边滤波 - 降噪同时保留边缘（比中值滤波更适合书法）
 */
export const bilateralFilter = (
    imageData: ImageData,
    d: number = 9,
    sigmaColor: number = 75,
    sigmaSpace: number = 75
): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const dst = new cv.Mat();

    // 💡 双边滤波在平滑纹理的同时保留笔画边缘
    cv.bilateralFilter(src, dst, d, sigmaColor, sigmaSpace);

    const result = imageDataFromMat(dst);
    src.delete();
    dst.delete();
    return result;
};

/**
 * Canny 边缘检测 - 专业级边缘检测
 */
export const cannyEdgeDetection = (
    imageData: ImageData,
    threshold1: number = 50,
    threshold2: number = 150
): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const dst = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, threshold1, threshold2);
    cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA);

    const result = imageDataFromMat(dst);
    src.delete();
    gray.delete();
    edges.delete();
    dst.delete();
    return result;
};

/**
 * 直方图均衡化 - 自动优化对比度
 */
export const histogramEqualization = (imageData: ImageData): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const ycrcb = new cv.Mat();
    const channels = new cv.MatVector();
    const dst = new cv.Mat();

    // 💡 在 YCrCb 色彩空间的 Y 通道进行均衡化，保持颜色不失真
    cv.cvtColor(src, ycrcb, cv.COLOR_RGBA2RGB);
    const rgb = new cv.Mat();
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
    cv.cvtColor(rgb, ycrcb, cv.COLOR_RGB2YCrCb);
    cv.split(ycrcb, channels);
    cv.equalizeHist(channels.get(0), channels.get(0));
    cv.merge(channels, ycrcb);
    cv.cvtColor(ycrcb, rgb, cv.COLOR_YCrCb2RGB);
    cv.cvtColor(rgb, dst, cv.COLOR_RGB2RGBA);

    const result = imageDataFromMat(dst);
    src.delete();
    ycrcb.delete();
    channels.delete();
    rgb.delete();
    dst.delete();
    return result;
};

/**
 * 自适应阈值（OpenCV 版本） - 更智能的二值化
 */
export const adaptiveThreshold = (
    imageData: ImageData,
    blockSize: number = 11,
    C: number = 2
): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const dst = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(
        gray,
        binary,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        blockSize,
        C
    );
    cv.cvtColor(binary, dst, cv.COLOR_GRAY2RGBA);

    const result = imageDataFromMat(dst);
    src.delete();
    gray.delete();
    binary.delete();
    dst.delete();
    return result;
};

/**
 * 形态学操作 - 更精细的笔画粗细控制
 */
export const morphologyOperation = (
    imageData: ImageData,
    operation: 'dilate' | 'erode' | 'open' | 'close',
    kernelSize: number = 3
): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const dst = new cv.Mat();
    const kernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(kernelSize, kernelSize)
    );

    switch (operation) {
        case 'dilate':
            cv.dilate(src, dst, kernel);
            break;
        case 'erode':
            cv.erode(src, dst, kernel);
            break;
        case 'open':
            cv.morphologyEx(src, dst, cv.MORPH_OPEN, kernel);
            break;
        case 'close':
            cv.morphologyEx(src, dst, cv.MORPH_CLOSE, kernel);
            break;
    }

    const result = imageDataFromMat(dst);
    src.delete();
    dst.delete();
    kernel.delete();
    return result;
};

/**
 * 锐化 - 使用拉普拉斯算子
 */
export const sharpen = (imageData: ImageData, amount: number = 1): ImageData => {
    const cv = getOpenCVSync();
    const src = cv.matFromImageData(imageData);
    const dst = new cv.Mat();
    const blurred = new cv.Mat();

    cv.GaussianBlur(src, blurred, new cv.Size(0, 0), 3);
    cv.addWeighted(src, 1 + amount, blurred, -amount, 0, dst);

    const result = imageDataFromMat(dst);
    src.delete();
    dst.delete();
    blurred.delete();
    return result;
};

// === 辅助函数 ===

function imageDataFromMat(mat: { data: Uint8Array; cols: number; rows: number }): ImageData {
    const data = new Uint8ClampedArray(mat.data);
    return new ImageData(data, mat.cols, mat.rows);
}

export default {
    initOpenCV,
    isCvReady,
    gaussianBlur,
    bilateralFilter,
    cannyEdgeDetection,
    histogramEqualization,
    adaptiveThreshold,
    morphologyOperation,
    sharpen,
};
