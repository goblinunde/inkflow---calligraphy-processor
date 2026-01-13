import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

/**
 * 滑块组件 - 主题适配版本
 * 💡 使用 CSS 变量以支持暗色/亮色主题
 */
export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange, disabled }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`mb-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-[var(--fg-secondary)]">{label}</label>
        <span className="text-sm font-mono text-[var(--fg-primary)]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent-primary)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
          disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, 
            var(--accent-primary) 0%, 
            var(--accent-primary) ${percentage}%, 
            var(--bg-tertiary) ${percentage}%, 
            var(--bg-tertiary) 100%)`
        }}
      />
    </div>
  );
};
