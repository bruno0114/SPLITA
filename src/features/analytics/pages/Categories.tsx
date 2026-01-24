import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, ShoppingCart, Coffee, Zap, Car, Home, Plane, MoreHorizontal,
    ChevronDown, Wallet, Users, LayoutGrid, ArrowRight
} from 'lucide-react';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useCategoryStats } from '../hooks/useCategoryStats';
import { useCategories } from '../hooks/useCategories';
import CategoryManagerModal from '@/features/analytics/components/CategoryManagerModal';
import { Settings2 } from 'lucide-react';
import { AppRoute } from '@/types/index';
import { useCurrency } from '@/context/CurrencyContext';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import { AnalyticsTransaction } from '../hooks/useCategoryStats';
import SkeletonBlock from '@/components/ui/Skeleton';

// Map string icon names to components
const IconMap: Record<string, React.ElementType> = {
    ShoppingBag, ShoppingCart, Coffee, Zap, Car, Home, Plane, MoreHorizontal
};

const Categories: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scope, setScope] = useState<string>('personal'); // 'personal' or groupId
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { currency, exchangeRate } = useCurrency();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const scopeParam = params.get('scope');
        if (scopeParam && scopeParam !== scope) {
            setScope(scopeParam);
        }
    }, [location.search, scope]);

    // Data Fetching
    const { fullTransactions: personalTx, loading: personalLoading } = usePersonalTransactions();
    const { groups } = useGroups();
    const { transactions: groupTx, loading: groupLoading } = useTransactions(scope !== 'personal' ? scope : null);
    const { categories: customCategories, refresh: refreshCategories } = useCategories();

    useEffect(() => {
        refreshCategories();
    }, [location.key, refreshCategories]);

    // Determine loading state based on current scope
    const isLoading = scope === 'personal' ? personalLoading : groupLoading;

    const activeTransactions = scope === 'personal' ? personalTx : groupTx;



    // Show ALL transactions by default - no auto-filtering
    // User can apply date filters explicitly if needed
    const allTransactions = useMemo((): AnalyticsTransaction[] => {
        return activeTransactions.map(t => ({
            id: t.id,
            amount: t.amount,
            category: t.category,
            date: t.date,
            type: (t as any).type as 'income' | 'expense' | undefined
        }));
    }, [activeTransactions]);

    const { totalExpense, categories } = useCategoryStats(allTransactions, customCategories);

    const formatCurrency = (val: number) => {
        const isUSD = currency === 'USD';
        const displayVal = isUSD ? val / exchangeRate : val;
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: isUSD ? 'USD' : 'ARS',
            maximumFractionDigits: isUSD ? 2 : 0
        }).format(displayVal);
    };

    const selectedGroup = groups.find(g => g.id === scope);

    // Show loader while fetching data
    if (isLoading && activeTransactions.length === 0) {
        return (
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="space-y-3">
                    <SkeletonBlock className="h-8 w-56" />
                    <SkeletonBlock className="h-4 w-72" />
                </div>

                <SkeletonBlock className="h-32 rounded-[2rem]" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonBlock className="h-40" />
                    <SkeletonBlock className="h-40" />
                    <SkeletonBlock className="h-40" />
                    <SkeletonBlock className="h-40" />
                    <SkeletonBlock className="h-40" />
                    <SkeletonBlock className="h-40" />
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-12 py-6 md:py-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Análisis de gastos</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Desglose por categoría.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="p-3 rounded-xl bg-surface border border-border text-slate-500 hover:text-primary hover:border-primary/50 transition-all flex items-center gap-2 shadow-sm"
                        title="Gestionar Categorías"
                    >
                        <Settings2 className="w-5 h-5" />
                        <span className="text-sm font-bold hidden md:inline">Gestionar</span>
                    </button>

                    {/* Scope Switcher */}
                    <PremiumDropdown
                        value={scope}
                        onChange={setScope}
                        groups={[
                            {
                                title: 'Cuenta Personal',
                                options: [{ id: 'personal', label: 'Finanzas Personales', icon: Wallet, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }]
                            },
                            {
                                title: 'Grupos',
                                options: groups.map(g => ({ id: g.id, label: g.name, icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10' }))
                            }
                        ]}
                        className="min-w-[220px]"
                    />
                </div>

                <AnimatePresence>
                    {isModalOpen && (
                        <CategoryManagerModal isOpen={isModalOpen} onClose={() => {
                            setIsModalOpen(false);
                            refreshCategories();
                        }} />
                    )}
                </AnimatePresence>
            </header>

            {/* Summary Card */}
            <div className="glass-panel rounded-[2rem] p-8 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
                        Total gastado {scope !== 'personal' ? 'del grupo' : ''}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                            <AnimatedPrice amount={totalExpense} showCode />
                        </span>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                    const Icon = IconMap[cat.icon] || LayoutGrid;

                    return (
                        <div
                            key={cat.id}
                            onClick={() => navigate(`/categorias/${scope}/${cat.id}`)}
                            className="glass-panel p-6 rounded-2xl group hover:border-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center ${cat.bg} ${cat.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 text-slate-400 group-hover:text-primary transition-colors">
                                    <span className="text-xs font-bold">Ver</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{cat.label}</h4>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(cat.amount)}</span>
                                    <span className="text-sm font-bold text-slate-500">{cat.percentage}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${cat.bg.replace('/10', '')} transition-all duration-1000 ease-out`} // Hack to get solid color from bg prop
                                        style={{ width: `${cat.percentage}%`, backgroundColor: 'currentColor' }} // Fallback or use CSS variable if possible, but cat.bg is confusing class. 
                                    // Better approach: config only gave us text color and bg-opacity. 
                                    // Let's use the text color class for background here if possible or just map colors in CSS. 
                                    // Since Tailwind classes are strings, we can't extract value easily.
                                    // Let's just use primary as fallback or try to derive.
                                    >
                                        <div className={`h-full w-full ${cat.color.replace('text-', 'bg-')}`}></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {cat.expenseCount > 0 && (
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                            {cat.expenseCount} {cat.expenseCount === 1 ? 'Gasto' : 'Gastos'}
                                        </span>
                                    )}
                                    {cat.incomeCount > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            {cat.incomeCount} {cat.incomeCount === 1 ? 'Ingreso' : 'Ingresos'}
                                        </span>
                                    )}
                                    {cat.expenseCount === 0 && cat.incomeCount === 0 && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">
                                            Sin movimientos
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-slate-100 dark:bg-slate-800 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutGrid className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sin datos disponibles</h3>
                    <p className="text-slate-500">No hay gastos registrados en esta categoría o período.</p>
                </div>
            )}
        </div>
    );
};

export default Categories;
