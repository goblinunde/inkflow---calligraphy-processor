import type { Dimensions, ProcessSettings } from '../types';

export const createDefaultSettings = (
  dimensions: Partial<Dimensions> = {}
): ProcessSettings => ({
  threshold: 180,
  strength: 1,
  contrast: 0,
  smoothing: true,
  monochrome: false,
  outputWidth: dimensions.width ?? 0,
  outputHeight: dimensions.height ?? 0,
  sharpness: 0,
  denoise: 0,
  adaptiveThreshold: false,
  edgeEnhance: false,
  removeBackground: true,
  brightness: 0,
  saturation: 0,
  backgroundColor: 'transparent',
  texture: 'none',
  blurType: 'box',
  blurRadius: 0,
  autoLevels: false,
  levelsEnabled: false,
  levelsInputBlack: 0,
  levelsInputWhite: 255,
  levelsGamma: 1,
  histogramEqualization: false,
  sealExtraction: false,
  preserveFlyingWhite: false,
  edgeSmoothness: 0,
  filter: null,
  filterIntensity: 50,
  stackedFilters: []
});
