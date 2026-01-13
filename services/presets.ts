import { ProcessSettings } from '../types';

export interface Preset {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    settings: ProcessSettings;
    isBuiltIn: boolean;
    createdAt: number;
}

// Built-in Presets
export const builtInPresets: Preset[] = [
    {
        id: 'preset-kaishu',
        name: '楷书优化',
        nameEn: 'Kaishu Optimized',
        description: '适合楷书作品，高阈值、边缘增强、去噪',
        descriptionEn: 'For Kaishu calligraphy, high threshold, edge enhancement, denoising',
        settings: {
            threshold: 200,
            strength: 2,
            contrast: 20,
            smoothing: true,
            monochrome: true,
            outputWidth: 0,
            outputHeight: 0,
            sharpness: 30,
            denoise: 15,
            adaptiveThreshold: false,
            edgeEnhance: true,
            removeBackground: true,
            brightness: -5,
            saturation: -100,
            backgroundColor: 'transparent',
            texture: 'xuan'
        },
        isBuiltIn: true,
        createdAt: Date.now()
    },
    {
        id: 'preset-xingshu',
        name: '行书流畅',
        nameEn: 'Xingshu Smooth',
        description: '适合行书作品，中阈值、平滑、降噪',
        descriptionEn: 'For Xingshu calligraphy, medium threshold, smoothing, denoising',
        settings: {
            threshold: 170,
            strength: 1,
            contrast: 10,
            smoothing: true,
            monochrome: false,
            outputWidth: 0,
            outputHeight: 0,
            sharpness: 20,
            denoise: 20,
            adaptiveThreshold: true,
            edgeEnhance: false,
            removeBackground: true,
            brightness: 0,
            saturation: -50,
            backgroundColor: 'transparent',
            texture: 'rice'
        },
        isBuiltIn: true,
        createdAt: Date.now()
    },
    {
        id: 'preset-caoshu',
        name: '草书狂放',
        nameEn: 'Caoshu Wild',
        description: '适合草书作品，低阈值、锐化、高对比度',
        descriptionEn: 'For Caoshu calligraphy, low threshold, sharpening, high contrast',
        settings: {
            threshold: 150,
            strength: 0,
            contrast: 30,
            smoothing: false,
            monochrome: false,
            outputWidth: 0,
            outputHeight: 0,
            sharpness: 50,
            denoise: 5,
            adaptiveThreshold: false,
            edgeEnhance: true,
            removeBackground: true,
            brightness: -10,
            saturation: -80,
            backgroundColor: 'transparent',
            texture: 'bamboo'
        },
        isBuiltIn: true,
        createdAt: Date.now()
    },
    {
        id: 'preset-photo',
        name: '照片模式',
        nameEn: 'Photo Mode',
        description: '保留背景，高饱和度，适合摄影作品',
        descriptionEn: 'Keep background, high saturation, for photography',
        settings: {
            threshold: 180,
            strength: 1,
            contrast: 15,
            smoothing: true,
            monochrome: false,
            outputWidth: 0,
            outputHeight: 0,
            sharpness: 25,
            denoise: 10,
            adaptiveThreshold: false,
            edgeEnhance: false,
            removeBackground: false,
            brightness: 10,
            saturation: 30,
            backgroundColor: '#ffffff',
            texture: 'none'
        },
        isBuiltIn: true,
        createdAt: Date.now()
    }
];

// Preset Management
const STORAGE_KEY = 'inkflow_presets';

export const loadUserPresets = (): Preset[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load presets:', error);
    }
    return [];
};

export const saveUserPresets = (presets: Preset[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
        console.error('Failed to save presets:', error);
    }
};

export const getAllPresets = (): Preset[] => {
    return [...builtInPresets, ...loadUserPresets()];
};

export const addPreset = (preset: Omit<Preset, 'id' | 'isBuiltIn' | 'createdAt'>): Preset => {
    const newPreset: Preset = {
        ...preset,
        id: `preset-${Date.now()}`,
        isBuiltIn: false,
        createdAt: Date.now()
    };

    const userPresets = loadUserPresets();
    userPresets.push(newPreset);
    saveUserPresets(userPresets);

    return newPreset;
};

export const deletePreset = (id: string): void => {
    const userPresets = loadUserPresets();
    const filtered = userPresets.filter(p => p.id !== id);
    saveUserPresets(filtered);
};

export const exportPreset = (preset: Preset): string => {
    return JSON.stringify(preset, null, 2);
};

export const importPreset = (jsonString: string): Preset | null => {
    try {
        const preset = JSON.parse(jsonString);
        if (preset.settings && preset.name) {
            return addPreset({
                name: preset.name,
                nameEn: preset.nameEn || preset.name,
                description: preset.description || '',
                descriptionEn: preset.descriptionEn || preset.description || '',
                settings: preset.settings
            });
        }
    } catch (error) {
        console.error('Failed to import preset:', error);
    }
    return null;
};
