import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight, RotateCw } from 'lucide-react';
import { Watermark, WatermarkType, ImageWatermark, TextWatermark } from '../types';

interface WatermarkOverlayProps {
    containerWidth: number;
    containerHeight: number;
    imageWidth: number;
    imageHeight: number;
    watermarks: Watermark[];
    onUpdateWatermark: (id: string, changes: Partial<Watermark>) => void;
    onRemoveWatermark: (id: string) => void;
    selectedWatermarkId: string | null;
    onSelectWatermark: (id: string | null) => void;
    gridEnabled?: boolean;
    gridSize?: number;
    snapEnabled?: boolean;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
    watermarks,
    onUpdateWatermark,
    onRemoveWatermark,
    selectedWatermarkId,
    onSelectWatermark,
    gridEnabled = false,
    gridSize = 50,
    snapEnabled = false
}) => {
    // Calculate displayed image dimensions and offset
    const imgRatio = imageWidth / imageHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayW, displayH, offsetX, offsetY;

    if (imgRatio > containerRatio) {
        displayW = containerWidth;
        displayH = containerWidth / imgRatio;
        offsetX = 0;
        offsetY = (containerHeight - displayH) / 2;
    } else {
        displayH = containerHeight;
        displayW = containerHeight * imgRatio;
        offsetX = (containerWidth - displayW) / 2;
        offsetY = 0;
    }

    // Scale: Display Pixels / Original Pixels
    const scale = displayW / imageWidth;

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                width: containerWidth,
                height: containerHeight,
            }}
        >
            {/* Grid Overlay */}
            {gridEnabled && (
                <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: displayW, height: displayH, left: offsetX, top: offsetY }}
                >
                    <defs>
                        <pattern
                            id="grid"
                            width={gridSize * scale}
                            height={gridSize * scale}
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d={`M ${gridSize * scale} 0 L 0 0 0 ${gridSize * scale}`}
                                fill="none"
                                stroke="rgba(99, 102, 241, 0.3)"
                                strokeWidth="1"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            )}

            <div
                className="absolute"
                style={{
                    left: offsetX,
                    top: offsetY,
                    width: displayW,
                    height: displayH,
                }}
            >
                {watermarks.map(watermark => (
                    <WatermarkItem
                        key={watermark.id}
                        watermark={watermark}
                        scale={scale}
                        isSelected={watermark.id === selectedWatermarkId}
                        onUpdate={(changes) => onUpdateWatermark(watermark.id, changes)}
                        onRemove={() => onRemoveWatermark(watermark.id)}
                        onSelect={() => onSelectWatermark(watermark.id)}
                    />
                ))}
            </div>
        </div>
    );
};

interface WatermarkItemProps {
    watermark: Watermark;
    scale: number;
    isSelected: boolean;
    onUpdate: (changes: Partial<Watermark>) => void;
    onRemove: () => void;
    onSelect: () => void;
}

const WatermarkItem: React.FC<WatermarkItemProps> = ({ watermark, scale, isSelected, onUpdate, onRemove, onSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startWatermark = useRef({ x: 0, y: 0, w: 0, h: 0, rotation: 0 });

    useEffect(() => {
        const handleUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setIsRotating(false);
        };

        const handleMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = (e.clientX - startPos.current.x) / scale;
                const dy = (e.clientY - startPos.current.y) / scale;
                onUpdate({
                    x: startWatermark.current.x + dx,
                    y: startWatermark.current.y + dy
                });
            }
            if (isResizing && watermark.type === WatermarkType.IMAGE) {
                const dx = (e.clientX - startPos.current.x) / scale;
                const newWidth = Math.max(20, startWatermark.current.w + dx);
                const ratio = startWatermark.current.w / startWatermark.current.h;
                const newHeight = newWidth / ratio;

                onUpdate({
                    width: newWidth,
                    height: newHeight
                } as Partial<ImageWatermark>);
            }
            if (isRotating) {
                const dx = e.clientX - startPos.current.x;
                const rotationDelta = dx * 0.5; // Sensitivity
                onUpdate({
                    rotation: (startWatermark.current.rotation + rotationDelta) % 360
                });
            }
        };

        if (isDragging || isResizing || isRotating) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, isResizing, isRotating, scale, onUpdate, watermark.type]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(); // Select on click
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startWatermark.current = {
            x: watermark.x,
            y: watermark.y,
            w: watermark.type === WatermarkType.IMAGE ? watermark.width : 0,
            h: watermark.type === WatermarkType.IMAGE ? watermark.height : 0,
            rotation: watermark.rotation
        };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startWatermark.current = {
            x: watermark.x,
            y: watermark.y,
            w: watermark.type === WatermarkType.IMAGE ? watermark.width : 0,
            h: watermark.type === WatermarkType.IMAGE ? watermark.height : 0,
            rotation: watermark.rotation
        };
    };

    const handleRotateStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRotating(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startWatermark.current = {
            x: watermark.x,
            y: watermark.y,
            w: 0,
            h: 0,
            rotation: watermark.rotation
        };
    };

    // Convert logical coordinates to display coordinates
    const left = watermark.x * scale;
    const top = watermark.y * scale;

    if (watermark.type === WatermarkType.IMAGE) {
        const width = watermark.width * scale;
        const height = watermark.height * scale;

        return (
            <div
                className="absolute group pointer-events-auto transition-transform hover:scale-105 hover:z-10"
                style={{
                    left,
                    top,
                    width,
                    height,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                    transform: `rotate(${watermark.rotation}deg)`,
                    opacity: watermark.opacity / 100,
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="relative w-full h-full">
                    <div className={`absolute inset-0 border-2 transition-all rounded-sm ring-1 ${isSelected
                        ? 'border-yellow-400 ring-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                        : 'border-red-400/30 group-hover:border-red-500 ring-red-300/20 group-hover:ring-red-400/40'
                        }`}></div>

                    {watermark.format === 'svg' ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: watermark.src }}
                            className="w-full h-full"
                        />
                    ) : (
                        <img
                            src={watermark.src}
                            alt="watermark"
                            className="w-full h-full object-contain pointer-events-none select-none"
                        />
                    )}

                    {/* Controls */}
                    <div className="absolute -top-3 -right-3 opacity-60 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                            title="删除水印 / Remove Watermark"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="absolute -bottom-3 -right-3 opacity-60 group-hover:opacity-100 cursor-nwse-resize p-1 transition-opacity"
                        onMouseDown={handleResizeStart}
                        title="调整大小 / Resize"
                    >
                        <div className="w-5 h-5 bg-white border-2 border-red-500 rounded shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                            <ArrowUpRight size={12} className="text-red-500 transform rotate-90" />
                        </div>
                    </div>

                    {/* Rotate Handle */}
                    <div
                        className="absolute -top-3 -left-3 opacity-60 group-hover:opacity-100 cursor-grab p-1 transition-opacity"
                        onMouseDown={handleRotateStart}
                        title="旋转 / Rotate"
                    >
                        <div className="w-5 h-5 bg-indigo-500 border-2 border-indigo-300 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                            <RotateCw size={12} className="text-white" />
                        </div>
                    </div>

                    {/* Drag Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                            拖动 Drag
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        // Text Watermark
        return (
            <div
                className="absolute group pointer-events-auto hover:z-10 transition-all"
                style={{
                    left,
                    top,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: `rotate(${watermark.rotation}deg)`,
                    transformOrigin: 'center',
                    opacity: watermark.opacity / 100,
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="relative">
                    {/* Text Border/Background - Always visible */}
                    <div
                        className={`absolute inset-0 border-2 transition-all rounded-md ${isSelected
                            ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                            : 'border-indigo-400/40 group-hover:border-indigo-500 bg-indigo-900/10 group-hover:bg-indigo-900/20'
                            }`}
                        style={{
                            margin: '-8px',
                            padding: '8px'
                        }}
                    ></div>

                    <div
                        style={{
                            fontSize: `${watermark.fontSize * scale}px`,
                            fontFamily: watermark.fontFamily,
                            color: watermark.color,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            whiteSpace: 'nowrap',
                            position: 'relative',
                        }}
                        className="select-none"
                    >
                        {watermark.text}
                    </div>

                    {/* Text Controls - Semi-visible by default */}
                    <div className="absolute -top-10 -right-2 opacity-70 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                            onMouseDown={handleRotateStart}
                            className="p-1.5 bg-indigo-500 rounded-full text-white hover:bg-indigo-600 shadow-lg transition-all hover:scale-110"
                            title="旋转 / Rotate"
                        >
                            <RotateCw size={12} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg transition-all hover:scale-110"
                            title="删除 / Remove"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    {/* Drag Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                            拖动 Drag
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};
