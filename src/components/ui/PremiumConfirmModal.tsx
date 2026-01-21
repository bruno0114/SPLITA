import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Trash2, Info } from 'lucide-react';

interface PremiumConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'info';
}

const PremiumConfirmModal: React.FC<PremiumConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-border overflow-hidden"
                    >
                        {/* Status Bar Deco */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />

                        <div className="flex flex-col items-center text-center mt-2">
                            <div className={`size-16 rounded-2xl flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {type === 'danger' ? <Trash2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium px-2">
                                {message}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 mt-8">
                            <button
                                onClick={onConfirm}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${type === 'danger' ? 'bg-red-500 text-white shadow-red-500/25 hover:bg-red-600' : 'bg-blue-600 text-white shadow-blue-500/25 hover:bg-blue-700'}`}
                            >
                                {confirmLabel}
                            </button>
                            <button
                                onClick={onCancel}
                                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
                            >
                                {cancelLabel}
                            </button>
                        </div>

                        {/* Decoration */}
                        <div className={`absolute -right-16 -bottom-16 size-40 blur-3xl rounded-full opacity-10 ${type === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PremiumConfirmModal;
