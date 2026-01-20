import React, { useState } from 'react';
import { X, DollarSign, Loader2, Repeat, CreditCard, LayoutGrid } from 'lucide-react';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { useCategories } from '@/features/analytics/hooks/useCategories';

interface TransactionModalProps {
    onClose: () => void;
    onSave: (data: any) => Promise<{ data?: any; error: any }>;
    initialData?: any | null;
    defaultCategory?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, initialData, defaultCategory }) => {
    const { categories } = useCategories();

    const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
    const [title, setTitle] = useState(initialData?.title || initialData?.merchant || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [category, setCategory] = useState(initialData?.category || defaultCategory || '');
    const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
    const [currentInstallment, setCurrentInstallment] = useState('');
    const [totalInstallments, setTotalInstallments] = useState('');
    const [saving, setSaving] = useState(false);

    // Parse existing installments if any (e.g. "2/6")
    React.useEffect(() => {
        const pattern = initialData?.recurring_pattern || initialData?.installments;
        if (pattern && typeof pattern === 'string' && pattern.includes('/')) {
            const [curr, tot] = pattern.split('/');
            setCurrentInstallment(curr);
            setTotalInstallments(tot);
        }
    }, [initialData]);

    const handleSave = async () => {
        if (!title || !amount) return;
        setSaving(true);

        const installmentsPattern = currentInstallment && totalInstallments
            ? `${currentInstallment}/${totalInstallments}`
            : null;

        const { error } = await onSave({
            title,
            amount: parseFloat(amount),
            category: category || 'Varios',
            type,
            date: initialData?.date || new Date().toISOString(),
            is_recurring: isRecurring,
            installments: installmentsPattern
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
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
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

                    <div className="grid grid-cols-2 gap-4">
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
                            <PremiumDropdown
                                value={category}
                                onChange={setCategory}
                                groups={[
                                    {
                                        title: 'Categorías',
                                        options: categories.map(c => ({
                                            id: c.name,
                                            label: c.name,
                                            icon: LayoutGrid,
                                            color: c.color,
                                            bgColor: c.bg_color
                                        }))
                                    }
                                ]}
                                className="w-full h-[54px]"
                            />
                        </div>
                    </div>

                    {/* Recurring & Installments */}
                    <div className="pt-4 border-t border-border mt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${isRecurring ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <Repeat className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Movimiento Recurrente</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Se repite mensualmente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${currentInstallment ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Pago en Cuotas</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Ej: 2 de 6</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-border">
                                <input
                                    type="number"
                                    placeholder="1"
                                    value={currentInstallment}
                                    onChange={(e) => setCurrentInstallment(e.target.value)}
                                    className="w-10 bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-sm h-8"
                                />
                                <span className="text-slate-400 text-xs font-bold">de</span>
                                <input
                                    type="number"
                                    placeholder="1"
                                    value={totalInstallments}
                                    onChange={(e) => setTotalInstallments(e.target.value)}
                                    className="w-10 bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-sm h-8"
                                />
                            </div>
                        </div>
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
