import React, { useState } from 'react';
import {
    Sliders, Palette, Thermometer, Sun, Moon, Circle, Sparkles,
    ChevronDown, ChevronUp, RotateCcw, Droplets, Zap, Camera, Loader
} from 'lucide-react';
import {
    applyHSL,
    applyColorTemperature,
    applyTint,
    applyClarity,
    adjustHighlightsShadows,
    applyVignette,
    applyExposure,
    applyVibrance,
    adjustBlacksWhites,
    applyDehaze,
    applyGrain,
    HSLAdjustment
} from '../../services/adjustmentsService';

interface AdvancedAdjustmentsPanelProps {
    imageData: ImageData | null;
    onApply: (result: ImageData) => void;
    t: any;
}

interface Adjustments {
    // 基础
    exposure: number;
    // HSL
    hue: number;
    saturation: number;
    lightness: number;
    vibrance: number;
    // 色温
    temperature: number;
    tint: number;
    // 光影
    clarity: number;
    highlights: number;
    shadows: number;
    blacks: number;
    whites: number;
    dehaze: number;
    // 效果
    vignette: number;
    grain: number;
}

const defaultAdjustments: Adjustments = {
    exposure: 0,
    hue: 0,
    saturation: 0,
    lightness: 0,
    vibrance: 0,
    temperature: 0,
    tint: 0,
    clarity: 0,
    highlights: 0,
    shadows: 0,
    blacks: 0,
    whites: 0,
    dehaze: 0,
    vignette: 0,
    grain: 0
};

/**
 * 高级调整面板
 * 💡 提供 15+ 专业调整控件
 */
export const AdvancedAdjustmentsPanel: React.FC<AdvancedAdjustmentsPanelProps> = ({
    imageData,
    onApply,
    t
}) => {
    const [adjustments, setAdjustments] = useState<Adjustments>(defaultAdjustments);
    const [expandedSection, setExpandedSection] = useState<string | null>('basic');
    // 💡 处理中状态，防止重复提交和提供视觉反馈
    const [isProcessing, setIsProcessing] = useState(false);

    const updateAdjustment = (key: keyof Adjustments, value: number) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
    };

    // 💡 异步应用调整，避免阻塞 UI
    const applyAdjustments = async () => {
        if (!imageData || isProcessing) return;

        setIsProcessing(true);

        // 让 UI 有机会更新显示加载状态
        await new Promise(resolve => setTimeout(resolve, 10));

        try {
            let result = imageData;

            // 曝光
            if (adjustments.exposure !== 0) {
                result = applyExposure(result, adjustments.exposure);
            }

            // HSL
            if (adjustments.hue !== 0 || adjustments.saturation !== 0 || adjustments.lightness !== 0) {
                result = applyHSL(result, {
                    hue: adjustments.hue,
                    saturation: adjustments.saturation,
                    lightness: adjustments.lightness
                });
            }

            // 自然饱和度
            if (adjustments.vibrance !== 0) {
                result = applyVibrance(result, adjustments.vibrance);
            }

            // 色温
            if (adjustments.temperature !== 0) {
                result = applyColorTemperature(result, adjustments.temperature);
            }

            // 色调
            if (adjustments.tint !== 0) {
                result = applyTint(result, adjustments.tint);
            }

            // 清晰度
            if (adjustments.clarity !== 0) {
                result = applyClarity(result, adjustments.clarity);
            }

            // 去雾
            if (adjustments.dehaze !== 0) {
                result = applyDehaze(result, adjustments.dehaze);
            }

            // 高光/阴影
            if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
                result = adjustHighlightsShadows(result, adjustments.highlights, adjustments.shadows);
            }

            // 黑色/白色
            if (adjustments.blacks !== 0 || adjustments.whites !== 0) {
                result = adjustBlacksWhites(result, adjustments.blacks, adjustments.whites);
            }

            // 晕影
            if (adjustments.vignette !== 0) {
                result = applyVignette(result, adjustments.vignette);
            }

            // 颗粒
            if (adjustments.grain !== 0) {
                result = applyGrain(result, adjustments.grain);
            }

            onApply(result);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetAll = () => {
        setAdjustments(defaultAdjustments);
    };

    const SliderControl = ({
        label,
        value,
        min,
        max,
        onChange
    }: {
        label: string;
        value: number;
        min: number;
        max: number;
        onChange: (v: number) => void;
    }) => (
        <div className="space-y-0.5">
            <div className="flex justify-between text-[9px]">
                <span className="text-[var(--fg-muted)]">{label}</span>
                <span className="text-[var(--fg-secondary)] font-mono">{value}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-1 rounded appearance-none bg-[var(--bg-tertiary)] cursor-pointer"
            />
        </div>
    );

    const Section = ({
        id,
        icon: Icon,
        title,
        children
    }: {
        id: string;
        icon: React.ElementType;
        title: string;
        children: React.ReactNode;
    }) => (
        <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
            <button
                onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                className="w-full flex items-center justify-between p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
                <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-medium text-[var(--fg-primary)]">{title}</span>
                </div>
                {expandedSection === id ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                )}
            </button>
            {expandedSection === id && (
                <div className="p-2 space-y-2 bg-[var(--bg-secondary)]">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-2">
            {/* 基础 */}
            <Section id="basic" icon={Camera} title="基础">
                <SliderControl
                    label="曝光"
                    value={adjustments.exposure}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('exposure', v)}
                />
            </Section>

            {/* 色彩 */}
            <Section id="color" icon={Palette} title="色彩">
                <SliderControl
                    label="色相"
                    value={adjustments.hue}
                    min={-180}
                    max={180}
                    onChange={(v) => updateAdjustment('hue', v)}
                />
                <SliderControl
                    label="饱和度"
                    value={adjustments.saturation}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('saturation', v)}
                />
                <SliderControl
                    label="自然饱和度"
                    value={adjustments.vibrance}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('vibrance', v)}
                />
                <SliderControl
                    label="明度"
                    value={adjustments.lightness}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('lightness', v)}
                />
            </Section>

            {/* 白平衡 */}
            <Section id="temperature" icon={Thermometer} title="白平衡">
                <SliderControl
                    label="色温"
                    value={adjustments.temperature}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('temperature', v)}
                />
                <SliderControl
                    label="色调"
                    value={adjustments.tint}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('tint', v)}
                />
            </Section>

            {/* 光影 */}
            <Section id="light" icon={Sun} title="光影">
                <SliderControl
                    label="高光"
                    value={adjustments.highlights}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('highlights', v)}
                />
                <SliderControl
                    label="阴影"
                    value={adjustments.shadows}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('shadows', v)}
                />
                <SliderControl
                    label="白色"
                    value={adjustments.whites}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('whites', v)}
                />
                <SliderControl
                    label="黑色"
                    value={adjustments.blacks}
                    min={-100}
                    max={100}
                    onChange={(v) => updateAdjustment('blacks', v)}
                />
            </Section>

            {/* 细节 */}
            <Section id="detail" icon={Zap} title="细节">
                <SliderControl
                    label="清晰度"
                    value={adjustments.clarity}
                    min={0}
                    max={100}
                    onChange={(v) => updateAdjustment('clarity', v)}
                />
                <SliderControl
                    label="去雾"
                    value={adjustments.dehaze}
                    min={0}
                    max={100}
                    onChange={(v) => updateAdjustment('dehaze', v)}
                />
            </Section>

            {/* 效果 */}
            <Section id="effects" icon={Circle} title="效果">
                <SliderControl
                    label="晕影"
                    value={adjustments.vignette}
                    min={0}
                    max={100}
                    onChange={(v) => updateAdjustment('vignette', v)}
                />
                <SliderControl
                    label="颗粒"
                    value={adjustments.grain}
                    min={0}
                    max={100}
                    onChange={(v) => updateAdjustment('grain', v)}
                />
            </Section>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={resetAll}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] text-[10px] transition-colors disabled:opacity-50"
                >
                    <RotateCcw className="h-3 w-3" />
                    重置
                </button>
                <button
                    onClick={applyAdjustments}
                    disabled={!imageData || isProcessing}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium disabled:opacity-50 transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader className="h-3 w-3 animate-spin" />
                            处理中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-3 w-3" />
                            应用
                        </>
                    )}
                </button>
            </div>

            {/* 提示 */}
            <p className="text-[8px] text-[var(--fg-muted)] text-center pt-1">
                15 项调整 · 可叠加 · 点击「应用」生效
            </p>
        </div>
    );
};

export default AdvancedAdjustmentsPanel;
