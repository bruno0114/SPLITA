import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { ArrowLeft, Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { getCategoryConfig } from '@/lib/constants';
import { PERSONAL_TRANSACTIONS_MOCK } from '@/features/dashboard/hooks/usePersonalTransactions';

// Reusing TransactionCard logic or importing it?
// Since TransactionCard is inside PersonalFinance.tsx (not exported), I should probably duplicate it lightly or refactor.
// For now, I'll create a simple list item here to avoid modifying PersonalFinance.tsx and risking refactor bugs.

const CategoryDetail: React.FC = () => {
    const { scope, categoryId } = useParams<{ scope: string; categoryId: string }>();
    const navigate = useNavigate();

    // Data Fetching
    const { transactions: personalTx } = usePersonalTransactions();
    const { transactions: groupTx } = useTransactions(scope !== 'personal' ? scope : null);
    const { groups } = useGroups();

    const activeTransactions = scope === 'personal' ? personalTx : groupTx;

    // Filter by category
    // categoryId is the KEY/ID from the URL.
    // The transactions store category NAME (string).
    // We need to match based on getCategoryConfig logic or check if we pass the raw name transparently.
    // In Categories.tsx, we grouped by `label`.
    // If I pass the label as ID, I can filter by that.

    // Let's assume the URL param is the 'key' or 'label'.
    // In Categories.tsx loop: key={cat.id} -> cat.id is the normalized key from map?
    // Wait, in useCategoryStats: 
    // categoryMap.set(key, ...) where key = config.label.
    // So cat.id = 'Supermercado', 'Compras', etc. (Label).

    // So filtering:
    const categoryTransactions = activeTransactions.filter(t => {
        const config = getCategoryConfig(t.category || 'varios');
        return config.label === categoryId; // Matching by Label
    });

    const categoryConfig = Object.values(getCategoryConfig(categoryId || '')).length > 0 ? getCategoryConfig(categoryId || '') : null;
    // Actually getCategoryConfig returns the object directly.
    // If categoryId is 'Supermercado', getCategoryConfig('Supermercado') returns the config.
    const config = getCategoryConfig(categoryId || 'varios');

    // Calculate total for this view
    const totalAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const isActiveScopePersonal = scope === 'personal';
    const scopeName = isActiveScopePersonal ? 'Finanzas Personales' : groups.find(g => g.id === scope)?.name || 'Grupo';

    // Helper for date formatting
    const formatDate = (dateStr: string) => {
        // Handle different date formats if necessary
        // Personal: ISO string
        // Group: locale string (es-AR)
        return dateStr;
    };

    return (
        <div className="px-6 md:px-12 py-6 md:py-10 pb-32">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/categories')}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <span>{scopeName}</span>
                        <span>•</span>
                        <span>{categoryTransactions.length} movimientos</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className={`${config.color}`}>{config.label}</span>
                    </h2>
                </div>
            </div>

            {/* Summary Card for Category */}
            <div className={`glass-panel p-6 rounded-2xl mb-8 flex items-center justify-between relative overflow-hidden`}>
                <div className={`absolute inset-0 ${config.bg} opacity-20`}></div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Categoría</p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
                </div>
                <div className={`relative z-10 size-16 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center`}>
                    {/* We rely on the parent or mapping to render icon, or just generic */}
                    <ShoppingBag className="w-8 h-8" />
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {categoryTransactions.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No hay movimientos en esta categoría.</p>
                ) : (
                    categoryTransactions.map((tx) => (
                        <div key={tx.id} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{tx.title || tx.merchant || 'Sin título'}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatDate(tx.date)}</span>
                                        {tx.payer && <span className="text-blue-500">• Pagado por {tx.payer.name}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(tx.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoryDetail;
