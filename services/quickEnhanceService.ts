/**
 * Quick Enhance Service - 一键增强服务
 * 💡 提供各种场景的一键优化预设
 */

import { applyHSL, applyColorTemperature, applyClarity, applyVibrance, applyExposure, adjustHighlightsShadows, applyVignette, applyDehaze, applyGrain } from './adjustmentsService';
import { applyFilter, FilterType } from './filtersService';

export interface EnhancePreset {
    id: string;
    name: string;
    icon: string;
    description: string;
}

export const ENHANCE_PRESETS: EnhancePreset[] = [
    { id: 'auto_enhance', name: '一键美化', icon: '✨', description: '智能优化曝光、对比度和色彩' },
    { id: 'portrait', name: '人像美颜', icon: '👤', description: '磨皮、提亮、柔和' },
    { id: 'landscape', name: '风景增强', icon: '🏞️', description: '鲜艳色彩、清晰度增强' },
    { id: 'food', name: '美食模式', icon: '🍜', description: '暖色调、高饱和' },
    { id: 'night', name: '夜景优化', icon: '🌙', description: '提亮阴影、降噪' },
    { id: 'vintage', name: '复古胶片', icon: '📷', description: '怀旧色调、颗粒感' },
    { id: 'hdr', name: 'HDR 效果', icon: '🌈', description: '高动态范围、细节丰富' },
    { id: 'cinematic', name: '电影色调', icon: '🎬', description: '青橙对比、电影感' },
    { id: 'fresh', name: '小清新', icon: '🌸', description: '低对比、轻柔色彩' },
    { id: 'dramatic', name: '戏剧效果', icon: '🎭', description: '高对比、暗角' },
];

/**
 * 一键美化 - 智能优化
 */
export function autoEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 自动曝光补偿
    result = applyExposure(result, 10);

    // 增加对比度和清晰度
    result = applyClarity(result, 25);

    // 自然饱和度
    result = applyVibrance(result, 15);

    // 轻微高光阴影调整
    result = adjustHighlightsShadows(result, -10, 15);

    return result;
}

/**
 * 人像美颜
 */
export function portraitEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 提亮
    result = applyExposure(result, 15);

    // 降低对比度（柔和）
    result = adjustHighlightsShadows(result, -15, 20);

    // 轻微暖色
    result = applyColorTemperature(result, 10);

    // 轻微降饱和度（更自然）
    result = applyHSL(result, { hue: 0, saturation: -5, lightness: 5 });

    return result;
}

/**
 * 风景增强
 */
export function landscapeEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 增加饱和度
    result = applyVibrance(result, 30);
    result = applyHSL(result, { hue: 0, saturation: 15, lightness: 0 });

    // 清晰度
    result = applyClarity(result, 40);

    // 去雾
    result = applyDehaze(result, 20);

    // 轻微晕影
    result = applyVignette(result, 15);

    return result;
}

/**
 * 美食模式
 */
export function foodEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 暖色调
    result = applyColorTemperature(result, 25);

    // 高饱和度
    result = applyVibrance(result, 25);
    result = applyHSL(result, { hue: 0, saturation: 20, lightness: 5 });

    // 轻微清晰度
    result = applyClarity(result, 20);

    return result;
}

/**
 * 夜景优化
 */
export function nightEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 提亮阴影
    result = adjustHighlightsShadows(result, -20, 40);

    // 增加曝光
    result = applyExposure(result, 20);

    // 降噪（通过降低清晰度模拟）
    result = applyClarity(result, -10);

    // 轻微冷色调
    result = applyColorTemperature(result, -10);

    return result;
}

/**
 * 复古胶片
 */
export function vintageEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 使用复古滤镜
    result = applyFilter(result, 'vintage');

    // 添加颗粒
    result = applyGrain(result, 20);

    // 晕影
    result = applyVignette(result, 30);

    return result;
}

/**
 * HDR 效果
 */
export function hdrEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 使用 HDR 滤镜
    result = applyFilter(result, 'hdr', 60);

    // 增加清晰度
    result = applyClarity(result, 35);

    // 增加饱和度
    result = applyVibrance(result, 20);

    return result;
}

/**
 * 电影色调
 */
export function cinematicEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 使用电影滤镜
    result = applyFilter(result, 'cinematic');

    // 晕影
    result = applyVignette(result, 25);

    // 轻微颗粒
    result = applyGrain(result, 10);

    return result;
}

/**
 * 小清新
 */
export function freshEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 使用日系滤镜
    result = applyFilter(result, 'japanese');

    // 提亮
    result = applyExposure(result, 15);

    // 降低对比度
    result = adjustHighlightsShadows(result, -20, 10);

    return result;
}

/**
 * 戏剧效果
 */
export function dramaticEnhance(imageData: ImageData): ImageData {
    let result = imageData;

    // 高对比度
    result = applyFilter(result, 'highcontrast', 40);

    // 清晰度
    result = applyClarity(result, 50);

    // 强晕影
    result = applyVignette(result, 50);

    // 降低饱和度
    result = applyHSL(result, { hue: 0, saturation: -20, lightness: 0 });

    return result;
}

/**
 * 应用预设
 */
export function applyEnhancePreset(imageData: ImageData, presetId: string): ImageData {
    switch (presetId) {
        case 'auto_enhance': return autoEnhance(imageData);
        case 'portrait': return portraitEnhance(imageData);
        case 'landscape': return landscapeEnhance(imageData);
        case 'food': return foodEnhance(imageData);
        case 'night': return nightEnhance(imageData);
        case 'vintage': return vintageEnhance(imageData);
        case 'hdr': return hdrEnhance(imageData);
        case 'cinematic': return cinematicEnhance(imageData);
        case 'fresh': return freshEnhance(imageData);
        case 'dramatic': return dramaticEnhance(imageData);
        default: return imageData;
    }
}

export default {
    autoEnhance,
    portraitEnhance,
    landscapeEnhance,
    foodEnhance,
    nightEnhance,
    vintageEnhance,
    hdrEnhance,
    cinematicEnhance,
    freshEnhance,
    dramaticEnhance,
    applyEnhancePreset,
    ENHANCE_PRESETS
};
