import { useState, useCallback, useRef } from 'react';
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

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const pushState = useCallback((settings: ProcessSettings, watermarks: Watermark[]) => {
        if (ignoreNextUpdate.current) {
            ignoreNextUpdate.current = false;
            return;
        }

        setHistory(prev => {
            // Remove all states after current index
            const newHistory = prev.slice(0, historyIndex + 1);

            // Add new state
            newHistory.push({ settings, watermarks });

            // Limit to 20 states
            if (newHistory.length > 20) {
                newHistory.shift();
                return newHistory;
            }

            return newHistory;
        });

        setHistoryIndex(prev => {
            const newIndex = Math.min(prev + 1, 19);
            return newIndex;
        });
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (canUndo) {
            ignoreNextUpdate.current = true;
            setHistoryIndex(prev => prev - 1);
            return history[historyIndex - 1];
        }
        return null;
    }, [canUndo, history, historyIndex]);

    const redo = useCallback(() => {
        if (canRedo) {
            ignoreNextUpdate.current = true;
            setHistoryIndex(prev => prev + 1);
            return history[historyIndex + 1];
        }
        return null;
    }, [canRedo, history, historyIndex]);

    return {
        pushState,
        undo,
        redo,
        canUndo,
        canRedo,
        currentState: history[historyIndex]
    };
};
