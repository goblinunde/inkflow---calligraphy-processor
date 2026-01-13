import React from 'react';
import { X } from 'lucide-react';

interface ShortcutHelpProps {
    isOpen: boolean;
    onClose: () => void;
    t: any;
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose, t }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { keys: ['Ctrl', 'Z'], action: '撤销 Undo', desc: '恢复到上一步操作' },
        { keys: ['Ctrl', 'Y'], action: '重做 Redo', desc: '恢复被撤销的操作' },
        { keys: ['Ctrl', 'Shift', 'Z'], action: '重做 Redo', desc: '恢复被撤销的操作（Mac）' },
        { keys: ['Ctrl', 'S'], action: '保存 Save', desc: '下载处理后的图片' },
        { keys: ['Delete'], action: '删除 Delete', desc: '删除选中的水印' },
        { keys: ['Backspace'], action: '删除 Delete', desc: '删除选中的水印' },
        { keys: ['Esc'], action: '取消选中 Deselect', desc: '取消水印选择' },
        { keys: ['Ctrl', 'D'], action: '复制 Duplicate', desc: '复制选中的水印' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">⌨️ 快捷键 Keyboard Shortcuts</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-white/60" />
                    </button>
                </div>

                <div className="p-6 space-y-3">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white mb-1">{shortcut.action}</div>
                                <div className="text-xs text-white/40">{shortcut.desc}</div>
                            </div>
                            <div className="flex gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span className="text-white/30 mx-1">+</span>}
                                        <kbd className="px-2 py-1 bg-slate-800 border border-white/20 rounded text-xs font-mono text-white shadow-sm">
                                            {key}
                                        </kbd>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-indigo-900/20 border-t border-indigo-500/20">
                    <p className="text-xs text-indigo-200/60 text-center">
                        💡 提示：Mac 用户请将 Ctrl 替换为 Cmd
                    </p>
                </div>
            </div>
        </div>
    );
};
