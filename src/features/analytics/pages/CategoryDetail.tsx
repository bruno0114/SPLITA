import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import {
    ArrowLeft, Calendar, DollarSign, ShoppingBag,
    ChevronLeft, ChevronRight, Filter, Plus,
    Search, X, Calendar as CalendarIcon, ArrowUpDown
} from 'lucide-react';
import { getCategoryConfig } from '@/lib/constants';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import TransactionModal from '@/features/expenses/components/TransactionModal';
import { Transaction, PersonalTransaction } from '@/types/index';

const ITEMS_PER_PAGE = 8;

const CategoryDetail: React.FC = () => {
    const { scope, categoryId } = useParams<{ scope: string; categoryId: string }>();
    const navigate = useNavigate();

    // Data Fetching
    const { transactions: personalTx } = usePersonalTransactions();
    const { transactions: groupTx } = useTransactions(scope !== 'personal' ? scope : null);
    const { groups } = useGroups();
    const { categories } = useCategories();

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);

    const activeTransactions = scope === 'personal' ? personalTx : groupTx;

    const personalFuncs = usePersonalTransactions();
    const groupFuncs = useTransactions(scope !== 'personal' ? scope : null);

    // Filter and Paginate logic
    const {
        paginatedTransactions,
        totalFiltered,
        totalAmount,
        totalPages,
        config
    } = useMemo(() => {
        // 1. Initial filter by category label
        let filtered = activeTransactions.filter(t => {
            const catConfig = getCategoryConfig(t.category || 'varios');
            return catConfig.label === categoryId;
        });

        // 2. Search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                (t as any).title?.toLowerCase().includes(lowerSearch) ||
                (t as any).merchant?.toLowerCase().includes(lowerSearch)
            );
        }

        // 3. Date range filter
        if (dateFrom) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(dateTo));
        }

        // 4. Calculate Stats
        const amount = filtered.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalCount = filtered.length;
        const pages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        // 5. Paginate
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

        // 6. Get Config (Try DB first, then assets)
        const catConfig = getCategoryConfig(categoryId || 'varios');

        return {
            paginatedTransactions: paginated,
            totalFiltered: totalCount,
            totalAmount: amount,
            totalPages: pages,
            config: catConfig
        };
    }, [activeTransactions, categoryId, searchTerm, dateFrom, dateTo, currentPage]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const isActiveScopePersonal = scope === 'personal';
    const scopeName = isActiveScopePersonal ? 'Finanzas Personales' : groups.find(g => g.id === scope)?.name || 'Grupo';

    // Helper for date formatting
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    const handleEdit = (tx: any) => {
        setEditingTx(tx);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que querés eliminar este movimiento?')) return;

        if (isActiveScopePersonal) {
            await personalFuncs.deleteTransaction(id);
        } else {
            await groupFuncs.deleteTransaction(id);
        }
    };

    const handleSave = async (data: any) => {
        if (isActiveScopePersonal) {
            if (editingTx) {
                return await personalFuncs.updateTransaction(editingTx.id, data);
            } else {
                return await personalFuncs.addTransaction(data);
            }
        } else {
            // Group transactions need splitBetween
            // For now, let's keep all members splitting or current logic
            const members = groups.find(g => g.id === scope)?.members.map(m => m.id) || [];
            if (editingTx) {
                return await groupFuncs.updateTransaction(editingTx.id, { ...data, splitBetween: members });
            } else {
                return await groupFuncs.addTransaction({ ...data, splitBetween: members });
            }
        }
    };

    return (
        <div className="px-6 md:px-12 py-6 md:py-10 pb-32 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/categories')}
                        className="p-3 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            <span>{scopeName}</span>
                            <span>•</span>
                            <span>{totalFiltered} movimientos</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className={`${config.color}`}>{config.label}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${showFilters ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-slate-600 hover:border-primary/50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
                    </button>
                    <button
                        onClick={() => { setEditingTx(null); setShowModal(true); }}
                        className="p-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent transition-all flex items-center gap-2 font-bold text-sm hover:scale-105"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir
                    </button>
                </div>
            </div>

            {/* Quick Stats & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Summary Card */}
                <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex items-center justify-between">
                    <div className={`absolute inset-0 ${config.bg} opacity-20`}></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gasto Total</p>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                            <AnimatedPrice amount={totalAmount} />
                        </div>
                    </div>
                    <div className={`relative z-10 size-14 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shadow-lg`}>
                        <ShoppingBag className="w-7 h-7" />
                    </div>
                </div>

                {/* Search & Filters Expands */}
                <div className={`lg:col-span-2 transition-all duration-300 ${showFilters ? 'opacity-100' : 'opacity-0 invisible h-0 overflow-hidden'}`}>
                    <div className="glass-panel p-5 rounded-3xl h-full flex flex-col justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar comercio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <span className="text-slate-400">-</span>
                                <div className="relative flex-1">
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                {(searchTerm || dateFrom || dateTo) && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                                        className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-4">
                {paginatedTransactions.length === 0 ? (
                    <div className="glass-panel p-16 rounded-3xl text-center">
                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sin resultados</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">No encontramos movimientos que coincidan con tus filtros.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                            className="mt-6 text-primary font-bold text-sm"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3">
                            {paginatedTransactions.map((tx) => (
                                <TransactionCard
                                    key={tx.id}
                                    transaction={tx}
                                    onEdit={() => handleEdit(tx)}
                                    onDelete={() => handleDelete(tx.id)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-10">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-3 rounded-xl bg-surface border border-border text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`size-10 rounded-xl font-bold text-sm transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border border-border text-slate-500 hover:border-primary/30'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-3 rounded-xl bg-surface border border-border text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/50 transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <TransactionModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    initialData={editingTx}
                    defaultCategory={config.label}
                />
            )}
        </div>
    );
};

export default CategoryDetail;
