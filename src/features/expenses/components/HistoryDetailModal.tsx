
import React, { useState } from 'react';
import { X, Calendar, ShoppingBag, Plus, ExternalLink, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

interface HistoryDetailModalProps {
    session: any;
    onClose: () => void;
    onUpdate: (sessionId: string, newData: any) => Promise<void>;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ session, onClose, onUpdate }) => {
    const [items, setItems] = useState(session.raw_data || []);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ merchant: '', amount: 0, category: 'Otros' });
    const [saving, setSaving] = useState(false);

    const handleAddItem = () => {
        if (!newItem.merchant || newItem.amount <= 0) return;
        setItems([...items, newItem]);
        setNewItem({ merchant: '', amount: 0, category: 'Otros' });
        setIsAdding(false);
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        await onUpdate(session.id, items);
        setSaving(false);
        onClose();
    };

    // Logic to identify file type
    const isImage = (url: string) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
    const isPdf = (url: string) => /\.pdf$/i.test(url);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-full max-h-[85vh] bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left Side: Document Preview */}
                <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-black/20 relative border-r border-border overflow-y-auto p-4 flex items-center justify-center">
                    {session.image_urls?.[0] ? (
                        isImage(session.image_urls[0]) ? (
                            <img
                                src={session.image_urls[0]}
                                alt="Document"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-lg shadow-black/20"
                            />
                        ) : isPdf(session.image_urls[0]) ? (
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                <div className="size-24 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500">
                                    <FileText className="w-12 h-12" />
                                </div>
                                <p className="font-bold">Documento PDF</p>
                                <a
                                    href={session.image_urls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-full text-xs font-black flex items-center gap-2 hover:bg-slate-300 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" /> ABRIR EN PESTAÑA
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                                <div className="size-24 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <FileText className="w-12 h-12" />
                                </div>
                                <p className="font-bold">Hoja de Cálculo / Doc</p>
                                <a
                                    href={session.image_urls[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-slate-200 dark:bg-white/10 rounded-full text-xs font-black flex items-center gap-2 hover:bg-slate-300 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" /> ABRIR ARCHIVO
                                </a>
                            </div>
                        )
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center gap-2">
                            <ImageIcon className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-medium">Sin previsualización</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Data Review */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="p-6 border-b border-border flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(session.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Detalle de Sesión</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Gastos Extraídos
                        </h3>

                        <div className="space-y-3">
                            {items.map((item: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-border"
                                >
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.merchant}</p>
                                        <p className="text-xs text-slate-500 capitalize">{item.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-blue-600">
                                            <AnimatedPrice amount={item.amount} />
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            <AnimatePresence>
                                {isAdding && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-blue-500/5 border border-dashed border-blue-500/30 rounded-2xl space-y-3"
                                    >
                                        <input
                                            autoFocus
                                            placeholder="Comercio..."
                                            className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm font-bold"
                                            value={newItem.merchant}
                                            onChange={e => setNewItem({ ...newItem, merchant: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="Monto"
                                                    className="w-full bg-surface border border-border rounded-xl pl-8 pr-4 py-2 text-sm font-bold"
                                                    value={newItem.amount || ''}
                                                    onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <button
                                                onClick={handleAddItem}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
                                            >
                                                Sumar
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!isAdding && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm font-bold flex items-center justify-center gap-2 hover:border-blue-500/50 hover:text-blue-500 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Agregar gasto manualmente
                                </button>
                            )}
                        </div>
                    </div>

                    <footer className="p-6 border-t border-border flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            disabled={saving}
                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {saving ? <Plus className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Guardar Cambios
                        </button>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default HistoryDetailModal;
