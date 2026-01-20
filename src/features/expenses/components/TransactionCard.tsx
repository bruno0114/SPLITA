import React from 'react';
import { ShoppingBag, DollarSign, Edit2, Trash2, Calendar, CreditCard } from 'lucide-react';
import { Transaction, PersonalTransaction } from '@/types/index';

interface TransactionCardProps {
    transaction: Transaction | PersonalTransaction;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onEdit, onDelete, showActions = true }) => {
    // Check if it's an income (only for personal transactions)
    const isIncome = (transaction as any).type === 'income';

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
        <div className={`glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer ${isIncome ? 'border-l-4 border-l-emerald-500 shadow-sm shadow-emerald-500/10' : ''}`}>
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    {isIncome ? <DollarSign className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.date)}</span>
                        {category && (
                            <span className="flex items-center gap-1">
                                <span className="text-slate-300">•</span>
                                {category}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right flex flex-col items-end">
                    <p className={`font-black text-base md:text-lg ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(amount)}
                    </p>
                    {subtext && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">
                            {subtext}
                        </p>
                    )}
                </div>

                {/* Actions - visible on group hover or mobile always available if needed? 
                    Let's keep group hover for premium feel 
                */}
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
