import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
}

/**
 * 增强的开关组件 - 带动画和主题适配
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    description
}) => {
    const sizes = {
        sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
        lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
    };

    const { track, thumb, translate } = sizes[size];

    return (
        <label className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            {(label || description) && (
                <div className="flex-1">
                    {label && <span className="text-sm font-medium text-[var(--fg-primary)]">{label}</span>}
                    {description && <p className="text-xs text-[var(--fg-muted)] mt-0.5">{description}</p>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
          relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
          ${track}
          ${checked
                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 shadow-lg shadow-[var(--accent-glow)]'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-default)]'
                    }
          ${!disabled && 'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]'}
        `}
            >
                <span
                    className={`
            inline-block rounded-full bg-white shadow-md transition-all duration-300 ease-in-out
            ${thumb}
            ${checked ? translate : 'translate-x-0.5'}
          `}
                />
            </button>
        </label>
    );
};

export default ToggleSwitch;
