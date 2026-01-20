import React, { useState } from 'react';
import { X, DollarSign, Loader2, Repeat, CreditCard, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [currency, setCurrency] = useState(initialData?.original_currency || 'ARS');
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate?.toString() || '1');
    const [isFetchingRate, setIsFetchingRate] = useState(false);

    // Parse existing installments if any (e.g. "2/6")
    React.useEffect(() => {
        const pattern = initialData?.recurring_pattern || initialData?.installments;
        if (pattern && typeof pattern === 'string' && pattern.includes('/')) {
            const [curr, tot] = pattern.split('/');
            setCurrentInstallment(curr);
            setTotalInstallments(tot);
        }
    }, [initialData]);

    const fetchRate = async () => {
        setIsFetchingRate(true);
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/blue');
            const data = await res.json();
            if (data && data.venta) {
                setExchangeRate(data.venta.toString());
            }
        } catch (e) {
            console.error("Error fetching rate", e);
            setExchangeRate("1000"); // Standard fallback
        } finally {
            setIsFetchingRate(false);
        }
    };

    const handleSave = async () => {
        if (!title || !amount) return;
        setSaving(true);

        const installmentsPattern = currentInstallment && totalInstallments
            ? `${currentInstallment}/${totalInstallments}`
            : null;

        const baseAmount = parseFloat(amount);
        const rate = parseFloat(exchangeRate) || 1;
        const finalAmount = currency === 'USD' ? baseAmount * rate : baseAmount;

        const { error } = await onSave({
            title,
            amount: finalAmount,
            category: category || 'Varios',
            type,
            date: initialData?.date || new Date().toISOString(),
            is_recurring: isRecurring,
            installments: installmentsPattern,
            original_amount: baseAmount,
            original_currency: currency,
            exchange_rate: currency === 'USD' ? rate : undefined
        });
        setSaving(false);
        if (!error) onClose();
    };

    const isGroupTransaction = initialData?.is_group;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-surface rounded-[2.5rem] p-7 shadow-2xl border border-border"
            >
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar movimiento' : 'Nuevo movimiento'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Type Toggle - Segmented Control style */}
                {!isGroupTransaction && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-6">
                        <button
                            onClick={() => setType('expense')}
                            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${type === 'expense'
                                ? 'bg-white dark:bg-rose-500 text-rose-500 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Gasto
                        </button>
                        <button
                            onClick={() => setType('income')}
                            className={`py-2.5 rounded-xl font-bold text-xs transition-all ${type === 'income'
                                ? 'bg-white dark:bg-emerald-500 text-emerald-500 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Ingreso
                        </button>
                    </div>
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 -mx-2 scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                            <input
                                type="text"
                                value={title}
                                disabled={isGroupTransaction}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Supermercado Coto"
                                className={`w-full bg-slate-50 dark:bg-black/20 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary focus:outline-none font-bold text-sm ${isGroupTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Categoría</label>
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
                                className="w-full h-10"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Monto ({currency})</label>
                            <div className="relative group/input">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm transition-colors group-focus-within/input:text-primary">
                                    {currency === 'USD' ? 'u$s' : '$'}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    disabled={isGroupTransaction}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className={`w-full bg-slate-50 dark:bg-black/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xl font-black focus:ring-2 focus:ring-primary focus:outline-none ${isGroupTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Moneda</label>
                            <PremiumDropdown
                                value={currency}
                                disabled={isGroupTransaction}
                                onChange={(val) => {
                                    setCurrency(val);
                                    if (val === 'USD') fetchRate();
                                }}
                                groups={[
                                    {
                                        title: 'Monedas',
                                        options: [
                                            { id: 'ARS', label: 'ARS - Pesos', icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                                            { id: 'USD', label: 'USD - Dólares', icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                                        ]
                                    }
                                ]}
                                className="w-full h-10"
                            />
                        </div>
                    </div>

                    {currency === 'USD' && (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black text-blue-500 uppercase tracking-widest">Tipo de cambio (ARS)</label>
                                <button
                                    onClick={fetchRate}
                                    disabled={isFetchingRate}
                                    className="text-[10px] font-black text-blue-600 uppercase hover:underline disabled:opacity-50"
                                >
                                    {isFetchingRate ? 'Actualizando...' : 'Actualizar Blue'}
                                </button>
                            </div>
                            <input
                                type="number"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(e.target.value)}
                                className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-xl font-bold text-blue-600 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 font-medium mt-2">
                                Total aproximado: <span className="font-bold">ARS ${(parseFloat(amount || '0') * parseFloat(exchangeRate || '0')).toLocaleString('es-AR')}</span>
                            </p>
                        </div>
                    )}

                    {/* Recurring & Installments - Compact Grid */}
                    <div className="pt-4 border-t border-border mt-4 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recurrente</label>
                            <button
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all ${isRecurring ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-slate-50 dark:bg-white/5 border-border text-slate-500'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Repeat className={`w-3.5 h-3.5 ${isRecurring ? 'animate-spin-slow' : ''}`} />
                                    <span className="text-xs font-bold">{isRecurring ? 'Si' : 'No'}</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-all ${isRecurring ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${isRecurring ? 'left-4.5' : 'left-0.5'}`} />
                                </div>
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">N° Cuotas</label>
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-border h-[42px]">
                                <input
                                    type="number"
                                    placeholder="1"
                                    value={currentInstallment}
                                    onChange={(e) => setCurrentInstallment(e.target.value)}
                                    className="w-full bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-full focus:ring-1 focus:ring-primary/30"
                                />
                                <span className="text-slate-400 text-[10px] font-black">/</span>
                                <input
                                    type="number"
                                    placeholder="1"
                                    value={totalInstallments}
                                    onChange={(e) => setTotalInstallments(e.target.value)}
                                    className="w-full bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-full focus:ring-1 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title || !amount || saving}
                        className="flex-1 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 text-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default TransactionModal;
