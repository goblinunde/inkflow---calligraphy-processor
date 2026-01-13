import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Languages, HelpCircle, Info, ExternalLink, Code, Undo2, Redo2, Layers, Crop, Keyboard, Wand2 } from 'lucide-react';
import { processImage } from './services/processor';
import { restoreImageWithAI as restoreWithGeminiLegacy } from './services/geminiService';
import { restoreImageWithAI, AIProvider, getToken, AI_PROVIDERS } from './services/aiProviders';
import { vectorizer } from './services/vectorizer';
import { ProcessSettings, Watermark, WatermarkType, ImageWatermark, TextWatermark } from './types';
import { translations, Language } from './services/translations';
import { applyColorPreset } from './services/colorPresets';
import { Sidebar } from './components/Sidebar';
import { MainCanvas } from './components/MainCanvas';
import { Modal } from './components/ui/Modal';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Preset, addPreset, deletePreset, loadUserPresets } from './services/presets';
import { ThemeSwitcher } from './components/ui/ThemeSwitcher';
import { useTheme } from './hooks/useTheme';
import { BatchProcessor } from './components/BatchProcessor';
import { CropTool } from './components/CropTool';
import { ShortcutsPanel } from './components/ShortcutsPanel';
import { PhotoEditorPanel } from './components/PhotoEditor';
import { rotateImage, flipHorizontal, flipVertical } from './services/transformService';
import { applyEnhancePreset } from './services/quickEnhanceService';

export default function App() {
  const [lang, setLang] = useState<Language>('zh'); // Default Chinese
  const t = translations[lang];

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState<{ width: number, height: number }>({ width: 0, height: 0 });

  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI 提供商状态
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('gemini');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [hasAIToken, setHasAIToken] = useState(false);

  // Watermarks State
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [selectedWatermarkId, setSelectedWatermarkId] = useState<string | null>(null);

  // Upload Status State
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Export State
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp' | 'svg'>('png');
  const [jpegQuality, setJpegQuality] = useState(90);

  // Modals state
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  // Preset State
  const [userPresets, setUserPresets] = useState<Preset[]>([]);

  // Grid Settings
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Resolution State
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Default Settings
  const [settings, setSettings] = useState<ProcessSettings>({
    threshold: 180,
    strength: 1,
    contrast: 0,
    smoothing: true,
    monochrome: false,
    outputWidth: 0,
    outputHeight: 0,
    sharpness: 0,
    denoise: 0,
    adaptiveThreshold: false,
    edgeEnhance: false,
    removeBackground: true,
    brightness: 0,
    saturation: 0,
    backgroundColor: 'transparent',
    texture: 'none',
    // Phase 5: Advanced Processing
    blurType: 'box',
    blurRadius: 0,
    autoLevels: false,
    levelsEnabled: false,
    levelsInputBlack: 0,
    levelsInputWhite: 255,
    levelsGamma: 1,
    histogramEqualization: false,
    // Phase 3: 书法专用
    sealExtraction: false,
    preserveFlyingWhite: false,
    edgeSmoothness: 0,
    // Phase 6: 艺术滤镜
    filter: null,
    filterIntensity: 50
  });

  // History Management
  const { pushState, undo, redo, canUndo, canRedo } = useHistory(settings, watermarks);

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onUndo: () => {
      const prevState = undo();
      if (prevState) {
        setSettings(prevState.settings);
        setWatermarks(prevState.watermarks);
        setSelectedWatermarkId(null);
      }
    },
    onRedo: () => {
      const nextState = redo();
      if (nextState) {
        setSettings(nextState.settings);
        setWatermarks(nextState.watermarks);
        setSelectedWatermarkId(null);
      }
    },
    onSave: () => {
      if (processedImage) {
        handleDownload();
      }
    },
    onDelete: () => {
      if (selectedWatermarkId) {
        handleRemoveWatermark(selectedWatermarkId);
      }
    },
    onEscape: () => {
      setSelectedWatermarkId(null);
    },
    onCopy: () => {
      if (selectedWatermarkId) {
        const watermark = watermarks.find(w => w.id === selectedWatermarkId);
        if (watermark) {
          const newWatermark = {
            ...watermark,
            id: Date.now().toString(),
            x: watermark.x + 20,
            y: watermark.y + 20
          };
          setWatermarks(prev => [...prev, newWatermark]);
        }
      }
    },
    onShowShortcuts: () => {
      setShowShortcuts(true);
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track state changes for history
  useEffect(() => {
    if (originalImage) { // Only track after initial load
      pushState(settings, watermarks);
    }
  }, [settings, watermarks]); // pushState excluded intentionally

  // Load user presets on mount
  useEffect(() => {
    setUserPresets(loadUserPresets());
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const src = event.target.result as string;
          setOriginalImage(src);
          // Keep seals if user wants? Or reset. Let's keep seals. 
          // But maybe center them if new image is drastically different size? 
          // For now just keep them.
          const img = new Image();
          img.onload = () => {
            setOriginalDims({ width: img.width, height: img.height });
            setSettings(prev => ({
              ...prev,
              outputWidth: img.width,
              outputHeight: img.height
            }));
          };
          img.src = src;
          setProcessedImage(null);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Watermark Upload Handler - Image Watermarks
  const handleImageWatermarkUpload = (file: File) => {
    // Validate original image uploaded first
    if (!originalImage || originalDims.width === 0) {
      setError('请先上传书法作品图片');
      setUploadStatus({ type: 'error', message: '请先上传书法作品图片' });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    const isSVG = file.type === 'image/svg+xml';
    const isPNG = file.type === 'image/png';
    const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';

    if (!isSVG && !isPNG && !isJPEG) {
      setError('仅支持 PNG, JPEG, SVG 格式');
      setUploadStatus({ type: 'error', message: '仅支持 PNG, JPEG, SVG 格式' });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError('水印上传失败，请重试');
      setUploadStatus({ type: 'error', message: '文件读取失败' });
      setTimeout(() => setUploadStatus(null), 3000);
    };

    if (isSVG) {
      reader.onload = (e) => {
        if (e.target?.result) {
          createImageWatermark(e.target.result as string, 'svg');
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        if (e.target?.result) {
          createImageWatermark(e.target.result as string, isPNG ? 'png' : 'jpeg');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const createImageWatermark = (src: string, format: 'png' | 'jpeg' | 'svg') => {
    if (format === 'svg') {
      // For SVG, use a default size
      const baseSize = Math.min(originalDims.width, originalDims.height) * 0.15;
      const newWatermark: ImageWatermark = {
        type: WatermarkType.IMAGE,
        id: Date.now().toString(),
        src,
        x: originalDims.width / 2 - baseSize / 2,
        y: originalDims.height / 2 - baseSize / 2,
        width: baseSize,
        height: baseSize,
        format: 'svg',
        rotation: 0,
        opacity: 100
      };
      setWatermarks(prev => [...prev, newWatermark]);
      setUploadStatus({ type: 'success', message: 'SVG 水印上传成功' });
      setTimeout(() => setUploadStatus(null), 3000);
    } else {
      // For PNG/JPEG, get actual dimensions
      const img = new Image();
      img.onload = () => {
        const baseSize = Math.min(originalDims.width, originalDims.height) * 0.15;
        const ratio = img.width / img.height;

        const newWatermark: ImageWatermark = {
          type: WatermarkType.IMAGE,
          id: Date.now().toString(),
          src,
          x: originalDims.width / 2 - baseSize / 2,
          y: originalDims.height / 2 - baseSize / ratio / 2,
          width: baseSize,
          height: baseSize / ratio,
          format,
          rotation: 0,
          opacity: 100
        };
        setWatermarks(prev => [...prev, newWatermark]);
        setUploadStatus({ type: 'success', message: '图片水印上传成功' });
        setTimeout(() => setUploadStatus(null), 3000);
      };
      img.onerror = () => {
        setError('图片加载失败');
        setUploadStatus({ type: 'error', message: '图片格式错误' });
        setTimeout(() => setUploadStatus(null), 3000);
      };
      img.src = src;
    }
  };

  // Text Watermark Handler
  const handleAddTextWatermark = (text: string, fontSize: number, fontFamily: string, color: string) => {
    if (!originalImage || originalDims.width === 0) {
      setError('请先上传书法作品图片');
      setUploadStatus({ type: 'error', message: '请先上传书法作品图片' });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    if (!text.trim()) {
      setError('请输入水印文字');
      setUploadStatus({ type: 'error', message: '请输入水印文字' });
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    const newWatermark: TextWatermark = {
      type: WatermarkType.TEXT,
      id: Date.now().toString(),
      text: text.trim(),
      x: originalDims.width / 2,
      y: originalDims.height / 2,
      fontSize,
      fontFamily,
      color,
      rotation: 0,
      opacity: 100
    };

    setWatermarks(prev => [...prev, newWatermark]);
    setUploadStatus({ type: 'success', message: '文字水印添加成功' });
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleUpdateWatermark = (id: string, changes: Partial<Watermark>) => {
    setWatermarks(prev => prev.map(w => w.id === id ? { ...w, ...changes } : w));
  };

  const handleRemoveWatermark = (id: string) => {
    setWatermarks(prev => prev.filter(w => w.id !== id));
    if (selectedWatermarkId === id) {
      setSelectedWatermarkId(null);
    }
  };

  // 💡 图层排序：上移
  const handleMoveWatermarkUp = (id: string) => {
    setWatermarks(prev => {
      const index = prev.findIndex(w => w.id === id);
      if (index <= 0) return prev;
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  // 💡 图层排序：下移
  const handleMoveWatermarkDown = (id: string) => {
    setWatermarks(prev => {
      const index = prev.findIndex(w => w.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  };

  // 💡 复制水印
  const handleDuplicateWatermark = (id: string) => {
    const watermark = watermarks.find(w => w.id === id);
    if (watermark) {
      const newWatermark = {
        ...watermark,
        id: Date.now().toString(),
        x: watermark.x + 20,
        y: watermark.y + 20
      };
      setWatermarks(prev => [...prev, newWatermark]);
      setSelectedWatermarkId(newWatermark.id);
    }
  };

  // 💡 拖拽重排水印图层
  const handleReorderWatermarks = (fromIndex: number, toIndex: number) => {
    setWatermarks(prev => {
      const newArr = [...prev];
      const [removed] = newArr.splice(fromIndex, 1);
      newArr.splice(toIndex, 0, removed);
      return newArr;
    });
  };

  const handleSettingsChange = (key: keyof ProcessSettings, value: number | boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyColorPreset = (presetId: string) => {
    const { colorPresets } = require('./services/colorPresets');
    const preset = colorPresets.find((p: any) => p.id === presetId);
    if (preset) {
      console.log('Applying color preset:', preset.name);
      const newSettings = applyColorPreset(preset, settings);
      setSettings(newSettings);
      // Image will auto-reprocess via useEffect
    } else {
      console.error('Color preset not found:', presetId);
    }
  };

  // 💡 快捷操作处理 (变换、一键预设)
  const handleQuickAction = useCallback(async (action: string) => {
    if (!processedImage) return;

    try {
      // 加载当前图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = processedImage;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 变换操作
      if (action === 'rotate_left') {
        imageData = rotateImage(imageData, 270);
      } else if (action === 'rotate_right') {
        imageData = rotateImage(imageData, 90);
      } else if (action === 'flip_h') {
        imageData = flipHorizontal(imageData);
      } else if (action === 'flip_v') {
        imageData = flipVertical(imageData);
      }
      // 💡 裁剪和缩放 - 打开对应工具
      else if (action === 'crop') {
        setShowCropTool(true);
        return; // 不执行图像处理，直接返回
      } else if (action === 'resize') {
        setShowPhotoEditor(true);
        return; // 不执行图像处理，打开编辑器
      }
      // 一键预设
      else if (['auto_enhance', 'portrait', 'landscape', 'food', 'night', 'vintage', 'hdr', 'cinematic', 'fresh', 'dramatic'].includes(action)) {
        imageData = applyEnhancePreset(imageData, action);
      }

      // 输出结果
      const outCanvas = document.createElement('canvas');
      outCanvas.width = imageData.width;
      outCanvas.height = imageData.height;
      const outCtx = outCanvas.getContext('2d')!;
      outCtx.putImageData(imageData, 0, 0);
      setProcessedImage(outCanvas.toDataURL('image/png'));

      console.log('Quick action applied:', action);
    } catch (err) {
      console.error('Quick action failed:', err);
    }
  }, [processedImage]);

  const handleApplyPreset = (preset: Preset) => {
    console.log('Applying preset:', preset.name);
    setSettings(preset.settings);
  };

  const handleSavePreset = (name: string, description: string) => {
    const newPreset = addPreset({
      name,
      nameEn: name,
      description,
      descriptionEn: description,
      settings: { ...settings }
    });
    setUserPresets(loadUserPresets());
    console.log('Preset saved:', name);
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    setUserPresets(loadUserPresets());
  };

  const handleDimensionChange = (key: 'outputWidth' | 'outputHeight', value: number) => {
    if (!originalDims.width) return;
    let newSettings = { ...settings, [key]: value };
    if (lockAspectRatio) {
      const ratio = originalDims.width / originalDims.height;
      if (key === 'outputWidth') {
        newSettings.outputHeight = Math.round(value / ratio);
      } else {
        newSettings.outputWidth = Math.round(value * ratio);
      }
    }
    setSettings(newSettings);
  };

  const handleReset = () => {
    setSettings({
      threshold: 180,
      strength: 1,
      contrast: 0,
      smoothing: true,
      monochrome: false,
      outputWidth: originalDims.width,
      outputHeight: originalDims.height,
      sharpness: 0,
      denoise: 0,
      adaptiveThreshold: false,
      edgeEnhance: false,
      removeBackground: true,
      brightness: 0,
      saturation: 0,
      backgroundColor: 'transparent',
      texture: 'none',
      blurType: 'box',
      blurRadius: 0,
      autoLevels: false,
      levelsEnabled: false,
      levelsInputBlack: 0,
      levelsInputWhite: 255,
      levelsGamma: 1,
      histogramEqualization: false
    });
    setWatermarks([]);
  };

  const runProcessing = useCallback(async () => {
    if (!originalImage) return;
    setIsProcessing(true);
    try {
      const result = await processImage(originalImage, settings);
      setProcessedImage(result);
    } catch (err) {
      console.error(err);
      setError("Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, settings]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runProcessing();
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [runProcessing]);

  const handleAiRestore = async () => {
    if (!originalImage) return;

    const token = getToken(selectedAIProvider);
    if (!token) {
      setError('请先配置 API Token');
      return;
    }

    setIsAiProcessing(true);
    setError(null);
    setAiSuggestion(null);

    try {
      const result = await restoreImageWithAI(originalImage, {
        provider: selectedAIProvider,
        apiKey: token
      });

      if (!result.success) {
        setError(result.error || 'AI 处理失败');
        return;
      }

      // 💡 如果返回了图像数据，更新原图
      if (result.imageData) {
        setOriginalImage(result.imageData);
        const img = new Image();
        img.onload = () => {
          setOriginalDims({ width: img.width, height: img.height });
          setSettings(prev => ({
            ...prev,
            threshold: 240,
            strength: 0,
            sharpness: 20,
            outputWidth: img.width,
            outputHeight: img.height,
          }));
        };
        img.src = result.imageData;
      }

      // 💡 如果返回了建议，显示建议
      if (result.suggestion) {
        setAiSuggestion(result.suggestion);
      }

    } catch (err: any) {
      setError("AI 处理失败：" + (err.message || '未知错误'));
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedImage) return;

    // Create Canvas for Composition
    const canvas = document.createElement('canvas');
    canvas.width = settings.outputWidth || 0;
    canvas.height = settings.outputHeight || 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load Main Image
    const mainImg = new Image();
    mainImg.src = processedImage;
    mainImg.crossOrigin = "Anonymous";
    await new Promise((resolve, reject) => {
      mainImg.onload = resolve;
      mainImg.onerror = reject;
    });

    ctx.drawImage(mainImg, 0, 0);

    // Draw Watermarks
    const scaleX = canvas.width / (originalDims.width || 1);
    const scaleY = canvas.height / (originalDims.height || 1);

    for (const watermark of watermarks) {
      if (watermark.type === WatermarkType.IMAGE) {
        const wmImg = new Image();
        if (watermark.format === 'svg') {
          // For SVG, create a data URL from the SVG string
          const blob = new Blob([watermark.src], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          wmImg.src = url;
        } else {
          wmImg.src = watermark.src;
        }
        wmImg.crossOrigin = "Anonymous";
        await new Promise(r => wmImg.onload = r);

        const x = watermark.x * scaleX;
        const y = watermark.y * scaleY;
        const w = watermark.width * scaleX;
        const h = watermark.height * scaleY;

        ctx.save();
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(watermark.rotation * Math.PI / 180);
        ctx.drawImage(wmImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        // Text Watermark
        const x = watermark.x * scaleX;
        const y = watermark.y * scaleY;
        const fontSize = watermark.fontSize * Math.min(scaleX, scaleY);

        ctx.save();
        ctx.globalAlpha = watermark.opacity / 100;
        ctx.translate(x, y);
        ctx.rotate(watermark.rotation * Math.PI / 180);
        ctx.font = `${fontSize}px "${watermark.fontFamily}"`;
        ctx.fillStyle = watermark.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(watermark.text, 0, 0);
        ctx.restore();
      }
    }

    const filename = `inkflow-${settings.outputWidth}x${settings.outputHeight}`;

    if (exportFormat === 'svg') {
      // SVG Export
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const svgString = vectorizer.toSVG(imageData);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'jpeg') {
      // JPEG Export with quality control
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', jpegQuality / 100);
    } else if (exportFormat === 'webp') {
      // WebP Export
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.webp`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/webp', 0.9);
    } else {
      // PNG Export (default)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };

  return (
    // 主题适配背景
    <div className="flex h-screen flex-col font-sans overflow-hidden selection:bg-indigo-500/30 gradient-mesh transition-colors duration-300">

      {/* Header - 主题适配 */}
      <header className="relative flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--glass-bg)] backdrop-blur-md px-6 py-4 shadow-lg z-20 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--fg-primary)]">{t.appTitle}</h1>
            <p className="text-xs text-[var(--fg-muted)]">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
          {/* Lang Toggle */}
          <button
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Switch Language"
          >
            <Languages className="h-4 w-4" />
            <span className="text-xs uppercase">{lang}</span>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher compact />

          <div className="h-8 w-px bg-[var(--border-default)] my-auto mx-1" />

          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const prevState = undo();
                if (prevState) {
                  setSettings(prevState.settings);
                  setWatermarks(prevState.watermarks);
                  setSelectedWatermarkId(null);
                }
              }}
              disabled={!canUndo}
              className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={`${t.undo || '撤销'} (Ctrl+Z)`}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const nextState = redo();
                if (nextState) {
                  setSettings(nextState.settings);
                  setWatermarks(nextState.watermarks);
                  setSelectedWatermarkId(null);
                }
              }}
              disabled={!canRedo}
              className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={`${t.redo || '重做'} (Ctrl+Y)`}
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-[var(--border-default)] my-auto mx-1" />

          {/* Shortcuts Panel Button */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors"
            title={`${t.shortcuts || '快捷键'} (?)`}
          >
            <Keyboard className="h-5 w-5" />
          </button>

          {/* Photo Editor Button */}
          {originalImage && (
            <button
              onClick={() => setShowPhotoEditor(true)}
              className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
              title={t.photoEditor || '照片编辑 (P图)'}
            >
              <Wand2 className="h-5 w-5" />
            </button>
          )}

          <button onClick={() => setShowHelp(true)} className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" title={t.help}>
            <HelpCircle className="h-5 w-5" />
          </button>
          <button onClick={() => setShowAbout(true)} className="p-2 rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white transition-colors" title={t.about}>
            <Info className="h-5 w-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-default)]"
          >
            <Upload className="h-4 w-4" />
            {t.uploadNew}
          </button>

          <div className="flex items-center rounded-lg bg-indigo-600/90 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all backdrop-blur-sm ml-2">
            <div className="border-r border-indigo-700/50">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpeg' | 'webp' | 'svg')}
                className="bg-transparent text-white text-xs font-semibold px-3 py-2 outline-none cursor-pointer appearance-none hover:bg-[var(--bg-secondary)] transition-colors"
                style={{ textAlignLast: 'center' }}
              >
                <option value="png" className="bg-slate-900 text-white">PNG</option>
                <option value="jpeg" className="bg-slate-900 text-white">JPEG</option>
                <option value="webp" className="bg-slate-900 text-white">WebP</option>
                <option value="svg" className="bg-slate-900 text-white">SVG</option>
              </select>
            </div>
            <button
              onClick={handleDownload}
              disabled={!processedImage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all"
            >
              <Download className="h-4 w-4" />
              {t.downloadPng}
            </button>
          </div>

        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10 text-shadow">
        <Sidebar
          t={t}
          settings={settings}
          handleSettingsChange={handleSettingsChange}
          onReset={handleReset}
          originalImage={originalImage}
          isAiProcessing={isAiProcessing}
          handleAiRestore={handleAiRestore}
          error={error}
          aiSuggestion={aiSuggestion}
          selectedAIProvider={selectedAIProvider}
          onAIProviderChange={setSelectedAIProvider}
          onAIConfigured={setHasAIToken}
          originalDims={originalDims}
          lockAspectRatio={lockAspectRatio}
          setLockAspectRatio={setLockAspectRatio}
          handleDimensionChange={handleDimensionChange}
          onImageWatermarkUpload={handleImageWatermarkUpload}
          onAddTextWatermark={handleAddTextWatermark}
          uploadStatus={uploadStatus}
          watermarks={watermarks}
          selectedWatermarkId={selectedWatermarkId}
          onSelectWatermark={setSelectedWatermarkId}
          onUpdateWatermark={handleUpdateWatermark}
          onRemoveWatermark={handleRemoveWatermark}
          onMoveWatermarkUp={handleMoveWatermarkUp}
          onMoveWatermarkDown={handleMoveWatermarkDown}
          onDuplicateWatermark={handleDuplicateWatermark}
          onReorderWatermarks={handleReorderWatermarks}
          onApplyColorPreset={handleApplyColorPreset}
          gridEnabled={gridEnabled}
          setGridEnabled={setGridEnabled}
          snapEnabled={snapEnabled}
          setSnapEnabled={setSnapEnabled}
          onOpenPhotoEditor={() => setShowPhotoEditor(true)}
          onQuickAction={handleQuickAction}
        />

        <MainCanvas
          t={t}
          originalImage={originalImage}
          processedImage={processedImage}
          isProcessing={isProcessing}
          onFileUpload={() => fileInputRef.current?.click()}
          originalDims={originalDims}
          watermarks={watermarks}
          selectedWatermarkId={selectedWatermarkId}
          onUpdateWatermark={handleUpdateWatermark}
          onRemoveWatermark={handleRemoveWatermark}
          onSelectWatermark={setSelectedWatermarkId}
          gridEnabled={gridEnabled}
          gridSize={gridSize}
          snapEnabled={snapEnabled}
          texture={settings.texture}
        />
      </div>

      {/* Modals are the same ... */}
      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title={t.helpContent.title}>
        <ul className="space-y-4">
          <li>
            <h4 className="font-semibold text-indigo-300 text-sm">{t.helpContent.step1}</h4>
            <p className="text-xs opacity-70 mt-1">{t.helpContent.step1Desc}</p>
          </li>
          <li>
            <h4 className="font-semibold text-indigo-300 text-sm">{t.helpContent.step2}</h4>
            <p className="text-xs opacity-70 mt-1">{t.helpContent.step2Desc}</p>
          </li>
          <li>
            <h4 className="font-semibold text-indigo-300 text-sm">{t.helpContent.step3}</h4>
            <p className="text-xs opacity-70 mt-1">{t.helpContent.step3Desc}</p>
          </li>
          <li>
            <h4 className="font-semibold text-indigo-300 text-sm">{t.helpContent.step4}</h4>
            <p className="text-xs opacity-70 mt-1">{t.helpContent.step4Desc}</p>
          </li>
        </ul>
      </Modal>

      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title={t.aboutContent.title}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm opacity-60 mb-2">{t.aboutContent.desc}</p>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
              <Code className="h-3 w-3" /> {t.aboutContent.techTitle}
            </h4>
            <ul className="space-y-1 text-xs opacity-70">
              {t.aboutContent.techStack.map((tech) => (
                <li key={tech} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-500" /> {tech}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
              <ExternalLink className="h-3 w-3" /> {t.aboutContent.linksTitle}
            </h4>
            <div className="flex flex-wrap gap-2">
              {t.aboutContent.links.map((link) => (
                <a key={link.label} href={link.url} className="px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-default)] text-xs hover:bg-[var(--bg-tertiary)] hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="w-full border-t border-[var(--border-default)] pt-4 text-center text-xs opacity-40">
            <p>{t.aboutContent.version}</p>
          </div>
        </div>
      </Modal>

      {/* Shortcuts Panel */}
      <ShortcutsPanel
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        t={t}
      />

      {/* Photo Editor */}
      {showPhotoEditor && originalImage && (
        <PhotoEditorPanel
          imageUrl={processedImage || originalImage}
          imageWidth={originalDims.width}
          imageHeight={originalDims.height}
          onSave={(editedUrl) => {
            setProcessedImage(editedUrl);
            setShowPhotoEditor(false);
          }}
          onCancel={() => setShowPhotoEditor(false)}
          t={t}
        />
      )}

    </div>
  );
}