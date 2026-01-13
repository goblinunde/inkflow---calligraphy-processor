import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 text-white/80 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
