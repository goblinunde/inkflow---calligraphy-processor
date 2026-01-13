import { ProcessSettings } from '../types';

export interface ColorPreset {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    settings: {
        brightness: number;
        saturation: number;
        contrast: number;
        monochrome: boolean;
    };
}

export const colorPresets: ColorPreset[] = [
    {
        id: 'color-pure-black',
        name: '纯黑墨',
        nameEn: 'Pure Black Ink',
        description: '纯黑色，高对比，适合传统书法',
        descriptionEn: 'Pure black, high contrast, for traditional calligraphy',
        settings: {
            brightness: -10,
            saturation: -100,
            contrast: 30,
            monochrome: true
        }
    },
    {
        id: 'color-antique-brown',
        name: '古典褐',
        nameEn: 'Antique Brown',
        description: '深褐色调，复古韵味',
        descriptionEn: 'Deep brown tone, vintage feel',
        settings: {
            brightness: -5,
            saturation: -60,
            contrast: 20,
            monochrome: false
        }
    },
    {
        id: 'color-vintage-gray',
        name: '复古灰',
        nameEn: 'Vintage Gray',
        description: '灰度效果，低饱和度，怀旧感',
        descriptionEn: 'Grayscale effect, low saturation, nostalgic',
        settings: {
            brightness: 0,
            saturation: -80,
            contrast: 15,
            monochrome: false
        }
    },
    {
        id: 'color-modern-cool',
        name: '现代冷调',
        nameEn: 'Modern Cool Tone',
        description: '蓝灰色调，现代简约',
        descriptionEn: 'Blue-gray tone, modern minimalist',
        settings: {
            brightness: 5,
            saturation: -40,
            contrast: 10,
            monochrome: false
        }
    },
    {
        id: 'color-warm-sepia',
        name: '温暖棕褐',
        nameEn: 'Warm Sepia',
        description: '暖色调，怀旧照片效果',
        descriptionEn: 'Warm tone, vintage photo effect',
        settings: {
            brightness: 10,
            saturation: -50,
            contrast: 15,
            monochrome: false
        }
    },
    {
        id: 'color-vivid',
        name: '鲜艳原色',
        nameEn: 'Vivid Original',
        description: '保留色彩，高饱和度',
        descriptionEn: 'Preserve colors, high saturation',
        settings: {
            brightness: 5,
            saturation: 30,
            contrast: 20,
            monochrome: false
        }
    }
];

export const applyColorPreset = (
    preset: ColorPreset,
    currentSettings: ProcessSettings
): ProcessSettings => {
    return {
        ...currentSettings,
        brightness: preset.settings.brightness,
        saturation: preset.settings.saturation,
        contrast: preset.settings.contrast,
        monochrome: preset.settings.monochrome
    };
};
