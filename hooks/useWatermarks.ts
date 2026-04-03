import { useCallback, useState } from 'react';
import type {
  Dimensions,
  ImageWatermark,
  TextWatermark,
  UploadStatus,
  Watermark
} from '../types';
import { WatermarkType } from '../types';
import { useTimedStatus } from './useTimedStatus';

interface UseWatermarksOptions {
  originalImage: string | null;
  originalDims: Dimensions;
  onError: (message: string | null) => void;
}

const createWatermarkId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useWatermarks = ({
  originalImage,
  originalDims,
  onError
}: UseWatermarksOptions) => {
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [selectedWatermarkId, setSelectedWatermarkId] = useState<string | null>(null);
  const { status: uploadStatus, showStatus } = useTimedStatus<UploadStatus>(3000);

  const showUploadStatus = useCallback((status: UploadStatus) => {
    onError(status.type === 'error' ? status.message : null);
    showStatus(status);
  }, [onError, showStatus]);

  const ensureBaseImage = useCallback(() => {
    if (!originalImage || originalDims.width === 0) {
      showUploadStatus({ type: 'error', message: '请先上传书法作品图片' });
      return false;
    }
    return true;
  }, [originalDims.width, originalImage, showUploadStatus]);

  const createImageWatermark = useCallback((src: string, format: 'png' | 'jpeg' | 'svg') => {
    if (format === 'svg') {
      const baseSize = Math.min(originalDims.width, originalDims.height) * 0.15;
      const newWatermark: ImageWatermark = {
        type: WatermarkType.IMAGE,
        id: createWatermarkId(),
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
      showUploadStatus({ type: 'success', message: 'SVG 水印上传成功' });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const baseSize = Math.min(originalDims.width, originalDims.height) * 0.15;
      const ratio = img.width / img.height;
      const newWatermark: ImageWatermark = {
        type: WatermarkType.IMAGE,
        id: createWatermarkId(),
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
      showUploadStatus({ type: 'success', message: '图片水印上传成功' });
    };
    img.onerror = () => {
      showUploadStatus({ type: 'error', message: '图片格式错误' });
    };
    img.src = src;
  }, [originalDims.height, originalDims.width, showUploadStatus]);

  const handleImageWatermarkUpload = useCallback((file: File) => {
    if (!ensureBaseImage()) {
      return;
    }

    const isSVG = file.type === 'image/svg+xml';
    const isPNG = file.type === 'image/png';
    const isJPEG = file.type === 'image/jpeg' || file.type === 'image/jpg';

    if (!isSVG && !isPNG && !isJPEG) {
      showUploadStatus({ type: 'error', message: '仅支持 PNG, JPEG, SVG 格式' });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      showUploadStatus({ type: 'error', message: '文件读取失败' });
    };

    if (isSVG) {
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          createImageWatermark(event.target.result, 'svg');
        }
      };
      reader.readAsText(file);
      return;
    }

    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        createImageWatermark(event.target.result, isPNG ? 'png' : 'jpeg');
      }
    };
    reader.readAsDataURL(file);
  }, [createImageWatermark, ensureBaseImage, showUploadStatus]);

  const handleAddTextWatermark = useCallback((
    text: string,
    fontSize: number,
    fontFamily: string,
    color: string
  ) => {
    if (!ensureBaseImage()) {
      return;
    }

    if (!text.trim()) {
      showUploadStatus({ type: 'error', message: '请输入水印文字' });
      return;
    }

    const newWatermark: TextWatermark = {
      type: WatermarkType.TEXT,
      id: createWatermarkId(),
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
    showUploadStatus({ type: 'success', message: '文字水印添加成功' });
  }, [ensureBaseImage, originalDims.height, originalDims.width, showUploadStatus]);

  const handleUpdateWatermark = useCallback((id: string, changes: Partial<Watermark>) => {
    setWatermarks(prev => prev.map(watermark => (
      watermark.id === id ? { ...watermark, ...changes } : watermark
    )));
  }, []);

  const handleRemoveWatermark = useCallback((id: string) => {
    setWatermarks(prev => prev.filter(watermark => watermark.id !== id));
    setSelectedWatermarkId(prev => (prev === id ? null : prev));
  }, []);

  const handleMoveWatermarkUp = useCallback((id: string) => {
    setWatermarks(prev => {
      const index = prev.findIndex(watermark => watermark.id === id);
      if (index <= 0) {
        return prev;
      }

      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveWatermarkDown = useCallback((id: string) => {
    setWatermarks(prev => {
      const index = prev.findIndex(watermark => watermark.id === id);
      if (index < 0 || index >= prev.length - 1) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleDuplicateWatermark = useCallback((id: string) => {
    setWatermarks(prev => {
      const watermark = prev.find(item => item.id === id);
      if (!watermark) {
        return prev;
      }

      const duplicated = {
        ...watermark,
        id: createWatermarkId(),
        x: watermark.x + 20,
        y: watermark.y + 20
      };

      setSelectedWatermarkId(duplicated.id);
      return [...prev, duplicated];
    });
  }, []);

  const handleReorderWatermarks = useCallback((fromIndex: number, toIndex: number) => {
    setWatermarks(prev => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  return {
    watermarks,
    setWatermarks,
    selectedWatermarkId,
    setSelectedWatermarkId,
    uploadStatus,
    handleImageWatermarkUpload,
    handleAddTextWatermark,
    handleUpdateWatermark,
    handleRemoveWatermark,
    handleMoveWatermarkUp,
    handleMoveWatermarkDown,
    handleDuplicateWatermark,
    handleReorderWatermarks
  };
};
