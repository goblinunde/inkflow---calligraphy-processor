import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
}

/**
 * 玻璃拟态卡片组件 - 现代化半透明效果
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hover = false,
    glow = false
}) => {
    return (
        <div
            className={`
        rounded-2xl 
        backdrop-blur-xl 
        bg-[var(--glass-bg)]
        border border-[var(--border-default)]
        shadow-lg shadow-[var(--shadow-color)]
        ${hover ? 'hover:border-[var(--border-hover)] hover:shadow-xl transition-all duration-300' : ''}
        ${glow ? 'ring-1 ring-[var(--accent-glow)]' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

interface CardHeaderProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, subtitle, action }) => {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 shadow-lg shadow-[var(--accent-glow)]">
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="font-semibold text-[var(--fg-primary)]">{title}</h3>
                    {subtitle && <p className="text-xs text-[var(--fg-muted)]">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
    );
};

export default GlassCard;
