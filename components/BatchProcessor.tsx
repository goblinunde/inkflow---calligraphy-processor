import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, Pause, Download, X, CheckCircle, AlertCircle, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { processImage } from '../services/processor';
import { ProcessSettings } from '../types';

interface BatchItem {
    id: string;
    file: File;
    originalUrl: string;
    processedUrl: string | null;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

interface BatchProcessorProps {
    settings: ProcessSettings;
    isOpen: boolean;
    onClose: () => void;
    t: any;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
    settings,
    isOpen,
    onClose,
    t
}) => {
    const [items, setItems] = useState<BatchItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pauseRef = useRef(false);

    // 添加文件
    const handleFilesSelect = useCallback((files: FileList) => {
        const newItems: BatchItem[] = Array.from(files)
            .filter(f => f.type.startsWith('image/'))
            .map(file => ({
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                originalUrl: URL.createObjectURL(file),
                processedUrl: null,
                status: 'pending' as const
            }));

        setItems(prev => [...prev, ...newItems]);
    }, []);

    // 处理单个图片
    const processItem = async (item: BatchItem): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const result = await processImage(reader.result as string, settings);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
        });
    };

    // 开始批量处理
    const startProcessing = async () => {
        setIsProcessing(true);
        setIsPaused(false);
        pauseRef.current = false;

        for (let i = 0; i < items.length; i++) {
            // 检查暂停
            while (pauseRef.current) {
                await new Promise(r => setTimeout(r, 100));
            }

            const item = items[i];
            if (item.status !== 'pending') continue;

            // 更新状态为处理中
            setItems(prev => prev.map(it =>
                it.id === item.id ? { ...it, status: 'processing' } : it
            ));

            try {
                const result = await processItem(item);
                setItems(prev => prev.map(it =>
                    it.id === item.id ? { ...it, status: 'done', processedUrl: result } : it
                ));
            } catch (err) {
                setItems(prev => prev.map(it =>
                    it.id === item.id ? { ...it, status: 'error', error: (err as Error).message } : it
                ));
            }
        }

        setIsProcessing(false);
    };

    // 暂停/继续
    const togglePause = () => {
        pauseRef.current = !pauseRef.current;
        setIsPaused(!isPaused);
    };

    // 下载全部
    const downloadAll = () => {
        items.filter(it => it.status === 'done' && it.processedUrl).forEach((item, idx) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = item.processedUrl!;
                link.download = `processed_${item.file.name}`;
                link.click();
            }, idx * 200);
        });
    };

    // 清空列表
    const clearAll = () => {
        items.forEach(it => {
            URL.revokeObjectURL(it.originalUrl);
            if (it.processedUrl) URL.revokeObjectURL(it.processedUrl);
        });
        setItems([]);
    };

    // 移除单项
    const removeItem = (id: string) => {
        setItems(prev => {
            const item = prev.find(it => it.id === id);
            if (item) {
                URL.revokeObjectURL(item.originalUrl);
                if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
            }
            return prev.filter(it => it.id !== id);
        });
    };

    const doneCount = items.filter(it => it.status === 'done').length;
    const totalCount = items.length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl w-[800px] max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                            {t.batchProcess || '批量处理'}
                        </h2>
                        {items.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs">
                                {doneCount}/{totalCount}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                    {items.length === 0 ? (
                        <div
                            className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => {
                                e.preventDefault();
                                handleFilesSelect(e.dataTransfer.files);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <Upload className="w-12 h-12 mx-auto text-[var(--fg-muted)] mb-3" />
                            <p className="text-[var(--fg-secondary)]">{t.dropFiles || '拖拽或点击添加图片'}</p>
                            <p className="text-xs text-[var(--fg-muted)] mt-1">支持 PNG, JPG, WebP</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            {items.map(item => (
                                <div key={item.id} className="relative group rounded-lg overflow-hidden border border-[var(--border-default)]">
                                    <img
                                        src={item.processedUrl || item.originalUrl}
                                        alt={item.file.name}
                                        className="w-full aspect-square object-cover"
                                    />
                                    {/* 状态指示 */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {item.status === 'processing' && (
                                            <div className="bg-black/60 rounded-full p-2">
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                        )}
                                        {item.status === 'done' && (
                                            <div className="bg-emerald-500/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <CheckCircle className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                        {item.status === 'error' && (
                                            <div className="bg-red-500/80 rounded-full p-1.5">
                                                <AlertCircle className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {/* 删除按钮 */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {/* 文件名 */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                        <p className="text-[10px] text-white truncate">{item.file.name}</p>
                                    </div>
                                </div>
                            ))}
                            {/* 添加更多 */}
                            <div
                                className="aspect-square border-2 border-dashed border-[var(--border-default)] rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-6 h-6 text-[var(--fg-muted)]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <div className="flex gap-2">
                        <button
                            onClick={clearAll}
                            disabled={items.length === 0 || isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            清空
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {isProcessing ? (
                            <button
                                onClick={togglePause}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                            >
                                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                {isPaused ? '继续' : '暂停'}
                            </button>
                        ) : (
                            <button
                                onClick={startProcessing}
                                disabled={items.filter(it => it.status === 'pending').length === 0}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                开始处理
                            </button>
                        )}
                        <button
                            onClick={downloadAll}
                            disabled={doneCount === 0}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            下载全部 ({doneCount})
                        </button>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
                />
            </div>
        </div>
    );
};

export default BatchProcessor;
