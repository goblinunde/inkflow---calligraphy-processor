import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../hooks/useTheme';

interface ThemeSwitcherProps {
    compact?: boolean;
}

/**
 * 主题切换器组件 - 支持暗色/亮色/跟随系统
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
    const { theme, resolvedTheme, setTheme } = useTheme();

    const themes: { id: Theme; icon: React.ReactNode; label: string }[] = [
        { id: 'light', icon: <Sun className="h-4 w-4" />, label: '亮色' },
        { id: 'dark', icon: <Moon className="h-4 w-4" />, label: '暗色' },
        { id: 'system', icon: <Monitor className="h-4 w-4" />, label: '自动' },
    ];

    if (compact) {
        // 紧凑模式 - 只显示当前图标，点击切换
        return (
            <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg transition-all duration-200
          bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] 
          text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]
          border border-[var(--border-default)] hover:border-[var(--border-hover)]
          shadow-sm hover:shadow-md"
                title={resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            >
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
        );
    }

    // 完整模式 - 显示三个选项
    return (
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
            {themes.map(({ id, icon, label }) => (
                <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${theme === id
                            ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-glow)]'
                            : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                    title={label}
                >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;
