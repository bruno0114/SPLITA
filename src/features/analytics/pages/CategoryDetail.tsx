import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonalTransactions } from '@/features/dashboard/hooks/usePersonalTransactions';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import {
    ArrowLeft, Calendar, DollarSign, ShoppingBag,
    ChevronLeft, ChevronRight, Filter, Plus,
    Search, X, Calendar as CalendarIcon, ArrowUpDown, Loader2
} from 'lucide-react';
import { resolveCategoryId, getCategoryConfigById, isValidCategoryId } from '@/lib/category-resolver';
import { isInDateRange } from '@/lib/date-utils';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import TransactionModal from '@/features/expenses/components/TransactionModal';
import BulkActionsBar from '@/features/expenses/components/BulkActionsBar';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';
import { useToast } from '@/context/ToastContext';
import PremiumToggleGroup from '@/components/ui/PremiumToggleGroup';
import { Transaction, PersonalTransaction, AppRoute } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';

const ITEMS_PER_PAGE = 8;

const CategoryDetail: React.FC = () => {
    const { scope, categoryId } = useParams<{ scope: string; categoryId: string }>();
    const navigate = useNavigate();
    const { currency, exchangeRate } = useCurrency();

    // Data Fetching
    const { fullTransactions: personalTx, loading: personalLoading } = usePersonalTransactions();
    const { transactions: groupTx, loading: groupLoading } = useTransactions(scope !== 'personal' ? scope : null);
    const { groups } = useGroups();
    const { categories } = useCategories();

    // Determine loading state based on current scope
    const isLoading = scope === 'personal' ? personalLoading : groupLoading;

    // Filters State - Start with no date filters to show all transactions
    // User can apply date range filters via the filter panel
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        isOpen: boolean;
        id: string | 'MASS_DELETE' | null;
        isGroup?: boolean;
        groupName?: string;
    }>({ isOpen: false, id: null });
    const { showToast } = useToast();

    const activeTransactions = scope === 'personal' ? personalTx : groupTx;

    const normalizeCategory = (input: string) => input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    const personalFuncs = usePersonalTransactions();
    const groupFuncs = useTransactions(scope !== 'personal' ? scope : null);

    // Filter and Paginate logic
    const {
        paginatedTransactions,
        allFiltered,
        totalFiltered,
        totalAmount,
        totalPages,
        config
    } = useMemo(() => {
        // 1. Initial filter by category ID (not label) for consistency with useCategoryStats
        // The categoryId from URL is now expected to be the canonical category ID
        const isSystemCategory = isValidCategoryId(categoryId || '');

        let filtered = activeTransactions.filter(t => {
            if (!categoryId) return false;
            if (isSystemCategory) {
                const resolvedId = resolveCategoryId(t.category);
                return resolvedId === categoryId;
            }
            if (!t.category) return false;
            return normalizeCategory(t.category) === normalizeCategory(categoryId);
        });

        // 2. Search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                (t as any).title?.toLowerCase().includes(lowerSearch) ||
                (t as any).merchant?.toLowerCase().includes(lowerSearch)
            );
        }

        // 3. Date range filter - Use canonical date utilities
        filtered = filtered.filter(t => isInDateRange(t.date, dateFrom, dateTo));

        // 4. Calculate Stats
        const expenses = filtered.filter(t => (t as any).type === 'expense' || !(t as any).type);
        const incomes = filtered.filter(t => (t as any).type === 'income');
        const expenseAmount = expenses.reduce((sum, t) => {
            const amt = Number(t.amount);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
        const incomeAmount = incomes.reduce((sum, t) => {
            const amt = Number(t.amount);
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
        const amount = expenseAmount > 0 ? expenseAmount : incomeAmount;
        const totalCount = filtered.length;
        const pages = Math.ceil(totalCount / ITEMS_PER_PAGE);

        // 5. Paginate
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

        // 6. Get Config by ID
        const catConfig = getCategoryConfigById(categoryId || 'varios');
        const customConfig = categories.find(c => !c.is_system && normalizeCategory(c.name) === normalizeCategory(categoryId || ''));
        const resolvedConfig = customConfig ? {
            label: customConfig.name,
            icon: customConfig.icon,
            color: customConfig.color,
            bg: customConfig.bg_color
        } : catConfig;

        return {
            paginatedTransactions: paginated,
            allFiltered: filtered,
            totalFiltered: totalCount,
            totalAmount: amount,
            totalPages: pages,
            config: resolvedConfig
        };
    }, [activeTransactions, categoryId, searchTerm, dateFrom, dateTo, currentPage, categories]);

    const formatCurrency = (val: number) => {
        const isUSD = currency === 'USD';
        const displayVal = isUSD ? val / exchangeRate : val;
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: isUSD ? 'USD' : 'ARS',
            maximumFractionDigits: isUSD ? 2 : 0
        }).format(displayVal);
    };

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

    const handleDeleteClick = (tx: any) => {
        setDeleteConfirm({
            isOpen: true,
            id: tx.id,
            isGroup: tx.is_group || !isActiveScopePersonal,
            groupName: tx.merchant || tx.title || 'gasto compartido'
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm.id) return;

        let error;
        if (isActiveScopePersonal) {
            const res = await personalFuncs.deleteTransaction(deleteConfirm.id);
            error = res.error;
        } else {
            const res = await groupFuncs.deleteTransaction(deleteConfirm.id);
            error = res.error;
        }

        if (error) {
            showToast('Error al eliminar', 'error');
        } else {
            showToast('Movimiento eliminado', 'success');
        }
        setDeleteConfirm({ isOpen: false, id: null });
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

    const handleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleMassDelete = async () => {
        setDeleteConfirm({ isOpen: true, id: 'MASS_DELETE' });
    };

    const executeMassDelete = async () => {
        const table = isActiveScopePersonal ? 'personal_transactions' : 'transactions';
        const { error } = await supabase
            .from(table)
            .delete()
            .in('id', selectedIds);

        if (!error) {
            showToast(`${selectedIds.length} movimientos eliminados`, 'success');
            setSelectedIds([]);
            isActiveScopePersonal ? personalFuncs.refreshTransactions() : groupFuncs.refreshTransactions();
        } else {
            showToast('Error al eliminar movimientos', 'error');
        }
        setDeleteConfirm({ isOpen: false, id: null });
    };

    const handleMassMove = async (newCategoryId: string) => {
        const table = isActiveScopePersonal ? 'personal_transactions' : 'transactions';
        const { error } = await supabase
            .from(table)
            .update({ category: newCategoryId })
            .in('id', selectedIds);

        if (!error) {
            setSelectedIds([]);
            isActiveScopePersonal ? personalFuncs.refreshTransactions() : groupFuncs.refreshTransactions();
            showToast(`${selectedIds.length} movimientos re-asignados`, 'success');
        } else {
            showToast('Error al re-asignar movimientos', 'error');
        }
    };

    // Show loader while fetching data
    if (isLoading && activeTransactions.length === 0) {
        return (
            <div className="flex flex-col h-[70vh] w-full items-center justify-center bg-background gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Cargando movimientos...</p>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-12 py-6 md:py-10 pb-32 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(AppRoute.CATEGORIES)}
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
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar comercio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <PremiumDatePicker
                                    startDate={dateFrom}
                                    endDate={dateTo}
                                    onStartDateChange={setDateFrom}
                                    onEndDateChange={setDateTo}
                                />
                                {(searchTerm || dateFrom || dateTo) && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                                        className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-white/50 dark:bg-black/20 rounded-xl border border-border"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction List Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de movimientos</div>
                {allFiltered.length > 0 && (
                    <button
                        onClick={() => {
                            if (selectedIds.length === allFiltered.length) {
                                setSelectedIds([]);
                            } else {
                                setSelectedIds(allFiltered.map(tx => tx.id));
                            }
                        }}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all"
                    >
                        {selectedIds.length === allFiltered.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                )}
            </div>

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
                                    onDelete={() => handleDeleteClick(tx)}
                                    onSelect={handleSelect}
                                    onChangeCategory={() => setSelectedIds([tx.id])}
                                    isSelected={selectedIds.includes(tx.id)}
                                    contextName={(tx as any).is_group ? `Split de ${(tx as any).payment_method}` : (isActiveScopePersonal ? 'Personal' : (groups.find(g => g.id === scope)?.name || 'Grupo'))}
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

            <AnimatePresence>
                {showModal && (
                    <TransactionModal
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                        initialData={editingTx}
                        defaultCategory={config.label}
                    />
                )}
            </AnimatePresence>

            <BulkActionsBar
                selectedCount={selectedIds.length}
                onClear={() => setSelectedIds([])}
                onDelete={handleMassDelete}
                onMove={handleMassMove}
            />

            <PremiumConfirmModal
                isOpen={deleteConfirm.isOpen}
                title={deleteConfirm.id === 'MASS_DELETE' ? 'Eliminar movimientos' : (deleteConfirm.isGroup ? 'Eliminar movimiento compartido' : 'Eliminar movimiento')}
                message={
                    deleteConfirm.id === 'MASS_DELETE'
                        ? (() => {
                            if (selectedIds.length === 1) {
                                const tx = activeTransactions.find(t => t.id === selectedIds[0]);
                                if (tx) {
                                    const isGroup = (tx as any).is_group || !isActiveScopePersonal;
                                    const name = (tx as any).merchant || (tx as any).title || 'gasto compartido';
                                    return isGroup
                                        ? `¿Estás seguro de que querés eliminar este movimiento compartido de "${name}"? Se borrará de tu historial. Esta acción no se puede deshacer.`
                                        : '¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.';
                                }
                            }
                            return `¿Estás seguro de que querés eliminar estos ${selectedIds.length} movimientos? Esta acción no se puede deshacer.${!isActiveScopePersonal ? ' Afectará los balances del grupo.' : ''}`;
                        })()
                        : (deleteConfirm.isGroup
                            ? `¿Estás seguro de que querés eliminar este movimiento compartido de "${deleteConfirm.groupName}"? Se borrará de tu historial. Esta acción no se puede deshacer.`
                            : '¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.'
                        )
                }
                confirmLabel="Eliminar"
                onConfirm={deleteConfirm.id === 'MASS_DELETE' ? executeMassDelete : handleConfirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
            />
        </div>
    );
};

export default CategoryDetail;
