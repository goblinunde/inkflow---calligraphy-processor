import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Move, Type, Image as ImageIcon, Lock, Unlock, Copy, GripVertical } from 'lucide-react';
import { Watermark, WatermarkType } from '../types';

interface WatermarkLayerManagerProps {
    watermarks: Watermark[];
    selectedWatermarkId: string | null;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, changes: Partial<Watermark>) => void;
    onRemove: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onDuplicate: (id: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void; // 💡 拖拽排序
    t: any; // translations
}

/**
 * 水印图层管理器组件 - 支持图层排序、可见性、锁定等操作
 * 💡 支持拖拽排序
 */
export const WatermarkLayerManager: React.FC<WatermarkLayerManagerProps> = ({
    watermarks,
    selectedWatermarkId,
    onSelect,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    onDuplicate,
    onReorder,
    t
}) => {
    // 💡 拖拽状态
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== null && index !== draggedIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && onReorder && draggedIndex !== toIndex) {
            onReorder(draggedIndex, toIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    if (watermarks.length === 0) {
        return (
            <div className="text-center py-8 text-[var(--fg-muted)]">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t.noWatermarks || '暂无水印图层'}</p>
                <p className="text-[10px] mt-1 opacity-60">{t.addWatermarkHint || '上传图片或添加文字'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* 图层列表 */}
            {watermarks.map((watermark, index) => (
                <div
                    key={watermark.id}
                    draggable={!!onReorder}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                        group relative rounded-lg border transition-all cursor-pointer
                        ${selectedWatermarkId === watermark.id
                            ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/50 shadow-lg shadow-[var(--accent-glow)]'
                            : 'bg-[var(--bg-tertiary)] border-[var(--border-default)] hover:border-[var(--border-hover)]'
                        }
                        ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                        ${dragOverIndex === index ? 'border-indigo-400 border-2 border-dashed' : ''}
                    `}
                    onClick={() => onSelect(watermark.id)}
                >
                    {/* 图层信息 */}
                    <div className="flex items-center gap-2 p-3">
                        {/* 拖拽手柄 */}
                        {onReorder && (
                            <div
                                className="cursor-grab active:cursor-grabbing text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="h-4 w-4" />
                            </div>
                        )}

                        {/* 图层类型图标 */}
                        <div className={`
                            flex h-8 w-8 items-center justify-center rounded-lg
                            ${watermark.type === WatermarkType.IMAGE ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}
                        `}>
                            {watermark.type === WatermarkType.IMAGE
                                ? <ImageIcon className="h-4 w-4" />
                                : <Type className="h-4 w-4" />
                            }
                        </div>

                        {/* 名称和信息 */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--fg-primary)] truncate">
                                {watermark.type === WatermarkType.TEXT
                                    ? watermark.text.slice(0, 12) + (watermark.text.length > 12 ? '...' : '')
                                    : `图片 #${watermark.id.slice(-4)}`
                                }
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--fg-muted)]">
                                <span>X: {Math.round(watermark.x)}</span>
                                <span>Y: {Math.round(watermark.y)}</span>
                                <span>{watermark.opacity}%</span>
                                {watermark.rotation !== 0 && <span>{watermark.rotation}°</span>}
                            </div>
                        </div>

                        {/* 快捷操作按钮 */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* 上移 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveUp(watermark.id); }}
                                disabled={index === 0}
                                className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30 transition-all"
                                title="上移图层"
                            >
                                <ChevronUp className="h-3 w-3" />
                            </button>

                            {/* 下移 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveDown(watermark.id); }}
                                disabled={index === watermarks.length - 1}
                                className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30 transition-all"
                                title="下移图层"
                            >
                                <ChevronDown className="h-3 w-3" />
                            </button>

                            {/* 复制 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onDuplicate(watermark.id); }}
                                className="p-1.5 rounded hover:bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] transition-all"
                                title="复制图层"
                            >
                                <Copy className="h-3 w-3" />
                            </button>

                            {/* 删除 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(watermark.id); }}
                                className="p-1.5 rounded hover:bg-red-500/20 text-[var(--fg-muted)] hover:text-red-400 transition-all"
                                title="删除图层"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    {/* 选中时显示详细控制 */}
                    {selectedWatermarkId === watermark.id && (
                        <div className="border-t border-[var(--border-default)] p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            {/* 坐标调整 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-[var(--fg-muted)] block mb-1">X 坐标</label>
                                    <input
                                        type="number"
                                        value={Math.round(watermark.x)}
                                        onChange={(e) => onUpdate(watermark.id, { x: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--fg-muted)] block mb-1">Y 坐标</label>
                                    <input
                                        type="number"
                                        value={Math.round(watermark.y)}
                                        onChange={(e) => onUpdate(watermark.id, { y: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </div>

                            {/* 透明度和旋转 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-[var(--fg-muted)] block mb-1">透明度</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            value={watermark.opacity}
                                            onChange={(e) => onUpdate(watermark.id, { opacity: parseInt(e.target.value) })}
                                            className="flex-1 h-1.5 rounded appearance-none bg-[var(--bg-tertiary)]"
                                            style={{
                                                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${watermark.opacity}%, var(--bg-tertiary) ${watermark.opacity}%, var(--bg-tertiary) 100%)`
                                            }}
                                        />
                                        <span className="text-[10px] text-[var(--fg-muted)] w-8 text-right">{watermark.opacity}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-[var(--fg-muted)] block mb-1">旋转</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="range"
                                            min={0}
                                            max={360}
                                            value={watermark.rotation}
                                            onChange={(e) => onUpdate(watermark.id, { rotation: parseInt(e.target.value) })}
                                            className="flex-1 h-1.5 rounded appearance-none bg-[var(--bg-tertiary)]"
                                        />
                                        <span className="text-[10px] text-[var(--fg-muted)] w-8 text-right">{watermark.rotation}°</span>
                                    </div>
                                </div>
                            </div>

                            {/* 尺寸调整（仅图片水印） */}
                            {watermark.type === WatermarkType.IMAGE && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">宽度</label>
                                        <input
                                            type="number"
                                            value={Math.round(watermark.width)}
                                            onChange={(e) => onUpdate(watermark.id, { width: parseInt(e.target.value) || 50 })}
                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">高度</label>
                                        <input
                                            type="number"
                                            value={Math.round(watermark.height)}
                                            onChange={(e) => onUpdate(watermark.id, { height: parseInt(e.target.value) || 50 })}
                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 文字水印额外控制 */}
                            {watermark.type === WatermarkType.TEXT && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">字号</label>
                                        <input
                                            type="number"
                                            value={watermark.fontSize}
                                            onChange={(e) => onUpdate(watermark.id, { fontSize: parseInt(e.target.value) || 16 })}
                                            min={8}
                                            max={200}
                                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-2 py-1.5 text-xs text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[var(--fg-muted)] block mb-1">颜色</label>
                                        <input
                                            type="color"
                                            value={watermark.color}
                                            onChange={(e) => onUpdate(watermark.id, { color: e.target.value })}
                                            className="w-full h-8 rounded-lg border border-[var(--border-default)] cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 快捷定位 */}
                            <div>
                                <label className="text-[10px] text-[var(--fg-muted)] block mb-1">快捷定位</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {[
                                        { pos: 'tl', label: '↖' },
                                        { pos: 'tc', label: '↑' },
                                        { pos: 'tr', label: '↗' },
                                        { pos: 'ml', label: '←' },
                                        { pos: 'mc', label: '⌖' },
                                        { pos: 'mr', label: '→' },
                                        { pos: 'bl', label: '↙' },
                                        { pos: 'bc', label: '↓' },
                                        { pos: 'br', label: '↘' },
                                    ].map(({ pos, label }) => (
                                        <button
                                            key={pos}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // 发送定位事件
                                                const event = new CustomEvent('watermark-quick-position', {
                                                    detail: { id: watermark.id, position: pos }
                                                });
                                                window.dispatchEvent(event);
                                            }}
                                            className="py-1.5 text-xs rounded bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/20 text-[var(--fg-muted)] hover:text-[var(--fg-primary)] border border-[var(--border-default)] transition-all"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* 图层数量指示 */}
            <div className="text-center text-[10px] text-[var(--fg-muted)] pt-2">
                共 {watermarks.length} 个图层
            </div>
        </div>
    );
};

export default WatermarkLayerManager;
