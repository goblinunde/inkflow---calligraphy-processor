import { ProcessSettings } from '../types';
import { applyLevels, autoLevels, LevelsSettings } from './levelsService';
import {
  extractRedSeal,
  detectFlyingWhite,
  binarizeWithFlyingWhite,
  bilateralEdgeSmooth
} from './calligraphyService';
import { applyFilter, FilterType } from './filtersService';

/**
 * Processes the image using an Enhanced Pipeline.
 * Phase 2: Supports 'Photo Mode' (keep background) and 'Ink Mode' (extraction).
 * Phase 5: Advanced processing with Levels, Histogram Equalization, Advanced Blur
 */
export const processImage = (
  originalSrc: string,
  settings: ProcessSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');

      const targetWidth = settings.outputWidth || img.width;
      const targetHeight = settings.outputHeight || img.height;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const originalImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const originalPixels = originalImageData.data;

      // === PHASE 2: COMMON PRE-PROCESSING (Brightness / Saturation) ===
      // Even in Ink Extraction mode, brightness/contrast helps pre-filtering.
      // But Saturation is mostly for Photo Mode (or Monochrome toggle).

      // We apply Brightness/Saturation/Contrast to RGB first.
      // Note: In Ink Extraction mode, we might want to do this logic differently (e.g. only Luma),
      // but consistent behavior is better for user conceptual model.

      if (settings.brightness !== 0 || settings.saturation !== 0 || settings.contrast !== 0) {
        applyColorAdjustments(originalPixels, settings.brightness, settings.contrast, settings.saturation);
      }

      // === PHASE 5: ADVANCED LEVELS PROCESSING ===
      // 💡 Auto Levels: Automatically stretch histogram for optimal contrast
      if (settings.autoLevels) {
        autoLevels(originalPixels);
      }

      // 💡 Manual Levels: Fine-grained control over input/output mapping
      if (settings.levelsEnabled && !settings.autoLevels) {
        const levelsConfig: LevelsSettings = {
          inputBlack: settings.levelsInputBlack,
          inputWhite: settings.levelsInputWhite,
          gamma: settings.levelsGamma,
          outputBlack: 0,
          outputWhite: 255
        };
        applyLevels(originalPixels, levelsConfig);
      }

      // === BRANCH: PHOTO MODE (Keep Background) ===
      if (settings.removeBackground === false) {
        // In Photo Mode, we just return the color adjusted image.
        // Denoise/Sharpen can still be applied if desired.

        // Optional: Apply Denoise/Sharpen to RGB? 
        // For complexity reasons, let's keep it simple first. 
        // Advanced Image Algo on RGB is slow in JS.
        // However, we used Luma for Denoise/Sharpen in Ink Mode. 
        // Let's Skip Denoise/Sharpen for Photo Mode in this iteration to ensure speed, 
        // unless we implement RGB-based algorithms.
        // Wait, Sharpening is easy on RGB (apply to each channel or Convert->Luma->Sharpen->ConvertBack).
        // Let's stick to Color Adjustments only for Photo Mode v1 for performance.

        ctx.putImageData(originalImageData, 0, 0);

        // 💡 Apply art filter(s) if specified
        if (settings.stackedFilters && settings.stackedFilters.length > 0) {
          // 叠加模式：循环应用所有滤镜
          let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          for (const filterType of settings.stackedFilters) {
            imageData = applyFilter(imageData, filterType as FilterType, settings.filterIntensity || 50);
          }
          ctx.putImageData(imageData, 0, 0);
        } else if (settings.filter) {
          // 单个滤镜模式
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const filteredData = applyFilter(imageData, settings.filter as FilterType, settings.filterIntensity || 50);
          ctx.putImageData(filteredData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // === BRANCH: INK EXTRACTION MODE (Remove Background) ===

      // 1. Grayscale Extraction
      // Use the *Already Adjusted* pixels to calculate Luma
      const luma = new Uint8ClampedArray(targetWidth * targetHeight);
      for (let i = 0; i < luma.length; i++) {
        const r = originalPixels[i * 4];
        const g = originalPixels[i * 4 + 1];
        const b = originalPixels[i * 4 + 2];
        luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      // 2. Denoise (Median Filter)
      let processedLuma = luma;
      if (settings.denoise > 0) {
        const radius = settings.denoise > 50 ? 2 : 1;
        processedLuma = applyMedianFilter(processedLuma, targetWidth, targetHeight, radius);
      }

      // 3. Sharpening
      if (settings.sharpness > 0) {
        const amount = settings.sharpness / 50;
        processedLuma = applyUnsharpMask(processedLuma, targetWidth, targetHeight, amount);
      }

      // 4. Binarization
      let mask = new Uint8Array(targetWidth * targetHeight);

      if (settings.adaptiveThreshold) {
        const windowSize = Math.max(15, Math.floor(targetWidth / 60));
        const C = 10;
        applyAdaptiveThreshold(processedLuma, mask, targetWidth, targetHeight, windowSize, C);
      } else {
        // Global Threshold
        for (let i = 0; i < processedLuma.length; i++) {
          mask[i] = processedLuma[i] < settings.threshold ? 255 : 0;
        }
      }

      // 4b. Edge Enhance
      if (settings.edgeEnhance) {
        mask = applyMorphology(mask, targetWidth, targetHeight, 1);
        mask = applyMorphology(mask, targetWidth, targetHeight, -1);
      }

      // 5. Morphology
      if (settings.strength !== 0) {
        mask = applyMorphology(mask, targetWidth, targetHeight, settings.strength);
      }

      // 6. Smoothing
      const blurRadius = settings.smoothing ? 2 : 1;
      mask = applyBoxBlur(mask, targetWidth, targetHeight, blurRadius);

      // === PHASE 3: 书法专用功能 ===

      // 6b. 边缘平滑（使用双边滤波保持边缘）
      if (settings.edgeSmoothness > 0) {
        // 将 mask 转换为 ImageData 格式
        const maskImageData = ctx.createImageData(targetWidth, targetHeight);
        for (let i = 0; i < mask.length; i++) {
          const idx = i * 4;
          maskImageData.data[idx] = mask[i];
          maskImageData.data[idx + 1] = mask[i];
          maskImageData.data[idx + 2] = mask[i];
          maskImageData.data[idx + 3] = 255;
        }

        const smoothedImageData = bilateralEdgeSmooth(maskImageData, settings.edgeSmoothness);

        // 转换回 mask 格式
        for (let i = 0; i < mask.length; i++) {
          mask[i] = smoothedImageData.data[i * 4];
        }
      }

      // 7. Composition
      const outputImageData = ctx.createImageData(targetWidth, targetHeight);
      const outputPixels = outputImageData.data;

      // Parse Background Color
      let bgR = 0, bgG = 0, bgB = 0, bgAlpha = 0;
      if (settings.backgroundColor && settings.backgroundColor !== 'transparent') {
        const hex = settings.backgroundColor.replace('#', '');
        bgR = parseInt(hex.substring(0, 2), 16);
        bgG = parseInt(hex.substring(2, 4), 16);
        bgB = parseInt(hex.substring(4, 6), 16);
        bgAlpha = 255;
      }

      for (let i = 0; i < mask.length; i++) {
        const inkAlpha = mask[i]; // 0..255
        const idx = i * 4;

        if (inkAlpha > 0) {
          // Ink Color Selection
          let inkR, inkG, inkB;

          if (settings.monochrome) {
            inkR = 0; inkG = 0; inkB = 0;
          } else {
            inkR = originalPixels[idx];
            inkG = originalPixels[idx + 1];
            inkB = originalPixels[idx + 2];
          }

          // Alpha Blending: Result = Ink * Alpha + BG * (1 - Alpha)
          // If bgAlpha is 0 (Transparent), simply set pixel to Ink.
          // Note: This matches standard "Source Over" composition.

          const alphaNorm = inkAlpha / 255;
          const invAlpha = 1 - alphaNorm;

          if (bgAlpha === 0) {
            // Transparent Background
            outputPixels[idx] = inkR;
            outputPixels[idx + 1] = inkG;
            outputPixels[idx + 2] = inkB;
            outputPixels[idx + 3] = inkAlpha;
          } else {
            // Solid Background
            // R = InkR * A + BgR * (1-A)
            outputPixels[idx] = inkR * alphaNorm + bgR * invAlpha;
            outputPixels[idx + 1] = inkG * alphaNorm + bgG * invAlpha;
            outputPixels[idx + 2] = inkB * alphaNorm + bgB * invAlpha;
            outputPixels[idx + 3] = 255; // Full opacity since BG is solid
          }

        } else {
          // No Ink -> Background
          outputPixels[idx] = bgR;
          outputPixels[idx + 1] = bgG;
          outputPixels[idx + 2] = bgB;
          outputPixels[idx + 3] = bgAlpha;
        }
      }

      ctx.putImageData(outputImageData, 0, 0);

      // 💡 Apply art filter(s) if specified (Ink Mode)
      if (settings.stackedFilters && settings.stackedFilters.length > 0) {
        // 叠加模式
        let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        for (const filterType of settings.stackedFilters) {
          imageData = applyFilter(imageData, filterType as FilterType, settings.filterIntensity || 50);
        }
        ctx.putImageData(imageData, 0, 0);
      } else if (settings.filter) {
        // 单个滤镜模式
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const filteredData = applyFilter(imageData, settings.filter as FilterType, settings.filterIntensity || 50);
        ctx.putImageData(filteredData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = originalSrc;
  });
};

function truncate(value: number): number {
  return Math.min(255, Math.max(0, value));
}

// === Color Adjustment Algorithms ===

function applyColorAdjustments(pixels: Uint8ClampedArray, brightness: number, contrast: number, saturation: number) {
  // Pre-calculate factors to save perf inside loop

  // Brightness: additive shift. -100..100 -> -128..128 approx or just typical shift
  const bShift = Math.floor(brightness * 2.55);

  // Contrast: factor.
  // factor = (259 * (contrast + 255)) / (255 * (259 - contrast)) 
  // Simplified: 0..100 range in settings is usually positive contrast. 
  // If we support negative contrast (-100..100):
  // Standard formula: F = (259(C+255))/(255(259-C))
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // Saturation: -100 (Grayscale) to 100 (Super vivid)
  // S = x > 0 ? 1 + x/100 : 1 + x/100 (0 at -100)
  const sFactor = 1 + (saturation / 100);
  const isGrayscale = saturation === -100;

  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    // 1. Brightness
    if (brightness !== 0) {
      r += bShift;
      g += bShift;
      b += bShift;
    }

    // 2. Contrast
    if (contrast !== 0) {
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;
    }

    // Clamp before Saturation? Or after? Usually safe to let flow

    // 3. Saturation
    if (saturation !== 0) {
      // LUMA for saturation 
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (isGrayscale) {
        r = g = b = gray;
      } else {
        r = gray + sFactor * (r - gray);
        g = gray + sFactor * (g - gray);
        b = gray + sFactor * (b - gray);
      }
    }

    pixels[i] = truncate(r);
    pixels[i + 1] = truncate(g);
    pixels[i + 2] = truncate(b);
  }
}


// --- Image Algorithms (Unchanged mainly) ---

function applyMedianFilter(data: Uint8ClampedArray, w: number, h: number, radius: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const size = (2 * radius + 1) * (2 * radius + 1);
  const kernel = new Int32Array(size);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            kernel[count++] = data[ny * w + nx];
          } else {
            kernel[count++] = data[y * w + x];
          }
        }
      }
      const validKernel = kernel.subarray(0, count).sort();
      output[y * w + x] = validKernel[Math.floor(count / 2)];
    }
  }
  return output;
}

function applyUnsharpMask(data: Uint8ClampedArray, w: number, h: number, amount: number): Uint8ClampedArray {
  const blurred = applyBoxBlurLuma(data, w, h, 2);
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i++) {
    const orig = data[i];
    const blur = blurred[i];
    const diff = orig - blur;
    output[i] = truncate(orig + diff * amount);
  }
  return output;
}

function applyAdaptiveThreshold(data: Uint8ClampedArray, mask: Uint8Array, w: number, h: number, s: number, t: number) {
  const integral = new Float64Array(w * h);

  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      sum += data[y * w + x];
      if (y === 0) {
        integral[y * w + x] = sum;
      } else {
        integral[y * w + x] = integral[(y - 1) * w + x] + sum;
      }
    }
  }

  const r = Math.floor(s / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - r);
      const x2 = Math.min(w - 1, x + r);
      const y1 = Math.max(0, y - r);
      const y2 = Math.min(h - 1, y + r);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);

      const A = integral[y2 * w + x2];
      const B = x1 > 0 ? integral[y2 * w + (x1 - 1)] : 0;
      const C = y1 > 0 ? integral[(y1 - 1) * w + x2] : 0;
      const D = (x1 > 0 && y1 > 0) ? integral[(y1 - 1) * w + (x1 - 1)] : 0;

      const sum = A - B - C + D;
      const mean = sum / count;

      if (data[y * w + x] < (mean * (100 - t) / 100)) {
        mask[y * w + x] = 255;
      } else {
        mask[y * w + x] = 0;
      }
    }
  }
}

/**
 * 形态学操作 - 支持小数 strength (更精细的笔画粗细控制)
 * 💡 整数部分执行完整迭代，小数部分通过 Alpha 混合实现部分效果
 */
function applyMorphology(mask: Uint8Array, width: number, height: number, strength: number): Uint8Array {
  if (strength === 0) return mask;

  const isDilation = strength > 0;
  const absStrength = Math.abs(strength);
  const fullIterations = Math.floor(absStrength);
  const fractionalPart = absStrength - fullIterations;

  let current = new Uint8Array(mask);
  let next = new Uint8Array(mask.length);

  // 执行完整迭代
  for (let iter = 0; iter < fullIterations; iter++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = current[idx];

        if (isDilation) {
          if (val === 255) {
            next[idx] = 255;
            continue;
          }
          if (hasNeighborValue(current, width, height, x, y, 255)) {
            next[idx] = 255;
          } else {
            next[idx] = 0;
          }
        } else {
          if (val === 0) {
            next[idx] = 0;
            continue;
          }
          if (hasNeighborValue(current, width, height, x, y, 0)) {
            next[idx] = 0;
          } else {
            next[idx] = 255;
          }
        }
      }
    }
    current.set(next);
  }

  // 处理小数部分（部分形态学效果）
  if (fractionalPart > 0.01) {
    // 执行一次形态学操作到 next
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = current[idx];

        if (isDilation) {
          if (val === 255) {
            next[idx] = 255;
            continue;
          }
          if (hasNeighborValue(current, width, height, x, y, 255)) {
            next[idx] = 255;
          } else {
            next[idx] = 0;
          }
        } else {
          if (val === 0) {
            next[idx] = 0;
            continue;
          }
          if (hasNeighborValue(current, width, height, x, y, 0)) {
            next[idx] = 0;
          } else {
            next[idx] = 255;
          }
        }
      }
    }

    // 💡 混合 current 和 next 根据 fractionalPart
    for (let i = 0; i < current.length; i++) {
      current[i] = Math.round(current[i] * (1 - fractionalPart) + next[i] * fractionalPart);
    }
  }

  return current;
}

function hasNeighborValue(data: Uint8Array, w: number, h: number, x: number, y: number, target: number): boolean {
  const neighbors = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
  ];

  for (const n of neighbors) {
    const nx = x + n.dx;
    const ny = y + n.dy;
    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
      if (data[ny * w + nx] === target) return true;
    }
  }
  return false;
}

function applyBoxBlur(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (radius <= 0) return mask;
  const output = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += mask[ny * width + nx];
            count++;
          }
        }
      }
      output[y * width + x] = sum / count;
    }
  }
  return output;
}

function applyBoxBlurLuma(data: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return data;
  const output = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += data[ny * width + nx];
            count++;
          }
        }
      }
      output[y * width + x] = sum / count;
    }
  }
  return output;
}
