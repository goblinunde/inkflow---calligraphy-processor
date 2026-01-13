import { useEffect } from 'react';

interface KeyboardShortcuts {
    onUndo?: () => void;
    onRedo?: () => void;
    onSave?: () => void;
    onDelete?: () => void;
    onEscape?: () => void;
    onCopy?: () => void;
    onShowShortcuts?: () => void;
}

export const useKeyboardShortcuts = (callbacks: KeyboardShortcuts) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z or Cmd+Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                callbacks.onUndo?.();
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z: Redo
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
            ) {
                e.preventDefault();
                callbacks.onRedo?.();
                return;
            }

            // Ctrl+S or Cmd+S: Save/Download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                callbacks.onSave?.();
                return;
            }

            // Delete or Backspace: Delete selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only if not in input field
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    callbacks.onDelete?.();
                }
                return;
            }

            // Escape: Deselect
            if (e.key === 'Escape') {
                e.preventDefault();
                callbacks.onEscape?.();
                return;
            }

            // Ctrl+D or Cmd+D: Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                callbacks.onCopy?.();
                return;
            }

            // ? or /: Show shortcuts panel
            if (e.key === '?' || e.key === '/') {
                // Only if not in input field
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    callbacks.onShowShortcuts?.();
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [callbacks]);
};
