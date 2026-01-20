import React, { useState } from 'react';
import { Plus, ArrowDown, ArrowUp, Users, ShoppingBag, DollarSign, Car, Utensils, Loader2, X, Receipt, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { usePersonalTransactions } from '../hooks/usePersonalTransactions';
import { PersonalTransaction } from '@/types/index';
import ProjectionCard from '../components/ProjectionCard';
import AnimatedPrice from '@/components/ui/AnimatedPrice';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import TransactionModal from '@/features/expenses/components/TransactionModal';
import BulkActionsBar from '@/features/expenses/components/BulkActionsBar';
import { supabase } from '@/lib/supabase';

const PersonalFinance: React.FC = () => {
  const { transactions, summary, loading, addTransaction, updateTransaction, deleteTransaction, refreshTransactions } = usePersonalTransactions();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este movimiento?')) {
      await deleteTransaction(id);
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
    const { error } = await supabase
      .from('personal_transactions')
      .delete()
      .in('id', selectedIds);

    if (!error) {
      setSelectedIds([]);
      refreshTransactions();
    }
  };

  const handleMassMove = async (newCategoryId: string) => {
    const { error } = await supabase
      .from('personal_transactions')
      .update({ category: newCategoryId })
      .in('id', selectedIds);

    if (!error) {
      setSelectedIds([]);
      refreshTransactions();
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
    <div className="px-6 md:px-12 py-6 md:py-10 pb-32">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
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

      {/* Projections & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <ProjectionCard currentSpent={summary.totalExpenses} />
        {/* Placeholder for another creative card or empty space */}
        <div className="hidden lg:block bg-surface/20 rounded-[32px] border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center">
          <p className="text-slate-400 text-sm font-medium italic">¿Planeando las próximas vacaciones?</p>
        </div>
      </div>

      {/* Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Movimientos personales</h3>
          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  if (selectedIds.length === transactions.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(transactions.map(tx => tx.id));
                  }
                }}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all"
              >
                {selectedIds.length === transactions.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            )}
            {transactions.length > 5 && (
              <button className="text-sm text-blue-500 hover:text-blue-600 font-semibold hover:underline">Ver todos</button>
            )}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin movimientos aún</h4>
            <p className="text-slate-500 text-sm mb-6">Cargá tu primer ingreso o gasto para empezar a trackear tus finanzas.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-blue-gradient px-6 py-3 rounded-xl font-bold text-sm text-white"
            >
              <Plus className="w-4 h-4" />
              Cargar movimiento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 20).map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={() => handleEdit(tx)}
                onDelete={() => handleDelete(tx.id)}
                onSelect={handleSelect}
                isSelected={selectedIds.includes(tx.id)}
                contextName="Personal"
              />
            ))}
          </div>
        )}
      </section>

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          onClose={handleCloseModal}
          onSave={handleSave}
          initialData={editingTransaction}
        />
      )}

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={handleMassDelete}
        onMove={handleMassMove}
      />
    </div>
  );
};

export default PersonalFinance;