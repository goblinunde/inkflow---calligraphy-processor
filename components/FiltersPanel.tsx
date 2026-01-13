import React, { useState } from 'react';
import { Wand2, X, Layers, ToggleLeft, ToggleRight } from 'lucide-react';
import { FILTERS, FilterType, FilterInfo } from '../services/filtersService';

interface FiltersPanelProps {
    currentFilter: FilterType | null;
    filterIntensity: number;
    onApplyFilter: (filter: FilterType | null, stackMode?: boolean) => void;
    onIntensityChange: (intensity: number) => void;
    t: any;
    lang: 'zh' | 'en';
    stackedFilters?: FilterType[];
}

type CategoryType = 'all' | 'classic' | 'artistic' | 'color' | 'special';

const CATEGORIES: { id: CategoryType; name: string; nameEn: string; icon: string }[] = [
    { id: 'all', name: '全部', nameEn: 'All', icon: '🎨' },
    { id: 'classic', name: '经典', nameEn: 'Classic', icon: '📷' },
    { id: 'artistic', name: '艺术', nameEn: 'Artistic', icon: '🖌️' },
    { id: 'color', name: '色调', nameEn: 'Color', icon: '🌈' },
    { id: 'special', name: '特效', nameEn: 'Special', icon: '✨' },
];

/**
 * 艺术滤镜面板组件
 * 💡 支持分类、强度调整、滤镜叠加模式
 */
export const FiltersPanel: React.FC<FiltersPanelProps> = ({
    currentFilter,
    filterIntensity,
    onApplyFilter,
    onIntensityChange,
    t,
    lang,
    stackedFilters = []
}) => {
    const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
    const [stackMode, setStackMode] = useState(false);

    // 支持强度调整的滤镜
    const intensityFilters: FilterType[] = [
        'inkwash', 'highcontrast', 'warm', 'cool', 'filmgrain', 'hdr', 'dreamy'
    ];

    const filteredFilters = activeCategory === 'all'
        ? FILTERS
        : FILTERS.filter(f => f.category === activeCategory);

    const handleFilterClick = (filterId: FilterType) => {
        if (stackMode) {
            // 叠加模式：添加滤镜
            onApplyFilter(filterId, true);
        } else {
            // 普通模式：切换滤镜
            onApplyFilter(currentFilter === filterId ? null : filterId, false);
        }
    };

    return (
        <div className="space-y-2.5">
            {/* 叠加模式开关 */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] text-[var(--fg-primary)]">滤镜叠加模式</span>
                </div>
                <button
                    onClick={() => setStackMode(!stackMode)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${stackMode
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border border-[var(--border-default)]'
                        }`}
                >
                    {stackMode ? (
                        <><ToggleRight className="h-3 w-3" /> 开启</>
                    ) : (
                        <><ToggleLeft className="h-3 w-3" /> 关闭</>
                    )}
                </button>
            </div>

            {/* 已叠加滤镜显示 */}
            {stackMode && stackedFilters.length > 0 && (
                <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-[8px] text-indigo-300 w-full mb-0.5">已叠加:</span>
                    {stackedFilters.map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-[8px] bg-indigo-500/20 text-indigo-200 rounded">
                            {FILTERS.find(ff => ff.id === f)?.[lang === 'zh' ? 'name' : 'nameEn']}
                        </span>
                    ))}
                </div>
            )}

            {/* 分类标签 */}
            <div className="flex gap-0.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`
                            flex items-center gap-0.5 px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap transition-all
                            ${activeCategory === cat.id
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'
                            }
                        `}
                    >
                        <span className="text-xs">{cat.icon}</span>
                        <span>{lang === 'zh' ? cat.name : cat.nameEn}</span>
                    </button>
                ))}
            </div>

            {/* 滤镜网格 */}
            <div className="grid grid-cols-4 gap-1">
                {filteredFilters.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => handleFilterClick(filter.id)}
                        className={`
                            flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all
                            ${currentFilter === filter.id || stackedFilters.includes(filter.id)
                                ? 'bg-indigo-500/20 border-indigo-500/50 shadow-sm'
                                : 'bg-[var(--bg-tertiary)] border-[var(--border-default)] hover:border-indigo-500/30'
                            }
                        `}
                        title={lang === 'zh' ? filter.name : filter.nameEn}
                    >
                        <span className="text-base">{filter.icon}</span>
                        <span className="text-[8px] text-[var(--fg-muted)] truncate w-full text-center">
                            {lang === 'zh' ? filter.name : filter.nameEn}
                        </span>
                    </button>
                ))}

                {/* 清除按钮 */}
                {(currentFilter || stackedFilters.length > 0) && (
                    <button
                        onClick={() => onApplyFilter(null, false)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all"
                        title={t.clearFilter || '清除滤镜'}
                    >
                        <X className="h-4 w-4 text-red-400" />
                        <span className="text-[8px] text-red-300">{t.clear || '清除'}</span>
                    </button>
                )}
            </div>

            {/* 滤镜强度滑块 */}
            {currentFilter && intensityFilters.includes(currentFilter) && (
                <div className="space-y-1 pt-1.5 border-t border-[var(--border-default)]">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] text-[var(--fg-muted)]">
                            {t.filterIntensity || '滤镜强度'}
                        </label>
                        <span className="text-[9px] text-[var(--fg-primary)] font-mono bg-[var(--bg-tertiary)] px-1 py-0.5 rounded">
                            {filterIntensity}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={filterIntensity}
                        onChange={e => onIntensityChange(parseInt(e.target.value))}
                        className="w-full h-1 rounded appearance-none bg-[var(--bg-tertiary)] cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${filterIntensity}%, var(--bg-tertiary) ${filterIntensity}%, var(--bg-tertiary) 100%)`
                        }}
                    />
                </div>
            )}

            {/* 提示 */}
            <p className="text-[8px] text-[var(--fg-muted)] text-center">
                {stackMode ? '叠加模式：点击添加多个滤镜' : '普通模式：点击切换单个滤镜'}
            </p>
        </div>
    );
};

export default FiltersPanel;
