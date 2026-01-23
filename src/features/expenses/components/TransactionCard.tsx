import { ShoppingBag, DollarSign, Edit2, Trash2, Calendar, Repeat, Hash, CheckCircle2, Circle, LayoutGrid, User, Users } from 'lucide-react';
import { Transaction, PersonalTransaction } from '@/types/index';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

interface TransactionCardProps {
    transaction: Transaction | PersonalTransaction;
    onEdit?: () => void;
    onDelete?: () => void;
    onSelect?: (id: string) => void;
    onChangeCategory?: () => void;
    isSelected?: boolean;
    showActions?: boolean;
    contextName?: string; // e.g. "Personal" or Group Name
}

const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
    onEdit,
    onDelete,
    onSelect,
    onChangeCategory,
    isSelected = false,
    showActions = true,
    contextName
}) => {
    // Check if it's an income (only for personal transactions)
    const isIncome = (transaction as any).type === 'income';
    const isRecurring = (transaction as any).is_recurring;
    const installments = (transaction as any).recurring_pattern || (transaction as any).installments;



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

    // Determine context icon
    const ContextIcon = contextName?.toLowerCase().includes('personal') ? User : Users;

    return (
        <div
            onClick={() => onSelect?.(transaction.id)}
            className={`glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer border-l-4 ${isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : isIncome ? 'border-l-emerald-500' : 'border-l-transparent'}`}
        >
            <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Multi-select Toggle */}
                {onSelect && (
                    <div className={`transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isSelected ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary blur-md opacity-20 animate-pulse" />
                                <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10 relative z-10" />
                            </div>
                        ) : (
                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                    </div>
                )}

                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {isIncome ? <DollarSign className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{title}</p>
                        {isRecurring && <Repeat className="w-3 h-3 text-blue-500 animate-pulse-slow shrink-0" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(transaction.date)}</span>
                        </div>
                        <span className="text-slate-300 text-[10px]">•</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                            {category}
                        </div>

                        {contextName && (
                            <>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm border truncate max-w-[100px] ${contextName.toLowerCase().includes('split') ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50 dark:border-white/5'}`}>
                                    <ContextIcon className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{contextName.replace('Split de ', '')}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 pl-[4.5rem] md:pl-0">
                <div className="text-left md:text-right flex flex-col md:items-end">
                    <p className={`font-black text-base md:text-lg flex items-center gap-1.5 ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? '+' : '-'}
                        <AnimatedPrice
                            amount={amount}
                            originalAmount={transaction.original_amount}
                            originalCurrency={transaction.original_currency}
                        />
                        {installments && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 min-w-[20px] rounded-full bg-primary/10 text-primary text-[9px] font-black ring-1 ring-primary/20">
                                {installments.includes('/') ? installments : <><Hash className="w-2.5 h-2.5 mr-0.5" />{installments}</>}
                            </span>
                        )}
                    </p>
                    {subtext && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px] md:max-w-none">
                            {subtext}
                        </p>
                    )}
                </div>

                {showActions && (onEdit || onDelete || onChangeCategory) && (
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {onChangeCategory && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onChangeCategory(); }}
                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                title="Cambiar Categoría"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        )}
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
