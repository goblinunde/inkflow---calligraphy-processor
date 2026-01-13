import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lasso, Pentagon, Square, Wand2, X, Check, RotateCcw, Feather, Expand, MinusSquare } from 'lucide-react';
import {
    SelectionPoint,
    SelectionPath,
    generateMaskFromPath,
    generateMaskFromRect,
    featherMask,
    expandMask,
    invertMask,
    maskToImageData
} from '../../services/selectionService';

export type SelectionTool = 'freehand' | 'polygon' | 'rectangle' | 'none';

interface SelectionToolsProps {
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    onSelectionComplete: (mask: Uint8Array, width: number, height: number) => void;
    onCancel: () => void;
    t: any;
}

/**
 * 选区工具组件
 * 💡 支持自由套索、多边形套索、矩形选区
 */
export const SelectionTools: React.FC<SelectionToolsProps> = ({
    imageUrl,
    imageWidth,
    imageHeight,
    onSelectionComplete,
    onCancel,
    t
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [tool, setTool] = useState<SelectionTool>('freehand');
    const [isDrawing, setIsDrawing] = useState(false);
    const [path, setPath] = useState<SelectionPath>({ points: [], closed: false });
    const [rectStart, setRectStart] = useState<SelectionPoint | null>(null);
    const [rectEnd, setRectEnd] = useState<SelectionPoint | null>(null);
    const [mask, setMask] = useState<Uint8Array | null>(null);
    const [featherRadius, setFeatherRadius] = useState(0);
    const [expandPixels, setExpandPixels] = useState(0);

    // 💡 蚂蚁线动画偏移
    const [marchingOffset, setMarchingOffset] = useState(0);

    // 容器尺寸
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // 加载图片并计算缩放
    useEffect(() => {
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth - 48;
        const containerHeight = containerRef.current.clientHeight - 120;

        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
        setOffset({
            x: (containerWidth - imageWidth * newScale) / 2,
            y: (containerHeight - imageHeight * newScale) / 2
        });
    }, [imageWidth, imageHeight]);

    // 蚂蚁线动画
    useEffect(() => {
        const interval = setInterval(() => {
            setMarchingOffset(prev => (prev + 1) % 16);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // 绘制选区
    useEffect(() => {
        const canvas = overlayRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 清除
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 如果有 mask，绘制半透明红色覆盖
        if (mask) {
            const maskImageData = maskToImageData(mask, imageWidth, imageHeight, { r: 255, g: 100, b: 100, a: 80 });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageWidth;
            tempCanvas.height = imageHeight;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.putImageData(maskImageData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }

        // 绘制路径
        if (path.points.length > 0) {
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -marchingOffset;

            ctx.beginPath();
            const firstPoint = path.points[0];
            ctx.moveTo(firstPoint.x * scale, firstPoint.y * scale);

            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x * scale, path.points[i].y * scale);
            }

            if (path.closed) {
                ctx.closePath();
            }
            ctx.stroke();

            // 黑色背景线
            ctx.strokeStyle = '#000';
            ctx.lineDashOffset = -marchingOffset + 8;
            ctx.stroke();

            ctx.restore();
        }

        // 绘制矩形
        if (rectStart && rectEnd) {
            ctx.save();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -marchingOffset;

            const x = Math.min(rectStart.x, rectEnd.x) * scale;
            const y = Math.min(rectStart.y, rectEnd.y) * scale;
            const w = Math.abs(rectEnd.x - rectStart.x) * scale;
            const h = Math.abs(rectEnd.y - rectStart.y) * scale;

            ctx.strokeRect(x, y, w, h);

            ctx.strokeStyle = '#000';
            ctx.lineDashOffset = -marchingOffset + 8;
            ctx.strokeRect(x, y, w, h);

            ctx.restore();
        }
    }, [path, rectStart, rectEnd, mask, marchingOffset, scale, imageWidth, imageHeight]);

    // 坐标转换
    const getImageCoords = (e: React.MouseEvent): SelectionPoint => {
        const canvas = overlayRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / scale),
            y: Math.round((e.clientY - rect.top) / scale)
        };
    };

    // 鼠标事件
    const handleMouseDown = (e: React.MouseEvent) => {
        const point = getImageCoords(e);

        if (tool === 'freehand') {
            setIsDrawing(true);
            setPath({ points: [point], closed: false });
            setMask(null);
        } else if (tool === 'polygon') {
            if (!isDrawing) {
                setIsDrawing(true);
                setPath({ points: [point], closed: false });
                setMask(null);
            } else {
                // 检查是否靠近起点（闭合）
                const first = path.points[0];
                const dist = Math.sqrt((point.x - first.x) ** 2 + (point.y - first.y) ** 2);
                if (dist < 15 && path.points.length > 2) {
                    closePath();
                } else {
                    setPath(prev => ({ ...prev, points: [...prev.points, point] }));
                }
            }
        } else if (tool === 'rectangle') {
            setIsDrawing(true);
            setRectStart(point);
            setRectEnd(point);
            setMask(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;

        const point = getImageCoords(e);

        if (tool === 'freehand') {
            setPath(prev => ({ ...prev, points: [...prev.points, point] }));
        } else if (tool === 'rectangle') {
            setRectEnd(point);
        }
    };

    const handleMouseUp = () => {
        if (tool === 'freehand' && isDrawing) {
            closePath();
        } else if (tool === 'rectangle' && isDrawing && rectStart && rectEnd) {
            generateRectMask();
        }
        setIsDrawing(false);
    };

    const closePath = () => {
        setPath(prev => ({ ...prev, closed: true }));
        setIsDrawing(false);

        // 生成 mask
        const newMask = generateMaskFromPath(
            { ...path, closed: true },
            imageWidth,
            imageHeight
        );
        setMask(newMask);
    };

    const generateRectMask = () => {
        if (!rectStart || !rectEnd) return;

        const x = Math.min(rectStart.x, rectEnd.x);
        const y = Math.min(rectStart.y, rectEnd.y);
        const w = Math.abs(rectEnd.x - rectStart.x);
        const h = Math.abs(rectEnd.y - rectStart.y);

        const newMask = generateMaskFromRect(x, y, w, h, imageWidth, imageHeight);
        setMask(newMask);
    };

    // 应用修改
    const applyFeather = () => {
        if (!mask || featherRadius <= 0) return;
        const feathered = featherMask(mask, imageWidth, imageHeight, featherRadius);
        setMask(feathered);
    };

    const applyExpand = () => {
        if (!mask || expandPixels === 0) return;
        const expanded = expandMask(mask, imageWidth, imageHeight, expandPixels);
        setMask(expanded);
    };

    const applyInvert = () => {
        if (!mask) return;
        const inverted = invertMask(mask);
        setMask(inverted);
    };

    const handleConfirm = () => {
        if (mask) {
            onSelectionComplete(mask, imageWidth, imageHeight);
        }
    };

    const handleReset = () => {
        setPath({ points: [], closed: false });
        setRectStart(null);
        setRectEnd(null);
        setMask(null);
        setIsDrawing(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" ref={containerRef}>
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                        {t.selectionTool || '选区工具'}
                    </h2>

                    {/* 工具选择 */}
                    <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                            onClick={() => { setTool('freehand'); handleReset(); }}
                            className={`p-2 rounded-md transition-all ${tool === 'freehand' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="自由套索"
                        >
                            <Lasso className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => { setTool('polygon'); handleReset(); }}
                            className={`p-2 rounded-md transition-all ${tool === 'polygon' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="多边形套索"
                        >
                            <Pentagon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => { setTool('rectangle'); handleReset(); }}
                            className={`p-2 rounded-md transition-all ${tool === 'rectangle' ? 'bg-indigo-500 text-white' : 'text-[var(--fg-muted)] hover:text-[var(--fg-primary)]'}`}
                            title="矩形选区"
                        >
                            <Square className="h-5 w-5" />
                        </button>
                    </div>

                    {/* 选区修改工具 */}
                    {mask && (
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[var(--border-default)]">
                            <div className="flex items-center gap-2">
                                <Feather className="h-4 w-4 text-[var(--fg-muted)]" />
                                <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={featherRadius}
                                    onChange={(e) => setFeatherRadius(parseInt(e.target.value) || 0)}
                                    className="w-14 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)]"
                                />
                                <button
                                    onClick={applyFeather}
                                    className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded hover:bg-indigo-500/20 text-[var(--fg-secondary)]"
                                >
                                    羽化
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Expand className="h-4 w-4 text-[var(--fg-muted)]" />
                                <input
                                    type="number"
                                    min={-20}
                                    max={20}
                                    value={expandPixels}
                                    onChange={(e) => setExpandPixels(parseInt(e.target.value) || 0)}
                                    className="w-14 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--fg-primary)]"
                                />
                                <button
                                    onClick={applyExpand}
                                    className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded hover:bg-indigo-500/20 text-[var(--fg-secondary)]"
                                >
                                    扩展
                                </button>
                            </div>

                            <button
                                onClick={applyInvert}
                                className="flex items-center gap-1 text-xs px-3 py-1 bg-[var(--bg-tertiary)] rounded hover:bg-indigo-500/20 text-[var(--fg-secondary)]"
                            >
                                <MinusSquare className="h-3 w-3" />
                                反选
                            </button>
                        </div>
                    )}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)]"
                        title="重置"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="取消"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!mask}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="h-4 w-4" />
                        确认选区
                    </button>
                </div>
            </div>

            {/* 画布区域 */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
                <div
                    className="relative"
                    style={{
                        width: imageWidth * scale,
                        height: imageHeight * scale
                    }}
                >
                    {/* 背景图片 */}
                    <canvas
                        ref={canvasRef}
                        width={imageWidth * scale}
                        height={imageHeight * scale}
                        className="absolute inset-0"
                    />
                    <img
                        src={imageUrl}
                        alt="Selection"
                        className="absolute inset-0 w-full h-full object-contain"
                        draggable={false}
                    />

                    {/* 选区覆盖层 */}
                    <canvas
                        ref={overlayRef}
                        width={imageWidth * scale}
                        height={imageHeight * scale}
                        className="absolute inset-0 cursor-crosshair"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
            </div>

            {/* 提示信息 */}
            <div className="px-6 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-default)] text-center">
                <p className="text-xs text-[var(--fg-muted)]">
                    {tool === 'freehand' && '按住鼠标拖动绘制自由选区'}
                    {tool === 'polygon' && '点击添加顶点，点击起点闭合选区'}
                    {tool === 'rectangle' && '拖动绘制矩形选区'}
                </p>
            </div>
        </div>
    );
};

export default SelectionTools;
