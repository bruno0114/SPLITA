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
                className="relative w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-border"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {initialData ? 'Editar movimiento' : 'Nuevo movimiento'}
                        </h3>
                        {isGroupTransaction && (
                            <p className="text-xs text-blue-500 font-medium mt-1">
                                Gasto grupal: solo podés editar tu categoría.
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Type Toggle - Disabled for group transactions */}
                {!isGroupTransaction && (
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
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin pb-40">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Descripción</label>
                            <input
                                type="text"
                                value={title}
                                disabled={isGroupTransaction}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Supermercado Coto"
                                className={`w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none font-bold ${isGroupTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Moneda</label>
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
                                            { id: 'ARS', label: 'ARS', icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                                            { id: 'USD', label: 'USD', icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                                        ]
                                    }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Monto ({currency})</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                    {currency === 'USD' ? 'u$s' : '$'}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    disabled={isGroupTransaction}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className={`w-full bg-white dark:bg-black/20 border border-border rounded-xl pl-12 pr-4 py-3 text-2xl font-black focus:ring-2 focus:ring-primary focus:outline-none ${isGroupTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </motion.div>
        </div>
    );
};

export default TransactionModal;
