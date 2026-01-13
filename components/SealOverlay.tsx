import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { Seal } from '../types';

interface SealOverlayProps {
    containerWidth: number;
    containerHeight: number;
    imageWidth: number;
    imageHeight: number;
    seals: Seal[];
    onUpdateSeal: (id: string, changes: Partial<Seal>) => void;
    onRemoveSeal: (id: string) => void;
}

export const SealOverlay: React.FC<SealOverlayProps> = ({
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
    seals,
    onUpdateSeal,
    onRemoveSeal
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
            <div
                className="absolute"
                style={{
                    left: offsetX,
                    top: offsetY,
                    width: displayW,
                    height: displayH,
                    // border: '1px solid rgba(255,0,0,0.5)', // Debug
                }}
            >
                {seals.map(seal => (
                    <SealItem
                        key={seal.id}
                        seal={seal}
                        scale={scale}
                        onUpdate={(changes) => onUpdateSeal(seal.id, changes)}
                        onRemove={() => onRemoveSeal(seal.id)}
                    />
                ))}
            </div>
        </div>
    );
};

interface SealItemProps {
    seal: Seal;
    scale: number;
    onUpdate: (changes: Partial<Seal>) => void;
    onRemove: () => void;
}

const SealItem: React.FC<SealItemProps> = ({ seal, scale, onUpdate, onRemove }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSeal = useRef({ x: 0, y: 0, w: 0, h: 0 });

    useEffect(() => {
        const handleUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        const handleMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = (e.clientX - startPos.current.x) / scale;
                const dy = (e.clientY - startPos.current.y) / scale;
                onUpdate({
                    x: startSeal.current.x + dx,
                    y: startSeal.current.y + dy
                });
            }
            if (isResizing) {
                // Simple resize width
                const dx = (e.clientX - startPos.current.x) / scale;
                // Aspect ratio preserve
                const newWidth = Math.max(20, startSeal.current.w + dx);
                const ratio = startSeal.current.w / startSeal.current.h;
                const newHeight = newWidth / ratio;

                onUpdate({
                    width: newWidth,
                    height: newHeight
                });
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, isResizing, scale, onUpdate]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container events if any
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startSeal.current = { x: seal.x, y: seal.y, w: seal.width, h: seal.height };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startSeal.current = { x: seal.x, y: seal.y, w: seal.width, h: seal.height };
    };

    // Convert logical coordinates to display coordinates
    const left = seal.x * scale;
    const top = seal.y * scale;
    const width = seal.width * scale;
    const height = seal.height * scale;

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
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="relative w-full h-full">
                {/* Selection Border - Always visible, emphasized on hover */}
                <div className="absolute inset-0 border-2 border-red-400/30 group-hover:border-red-500 transition-all rounded-sm ring-1 ring-red-300/20 group-hover:ring-red-400/40"></div>

                <img
                    src={seal.src}
                    alt="seal"
                    className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Controls (Slightly visible, fully visible on hover) */}
                <div className="absolute -top-3 -right-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        title="删除印章 / Remove Seal"
                    >
                        <X size={12} />
                    </button>
                </div>

                {/* Resize Handle - Slightly visible, fully visible on hover */}
                <div
                    className="absolute -bottom-3 -right-3 opacity-60 group-hover:opacity-100 cursor-nwse-resize p-1 transition-opacity"
                    onMouseDown={handleResizeStart}
                    title="调整大小 / Resize"
                >
                    <div className="w-5 h-5 bg-white border-2 border-red-500 rounded shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                        <ArrowUpRight size={12} className="text-red-500 transform rotate-90" />
                    </div>
                </div>

                {/* Drag Indicator (Center badge on hover) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                        拖动 Drag
                    </div>
                </div>
            </div>
        </div>
    );
};
