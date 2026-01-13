import React, { useState } from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import {
    Wand2, Eraser, Stamp, Droplets, Lasso, Sun, Moon, Sparkles,
    Eye, ChevronRight, Zap, Crop, RotateCcw, RotateCw,
    FlipHorizontal, FlipVertical, ZoomIn, Paintbrush, Camera, Star,
    ImagePlus, Palette, Sliders, Contrast, Maximize
} from 'lucide-react';

interface PhotoToolsPanelProps {
    t: any;
    originalImage: string | null;
    onOpenPhotoEditor: () => void;
    onQuickAction?: (action: string, imageData?: ImageData) => void;
}

// 一键预设
const QUICK_PRESETS = [
    { id: 'auto_enhance', icon: '✨', label: '一键美化', color: 'from-indigo-500 to-purple-500' },
    { id: 'portrait', icon: '👤', label: '人像美颜', color: 'from-pink-500 to-rose-500' },
    { id: 'landscape', icon: '🏞️', label: '风景增强', color: 'from-emerald-500 to-teal-500' },
    { id: 'food', icon: '🍜', label: '美食模式', color: 'from-orange-500 to-amber-500' },
    { id: 'night', icon: '🌙', label: '夜景优化', color: 'from-slate-500 to-zinc-500' },
    { id: 'vintage', icon: '📷', label: '复古胶片', color: 'from-amber-600 to-yellow-600' },
    { id: 'hdr', icon: '🌈', label: 'HDR', color: 'from-cyan-500 to-blue-500' },
    { id: 'cinematic', icon: '🎬', label: '电影色调', color: 'from-violet-500 to-purple-500' },
];

// 修图工具
const RETOUCH_TOOLS = [
    { id: 'lasso', icon: Lasso, label: '套索', desc: '选区' },
    { id: 'clone', icon: Stamp, label: '克隆', desc: '复制' },
    { id: 'spot', icon: Droplets, label: '修复', desc: '瑕疵' },
    { id: 'dodge', icon: Sun, label: '减淡', desc: '提亮' },
    { id: 'burn', icon: Moon, label: '加深', desc: '压暗' },
    { id: 'sharpen', icon: Zap, label: '锐化', desc: '清晰' },
    { id: 'redeye', icon: Eye, label: '红眼', desc: '消除' },
    { id: 'brush', icon: Paintbrush, label: '画笔', desc: '绘制' },
];

// 变换工具
const TRANSFORM_TOOLS = [
    { id: 'rotate_left', icon: RotateCcw, label: '左旋90°' },
    { id: 'rotate_right', icon: RotateCw, label: '右旋90°' },
    { id: 'flip_h', icon: FlipHorizontal, label: '水平翻转' },
    { id: 'flip_v', icon: FlipVertical, label: '垂直翻转' },
    { id: 'crop', icon: Crop, label: '裁剪' },
    { id: 'resize', icon: Maximize, label: '缩放' },
];

// 调整项
const ADJUSTMENTS = [
    { id: 'exposure', icon: Sun, label: '曝光' },
    { id: 'contrast', icon: Contrast, label: '对比度' },
    { id: 'saturation', icon: Palette, label: '饱和度' },
    { id: 'temperature', icon: Sliders, label: '色温' },
    { id: 'hsl', icon: Palette, label: 'HSL' },
    { id: 'curves', icon: Sliders, label: '曲线' },
];

/**
 * P图工具面板 - 精细版
 * 💡 标签式UI、一键预设、变换工具、调整项
 */
export const PhotoToolsPanel: React.FC<PhotoToolsPanelProps> = ({
    t,
    originalImage,
    onOpenPhotoEditor,
    onQuickAction
}) => {
    const [activeTab, setActiveTab] = useState<'preset' | 'tool' | 'transform' | 'adjust'>('preset');

    const handleAction = (actionId: string) => {
        if (onQuickAction) {
            onQuickAction(actionId);
        } else {
            onOpenPhotoEditor();
        }
    };

    const isDisabled = !originalImage;

    return (
        <div className="space-y-2.5">
            <SectionHeader icon={Wand2} title={t.photoTools || '🖌️ P图工具'} />

            {/* 标签栏 */}
            <div className="grid grid-cols-4 gap-0.5 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
                {[
                    { id: 'preset', label: '预设', icon: '✨' },
                    { id: 'tool', label: '工具', icon: '🔧' },
                    { id: 'transform', label: '变换', icon: '🔄' },
                    { id: 'adjust', label: '调整', icon: '🎚️' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex flex-col items-center py-1.5 rounded-md text-[9px] font-medium transition-all
                            ${activeTab === tab.id
                                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                                : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]'
                            }
                        `}
                    >
                        <span className="text-sm">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 预设面板 */}
            {activeTab === 'preset' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-1">
                        {QUICK_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handleAction(preset.id)}
                                disabled={isDisabled}
                                className={`
                                    relative flex flex-col items-center gap-0.5 p-1.5 rounded-lg overflow-hidden
                                    bg-gradient-to-br ${preset.color} bg-opacity-10
                                    border border-white/10 hover:border-white/30
                                    transition-all hover:scale-105 hover:shadow-lg
                                    disabled:opacity-30 disabled:hover:scale-100
                                `}
                            >
                                <span className="text-lg drop-shadow">{preset.icon}</span>
                                <span className="text-[8px] font-medium text-white/90 drop-shadow">{preset.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 热门滤镜 */}
                    <div className="pt-1">
                        <p className="text-[8px] text-[var(--fg-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5" /> 热门滤镜
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {['水墨', 'LOMO', '电影', '日落', '小清新', '素描', '油画', '波普'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={onOpenPhotoEditor}
                                    disabled={isDisabled}
                                    className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[8px] text-[var(--fg-muted)] hover:border-indigo-500/50 hover:text-indigo-300 transition-all disabled:opacity-30"
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 工具面板 */}
            {activeTab === 'tool' && (
                <div className="grid grid-cols-4 gap-1">
                    {RETOUCH_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            onClick={onOpenPhotoEditor}
                            disabled={isDisabled}
                            className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all disabled:opacity-30"
                        >
                            <tool.icon className="h-4 w-4 text-[var(--fg-muted)]" />
                            <span className="text-[9px] font-medium text-[var(--fg-primary)]">{tool.label}</span>
                            <span className="text-[7px] text-[var(--fg-muted)]">{tool.desc}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* 变换面板 */}
            {activeTab === 'transform' && (
                <div className="space-y-2">
                    {/* 旋转翻转 */}
                    <div className="grid grid-cols-2 gap-1">
                        {TRANSFORM_TOOLS.slice(0, 4).map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => handleAction(tool.id)}
                                disabled={isDisabled}
                                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all disabled:opacity-30"
                            >
                                <tool.icon className="h-4 w-4 text-indigo-400" />
                                <span className="text-[10px] font-medium text-[var(--fg-primary)]">{tool.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 裁剪缩放 - 💡 调用 handleAction 触发实际功能 */}
                    <div className="grid grid-cols-2 gap-1">
                        {TRANSFORM_TOOLS.slice(4).map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => handleAction(tool.id)}
                                disabled={isDisabled}
                                className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all disabled:opacity-30"
                            >
                                <tool.icon className="h-4 w-4 text-indigo-400" />
                                <span className="text-[10px] font-medium text-[var(--fg-primary)]">{tool.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 快捷提示 */}
                    <p className="text-[8px] text-[var(--fg-muted)] text-center">
                        旋转翻转即时生效 · 裁剪缩放在编辑器中操作
                    </p>
                </div>
            )}

            {/* 调整面板 */}
            {activeTab === 'adjust' && (
                <div className="grid grid-cols-3 gap-1">
                    {ADJUSTMENTS.map(adj => (
                        <button
                            key={adj.id}
                            onClick={onOpenPhotoEditor}
                            disabled={isDisabled}
                            className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all disabled:opacity-30"
                        >
                            <adj.icon className="h-4 w-4 text-[var(--fg-muted)]" />
                            <span className="text-[9px] font-medium text-[var(--fg-primary)]">{adj.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* 打开编辑器 */}
            <button
                onClick={onOpenPhotoEditor}
                disabled={isDisabled}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-medium shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50"
            >
                <Sparkles className="h-3.5 w-3.5" />
                打开完整编辑器
            </button>

            {/* 统计 */}
            <div className="flex items-center justify-center gap-2 text-[7px] text-[var(--fg-muted)]">
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-indigo-500 rounded-full"></span>8预设</span>
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-purple-500 rounded-full"></span>8工具</span>
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-pink-500 rounded-full"></span>6变换</span>
                <span className="flex items-center gap-0.5"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span>6调整</span>
            </div>
        </div>
    );
};

export default PhotoToolsPanel;
