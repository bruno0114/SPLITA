import React, { useState } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';

interface TransactionModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<{ data?: any; error: any }>;
    initialData?: any | null;
    defaultCategory?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, initialData, defaultCategory }) => {
    const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
    const [title, setTitle] = useState(initialData?.title || initialData?.merchant || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || defaultCategory || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title || !amount) return;
        setSaving(true);
        const { error } = await onSave({
            title,
            amount: parseFloat(amount),
            category,
            type,
            date: initialData?.date || new Date().toISOString()
        });
        setSaving(false);
        if (!error) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {initialData ? 'Editar movimiento' : 'Nuevo movimiento'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Type Toggle - Only for personal transactions usually, but we keep it enabled for now */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'expense'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        Gasto
                    </button>
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'income'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                    >
                        Ingreso
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Descripción</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Supermercado Coto"
                            className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Monto</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white dark:bg-black/20 border border-border rounded-xl pl-10 pr-4 py-3 text-2xl font-black focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Categoría</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ej: Compras, Transporte..."
                            className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title || !amount || saving}
                        className="flex-1 py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;
