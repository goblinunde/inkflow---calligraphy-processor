import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessSettings, Watermark } from '../types';

interface HistoryState {
    settings: ProcessSettings;
    watermarks: Watermark[];
}

export const useHistory = (initialSettings: ProcessSettings, initialWatermarks: Watermark[] = []) => {
    const [history, setHistory] = useState<HistoryState[]>([
        { settings: initialSettings, watermarks: initialWatermarks }
    ]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const ignoreNextUpdate = useRef(false);
    const historyRef = useRef(history);
    const historyIndexRef = useRef(historyIndex);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    useEffect(() => {
        historyIndexRef.current = historyIndex;
    }, [historyIndex]);

    const pushState = useCallback((settings: ProcessSettings, watermarks: Watermark[]) => {
        if (ignoreNextUpdate.current) {
            ignoreNextUpdate.current = false;
            return;
        }

        setHistory(prev => {
            const currentIndex = historyIndexRef.current;
            const newHistory = prev.slice(0, currentIndex + 1);

            newHistory.push({ settings, watermarks });

            if (newHistory.length > 20) {
                newHistory.shift();
            }

            const nextIndex = newHistory.length - 1;
            historyIndexRef.current = nextIndex;
            setHistoryIndex(nextIndex);
            return newHistory;
        });
    }, []);

    const undo = useCallback(() => {
        const nextIndex = historyIndexRef.current - 1;
        if (nextIndex >= 0) {
            ignoreNextUpdate.current = true;
            historyIndexRef.current = nextIndex;
            setHistoryIndex(nextIndex);
            return historyRef.current[nextIndex];
        }
        return null;
    }, []);

    const redo = useCallback(() => {
        const nextIndex = historyIndexRef.current + 1;
        if (nextIndex < historyRef.current.length) {
            ignoreNextUpdate.current = true;
            historyIndexRef.current = nextIndex;
            setHistoryIndex(nextIndex);
            return historyRef.current[nextIndex];
        }
        return null;
    }, []);

    return {
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        currentState: history[historyIndex]
    };
};
