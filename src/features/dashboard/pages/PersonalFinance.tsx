import React, { useState } from 'react';
import { Plus, ArrowDown, ArrowUp, Users, ShoppingBag, DollarSign, Car, Utensils, Loader2, X, Receipt, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { usePersonalTransactions, PersonalTransaction } from '../hooks/usePersonalTransactions';
import ProjectionCard from '../components/ProjectionCard';
import AnimatedPrice from '@/components/ui/AnimatedPrice';

const PersonalFinance: React.FC = () => {
  const { transactions, summary, loading, addTransaction, updateTransaction, deleteTransaction } = usePersonalTransactions();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);

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
          {transactions.length > 5 && (
            <button className="text-sm text-blue-500 hover:text-blue-600 font-semibold hover:underline">Ver todos</button>
          )}
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
            {transactions.slice(0, 10).map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={() => handleEdit(tx)}
                onDelete={() => handleDelete(tx.id)}
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
    </div>
  );
};

interface TransactionCardProps {
  transaction: PersonalTransaction;
  onEdit: () => void;
  onDelete: () => void;
}

const TransactionCard = ({ transaction, onEdit, onDelete }: TransactionCardProps) => {
  const isIncome = transaction.type === 'income';
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-all group cursor-pointer ${isIncome ? 'border-l-4 border-l-emerald-500' : ''}`}>
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
          {isIncome ? <DollarSign className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">{transaction.title}</p>
          <p className="text-xs text-slate-500 font-medium">
            {transaction.category || 'Sin categoría'} • {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right flex flex-col items-end">
          <p className={`font-bold text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-tight">
            {transaction.payment_method || 'Efectivo'}
          </p>
        </div>

        {/* Actions - visible on group hover */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface TransactionModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<{ data?: any; error: any }>;
  initialData?: PersonalTransaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave, initialData }) => {
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !amount) return;
    setSaving(true);
    const { error } = await onSave({
      title,
      amount: parseFloat(amount),
      category,
      type
    });
    setSaving(false);
    if (!error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {initialData ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'expense'
              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-2 border-red-500'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
          >
            Gasto
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === 'income'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
          >
            Ingreso
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Descripción</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Supermercado Coto"
              className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-white dark:bg-black/20 border border-border rounded-xl pl-10 pr-4 py-3 text-2xl font-bold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Categoría (opcional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Compras, Transporte..."
              className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title || !amount || saving}
            className="flex-1 py-3 rounded-xl bg-blue-gradient text-white font-bold shadow-lg shadow-blue-500/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalFinance;