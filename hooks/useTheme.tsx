import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 💡 CSS 变量定义 - 用于主题切换
const themes = {
    dark: {
        // 背景色
        '--bg-primary': '#0f0f14',
        '--bg-secondary': '#1a1a24',
        '--bg-tertiary': '#252532',
        '--bg-elevated': '#2a2a3a',
        // 前景色
        '--fg-primary': '#f4f4f7',
        '--fg-secondary': '#a0a0b0',
        '--fg-muted': '#6b6b7a',
        // 边框
        '--border-default': 'rgba(255, 255, 255, 0.08)',
        '--border-hover': 'rgba(255, 255, 255, 0.15)',
        // 强调色
        '--accent-primary': '#6366f1',
        '--accent-hover': '#818cf8',
        '--accent-glow': 'rgba(99, 102, 241, 0.3)',
        // 特殊效果
        '--glass-bg': 'rgba(15, 15, 20, 0.8)',
        '--shadow-color': 'rgba(0, 0, 0, 0.5)',
    },
    light: {
        // 背景色
        '--bg-primary': '#fafafa',
        '--bg-secondary': '#f0f0f5',
        '--bg-tertiary': '#e8e8f0',
        '--bg-elevated': '#ffffff',
        // 前景色
        '--fg-primary': '#1a1a2e',
        '--fg-secondary': '#4a4a5a',
        '--fg-muted': '#8a8a9a',
        // 边框
        '--border-default': 'rgba(0, 0, 0, 0.08)',
        '--border-hover': 'rgba(0, 0, 0, 0.15)',
        // 强调色
        '--accent-primary': '#4f46e5',
        '--accent-hover': '#6366f1',
        '--accent-glow': 'rgba(79, 70, 229, 0.2)',
        // 特殊效果
        '--glass-bg': 'rgba(255, 255, 255, 0.9)',
        '--shadow-color': 'rgba(0, 0, 0, 0.1)',
    }
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('inkflow-theme') as Theme;
        return saved || 'dark';
    });

    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

    // 💡 根据系统偏好解析主题
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolved = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolved();
        mediaQuery.addEventListener('change', updateResolved);
        return () => mediaQuery.removeEventListener('change', updateResolved);
    }, [theme]);

    // 💡 应用主题 CSS 变量
    useEffect(() => {
        const root = document.documentElement;
        const themeVars = themes[resolvedTheme];

        Object.entries(themeVars).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
        });

        // 更新 body class
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${resolvedTheme}`);
    }, [resolvedTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('inkflow-theme', newTheme);
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
