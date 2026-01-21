import React, { useState } from 'react';
import { Plus, ArrowDown, ArrowUp, Users, ShoppingBag, DollarSign, Car, Utensils, Loader2, X, Receipt, Edit2, Trash2, AlertTriangle, Calendar, Filter, BarChart3 } from 'lucide-react';
import { usePersonalTransactions, TransactionFilters } from '../hooks/usePersonalTransactions';
import { PersonalTransaction } from '@/types/index';
import ProjectionCard from '../components/ProjectionCard';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import TransactionModal from '@/features/expenses/components/TransactionModal';
import BulkActionsBar from '@/features/expenses/components/BulkActionsBar';
import PremiumToggleGroup from '@/components/ui/PremiumToggleGroup';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';
import ExpenditureEvolutionChart from '../components/ExpenditureEvolutionChart';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import SubscriptionModal from '../components/SubscriptionModal';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';
import { useToast } from '@/context/ToastContext';

const PersonalFinance: React.FC = () => {
  const {
    transactions,
    summary,
    loading,
    loadingMore,
    hasMore,
    filters,
    setFilters,
    loadMore,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactions,
    refreshTransactions
  } = usePersonalTransactions();

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [activeType, setActiveType] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | 'MASS_DELETE' | null;
    isGroup?: boolean;
    groupName?: string;
  }>({ isOpen: false, id: null });
  const { showToast } = useToast();

  const filteredTransactions = transactions.filter(tx => {
    if (activeType === 'all') return true;
    return tx.type === activeType;
  });

  const observerRef = React.useRef<HTMLDivElement>(null);

  // Infinite Scroll Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const getBalanceChange = () => {
    if (summary.totalIncome === 0) return 0;
    return Math.round((summary.balance / summary.totalIncome) * 100);
  };

  const handleEdit = (tx: PersonalTransaction) => {
    setEditingTransaction(tx);
    setShowModal(true);
  };

  const handleDeleteClick = (tx: PersonalTransaction) => {
    setDeleteConfirm({
      isOpen: true,
      id: tx.id,
      isGroup: tx.is_group,
      groupName: tx.payment_method // Split transactions store group name here in Personal view
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.id) {
      const { error } = await deleteTransaction(deleteConfirm.id);
      if (error) {
        showToast('Error al eliminar el movimiento', 'error');
      } else {
        showToast('Movimiento eliminado', 'success');
      }
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleSave = async (data: any) => {
    if (editingTransaction) {
      return await updateTransaction(editingTransaction.id, data);
    } else {
      return await addTransaction(data);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMassDelete = async () => {
    if (selectedIds.length > 0) {
      setDeleteConfirm({ isOpen: true, id: 'MASS_DELETE' });
    }
  };

  const executeMassDelete = async () => {
    const { error } = await deleteTransactions(selectedIds);

    if (!error) {
      showToast(`${selectedIds.length} movimientos eliminados`, 'success');
      setSelectedIds([]);
    } else {
      showToast('Error al eliminar movimientos', 'error');
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const handleMassMove = async (newCategoryId: string) => {
    const { error } = await supabase
      .from('personal_transactions')
      .update({ category: newCategoryId })
      .in('id', selectedIds);

    if (!error) {
      setSelectedIds([]);
      refreshTransactions();
      showToast(`${selectedIds.length} movimientos re-asignados`, 'success');
    } else {
      showToast('Error al re-asignar movimientos', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-6 md:py-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Finanzas personales</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestioná tus ahorros y gastos individuales.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-gradient px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Cargar movimiento
        </button>
      </header>

      {/* Main Balance Card */}
      <div className="glass-panel rounded-[2rem] p-6 md:p-8 mb-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-gradient opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"></div>
        <div className="relative z-10">
          <p className="text-blue-600 dark:text-blue-400 text-sm font-bold uppercase tracking-widest mb-2">Tu balance general</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              <AnimatedPrice amount={summary.balance} showCode />
            </span>
          </div>
          <div className="mt-6 flex gap-4">
            {summary.balance !== 0 && (
              <div className={`flex items-center gap-2 ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'} px-3 py-1 rounded-full text-xs font-bold border`}>
                {summary.balance >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {summary.balance >= 0 ? '+' : ''}{getBalanceChange()}% este mes
              </div>
            )}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="glass-panel p-5 md:p-6 rounded-2xl flex flex-row md:flex-col items-center md:items-start gap-4 group hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all">
          <div className="size-10 md:size-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ArrowDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Mis ingresos</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              <AnimatedPrice amount={summary.totalIncome} />
            </p>
          </div>
        </div>
        <div className="glass-panel p-5 md:p-6 rounded-2xl flex flex-row md:flex-col items-center md:items-start gap-4 group hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all">
          <div className="size-10 md:size-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
            <ArrowUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Gastos propios</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">{formatCurrency(summary.totalExpenses)}</p>
          </div>
        </div>
        <div className="glass-panel p-5 md:p-6 rounded-2xl flex flex-row md:flex-col items-center md:items-start gap-4 group hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all">
          <div className="size-10 md:size-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Movimientos</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Chart & Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2">
          <ExpenditureEvolutionChart
            transactions={transactions}
            onUpgrade={() => setShowPremiumModal(true)}
          />
        </div>
        <div className="lg:col-span-1">
          <ProjectionCard currentSpent={summary.totalExpenses} />
        </div>
      </div>

      {/* Transactions Section */}
      <section className="pb-24">
        {/* Filters Bar */}
        <div className="glass-panel rounded-3xl p-6 mb-8 border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/20 relative z-30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <PremiumToggleGroup
                id="type-filter"
                options={[
                  { label: 'Todos', value: 'all' },
                  { label: 'Gastos', value: 'expense', icon: ArrowUp },
                  { label: 'Ingresos', value: 'income', icon: ArrowDown },
                ]}
                value={[activeType]}
                onChange={(vals) => {
                  if (vals.length > 0) setActiveType(vals[0]);
                  else setActiveType('all');
                }}
                multi={false}
              />

              {/* 
              <PremiumDatePicker
                startDate={filters.startDate || ''}
                endDate={filters.endDate || ''}
                onStartDateChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))}
                onEndDateChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))}
              />
              */}
            </div>

            <div className="flex items-center gap-4">
              {loading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              {filteredTransactions.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedIds.length === filteredTransactions.length) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(filteredTransactions.map(tx => tx.id));
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20"
                >
                  {selectedIds.length === filteredTransactions.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Movimientos</h3>
            {loading && <div className="size-2 rounded-full bg-primary animate-ping" />}
          </div>
        </div>

        {filteredTransactions.length === 0 && !loading ? (
          <div className="glass-panel rounded-[2rem] p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-gradient opacity-[0.03] animate-pulse" />
            <div className="relative z-10">
              <div className="size-20 rounded-full bg-slate-100 dark:bg-white/5 mx-auto mb-6 flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nada por aquí</h4>
              <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">No encontramos movimientos con los filtros seleccionados o todavía no cargaste nada.</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-3 bg-blue-gradient px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nueva Transacción
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                >
                  <TransactionCard
                    transaction={tx}
                    onEdit={() => handleEdit(tx)}
                    onDelete={() => handleDeleteClick(tx)}
                    onSelect={handleSelect}
                    isSelected={selectedIds.includes(tx.id)}
                    contextName={tx.is_group ? `Split de ${tx.payment_method}` : 'Personal'}
                    onChangeCategory={() => handleSelect(tx.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Infinite Scroll Sentinel */}
            <div ref={observerRef} className="py-12 flex flex-col items-center justify-center gap-4">
              <AnimatePresence>
                {loadingMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex gap-1.5">
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 rounded-full bg-blue-500" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 rounded-full bg-blue-400" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 rounded-full bg-blue-300" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargando más movimientos</span>
                  </motion.div>
                )}
                {!hasMore && transactions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-px w-12 bg-slate-200 dark:bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Fin del historial</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <TransactionModal
            onClose={handleCloseModal}
            onSave={handleSave}
            initialData={editingTransaction}
          />
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={handleMassDelete}
        onMove={handleMassMove}
      />

      <AnimatePresence>
        {showPremiumModal && (
          <SubscriptionModal onClose={() => setShowPremiumModal(false)} />
        )}
      </AnimatePresence>

      <PremiumConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.id === 'MASS_DELETE' ? 'Eliminar movimientos' : (deleteConfirm.isGroup ? 'Eliminar movimiento compartido' : 'Eliminar movimiento')}
        message={
          deleteConfirm.id === 'MASS_DELETE'
            ? (() => {
              const selectedTxs = transactions.filter(t => selectedIds.includes(t.id));
              const groupNames = Array.from(new Set(selectedTxs.filter(t => t.is_group).map(t => t.payment_method)));
              const groupCount = selectedTxs.filter(t => t.is_group).length;

              if (selectedIds.length === 1) {
                const tx = selectedTxs[0];
                return tx.is_group
                  ? `⚠️ ¿Estás seguro de que querés eliminar este movimiento compartido de "${tx.payment_method}"? Se borrará de tu historial del grupo. Esta acción no se puede deshacer.`
                  : '⚠️ ¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.';
              }

              let msg = `⚠️ ¿Estás seguro de que querés eliminar estos ${selectedIds.length} movimientos?`;
              if (groupCount > 0) {
                msg += `\n\n⚠️ Atención: ${groupCount} movimientos pertenecen a grupos compartidos (${groupNames.join(', ')}). Al eliminarlos, también se borrarán del historial del grupo para vos.`;
              }
              return msg + "\n\nEsta acción no se puede deshacer.";
            })()
            : (deleteConfirm.isGroup
              ? `⚠️ ¿Estás seguro de que querés eliminar este movimiento compartido de "${deleteConfirm.groupName}"? Se borrará de tu historial del grupo. Esta acción no se puede deshacer.`
              : '⚠️ ¿Estás seguro de que querés eliminar este movimiento? Esta acción no se puede deshacer.'
            )
        }
        confirmLabel="Eliminar"
        onConfirm={deleteConfirm.id === 'MASS_DELETE' ? executeMassDelete : handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default PersonalFinance;