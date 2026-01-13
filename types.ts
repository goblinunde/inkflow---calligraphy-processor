export interface ProcessSettings {
  threshold: number; // 0-255, cutoff for white background
  strength: number; // -3 to 5. Negative = Thin (Erosion), Positive = Bold (Dilation)
  contrast: number; // 0-200, contrast adjustment
  smoothing: boolean; // extra blur for smoother edges
  monochrome: boolean; // Output solid black text or keep original color
  outputWidth?: number;
  outputHeight?: number;

  // New Enhancements
  sharpness: number;         // 0-100, Unsharp Mask strength
  denoise: number;           // 0-100, Median Filter strength
  adaptiveThreshold: boolean; // Use local window binarization
  edgeEnhance: boolean;      // Extra edge boost

  // Phase 2: Photo Mode & Adjustments
  removeBackground: boolean; // Default true (Ink Extraction pipeline)
  brightness: number;        // -100 to 100
  saturation: number;        // -100 to 100

  // Phase 4: Background Processing
  backgroundColor: string;   // 'transparent' or Hex code
  texture: string;           // 'none', 'xuan', 'gold', 'silk'

  // Phase 5: Advanced Image Processing (OpenCV.js)
  blurType: 'box' | 'gaussian' | 'bilateral';  // 模糊类型
  blurRadius: number;        // 模糊半径 0-20
  autoLevels: boolean;       // 自动色阶
  levelsEnabled: boolean;    // 手动色阶调整
  levelsInputBlack: number;  // 0-255 输入黑点
  levelsInputWhite: number;  // 0-255 输入白点
  levelsGamma: number;       // 0.1-3.0 Gamma
  histogramEqualization: boolean; // 直方图均衡化

  // Phase 3: 书法专用功能
  sealExtraction: boolean;        // 印章红色自动分离
  preserveFlyingWhite: boolean;   // 保留飞白效果
  edgeSmoothness: number;         // 边缘平滑强度 (0-100)

  // Phase 6: 艺术滤镜
  filter?: 'vintage' | 'inkwash' | 'sepia' | 'highcontrast' | 'invert' | 'warm' | 'cool' | null;
  filterIntensity: number;        // 滤镜强度 (0-100)
  stackedFilters?: string[];      // 💡 叠加的滤镜列表
}

export enum ProcessingMode {
  MANUAL = 'MANUAL',
  AI_RESTORE = 'AI_RESTORE'
}

export enum WatermarkType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT'
}

export interface BaseWatermark {
  id: string;
  x: number;   // Position in Image Coordinates
  y: number;
  rotation: number;
  opacity: number;  // 0-100
}

export interface ImageWatermark extends BaseWatermark {
  type: WatermarkType.IMAGE;
  src: string; // DataURL or SVG string
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'svg';
}

export interface TextWatermark extends BaseWatermark {
  type: WatermarkType.TEXT;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export type Watermark = ImageWatermark | TextWatermark;