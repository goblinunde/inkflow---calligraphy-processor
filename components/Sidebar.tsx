import React, { useRef, useState } from 'react';
import { Sparkles, Sliders, Layers, Droplet, Image as ImageIcon, Palette, Zap, Gauge, Scaling, Lock, LockOpen, RotateCcw, Stamp, Type, Upload, CheckCircle, XCircle, Settings, Wand2 } from 'lucide-react';
import { Slider } from './ui/Slider';
import { SectionHeader } from './ui/SectionHeader';
import { ProcessSettings } from '../types';
import { WatermarkLayerManager } from './WatermarkLayerManager';
import { AIConfigPanel } from './ui/AIConfigPanel';
import { AIProvider } from '../services/aiProviders';
import { FiltersPanel } from './FiltersPanel';
import { FilterType } from '../services/filtersService';
import { PhotoToolsPanel } from './PhotoEditor/PhotoToolsPanel';

interface SidebarProps {
    t: any;
    settings: ProcessSettings;
    handleSettingsChange: (key: keyof ProcessSettings, value: number | boolean | string) => void;
    onReset: () => void;
    originalImage: string | null;
    isAiProcessing: boolean;
    handleAiRestore: () => void;
    error: string | null;
    aiSuggestion: string | null;
    selectedAIProvider: AIProvider;
    onAIProviderChange: (provider: AIProvider) => void;
    onAIConfigured: (hasToken: boolean) => void;
    originalDims: { width: number; height: number };
    lockAspectRatio: boolean;
    setLockAspectRatio: (val: boolean) => void;
    handleDimensionChange: (key: 'outputWidth' | 'outputHeight', value: number) => void;
    onImageWatermarkUpload: (file: File) => void;
    onAddTextWatermark: (text: string, fontSize: number, fontFamily: string, color: string) => void;
    uploadStatus: { type: 'success' | 'error', message: string } | null;
    watermarks: any[];
    selectedWatermarkId: string | null;
    onSelectWatermark: (id: string | null) => void;
    onUpdateWatermark: (id: string, changes: any) => void;
    onRemoveWatermark: (id: string) => void;
    onMoveWatermarkUp: (id: string) => void;
    onMoveWatermarkDown: (id: string) => void;
    onDuplicateWatermark: (id: string) => void;
    onReorderWatermarks?: (fromIndex: number, toIndex: number) => void;
    onApplyColorPreset: (presetId: string) => void;
    gridEnabled: boolean;
    setGridEnabled: (enabled: boolean) => void;
    snapEnabled: boolean;
    setSnapEnabled: (enabled: boolean) => void;
    onOpenPhotoEditor?: () => void;
    onQuickAction?: (action: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    t,
    settings,
    handleSettingsChange,
    onReset,
    originalImage,
    isAiProcessing,
    handleAiRestore,
    error,
    aiSuggestion,
    selectedAIProvider,
    onAIProviderChange,
    onAIConfigured,
    originalDims,
    lockAspectRatio,
    setLockAspectRatio,
    handleDimensionChange,
    onImageWatermarkUpload,
    onAddTextWatermark,
    uploadStatus,
    watermarks,
    selectedWatermarkId,
    onSelectWatermark,
    onUpdateWatermark,
    onRemoveWatermark,
    onMoveWatermarkUp,
    onMoveWatermarkDown,
    onDuplicateWatermark,
    onReorderWatermarks,
    onApplyColorPreset,
    gridEnabled,
    setGridEnabled,
    snapEnabled,
    setSnapEnabled,
    onOpenPhotoEditor,
    onQuickAction
}) => {
    const watermarkInputRef = useRef<HTMLInputElement>(null);

    // Text Watermark State
    const [watermarkText, setWatermarkText] = useState('');
    const [fontFamily, setFontFamily] = useState('ZCOOL KuaiLe');
    const [fontSize, setFontSize] = useState(60);
    const [textColor, setTextColor] = useState('#000000');

    // 💡 滤镜叠加模式状态
    const [stackedFilters, setStackedFilters] = useState<FilterType[]>([]);

    const handleWatermarkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            onImageWatermarkUpload(e.target.files[0]);
            e.target.value = ''; // Reset input
        }
    };

    const handleAddText = () => {
        onAddTextWatermark(watermarkText, fontSize, fontFamily, textColor);
        setWatermarkText(''); // Clear input
    };

    return (
        <aside className="w-80 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--glass-bg)] backdrop-blur-xl p-6 scrollbar-thin scrollbar-thumb-[var(--fg-muted)]/30 scrollbar-track-transparent transition-colors duration-300">
            <div className="space-y-8">

                {/* AI Section - 多提供商支持 */}
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-5 border border-indigo-500/20 shadow-inner">
                    <div className="flex items-center gap-2 mb-3 text-indigo-300">
                        <Sparkles className="h-4 w-4" />
                        <h2 className="font-semibold text-xs uppercase tracking-wider">{t.aiRestore}</h2>
                    </div>
                    <p className="text-xs text-indigo-200/50 mb-4 leading-relaxed">
                        {t.aiDesc}
                    </p>

                    {/* AI 配置面板 */}
                    <AIConfigPanel
                        selectedProvider={selectedAIProvider}
                        onProviderChange={onAIProviderChange}
                        onConfigured={onAIConfigured}
                        t={t}
                    />

                    {/* 执行按钮 */}
                    <button
                        onClick={handleAiRestore}
                        disabled={!originalImage || isAiProcessing}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition-all shadow-lg shadow-indigo-900/20 mt-4"
                    >
                        {isAiProcessing ? (
                            <span className="animate-pulse">{t.restoring}</span>
                        ) : (
                            <>{t.autoRepair}</>
                        )}
                    </button>

                    {/* 错误显示 */}
                    {error && <p className="mt-3 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-500/20">{error}</p>}

                    {/* AI 建议显示 */}
                    {aiSuggestion && (
                        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                            <p className="text-[10px] text-blue-300 font-medium mb-1">AI 分析建议：</p>
                            <p className="text-xs text-blue-200/80 whitespace-pre-wrap max-h-40 overflow-y-auto">{aiSuggestion}</p>
                        </div>
                    )}
                </div>

                {/* Mode Toggle */}
                <div className="bg-[var(--bg-secondary)] rounded-xl p-1 flex">
                    <button
                        onClick={() => handleSettingsChange('removeBackground', true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${settings.removeBackground ? 'bg-indigo-600 text-[var(--fg-primary)] shadow-lg' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}`}
                    >
                        <Droplet className="h-3 w-3" />
                        {t.inkMode}
                    </button>
                    <button
                        onClick={() => handleSettingsChange('removeBackground', false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${!settings.removeBackground ? 'bg-indigo-600 text-[var(--fg-primary)] shadow-lg' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}`}
                    >
                        <ImageIcon className="h-3 w-3" />
                        {t.photoMode}
                    </button>
                </div>

                {/* General Adjustments */}
                <div>
                    <SectionHeader icon={Sliders} title={t.adjustments} />
                    <div className="space-y-6">
                        <Slider label={t.brightness} value={settings.brightness} min={-100} max={100} onChange={(val) => handleSettingsChange('brightness', val)} disabled={!originalImage} />
                        <Slider label={t.saturationMono} value={settings.saturation} min={-100} max={100} onChange={(val) => handleSettingsChange('saturation', val)} disabled={!originalImage} />
                        <Slider label={t.contrast} value={settings.contrast} min={0} max={100} onChange={(val) => handleSettingsChange('contrast', val)} disabled={!originalImage} />
                    </div>
                </div>

                {/* Color Presets */}
                {originalImage && (
                    <div className="relative z-10">
                        <SectionHeader icon={Palette} title="🎨 色彩预设" />
                        <div className="grid grid-cols-2 gap-2 relative z-10">
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-pure-black');
                                    onApplyColorPreset('color-pure-black');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                🖤 纯黑墨
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-antique-brown');
                                    onApplyColorPreset('color-antique-brown');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                🤎 古典褐
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-vintage-gray');
                                    onApplyColorPreset('color-vintage-gray');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                🩶 复古灰
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-modern-cool');
                                    onApplyColorPreset('color-modern-cool');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                💙 现代冷调
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-warm-sepia');
                                    onApplyColorPreset('color-warm-sepia');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                🧡 温暖棕褐
                            </button>
                            <button
                                onClick={() => {
                                    console.log('Color preset clicked: color-vivid');
                                    onApplyColorPreset('color-vivid');
                                }}
                                className="py-2 px-2 text-[11px] rounded border bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-[var(--fg-primary)] transition-all active:scale-95 cursor-pointer pointer-events-auto"
                            >
                                ❤️ 鲜艳原色
                            </button>
                        </div>
                    </div>
                )}

                {/* Art Filters Panel */}
                {originalImage && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SectionHeader icon={Wand2} title={t.artFilters || '✨ 艺术滤镜'} />
                        <FiltersPanel
                            currentFilter={settings.filter as FilterType | null}
                            filterIntensity={settings.filterIntensity || 50}
                            onApplyFilter={(filter, stackMode) => {
                                if (stackMode && filter) {
                                    // 💡 叠加模式：切换滤镜在列表中的存在
                                    const newStacked = stackedFilters.includes(filter)
                                        ? stackedFilters.filter(f => f !== filter)
                                        : [...stackedFilters, filter];
                                    setStackedFilters(newStacked);
                                    // 💡 同步到 settings 以触发 processor 重新处理
                                    handleSettingsChange('stackedFilters' as any, newStacked as any);
                                } else if (filter === null) {
                                    // 清除所有滤镜
                                    setStackedFilters([]);
                                    handleSettingsChange('filter', '');
                                    handleSettingsChange('stackedFilters' as any, [] as any);
                                } else {
                                    // 普通模式：单个滤镜
                                    setStackedFilters([]);
                                    handleSettingsChange('filter', filter || '');
                                    handleSettingsChange('stackedFilters' as any, [] as any);
                                }
                            }}
                            onIntensityChange={(intensity) => handleSettingsChange('filterIntensity', intensity)}
                            t={t}
                            lang={t.appTitle === 'InkFlow' ? 'en' : 'zh'}
                            stackedFilters={stackedFilters}
                        />
                    </div>
                )}

                {/* P图工具 - 仅在照片模式显示 */}
                {originalImage && !settings.removeBackground && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <PhotoToolsPanel
                            t={t}
                            originalImage={originalImage}
                            onOpenPhotoEditor={() => onOpenPhotoEditor?.()}
                            onQuickAction={onQuickAction}
                        />
                    </div>
                )}

                {/* Ink Specific Controls */}
                {settings.removeBackground && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SectionHeader icon={Layers} title={t.inkExtraction} />
                        <div className="space-y-6">

                            {/* 背景阈值 - 扩展版 */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-[var(--fg-secondary)]">{t.bgThreshold}</label>
                                    <input
                                        type="number"
                                        value={settings.threshold}
                                        onChange={(e) => handleSettingsChange('threshold', Math.max(1, Math.min(254, parseInt(e.target.value) || 1)))}
                                        className="w-16 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)] text-center focus:outline-none focus:border-indigo-500"
                                        disabled={!originalImage}
                                        min={1}
                                        max={254}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={254}
                                    step={1}
                                    value={settings.threshold}
                                    onChange={(e) => handleSettingsChange('threshold', Number(e.target.value))}
                                    disabled={!originalImage}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                {/* 阈值快捷预设 */}
                                <div className="grid grid-cols-5 gap-1 mt-2">
                                    {[100, 140, 180, 210, 240].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => handleSettingsChange('threshold', val)}
                                            disabled={!originalImage}
                                            className={`py-1 text-[10px] rounded transition-all ${settings.threshold === val ? 'bg-indigo-500/40 text-indigo-200' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs text-[var(--fg-muted)]">{t.adaptiveThreshold}</span>
                                <button
                                    onClick={() => handleSettingsChange('adaptiveThreshold', !settings.adaptiveThreshold)}
                                    disabled={!originalImage}
                                    className={`w-9 h-5 rounded-full transition-colors relative ${settings.adaptiveThreshold ? 'bg-indigo-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${settings.adaptiveThreshold ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* 笔画粗细 - 扩展版 (范围更大、步进更细) */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-medium text-[var(--fg-secondary)]">{t.strokeWeight}</label>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleSettingsChange('strength', Math.max(-10, settings.strength - 0.5))}
                                            disabled={!originalImage}
                                            className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                        >−</button>
                                        <input
                                            type="number"
                                            value={settings.strength}
                                            onChange={(e) => handleSettingsChange('strength', Math.max(-10, Math.min(15, parseFloat(e.target.value) || 0)))}
                                            className="w-14 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)] text-center focus:outline-none focus:border-indigo-500"
                                            disabled={!originalImage}
                                            step={0.5}
                                            min={-10}
                                            max={15}
                                        />
                                        <button
                                            onClick={() => handleSettingsChange('strength', Math.min(15, settings.strength + 0.5))}
                                            disabled={!originalImage}
                                            className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                        >+</button>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={-10}
                                    max={15}
                                    step={0.5}
                                    value={settings.strength}
                                    onChange={(e) => handleSettingsChange('strength', Number(e.target.value))}
                                    disabled={!originalImage}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[9px] text-[var(--fg-muted)] mt-1">
                                    <span>极细 -10</span>
                                    <span className="text-indigo-300">← 0 →</span>
                                    <span>极粗 +15</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button onClick={() => handleSettingsChange('monochrome', !settings.monochrome)} disabled={!originalImage} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${settings.monochrome ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}>
                                    <Palette className="h-3 w-3" />
                                    {settings.monochrome ? t.blackInk : t.originalColor}
                                </button>
                                <button onClick={() => handleSettingsChange('edgeEnhance', !settings.edgeEnhance)} disabled={!originalImage} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${settings.edgeEnhance ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}>
                                    <Gauge className="h-3 w-3" />
                                    {t.edgeBoost}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 书法专用功能 */}
                {originalImage && settings.removeBackground && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SectionHeader icon={Type} title={t.calligraphyTools || '书法专用'} />
                        <div className="space-y-4">

                            {/* 印章红色分离 */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div>
                                    <span className="text-xs font-medium text-red-300">{t.sealExtraction || '印章分离'}</span>
                                    <p className="text-[10px] text-red-200/50 mt-0.5">自动识别红色印章</p>
                                </div>
                                <button
                                    onClick={() => handleSettingsChange('sealExtraction', !settings.sealExtraction)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.sealExtraction ? 'bg-red-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.sealExtraction ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* 飞白效果保留 */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <div>
                                    <span className="text-xs font-medium text-amber-300">{t.flyingWhite || '飞白保留'}</span>
                                    <p className="text-[10px] text-amber-200/50 mt-0.5">保留干笔纹理</p>
                                </div>
                                <button
                                    onClick={() => handleSettingsChange('preserveFlyingWhite', !settings.preserveFlyingWhite)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.preserveFlyingWhite ? 'bg-amber-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.preserveFlyingWhite ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* 边缘平滑 */}
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-emerald-300">{t.edgeSmoothing || '边缘平滑'}</span>
                                    <span className="text-xs text-emerald-200">{settings.edgeSmoothness}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={settings.edgeSmoothness}
                                    onChange={(e) => handleSettingsChange('edgeSmoothness', parseInt(e.target.value))}
                                    disabled={!originalImage}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    style={{
                                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${settings.edgeSmoothness}%, var(--bg-tertiary) ${settings.edgeSmoothness}%, var(--bg-tertiary) 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-[9px] text-emerald-200/50 mt-1">
                                    <span>锐利</span>
                                    <span>柔和</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhancements (Common) - 扩展版 */}
                <div>
                    <SectionHeader icon={Zap} title={t.enhance} />
                    <div className="space-y-6">

                        {/* 锐化 - 扩展版 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-medium text-[var(--fg-secondary)]">{t.sharpness}</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSettingsChange('sharpness', Math.max(0, settings.sharpness - 5))}
                                        disabled={!originalImage}
                                        className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                    >−</button>
                                    <input
                                        type="number"
                                        value={settings.sharpness}
                                        onChange={(e) => handleSettingsChange('sharpness', Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
                                        className="w-14 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)] text-center focus:outline-none focus:border-indigo-500"
                                        disabled={!originalImage}
                                        min={0}
                                        max={200}
                                    />
                                    <button
                                        onClick={() => handleSettingsChange('sharpness', Math.min(200, settings.sharpness + 5))}
                                        disabled={!originalImage}
                                        className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                    >+</button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={200}
                                step={1}
                                value={settings.sharpness}
                                onChange={(e) => handleSettingsChange('sharpness', Number(e.target.value))}
                                disabled={!originalImage}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            {/* 锐化快捷预设 */}
                            <div className="grid grid-cols-5 gap-1 mt-2">
                                {[0, 30, 60, 100, 150].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleSettingsChange('sharpness', val)}
                                        disabled={!originalImage}
                                        className={`py-1 text-[10px] rounded transition-all ${settings.sharpness === val ? 'bg-indigo-500/40 text-indigo-200' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                                    >
                                        {val === 0 ? '关' : val === 30 ? '轻' : val === 60 ? '中' : val === 100 ? '强' : '极'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 降噪 - 扩展版 */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-medium text-[var(--fg-secondary)]">{t.denoise}</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleSettingsChange('denoise', Math.max(0, settings.denoise - 5))}
                                        disabled={!originalImage}
                                        className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                    >−</button>
                                    <input
                                        type="number"
                                        value={settings.denoise}
                                        onChange={(e) => handleSettingsChange('denoise', Math.max(0, Math.min(150, parseInt(e.target.value) || 0)))}
                                        className="w-14 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)] text-center focus:outline-none focus:border-indigo-500"
                                        disabled={!originalImage}
                                        min={0}
                                        max={150}
                                    />
                                    <button
                                        onClick={() => handleSettingsChange('denoise', Math.min(150, settings.denoise + 5))}
                                        disabled={!originalImage}
                                        className="w-6 h-6 rounded bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm"
                                    >+</button>
                                </div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={150}
                                step={1}
                                value={settings.denoise}
                                onChange={(e) => handleSettingsChange('denoise', Number(e.target.value))}
                                disabled={!originalImage}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            {/* 降噪快捷预设 */}
                            <div className="grid grid-cols-5 gap-1 mt-2">
                                {[0, 25, 50, 80, 120].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleSettingsChange('denoise', val)}
                                        disabled={!originalImage}
                                        className={`py-1 text-[10px] rounded transition-all ${settings.denoise === val ? 'bg-indigo-500/40 text-indigo-200' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                                    >
                                        {val === 0 ? '关' : val === 25 ? '轻' : val === 50 ? '中' : val === 80 ? '强' : '极'}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Advanced Processing (Phase 5) */}
                {originalImage && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <SectionHeader icon={Sliders} title={t.advancedProcessing || '🔬 高级处理'} />
                        <div className="space-y-4">

                            {/* Blur Type Selection */}
                            <div>
                                <span className="text-xs text-[var(--fg-secondary)] block mb-2">{t.blurType || '模糊类型'}</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['box', 'gaussian', 'bilateral'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleSettingsChange('blurType', type)}
                                            className={`py-2 px-1 text-[11px] rounded border transition-all ${settings.blurType === type
                                                ? 'bg-indigo-500/30 border-indigo-500 text-indigo-100'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'
                                                }`}
                                        >
                                            {type === 'box' ? '普通' : type === 'gaussian' ? '高斯' : '双边'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Blur Radius (only for gaussian/bilateral) */}
                            {(settings.blurType === 'gaussian' || settings.blurType === 'bilateral') && (
                                <Slider
                                    label={t.blurRadius || '模糊半径'}
                                    value={settings.blurRadius}
                                    min={0}
                                    max={20}
                                    onChange={(val) => handleSettingsChange('blurRadius', val)}
                                    disabled={!originalImage}
                                />
                            )}

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-default)]">
                                <button
                                    onClick={() => handleSettingsChange('autoLevels', !settings.autoLevels)}
                                    className={`flex items-center justify-center gap-2 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${settings.autoLevels ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}
                                >
                                    <Zap className="h-3 w-3" />
                                    {t.autoLevels || '自动色阶'}
                                </button>
                                <button
                                    onClick={() => handleSettingsChange('histogramEqualization', !settings.histogramEqualization)}
                                    className={`flex items-center justify-center gap-2 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${settings.histogramEqualization ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}
                                >
                                    <Gauge className="h-3 w-3" />
                                    {t.histogramEq || '直方图均衡'}
                                </button>
                            </div>

                            {/* Manual Levels Toggle */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs text-[var(--fg-muted)]">{t.manualLevels || '手动色阶调整'}</span>
                                <button
                                    onClick={() => handleSettingsChange('levelsEnabled', !settings.levelsEnabled)}
                                    className={`w-9 h-5 rounded-full transition-colors relative ${settings.levelsEnabled ? 'bg-indigo-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${settings.levelsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Levels Controls (when enabled) */}
                            {settings.levelsEnabled && (
                                <div className="space-y-4 bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-default)]">
                                    <Slider
                                        label={t.inputBlack || '输入黑点'}
                                        value={settings.levelsInputBlack}
                                        min={0}
                                        max={254}
                                        onChange={(val) => handleSettingsChange('levelsInputBlack', val)}
                                        disabled={!originalImage}
                                    />
                                    <Slider
                                        label={t.inputWhite || '输入白点'}
                                        value={settings.levelsInputWhite}
                                        min={1}
                                        max={255}
                                        onChange={(val) => handleSettingsChange('levelsInputWhite', val)}
                                        disabled={!originalImage}
                                    />
                                    <Slider
                                        label={t.gamma || 'Gamma'}
                                        value={settings.levelsGamma * 100}
                                        min={10}
                                        max={300}
                                        onChange={(val) => handleSettingsChange('levelsGamma', val / 100)}
                                        disabled={!originalImage}
                                    />
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Background Processing */}
                {settings.removeBackground && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-100">
                        <SectionHeader icon={Palette} title={t.bgProcessing} />
                        <div className="space-y-4">
                            {/* Background Color Picker */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--fg-secondary)]">{t.bgColor}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSettingsChange('backgroundColor', 'transparent')}
                                        className={`h-6 w-6 rounded border ${settings.backgroundColor === 'transparent' ? 'border-white bg-[#ffffff] bg-opacity-10 backdrop-blur-sm ring-1 ring-white' : 'border-white/20 bg-transparent'}`}
                                        title={t.transparent}
                                    >
                                        <div className="w-full h-full rounded checkerboard opacity-50"></div>
                                    </button>
                                    <input
                                        type="color"
                                        value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
                                        onChange={(e) => handleSettingsChange('backgroundColor', e.target.value)}
                                        className="h-6 w-6 rounded border border-white/20 p-0 bg-transparent cursor-pointer"
                                        disabled={settings.backgroundColor === 'transparent'}
                                    />
                                    <button
                                        onClick={() => handleSettingsChange('backgroundColor', settings.backgroundColor === 'transparent' ? '#ffffff' : 'transparent')}
                                        className="text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                        {settings.backgroundColor === 'transparent' ? t.transparent : settings.backgroundColor}
                                    </button>
                                </div>
                            </div>

                            {/* Texture Selector */}
                            <div className="pt-2 border-t border-[var(--border-default)]">
                                <span className="text-xs text-[var(--fg-secondary)] block mb-2">{t.bgTexture}</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['none', 'rice', 'xuan', 'parchment', 'bamboo', 'gold', 'silk'].map(tex => (
                                        <button
                                            key={tex}
                                            onClick={() => handleSettingsChange('texture', tex)}
                                            className={`py-2 px-1 text-[11px] rounded border transition-all ${settings.texture === tex
                                                ? 'bg-indigo-500/30 border-indigo-500 text-indigo-100 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]'
                                                }`}
                                        >
                                            {t[tex] || tex}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Smoothing */}
                            <div className="flex items-center justify-between px-1 border-t border-[var(--border-default)] pt-3">
                                <span className="text-xs text-[var(--fg-muted)]">{t.smoothing}</span>
                                <button
                                    onClick={() => handleSettingsChange('smoothing', !settings.smoothing)}
                                    disabled={!originalImage}
                                    className={`w-9 h-5 rounded-full transition-colors relative ${settings.smoothing ? 'bg-indigo-500' : 'bg-[var(--bg-tertiary)]'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${settings.smoothing ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Watermarks Section */}
                {originalImage && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 delay-150">
                        <SectionHeader icon={Stamp} title={t.watermarks || '水印'} />
                        <div className="space-y-4">

                            {/* Upload Status */}
                            {uploadStatus && (
                                <div className={`text-xs p-2 rounded flex items-center gap-2 ${uploadStatus.type === 'success'
                                    ? 'bg-green-900/20 text-green-300 border border-green-500/20'
                                    : 'bg-red-900/20 text-red-300 border border-red-500/20'
                                    }`}>
                                    {uploadStatus.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                    {uploadStatus.message}
                                </div>
                            )}

                            {/* 图层管理器 */}
                            <WatermarkLayerManager
                                watermarks={watermarks}
                                selectedWatermarkId={selectedWatermarkId}
                                onSelect={onSelectWatermark}
                                onUpdate={onUpdateWatermark}
                                onRemove={onRemoveWatermark}
                                onMoveUp={onMoveWatermarkUp}
                                onMoveDown={onMoveWatermarkDown}
                                onDuplicate={onDuplicateWatermark}
                                onReorder={onReorderWatermarks}
                                t={t}
                            />

                            {/* Selected Watermark Editor */}
                            {selectedWatermarkId && watermarks.find(w => w.id === selectedWatermarkId) && (() => {
                                const selectedWatermark = watermarks.find(w => w.id === selectedWatermarkId)!;
                                return (
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-yellow-200">✏️ 选中的水印</span>
                                            <span className="text-[10px] text-yellow-300/50">#{selectedWatermark.id.slice(-4)}</span>
                                        </div>

                                        {/* Opacity Slider */}
                                        <div>
                                            <label className="text-[10px] text-[var(--fg-secondary)] block mb-1">透明度 Opacity</label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={selectedWatermark.opacity}
                                                onChange={(e) => onUpdateWatermark(selectedWatermarkId, { opacity: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${selectedWatermark.opacity}%, rgba(255,255,255,0.1) ${selectedWatermark.opacity}%, rgba(255,255,255,0.1) 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-[10px] text-[var(--fg-muted)] mt-1">
                                                <span>0%</span>
                                                <span className="text-yellow-300 font-medium">{selectedWatermark.opacity}%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>

                                        {/* Rotation Slider */}
                                        <div>
                                            <label className="text-[10px] text-[var(--fg-secondary)] block mb-1">旋转角度 Rotation</label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={360}
                                                value={selectedWatermark.rotation}
                                                onChange={(e) => onUpdateWatermark(selectedWatermarkId, { rotation: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-[var(--fg-muted)] mt-1">
                                                <span>0°</span>
                                                <span className="text-yellow-300 font-medium">{Math.round(selectedWatermark.rotation)}°</span>
                                                <span>360°</span>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-2 pt-2 border-t border-yellow-500/20">
                                            <button
                                                onClick={() => onUpdateWatermark(selectedWatermarkId, { opacity: 100, rotation: 0 })}
                                                className="flex-1 text-[10px] py-1.5 px-2 rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] transition-all"
                                            >
                                                重置
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newWatermark = { ...selectedWatermark, id: Date.now().toString() };
                                                    // Copy watermark logic would go here
                                                }}
                                                className="flex-1 text-[10px] py-1.5 px-2 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 transition-all"
                                                title="复制水印"
                                            >
                                                复制
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Image Watermark Upload */}
                            <div>
                                <span className="text-xs text-[var(--fg-secondary)] block mb-2">{t.imageWatermark || '图片水印'}</span>
                                <button
                                    onClick={() => watermarkInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-lg bg-red-900/30 border border-red-500/20 text-red-200 text-xs font-medium hover:bg-red-900/50 hover:border-red-500/40 transition-all shadow-sm"
                                >
                                    <Upload className="h-3 w-3" />
                                    {t.uploadWatermark || '上传水印图片'}
                                </button>
                                <input
                                    type="file"
                                    ref={watermarkInputRef}
                                    accept="image/png,image/jpeg,image/svg+xml"
                                    className="hidden"
                                    onChange={handleWatermarkFile}
                                />
                                <p className="text-[10px] text-[var(--fg-muted)] mt-1">{t.supportedFormats || '支持 PNG, JPEG, SVG'}</p>
                            </div>

                            {/* Text Watermark */}
                            <div className="pt-3 border-t border-[var(--border-default)]">
                                <span className="text-xs text-[var(--fg-secondary)] block mb-2">{t.textWatermark || '文字水印'}</span>

                                <input
                                    type="text"
                                    placeholder={t.enterWatermarkText || '输入水印文字...'}
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-white/20 mb-3"
                                />

                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-indigo-500/50 mb-3"
                                >
                                    <optgroup label="中文艺术字">
                                        <option value="ZCOOL KuaiLe">站酷快乐体</option>
                                        <option value="ZCOOL XiaoWei">站酷小薇体</option>
                                        <option value="Ma Shan Zheng">马善政楷书</option>
                                        <option value="Liu Jian Mao Cao">刘建毛草</option>
                                        <option value="Zhi Mang Xing">志明行书</option>
                                    </optgroup>
                                    <optgroup label="English Fonts">
                                        <option value="Lobster">Lobster</option>
                                        <option value="Pacifico">Pacifico</option>
                                        <option value="Dancing Script">Dancing Script</option>
                                        <option value="Caveat">Caveat</option>
                                        <option value="Shadows Into Light">Shadows Into Light</option>
                                    </optgroup>
                                </select>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">{t.fontSize || '字号'}</label>
                                        <input
                                            type="number"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value) || 60)}
                                            min={12}
                                            max={200}
                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">{t.textColor || '颜色'}</label>
                                        <input
                                            type="color"
                                            value={textColor}
                                            onChange={(e) => setTextColor(e.target.value)}
                                            className="w-full h-8 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddText}
                                    disabled={!watermarkText.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-indigo-600/80 border border-indigo-500/30 text-[var(--fg-primary)] text-xs font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <Type className="h-3 w-3" />
                                    {t.addTextWatermark || '添加文字水印'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolution */}
                <div>
                    <SectionHeader icon={Scaling} title={t.resolution} />
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                            <input
                                type="number"
                                value={settings.outputWidth || ''}
                                onChange={(e) => handleDimensionChange('outputWidth', parseInt(e.target.value) || 0)}
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-white/20"
                                disabled={!originalImage}
                                placeholder="W"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                value={settings.outputHeight || ''}
                                onChange={(e) => handleDimensionChange('outputHeight', parseInt(e.target.value) || 0)}
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-sm text-[var(--fg-primary)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-white/20"
                                disabled={!originalImage}
                                placeholder="H"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-xs text-[var(--fg-muted)]">{originalDims.width}px × {originalDims.height}px</span>
                        <button
                            onClick={() => setLockAspectRatio(!lockAspectRatio)}
                            className="flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                        >
                            {lockAspectRatio ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                        </button>
                    </div>

                    <button
                        onClick={onReset}
                        className="flex items-center justify-center gap-2 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] py-2 text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)] transition-all backdrop-blur-sm"
                        disabled={!originalImage}
                    >
                        <RotateCcw className="h-3 w-3" />
                        {t.reset}
                    </button>
                </div>

            </div>
        </aside>
    );
};
