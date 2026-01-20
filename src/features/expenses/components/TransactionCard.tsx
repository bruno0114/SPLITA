import { ShoppingBag, DollarSign, Edit2, Trash2, Calendar, Repeat, Hash, CheckCircle2, Circle, LayoutGrid } from 'lucide-react';
import { Transaction, PersonalTransaction } from '@/types/index';

interface TransactionCardProps {
    transaction: Transaction | PersonalTransaction;
    onEdit?: () => void;
    onDelete?: () => void;
    onSelect?: (id: string) => void;
    isSelected?: boolean;
    showActions?: boolean;
    contextName?: string; // e.g. "Personal" or Group Name
}

const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    onEdit,
    onDelete,
    onSelect,
    isSelected = false,
    showActions = true,
    contextName
}) => {
    // Check if it's an income (only for personal transactions)
    const isIncome = (transaction as any).type === 'income';
    const isRecurring = (transaction as any).is_recurring;
    const installments = (transaction as any).recurring_pattern || (transaction as any).installments;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) return 'Hoy';
            if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
            return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        } catch (e) {
            return dateStr;
        }
    };

    const title = (transaction as any).title || (transaction as any).merchant || 'Sin título';
    const category = transaction.category || 'Varios';
    const amount = Number(transaction.amount);
    const subtext = (transaction as any).payment_method || ((transaction as any).payer?.name ? `Pagado por ${(transaction as any).payer.name}` : '');

    return (
        <div
            onClick={() => onSelect?.(transaction.id)}
            className={`glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer border-l-4 ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : isIncome ? 'border-l-emerald-500' : 'border-l-transparent'}`}
        >
            <div className="flex items-center gap-4">
                {/* Multi-select Toggle */}
                {onSelect && (
                    <div className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                        ) : (
                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                    </div>
                )}

                <div className={`size-12 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {isIncome ? <DollarSign className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
                        {isRecurring && <Repeat className="w-3 h-3 text-blue-500 animate-pulse-slow" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(transaction.date)}</span>
                        </div>
                        <span className="text-slate-300 text-[10px]">•</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {category}
                        </div>

                        {contextName && (
                            <>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <div className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                    {contextName}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right flex flex-col items-end">
                    <p className={`font-black text-base md:text-lg flex items-center gap-1.5 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(amount)}
                        {installments && (
                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500">
                                {installments.includes('/') ? installments : <Hash className="w-2.5 h-2.5" />}
                            </span>
                        )}
                    </p>
                    {subtext && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">
                            {subtext}
                        </p>
                    )}
                </div>

                {showActions && (onEdit || onDelete) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionCard;
