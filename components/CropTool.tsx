import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, Check, X, RotateCcw, Lock, LockOpen } from 'lucide-react';

interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CropToolProps {
    imageUrl: string;
    isOpen: boolean;
    onClose: () => void;
    onApply: (croppedImageUrl: string) => void;
    t: any;
}

export const CropTool: React.FC<CropToolProps> = ({
    imageUrl,
    isOpen,
    onClose,
    onApply,
    t
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lockRatio, setLockRatio] = useState(false);
    const [scale, setScale] = useState(1);

    // 加载图片
    useEffect(() => {
        if (!isOpen || !imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImage(img);
            // 初始裁剪区域为图片中央 80%
            const margin = 0.1;
            setCrop({
                x: img.width * margin,
                y: img.height * margin,
                width: img.width * (1 - 2 * margin),
                height: img.height * (1 - 2 * margin)
            });

            // 计算缩放比例以适应容器
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth - 40;
                const containerHeight = containerRef.current.clientHeight - 40;
                const scaleX = containerWidth / img.width;
                const scaleY = containerHeight / img.height;
                setScale(Math.min(scaleX, scaleY, 1));
            }
        };
        img.src = imageUrl;
    }, [isOpen, imageUrl]);

    // 绘制画布
    useEffect(() => {
        if (!canvasRef.current || !image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = image.width * scale;
        canvas.height = image.height * scale;

        // 绘制图片
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // 绘制半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 清除裁剪区域的遮罩
        const scaledCrop = {
            x: crop.x * scale,
            y: crop.y * scale,
            width: crop.width * scale,
            height: crop.height * scale
        };

        ctx.clearRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
        ctx.drawImage(
            image,
            crop.x, crop.y, crop.width, crop.height,
            scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height
        );

        // 绘制裁剪框边框
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);

        // 绘制角点
        const cornerSize = 10;
        ctx.fillStyle = '#6366f1';
        const corners = [
            [scaledCrop.x, scaledCrop.y],
            [scaledCrop.x + scaledCrop.width, scaledCrop.y],
            [scaledCrop.x, scaledCrop.y + scaledCrop.height],
            [scaledCrop.x + scaledCrop.width, scaledCrop.y + scaledCrop.height]
        ];
        corners.forEach(([x, y]) => {
            ctx.fillRect(x - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize);
        });

        // 绘制三分线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(scaledCrop.x + scaledCrop.width * i / 3, scaledCrop.y);
            ctx.lineTo(scaledCrop.x + scaledCrop.width * i / 3, scaledCrop.y + scaledCrop.height);
            ctx.stroke();
            // 水平线
            ctx.beginPath();
            ctx.moveTo(scaledCrop.x, scaledCrop.y + scaledCrop.height * i / 3);
            ctx.lineTo(scaledCrop.x + scaledCrop.width, scaledCrop.y + scaledCrop.height * i / 3);
            ctx.stroke();
        }
    }, [image, crop, scale]);

    // 鼠标事件处理
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setIsDragging(true);
        setDragStart({ x: x - crop.x, y: y - crop.y });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !canvasRef.current || !image) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        let newX = x - dragStart.x;
        let newY = y - dragStart.y;

        // 边界约束
        newX = Math.max(0, Math.min(newX, image.width - crop.width));
        newY = Math.max(0, Math.min(newY, image.height - crop.height));

        setCrop(prev => ({ ...prev, x: newX, y: newY }));
    }, [isDragging, dragStart, scale, image, crop.width, crop.height]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 应用裁剪
    const applyCrop = () => {
        if (!image) return;

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = crop.width;
        outputCanvas.height = crop.height;
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            crop.x, crop.y, crop.width, crop.height,
            0, 0, crop.width, crop.height
        );

        onApply(outputCanvas.toDataURL('image/png'));
        onClose();
    };

    // 重置裁剪
    const resetCrop = () => {
        if (!image) return;
        const margin = 0.1;
        setCrop({
            x: image.width * margin,
            y: image.height * margin,
            width: image.width * (1 - 2 * margin),
            height: image.height * (1 - 2 * margin)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl max-w-[90vw] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-3">
                        <Crop className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                            {t.cropTool || '裁剪工具'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--fg-muted)]">
                            {Math.round(crop.width)} × {Math.round(crop.height)}
                        </span>
                        <button
                            onClick={() => setLockRatio(!lockRatio)}
                            className={`p-1.5 rounded transition-colors ${lockRatio ? 'bg-indigo-500/20 text-indigo-400' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                            title={lockRatio ? '解锁比例' : '锁定比例'}
                        >
                            {lockRatio ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 p-5 flex items-center justify-center bg-[#1a1a1a] min-h-[400px]"
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="cursor-move rounded shadow-lg"
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <button
                        onClick={resetCrop}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        重置
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-[var(--bg-tertiary)] text-[var(--fg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                            取消
                        </button>
                        <button
                            onClick={applyCrop}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            应用裁剪
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropTool;
