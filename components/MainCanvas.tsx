import React, { useRef, useState, useEffect } from 'react';
import { Upload, Loader2, ImageIcon, Wand2 } from 'lucide-react';
import { Watermark } from '../types';
import { WatermarkOverlay } from './WatermarkOverlay';

interface MainCanvasProps {
    t: any;
    originalImage: string | null;
    processedImage: string | null;
    isProcessing: boolean;
    onFileUpload: () => void;
    originalDims?: { width: number, height: number };
    watermarks?: Watermark[];
    selectedWatermarkId?: string | null;
    onUpdateWatermark?: (id: string, changes: Partial<Watermark>) => void;
    onRemoveWatermark?: (id: string) => void;
    onSelectWatermark?: (id: string | null) => void;
    gridEnabled?: boolean;
    gridSize?: number;
    snapEnabled?: boolean;
    texture?: string;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
    t,
    originalImage,
    processedImage,
    isProcessing,
    onFileUpload,
    originalDims,
    watermarks = [],
    selectedWatermarkId = null,
    onUpdateWatermark = () => { },
    onRemoveWatermark = () => { },
    onSelectWatermark = () => { },
    gridEnabled = false,
    gridSize = 50,
    snapEnabled = false,
    texture = 'none'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            setContainerDims({
                width: entry.contentRect.width,
                height: entry.contentRect.height
            });
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <main className="flex-1 relative flex items-center justify-center p-8 overflow-hidden bg-white/5 backdrop-blur-sm shadow-inner">
            {!originalImage ? (
                <div className="text-center p-12 rounded-2xl border-2 border-dashed border-white/10 bg-black/20 backdrop-blur-md max-w-lg w-full hover:border-indigo-500/30 transition-colors">
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-white/5 to-white/0 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                        <Upload className="h-8 w-8 text-white/50" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t.uploadArtwork}</h3>
                    <p className="text-white/40 mb-8">{t.dragDrop}</p>
                    <button
                        onClick={onFileUpload}
                        className="bg-indigo-600 hover:bg-indigo-500 hover:scale-105 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-xl shadow-indigo-900/20"
                    >
                        {t.selectImage}
                    </button>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col md:flex-row gap-6 max-h-full">
                    {/* Original */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0 group">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-semibold text-white/30 uppercase">{t.original}</span>
                        </div>
                        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md relative shadow-2xl transition-transform group-hover:scale-[1.01] duration-500 p-4">
                            <img
                                src={originalImage}
                                alt="Original"
                                className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>

                    {/* Processed */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0 group">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-semibold text-indigo-300 uppercase glow-sm">{t.processedResult}</span>
                            {isProcessing && <span className="text-xs text-indigo-300 animate-pulse">{t.processing}</span>}
                        </div>
                        <div
                            ref={containerRef}
                            className="flex-1 rounded-2xl overflow-hidden border border-indigo-500/20 bg-[#1a1a1a] checkerboard relative shadow-2xl shadow-indigo-900/20 transition-transform group-hover:scale-[1.01] duration-500 p-4"
                        >
                            {/* Texture Layer */}
                            {processedImage && texture && texture !== 'none' && (
                                <img
                                    src={`/textures/${texture}.png`}
                                    className="absolute inset-0 w-full h-full object-contain p-4 z-0"
                                    alt="texture"
                                />
                            )}

                            {processedImage && (
                                <img
                                    src={processedImage}
                                    alt="Processed"
                                    className={`w-full h-full object-contain relative z-10 transition-opacity duration-300 ${isProcessing ? 'opacity-40' : 'opacity-100'}`}
                                />
                            )}

                            {/* 💡 处理中覆盖层 - Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl animate-in fade-in duration-300">
                                    <div className="flex flex-col items-center gap-4 p-8">
                                        {/* 💡 动画 Spinner */}
                                        <div className="relative">
                                            <div className="absolute inset-0 animate-ping">
                                                <Wand2 className="h-12 w-12 text-indigo-400/30" />
                                            </div>
                                            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
                                        </div>

                                        {/* 💡 状态文字 */}
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-white animate-pulse">
                                                {t.processing || '图片处理中...'}
                                            </p>
                                            <p className="text-xs text-indigo-300/70 mt-1">
                                                请稍候，正在应用效果
                                            </p>
                                        </div>

                                        {/* 💡 进度动画条 */}
                                        <div className="w-48 h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"
                                                style={{ width: '70%', animation: 'pulse 1.5s ease-in-out infinite, shimmer 2s linear infinite' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Watermark Overlay Layer */}
                            {processedImage && originalDims && (
                                <div className="absolute inset-0 p-4 z-20 pointer-events-none">
                                    <WatermarkOverlay
                                        containerWidth={containerDims.width}
                                        containerHeight={containerDims.height}
                                        imageWidth={originalDims.width}
                                        imageHeight={originalDims.height}
                                        watermarks={watermarks}
                                        selectedWatermarkId={selectedWatermarkId}
                                        onUpdateWatermark={onUpdateWatermark}
                                        onRemoveWatermark={onRemoveWatermark}
                                        onSelectWatermark={onSelectWatermark}
                                        gridEnabled={gridEnabled}
                                        gridSize={gridSize}
                                        snapEnabled={snapEnabled}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};
