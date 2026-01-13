import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

/**
 * 增强的按钮组件 - 多种变体和动画效果
 */
export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    disabled,
    className = '',
    ...props
}) => {
    const baseStyles = `
    inline-flex items-center justify-center gap-2 
    font-medium rounded-xl 
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
  `;

    const variants = {
        primary: `
      bg-gradient-to-r from-[var(--accent-primary)] to-purple-500
      text-white shadow-lg shadow-[var(--accent-glow)]
      hover:shadow-xl hover:from-[var(--accent-hover)] hover:to-purple-400
      focus:ring-[var(--accent-primary)]
    `,
        secondary: `
      bg-[var(--bg-tertiary)] text-[var(--fg-primary)]
      border border-[var(--border-default)]
      hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)]
      focus:ring-[var(--fg-muted)]
    `,
        ghost: `
      bg-transparent text-[var(--fg-secondary)]
      hover:bg-[var(--bg-tertiary)] hover:text-[var(--fg-primary)]
      focus:ring-[var(--fg-muted)]
    `,
        danger: `
      bg-gradient-to-r from-red-500 to-rose-500
      text-white shadow-lg shadow-red-500/30
      hover:shadow-xl hover:from-red-400 hover:to-rose-400
      focus:ring-red-500
    `,
        success: `
      bg-gradient-to-r from-emerald-500 to-green-500
      text-white shadow-lg shadow-emerald-500/30
      hover:shadow-xl hover:from-emerald-400 hover:to-green-400
      focus:ring-emerald-500
    `,
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    {children}
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </button>
    );
};

export default Button;
