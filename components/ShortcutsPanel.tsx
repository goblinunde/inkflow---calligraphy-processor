import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    t: any;
}

const shortcuts = [
    {
        category: '文件', items: [
            { keys: ['Ctrl', 'O'], action: '打开图片' },
            { keys: ['Ctrl', 'S'], action: '保存/导出' },
            { keys: ['Ctrl', 'Shift', 'E'], action: '批量处理' },
        ]
    },
    {
        category: '编辑', items: [
            { keys: ['Ctrl', 'Z'], action: '撤销' },
            { keys: ['Ctrl', 'Y'], action: '重做' },
            { keys: ['Ctrl', 'Shift', 'Z'], action: '重做 (备选)' },
            { keys: ['Delete'], action: '删除选中水印' },
            { keys: ['C'], action: '打开裁剪工具' },
        ]
    },
    {
        category: '视图', items: [
            { keys: ['Space'], action: '按住拖拽画布' },
            { keys: ['+'], action: '放大' },
            { keys: ['-'], action: '缩小' },
            { keys: ['0'], action: '重置缩放' },
            { keys: ['G'], action: '切换网格' },
        ]
    },
    {
        category: '调整', items: [
            { keys: ['1'], action: '应用楷书预设' },
            { keys: ['2'], action: '应用行书预设' },
            { keys: ['3'], action: '应用草书预设' },
            { keys: ['R'], action: '重置所有参数' },
        ]
    },
];

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({
    isOpen,
    onClose,
    t
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl w-[500px] max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
                    <div className="flex items-center gap-3">
                        <Keyboard className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-[var(--fg-primary)]">
                            {t.shortcuts || '快捷键'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
                    {shortcuts.map(category => (
                        <div key={category.category}>
                            <h3 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
                                {category.category}
                            </h3>
                            <div className="space-y-2">
                                {category.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <span className="text-sm text-[var(--fg-secondary)]">{item.action}</span>
                                        <div className="flex items-center gap-1">
                                            {item.keys.map((key, i) => (
                                                <React.Fragment key={i}>
                                                    <kbd className="px-2 py-1 text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border-default)] rounded shadow-sm text-[var(--fg-primary)]">
                                                        {key}
                                                    </kbd>
                                                    {i < item.keys.length - 1 && (
                                                        <span className="text-[var(--fg-muted)] text-xs">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <p className="text-xs text-[var(--fg-muted)] text-center">
                        按 <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded text-[10px]">?</kbd> 或 <kbd className="px-1.5 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded text-[10px]">/</kbd> 打开此面板
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsPanel;
