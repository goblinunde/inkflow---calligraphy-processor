import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
    icon: LucideIcon;
    title: string;
}

/**
 * 区块标题组件 - 主题适配版本
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 text-[var(--fg-muted)] border-b border-[var(--border-default)] pb-2">
        <Icon className="h-4 w-4" />
        <h2 className="font-semibold text-xs uppercase tracking-wider">{title}</h2>
    </div>
);
