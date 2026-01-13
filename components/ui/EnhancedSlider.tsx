import React from 'react';

interface EnhancedSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    unit?: string;
    showPresets?: number[];
    presetLabels?: string[];
    showMinMax?: boolean;
    gradient?: boolean;
}

/**
 * 增强的滑块组件 - 带渐变轨道、预设按钮和精细控制
 */
export const EnhancedSlider: React.FC<EnhancedSliderProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    disabled = false,
    unit = '',
    showPresets = [],
    presetLabels = [],
    showMinMax = true,
    gradient = false,
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const trackStyle = gradient
        ? {
            background: `linear-gradient(to right, 
          var(--accent-primary) 0%, 
          var(--accent-primary) ${percentage}%, 
          var(--bg-tertiary) ${percentage}%, 
          var(--bg-tertiary) 100%)`
        }
        : {
            background: `linear-gradient(to right, 
          var(--accent-primary) 0%, 
          var(--accent-primary) ${percentage}%, 
          var(--bg-tertiary) ${percentage}%, 
          var(--bg-tertiary) 100%)`
        };

    return (
        <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
            {/* Label and Value */}
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--fg-secondary)]">{label}</label>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onChange(Math.max(min, value - step))}
                        disabled={disabled || value <= min}
                        className="w-6 h-6 rounded-lg bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)] transition-all text-sm disabled:opacity-30"
                    >−</button>
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                            const newVal = parseFloat(e.target.value);
                            if (!isNaN(newVal)) {
                                onChange(Math.max(min, Math.min(max, newVal)));
                            }
                        }}
                        disabled={disabled}
                        step={step}
                        min={min}
                        max={max}
                        className="w-16 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs text-[var(--fg-primary)] text-center focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-glow)] transition-all"
                    />
                    <span className="text-xs text-[var(--fg-muted)] w-4">{unit}</span>
                    <button
                        onClick={() => onChange(Math.min(max, value + step))}
                        disabled={disabled || value >= max}
                        className="w-6 h-6 rounded-lg bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)] transition-all text-sm disabled:opacity-30"
                    >+</button>
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer transition-all
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[var(--shadow-color)]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent-primary)]
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
            [&::-webkit-slider-thumb]:hover:scale-110
            disabled:cursor-not-allowed"
                    style={trackStyle}
                />
            </div>

            {/* Min/Max Labels */}
            {showMinMax && (
                <div className="flex justify-between text-[10px] text-[var(--fg-muted)]">
                    <span>{min}{unit}</span>
                    <span>{max}{unit}</span>
                </div>
            )}

            {/* Preset Buttons */}
            {showPresets.length > 0 && (
                <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `repeat(${showPresets.length}, 1fr)` }}>
                    {showPresets.map((preset, idx) => (
                        <button
                            key={preset}
                            onClick={() => onChange(preset)}
                            disabled={disabled}
                            className={`py-1.5 text-[10px] rounded-lg transition-all ${value === preset
                                    ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-glow)]'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--fg-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg-primary)] border border-[var(--border-default)]'
                                }`}
                        >
                            {presetLabels[idx] || preset}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EnhancedSlider;
