import React from 'react';
import { BookMarked, Download, Upload, Trash2 } from 'lucide-react';
import { Preset, builtInPresets } from '../services/presets';

interface PresetPanelProps {
    currentSettings: any;
    onApplyPreset: (preset: Preset) => void;
    onSavePreset: (name: string, description: string) => void;
    userPresets: Preset[];
    onDeletePreset: (id: string) => void;
    lang: 'zh' | 'en';
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
    currentSettings,
    onApplyPreset,
    onSavePreset,
    userPresets,
    onDeletePreset,
    lang
}) => {
    const [showSaveDialog, setShowSaveDialog] = React.useState(false);
    const [presetName, setPresetName] = React.useState('');
    const [presetDesc, setPresetDesc] = React.useState('');

    const handleSave = () => {
        if (presetName.trim()) {
            onSavePreset(presetName, presetDesc);
            setPresetName('');
            setPresetDesc('');
            setShowSaveDialog(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Built-in Presets */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60">内置预设 Built-in</span>
                    <button
                        onClick={() => setShowSaveDialog(true)}
                        className="text-[10px] px-2 py-1 rounded bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-all"
                    >
                        + 保存当前
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {builtInPresets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => onApplyPreset(preset)}
                            className="p-2 rounded border border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all text-left group"
                        >
                            <div className="text-[11px] font-medium text-white/90">{lang === 'zh' ? preset.name : preset.nameEn}</div>
                            <div className="text-[9px] text-white/40 mt-0.5 line-clamp-2">{lang === 'zh' ? preset.description : preset.descriptionEn}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* User Presets */}
            {userPresets.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                    <span className="text-xs text-white/60 block mb-2">我的预设 My Presets</span>
                    <div className="space-y-2">
                        {userPresets.map(preset => (
                            <div key={preset.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => onApplyPreset(preset)}
                                    className="flex-1 p-2 rounded border border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all text-left"
                                >
                                    <div className="text-[11px] font-medium text-white/90">{preset.name}</div>
                                    <div className="text-[9px] text-white/40 mt-0.5 line-clamp-1">{preset.description}</div>
                                </button>
                                <button
                                    onClick={() => onDeletePreset(preset.id)}
                                    className="p-2 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)}>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-white mb-4">💾 保存预设 Save Preset</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-white/60 block mb-1">名称 Name</label>
                                <input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="如：我的楷书配置"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/60 block mb-1">描述 Description (可选)</label>
                                <textarea
                                    value={presetDesc}
                                    onChange={(e) => setPresetDesc(e.target.value)}
                                    placeholder="简单描述这个预设的用途"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none"
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!presetName.trim()}
                                    className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
