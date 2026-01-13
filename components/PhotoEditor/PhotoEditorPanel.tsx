import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    MousePointer2,
    Lasso,
    Eraser,
    Stamp,
    Droplets,
    PaintBucket,
    Wand2,
    X,
    Check,
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    Move,
    Sparkles,
    Sun,
    Moon,
    Zap,
    Layers,
    Eye,
    Palette
} from 'lucide-react';
import { SelectionTools, SelectionTool } from './SelectionTools';
import { AdvancedAdjustmentsPanel } from './AdvancedAdjustmentsPanel';
import { inpaint, simpleInpaint, cloneStamp, spotHeal, localBlur, InpaintMethod } from '../../services/inpaintService';
import { dodge, burn, sharpenBrush, denoiseBrush, removeRedEye, BrushSettings } from '../../services/retouchService';

export type PhotoEditorTool = 'select' | 'move' | 'clone' | 'spot' | 'blur' | 'inpaint' | 'dodge' | 'burn' | 'sharpen' | 'denoise' | 'redeye';

interface PhotoEditorPanelProps {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    onSave: (editedImageUrl: string) => void;
    onCancel: () => void;
    t: any;
}

/**
 * 照片编辑主面板
 * 💡 集成选区工具、去水印、修图笔刷等功能
 */
export const PhotoEditorPanel: React.FC<PhotoEditorPanelProps> = ({
    imageUrl,
    imageWidth,
    imageHeight,
    onSave,
    onCancel,
    t
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 编辑状态
    const [currentTool, setCurrentTool] = useState<PhotoEditorTool>('select');
    const [showSelection, setShowSelection] = useState(false);
    const [currentMask, setCurrentMask] = useState<Uint8Array | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // 画布状态
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // 历史记录
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // 工具参数
    const [brushSize, setBrushSize] = useState(20);
    const [brushOpacity, setBrushOpacity] = useState(50);
    const [brushHardness, setBrushHardness] = useState(50);
    const [inpaintMethod, setInpaintMethod] = useState<InpaintMethod>('telea');
    const [inpaintRadius, setInpaintRadius] = useState(3);

    // 面板状态
    const [showAdjustments, setShowAdjustments] = useState(false);

    // 克隆图章源点
    const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);

    // 加载图片
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = imageWidth;
            canvas.height = imageHeight;
            ctx.drawImage(img, 0, 0, imageWidth, imageHeight);

            const data = ctx.getImageData(0, 0, imageWidth, imageHeight);
            setImageData(data);
            pushHistory(data);
        };
        img.src = imageUrl;
    }, [imageUrl, imageWidth, imageHeight]);

    // 计算缩放
    useEffect(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth - 48;
        const containerHeight = containerRef.current.clientHeight - 48;

        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
    }, [imageWidth, imageHeight]);

    // 历史管理
    const pushHistory = (data: ImageData) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(data);
            return newHistory.slice(-20); // 最多保留 20 步
        });
        setHistoryIndex(prev => Math.min(prev + 1, 19));
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setImageData(history[historyIndex - 1]);
            redrawCanvas(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setImageData(history[historyIndex + 1]);
            redrawCanvas(history[historyIndex + 1]);
        }
    };

    const redrawCanvas = (data: ImageData) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.putImageData(data, 0, 0);
        }
    };

    // 选区完成处理
    const handleSelectionComplete = (mask: Uint8Array, width: number, height: number) => {
        setCurrentMask(mask);
        setShowSelection(false);
    };

    // 应用去水印/内容填充
    const applyInpaint = async () => {
        if (!imageData || !currentMask) return;

        setIsProcessing(true);
        try {
            let result: ImageData;

            try {
                result = await inpaint(imageData, currentMask, {
                    method: inpaintMethod,
                    radius: inpaintRadius
                });
            } catch (error) {
                console.warn('OpenCV inpaint failed, using fallback:', error);
                result = simpleInpaint(imageData, currentMask, 10);
            }

            setImageData(result);
            pushHistory(result);
            redrawCanvas(result);
            setCurrentMask(null);
        } finally {
            setIsProcessing(false);
        }
    };

    // 应用模糊
    const applyBlur = () => {
        if (!imageData || !currentMask) return;

        const result = localBlur(imageData, currentMask, 5);
        setImageData(result);
        pushHistory(result);
        redrawCanvas(result);
        setCurrentMask(null);
    };

    // 鼠标事件处理（克隆/污点修复/减淡/加深等）
    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (!imageData) return;

        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / scale);
        const y = Math.round((e.clientY - rect.top) / scale);

        const brushSettings: Partial<BrushSettings> = {
            size: brushSize,
            opacity: brushOpacity,
            hardness: brushHardness,
            flow: 50
        };

        let result: ImageData | null = null;

        if (currentTool === 'clone') {
            if (e.altKey) {
                setCloneSource({ x, y });
                return;
            }
            if (cloneSource) {
                result = cloneStamp(imageData, cloneSource.x, cloneSource.y, x, y, brushSize, brushOpacity / 100);
            }
        } else if (currentTool === 'spot') {
            result = spotHeal(imageData, x, y, brushSize);
        } else if (currentTool === 'dodge') {
            result = dodge(imageData, x, y, brushSettings, 'midtones');
        } else if (currentTool === 'burn') {
            result = burn(imageData, x, y, brushSettings, 'midtones');
        } else if (currentTool === 'sharpen') {
            result = sharpenBrush(imageData, x, y, brushSettings);
        } else if (currentTool === 'denoise') {
            result = denoiseBrush(imageData, x, y, brushSettings);
        } else if (currentTool === 'redeye') {
            result = removeRedEye(imageData, x, y, brushSize / 2);
        }

        if (result) {
            setImageData(result);
            redrawCanvas(result);
            // 只在松开时保存历史（避免连续绘制产生太多历史）
        }
    };

    // 鼠标松开时保存历史
    const handleCanvasMouseUp = () => {
        if (imageData && ['clone', 'dodge', 'burn', 'sharpen', 'denoise'].includes(currentTool)) {
            pushHistory(imageData);
        }
    };

    // 保存
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onSave(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" ref={containerRef}>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-[var(--fg-primary)] flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        {t.photoEditor || '照片编辑'}
                    </h2>

                    {/* 工具选择 */}
                    <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1 ml-4">
                        <button
                            onClick={() => setShowSelection(true)}
                            className={`p-2 rounded-md transition-all ${currentTool === 'select' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="选区工具"
                        >
                            <Lasso className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentTool('clone')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'clone' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="克隆图章 (Alt+点击设置源点)"
                        >
                            <Stamp className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentTool('spot')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'spot' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="污点修复"
                        >
                            <Droplets className="h-5 w-5" />
                        </button>
                        <div className="w-px h-6 bg-[var(--border-default)] mx-1 my-auto" />
                        <button
                            onClick={() => setCurrentTool('dodge')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'dodge' ? 'bg-amber-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="减淡 (提亮)"
                        >
                            <Sun className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentTool('burn')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'burn' ? 'bg-slate-600 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="加深 (压暗)"
                        >
                            <Moon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentTool('sharpen')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'sharpen' ? 'bg-green-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="锐化"
                        >
                            <Zap className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentTool('redeye')}
                            className={`p-2 rounded-md transition-all ${currentTool === 'redeye' ? 'bg-red-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="红眼消除"
                        >
                            <Eye className="h-5 w-5" />
                        </button>
                        <div className="w-px h-6 bg-[var(--border-default)] mx-1 my-auto" />
                        <button
                            onClick={() => setShowAdjustments(!showAdjustments)}
                            className={`p-2 rounded-md transition-all ${showAdjustments ? 'bg-purple-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="高级调整"
                        >
                            <Palette className="h-5 w-5" />
                        </button>
                    </div>

                    {/* 笔刷设置 */}
                    {['clone', 'spot', 'dodge', 'burn', 'sharpen', 'denoise', 'redeye'].includes(currentTool) && (
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[var(--border-default)]">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[var(--fg-muted)]">大小</span>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                    className="w-16 h-1.5 rounded appearance-none bg-[var(--bg-tertiary)]"
                                />
                                <span className="text-[10px] text-[var(--fg-primary)] w-6">{brushSize}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[var(--fg-muted)]">强度</span>
                                <input
                                    type="range"
                                    min={10}
                                    max={100}
                                    value={brushOpacity}
                                    onChange={(e) => setBrushOpacity(parseInt(e.target.value))}
                                    className="w-16 h-1.5 rounded appearance-none bg-[var(--bg-tertiary)]"
                                />
                                <span className="text-[10px] text-[var(--fg-primary)] w-6">{brushOpacity}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-[var(--fg-muted)]">硬度</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={brushHardness}
                                    onChange={(e) => setBrushHardness(parseInt(e.target.value))}
                                    className="w-16 h-1.5 rounded appearance-none bg-[var(--bg-tertiary)]"
                                />
                                <span className="text-[10px] text-[var(--fg-primary)] w-6">{brushHardness}%</span>
                            </div>
                        </div>
                    )}

                    {/* 选区操作 */}
                    {currentMask && (
                        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-[var(--border-default)]">
                            <span className="text-xs text-green-400 font-medium">✓ 已选区</span>

                            <select
                                value={inpaintMethod}
                                onChange={(e) => setInpaintMethod(e.target.value as InpaintMethod)}
                                className="bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)]"
                            >
                                <option value="telea">Telea (快速)</option>
                                <option value="ns">Navier-Stokes (平滑)</option>
                            </select>

                            <button
                                onClick={applyInpaint}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                            >
                                <Eraser className="h-3 w-3" />
                                {isProcessing ? '处理中...' : '去除/填充'}
                            </button>

                            <button
                                onClick={applyBlur}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium rounded-lg transition-all"
                            >
                                <Droplets className="h-3 w-3" />
                                模糊
                            </button>

                            <button
                                onClick={() => setCurrentMask(null)}
                                className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* 右侧操作 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30"
                        title="撤销"
                    >
                        <Undo2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)] disabled:opacity-30"
                        title="重做"
                    >
                        <Redo2 className="h-5 w-5" />
                    </button>

                    <div className="w-px h-6 bg-[var(--border-default)] mx-2" />

                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] text-sm"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm"
                    >
                        <Check className="h-4 w-4" />
                        保存
                    </button>
                </div>
            </div>

            {/* 主体区域 - 画布 + 侧边栏 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 画布区域 */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                    <div
                        className="relative bg-[#1a1a1a] checkerboard rounded-lg overflow-hidden shadow-2xl"
                        style={{
                            width: imageWidth * scale,
                            height: imageHeight * scale
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={imageWidth}
                            height={imageHeight}
                            className="w-full h-full"
                            style={{
                                cursor: ['clone', 'dodge', 'burn', 'sharpen', 'denoise', 'spot', 'redeye'].includes(currentTool)
                                    ? 'crosshair'
                                    : 'default'
                            }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseUp={handleCanvasMouseUp}
                        />

                        {/* 选区蒙版显示 */}
                        {currentMask && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'rgba(255, 100, 100, 0.3)',
                                    maskImage: `url(${createMaskDataUrl(currentMask, imageWidth, imageHeight)})`,
                                    WebkitMaskImage: `url(${createMaskDataUrl(currentMask, imageWidth, imageHeight)})`
                                }}
                            />
                        )}

                        {/* 克隆源点指示 */}
                        {cloneSource && currentTool === 'clone' && (
                            <div
                                className="absolute w-4 h-4 border-2 border-green-400 rounded-full pointer-events-none"
                                style={{
                                    left: cloneSource.x * scale - 8,
                                    top: cloneSource.y * scale - 8
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* 高级调整侧边栏 */}
                {showAdjustments && (
                    <div className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-default)] p-4 overflow-y-auto">
                        <h3 className="text-sm font-bold text-[var(--fg-primary)] mb-4 flex items-center gap-2">
                            <Palette className="h-4 w-4 text-purple-400" />
                            高级调整
                        </h3>
                        <AdvancedAdjustmentsPanel
                            imageData={imageData}
                            onApply={(result) => {
                                setImageData(result);
                                pushHistory(result);
                                redrawCanvas(result);
                            }}
                            t={t}
                        />
                    </div>
                )}
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-default)] text-center">
                <p className="text-xs text-[var(--fg-muted)]">
                    {currentTool === 'clone' && '使用 Alt+点击 设置克隆源点，然后点击绘制'}
                    {currentTool === 'spot' && '点击瑕疵区域进行自动修复'}
                    {currentTool === 'dodge' && '点击区域进行局部提亮'}
                    {currentTool === 'burn' && '点击区域进行局部压暗'}
                    {currentTool === 'sharpen' && '点击区域进行锐化'}
                    {currentTool === 'redeye' && '点击红眼区域进行消除'}
                    {currentTool === 'select' && '使用套索工具选择区域，然后进行去水印或填充'}
                    {!['clone', 'spot', 'dodge', 'burn', 'sharpen', 'redeye', 'select'].includes(currentTool) && '选择工具开始编辑'}
                </p>
            </div>

            {/* 选区工具弹窗 */}
            {showSelection && (
                <SelectionTools
                    imageUrl={imageUrl}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    onSelectionComplete={handleSelectionComplete}
                    onCancel={() => setShowSelection(false)}
                    t={t}
                />
            )}
        </div>
    );
};

// 辅助函数：将 mask 转为 data URL
function createMaskDataUrl(mask: Uint8Array, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < mask.length; i++) {
        const idx = i * 4;
        imageData.data[idx] = mask[i];
        imageData.data[idx + 1] = mask[i];
        imageData.data[idx + 2] = mask[i];
        imageData.data[idx + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

export default PhotoEditorPanel;

