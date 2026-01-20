import React, { useState } from 'react';
import {
    ShoppingBag, ShoppingCart, Coffee, Zap, Car, Home, Plane, MoreHorizontal,
    ChevronDown, Wallet, Users, LayoutGrid, ArrowRight
} from 'lucide-react';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useCategoryStats } from '../hooks/useCategoryStats';

// Map string icon names to components
const IconMap: Record<string, React.ElementType> = {
    ShoppingBag, ShoppingCart, Coffee, Zap, Car, Home, Plane, MoreHorizontal
};

const Categories: React.FC = () => {
    const [scope, setScope] = useState<string>('personal'); // 'personal' or groupId

    // Data Fetching
    const { transactions: personalTx } = usePersonalTransactions();
    const { groups } = useGroups();
    const { transactions: groupTx } = useTransactions(scope !== 'personal' ? scope : null);

    const activeTransactions = scope === 'personal' ? personalTx : groupTx;
    const { totalExpense, categories } = useCategoryStats(activeTransactions as any[]); // Type assertion needed until unification

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const selectedGroup = groups.find(g => g.id === scope);

    return (
        <div className="px-6 md:px-12 py-6 md:py-10 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Análisis de gastos</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Desglose detallado por categorías.</p>
                </div>

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
            </header>

            {/* Summary Card */}
            <div className="glass-panel rounded-[2rem] p-8 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">
                        Total gastado {scope !== 'personal' ? 'del grupo' : ''}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                            {formatCurrency(totalExpense)}
                        </span>
                        <span className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium">ARS</span>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => {
                    const Icon = IconMap[cat.icon] || LayoutGrid;

                    return (
                        <div key={cat.id} className="glass-panel p-6 rounded-2xl group hover:border-primary/20 transition-all cursor-pointer">
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

                                <p className="text-xs text-slate-500 mt-3 font-medium">
                                    {cat.count} movimientos
                                </p>
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
