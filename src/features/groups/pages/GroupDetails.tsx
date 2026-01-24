import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Receipt, BarChart3, User, Search, Filter, Share, Loader2, Edit2, Trash2, X, Users, History, Check, ChevronRight, AlertCircle, Sparkles, LayoutGrid, Repeat, CreditCard, DollarSign } from 'lucide-react';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import InviteModal from '@/features/groups/components/InviteModal';
import { compressToWebP } from '@/lib/image-utils';
import { supabase } from '@/lib/supabase';
import { simplifyDebts as expertSimplifyDebts } from '@/lib/expert-math';
import { Transaction, AppRoute } from '@/types/index';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import BulkActionsBar from '@/features/expenses/components/BulkActionsBar';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';
import { useToast } from '@/context/ToastContext';
import Portal from '@/components/ui/Portal';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

interface GroupDetailsProps {
   groupId?: string | null;
   onBack?: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId: propGroupId, onBack }) => {
   const { groupId: paramGroupId } = useParams<{ groupId: string }>();
   const navigate = useNavigate();
   const location = useLocation();
   const initialModalHandled = useRef(false);
   const groupId = propGroupId || paramGroupId;
   const { user } = useAuth();

   const { groups } = useGroups();
   const { transactions, loading: loadingTx, addTransaction, updateTransaction, deleteTransaction, deleteTransactions, refreshTransactions } = useTransactions(groupId);

   const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
   const [showModal, setShowModal] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showInviteModal, setShowInviteModal] = useState(false);
   const [inviteCopied, setInviteCopied] = useState(false);
   const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
   const [permissionError, setPermissionError] = useState<{ isOpen: boolean; payerName: string }>({ isOpen: false, payerName: '' });
   const [settleConfirmOpen, setSettleConfirmOpen] = useState(false);
   const [settling, setSettling] = useState(false);
   const [settlingIds, setSettlingIds] = useState<string[]>([]);
   const { showToast } = useToast();
   const { createNotifications, fetchNotifications } = useNotifications();

   const group = groups.find(g => g.id === groupId);
   const isOwner = !!group && user?.id === group.createdBy;

   const groupTypeLabel = useMemo(() => {
      if (!group) return '';
      const defaultLabels: Record<string, string> = {
         trip: 'Viaje',
         house: 'Casa',
         couple: 'Pareja',
         other: 'Otro'
      };
      if (group.type === 'other' && group.customTypeLabel?.trim()) {
         return group.customTypeLabel.trim();
      }
      return defaultLabels[group.type] || 'Otro';
   }, [group]);

   // Calculate Group Balances
    const balances = useMemo(() => {
        if (!group || !user) return { userBalance: 0, totalSpent: 0, userSpent: 0, memberBalances: {} as Record<string, number> };

        let userBalance = 0;
        let totalSpent = 0;
        let userSpent = 0;
        const memberBalances: Record<string, number> = {};

        group.members.forEach(m => memberBalances[m.id] = 0);

        transactions.forEach(tx => {
            const txTotal = tx.totalAmount ?? tx.amount;
            totalSpent += txTotal;

            if (memberBalances[tx.payer.id] !== undefined) {
                memberBalances[tx.payer.id] += txTotal;
            }

            if (tx.splits && tx.splits.length > 0) {
                tx.splits.forEach(split => {
                    if (memberBalances[split.userId] !== undefined) {
                        memberBalances[split.userId] -= split.amount;
                    }
                    if (split.userId === user.id) {
                        userSpent += split.amount;
                    }
                });
            } else {
                const splitCount = tx.splitWith.length || 1;
                const amountPerPerson = txTotal / splitCount;

                tx.splitWith.forEach(member => {
                    if (memberBalances[member.id] !== undefined) {
                        memberBalances[member.id] -= amountPerPerson;
                    }
                    if (member.id === user.id) {
                        userSpent += amountPerPerson;
                    }
                });
            }
        });

        userBalance = memberBalances[user.id] || 0;

        if (group.members.length === 1 && group.members[0].id === user.id) {
            userBalance = -userSpent;
        }

        return { userBalance, totalSpent, userSpent, memberBalances };
    }, [transactions, group, user]);

    const simplifiedDebts = useMemo(() => {
       if (!group) return [] as { from: string; to: string; amount: number }[];
       return expertSimplifyDebts(balances.memberBalances, group.members);
    }, [balances.memberBalances, group]);


   const handleBack = () => {
      if (onBack) onBack();
      else navigate(AppRoute.DASHBOARD_GROUPS);
   };

   useEffect(() => {
      const params = new URLSearchParams(location.search);
      const shouldOpen = params.get('newExpense') === '1';
      if (shouldOpen && !initialModalHandled.current) {
         setEditingTransaction(null);
         setShowModal(true);
         initialModalHandled.current = true;
         navigate(`/grupos/${groupId}`, { replace: true });
      }
   }, [location.search, navigate, groupId]);

   const handleAddTransaction = () => {
      setEditingTransaction(null);
      setShowModal(true);
   };

   const handleEdit = (tx: any) => {
      setEditingTransaction(tx);
      setShowModal(true);
   };

   const handleDeleteClick = (id: string) => {
      setDeleteConfirm({ isOpen: true, id });
   };

   const isSettlementCategory = (category?: string | null) => {
      return (category || '').toLowerCase() === 'saldos';
   };

   const getDeleteCopy = (ids: string[]) => {
      const selected = transactions.filter(tx => ids.includes(tx.id));
      const allSettlements = selected.length > 0 && selected.every(tx => isSettlementCategory(tx.category));
      const label = allSettlements ? 'liquidación' : 'movimiento';
      return {
         label,
         pluralLabel: allSettlements ? 'liquidaciones' : 'movimientos',
         allSettlements
      };
   };

   const executeMassDelete = async () => {
      const { error } = await deleteTransactions(selectedIds);
      const copy = getDeleteCopy(selectedIds);

      if (!error) {
         setSelectedIds([]);
         showToast(`${selectedIds.length} ${copy.pluralLabel} eliminadas`, 'success');
      } else {
         if (error.includes('row-level security') || error.includes('policy') || error === 'PERMISSION_DENIED') {
            // For mass delete, we don't necessarily know all payers, but we can show a general permission error
            setPermissionError({ isOpen: true, payerName: 'sus creadores' });
         } else {
            showToast(`Error al eliminar ${copy.pluralLabel}`, 'error');
         }
      }
      setDeleteConfirm({ isOpen: false, id: null });
   };

   const handleConfirmDelete = async () => {
      if (deleteConfirm.id) {
         const txToDelete = transactions.find(t => t.id === deleteConfirm.id);
         const isSettlement = isSettlementCategory(txToDelete?.category);
         const { error } = await deleteTransaction(deleteConfirm.id);

         if (error) {
            if (error.includes('row-level security') || error.includes('policy') || error === 'PERMISSION_DENIED') {
               setPermissionError({
                  isOpen: true,
                  payerName: txToDelete?.payer.name || 'su creador'
               });
            } else {
               showToast(`Error al eliminar la ${isSettlement ? 'liquidación' : 'movimiento'}`, 'error');
            }
         } else {
            showToast(`${isSettlement ? 'Liquidación' : 'Movimiento'} eliminada`, 'success');
         }
         setDeleteConfirm({ isOpen: false, id: null });
      }
   };

   const handleInvite = () => {
      setShowInviteModal(true);
   };

   const handleSave = async (data: any) => {
      let result;
      if (editingTransaction) {
         result = await updateTransaction(editingTransaction.id, data);
      } else {
         result = await addTransaction(data);
      }

      if (!result.error) {
         const isSettlement = isSettlementCategory(data.category || editingTransaction?.category);
         showToast(editingTransaction
            ? `${isSettlement ? 'Liquidación' : 'Movimiento'} actualizada`
            : `${isSettlement ? 'Liquidación' : 'Movimiento'} guardada con éxito`,
            'success');
      } else {
         const isSettlement = isSettlementCategory(data.category || editingTransaction?.category);
         showToast(`Error al guardar la ${isSettlement ? 'liquidación' : 'movimiento'}: ${result.error}`, 'error');
      }
      return result;
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

   const handleMassMove = async (newCategoryId: string) => {
      const { error } = await supabase
         .from('transactions')
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

   const handleCloseSettings = () => {
      setShowSettings(false);
   };

   const canSettleDebt = (fromId: string) => {
      if (!user || !group) return false;
      return fromId === user.id || isOwner;
   };

   const notifySettlement = async (fromId: string, toId: string, amount: number) => {
      if (!group) return;
      const fromMember = group.members.find(m => m.id === fromId);
      const toMember = group.members.find(m => m.id === toId);
      const formattedAmount = amount.toLocaleString('es-AR');
      const title = 'Deuda saldada';
      const body = `${fromMember?.name || 'Alguien'} le pagó a ${toMember?.name || 'alguien'} $ ${formattedAmount}`;

      const notifications = group.members.map(member => ({
         userId: member.id,
         groupId: group.id,
         type: 'settlement',
         title,
         body,
         metadata: {
            fromId,
            toId,
            amount
         }
      }));

      await createNotifications(notifications);
      await fetchNotifications();
   };

   const createSettlementTransaction = async (fromId: string, toId: string, amount: number, skipRefresh?: boolean) => {
      if (!group) return { error: 'Missing group' };

      const fromMember = group.members.find(m => m.id === fromId);
      const toMember = group.members.find(m => m.id === toId);

      const result = await addTransaction({
         title: `Liquidación con ${toMember?.name || 'miembro'}`,
         amount,
         category: 'Saldos',
         date: new Date().toISOString(),
         splitBetween: [toId],
         customSplits: { [toId]: amount },
         payerId: fromId
      }, { skipRefresh });

      if (!result.error) {
         await notifySettlement(fromId, toId, amount);
      }

      return result;
   };

   const handleSettleDebt = async (fromId: string, toId: string, amount: number) => {
      if (!canSettleDebt(fromId)) return;
      setSettlingIds(prev => [...prev, `${fromId}-${toId}`]);
      const { error } = await createSettlementTransaction(fromId, toId, amount);
      if (!error) {
         showToast('Deuda saldada', 'success');
      } else {
         showToast('Error al saldar deuda: ' + error, 'error');
      }
      setSettlingIds(prev => prev.filter(id => id !== `${fromId}-${toId}`));
   };

   const handleSettleAllDebts = async () => {
      if (!group || !user) return;
      const debtsToSettle = simplifiedDebts.filter(debt => canSettleDebt(debt.from));

      if (debtsToSettle.length === 0) {
         showToast('No tenés deudas pendientes', 'info');
         setSettleConfirmOpen(false);
         return;
      }

      setSettling(true);
      for (let i = 0; i < debtsToSettle.length; i += 1) {
         const debt = debtsToSettle[i];
         const isLast = i === debtsToSettle.length - 1;
         const { error } = await createSettlementTransaction(debt.from, debt.to, debt.amount, !isLast);
         if (error) {
            showToast('Error al saldar deudas: ' + error, 'error');
            setSettling(false);
            setSettleConfirmOpen(false);
            return;
         }
      }

      await refreshTransactions();
      showToast('Deudas saldadas', 'success');
      setSettling(false);
      setSettleConfirmOpen(false);
   };

   if (!group) {
      if (groups.length === 0) return <div className="p-10 text-center">Cargando grupos...</div>;
      return <div className="p-10 text-center">Grupo no encontrado.</div>;
   }

   return (
      <div className="flex flex-col bg-background relative overflow-hidden">
         {/* Banner */}
         <div className="relative h-48 w-full shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10"></div>
            {group.image ? (
               <img src={group.image} alt={group.name} className="w-full h-full object-cover opacity-60" />
            ) : (
               <div className="w-full h-full bg-blue-600 opacity-20"></div>
            )}

            <button
               onClick={handleBack}
               className="absolute top-6 left-6 z-20 size-10 rounded-full bg-surface/50 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white hover:bg-surface transition-all"
            >
               <ChevronLeft className="w-6 h-6" />
            </button>
            <button
               onClick={() => setShowSettings(true)}
               className="absolute top-6 right-6 z-20 size-10 rounded-full bg-surface/50 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white hover:bg-surface transition-all"
            >
               <Settings className="w-5 h-5" />
            </button>
         </div>

         {/* Content */}
         <div className="flex-1 -mt-12 relative z-20 px-4 md:px-8 pb-10">
            <div className="max-w-4xl mx-auto space-y-6">

               {/* Group Header Info */}
               <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                  <div>
                     <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 shadow-sm">{group.name}</h1>
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           {group.members.map(m => (
                              <img key={m.id} src={m.avatar} alt={m.name} className="size-8 rounded-full border-2 border-background" title={m.name} />
                           ))}
                           <button
                              onClick={handleInvite}
                              className="size-8 rounded-full border-2 border-background bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300"
                           >
                              <Plus className="w-4 h-4" />
                           </button>
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{groupTypeLabel.toUpperCase()}</span>
                     </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto relative">
                     <button
                        onClick={handleInvite}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                     >
                        <Share className="w-4 h-4" />
                        Invitar
                     </button>
                     <button
                        onClick={() => setSettleConfirmOpen(true)}
                        disabled={settling}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                     >
                        <Receipt className="w-4 h-4" />
                        Saldar deudas
                     </button>
                     <button
                        onClick={handleAddTransaction}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-gradient text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
                     >
                        <Plus className="w-4 h-4" />
                        Añadir gasto
                     </button>
                  </div>
               </div>

               {/* Stats Bar */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-panel p-4 rounded-2xl">
                     <p className="text-xs uppercase font-bold text-slate-500 mb-1">Gasto total</p>
                     <p className="text-xl font-black text-slate-900 dark:text-white">$ {balances.totalSpent.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl">
                     <p className="text-xs uppercase font-bold text-slate-500 mb-1">Tu gasto</p>
                     <p className="text-xl font-black text-slate-900 dark:text-white">$ {balances.userSpent.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
                     <div className={`absolute right-0 top-0 bottom-0 w-1 ${balances.userBalance > 0 ? 'bg-emerald-500' : balances.userBalance < 0 ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                     <p className="text-xs uppercase font-bold text-slate-500 mb-1">Tu situación</p>
                     <p className={`text-xl font-black ${balances.userBalance > 0 ? 'text-emerald-500' : balances.userBalance < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {balances.userBalance > 0 ? `+ $${balances.userBalance.toLocaleString('es-AR')}` :
                           balances.userBalance < 0 ? `- $${Math.abs(balances.userBalance).toLocaleString('es-AR')}` :
                              `$ 0`}
                     </p>
                  </div>
                  <div
                     onClick={() => navigate(`/categorias?scope=${group.id}`)}
                     className="glass-panel p-4 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-surface/50 transition-colors"
                  >
                     <BarChart3 className="w-6 h-6 text-blue-500" />
                     <span className="ml-2 font-bold text-sm text-blue-500">Ver reporte</span>
                  </div>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-border">
                  <button
                     onClick={() => setActiveTab('expenses')}
                     className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                     Movimientos
                  </button>
                  <button
                     onClick={() => setActiveTab('balances')}
                     className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'balances' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                     Balance sugerido
                  </button>
               </div>

               {/* Tab Content */}
               <div className="min-h-[300px]">
                  {activeTab === 'expenses' ? (
                     <div className="space-y-4">
                        <div className="flex gap-2 mb-4">
                           <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="text" placeholder="Buscar gastos..." className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                           </div>
                           <button className="px-3 py-2 bg-surface border border-border rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                              <Filter className="w-4 h-4" />
                           </button>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between mb-2 px-2">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial</div>
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
                           </div>
                           {loadingTx ? (
                              <div className="flex justify-center p-4">
                                 <Loader2 className="animate-spin text-slate-400" />
                              </div>
                           ) : transactions.length === 0 ? (
                              <div className="text-center p-4 text-slate-500">No hay movimientos aún.</div>
                           ) : (
                              transactions.map(tx => (
                                 <TransactionCard
                                    key={tx.id}
                                    transaction={tx}
                                    onEdit={() => handleEdit(tx)}
                                    onDelete={() => handleDeleteClick(tx.id)}
                                    onSelect={handleSelect}
                                    onChangeCategory={() => setSelectedIds([tx.id])}
                                    isSelected={selectedIds.includes(tx.id)}
                                    contextName={group.name}
                                 />
                              ))
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-center gap-3">
                           <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <Sparkles className="w-4 h-4" />
                           </div>
                           <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              <span className="font-bold text-blue-600">Simplificación activada:</span> Minimizamos los pagos para que saldar sea más fácil.
                           </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {simplifiedDebts.length === 0 ? (
                              <div className="col-span-2 py-10 text-center text-slate-500 font-medium">No hay deudas pendientes. ¡Están al día!</div>
                           ) : (
                              simplifiedDebts.map((tx, i) => {
                                 const fromMember = group.members.find(m => m.id === tx.from);
                                 const toMember = group.members.find(m => m.id === tx.to);
                                 const canSettle = canSettleDebt(tx.from);
                                 const isSettling = settlingIds.includes(`${tx.from}-${tx.to}`) || settling;
                                 return (
                                    <motion.div
                                       key={`${tx.from}-${tx.to}-${i}`}
                                       initial={{ opacity: 0, x: -10 }}
                                       animate={{ opacity: 1, x: 0 }}
                                       transition={{ delay: i * 0.1 }}
                                       className="glass-panel p-5 rounded-2xl flex items-center justify-between group"
                                    >
                                       <div className="flex items-center gap-3">
                                          <div className="flex -space-x-3">
                                             <img src={fromMember?.avatar} className="size-10 rounded-full border-2 border-surface" alt="" title={fromMember?.name} />
                                             <div className="size-10 rounded-full bg-surface border-2 border-surface flex items-center justify-center">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                             </div>
                                             <img src={toMember?.avatar} className="size-10 rounded-full border-2 border-surface" alt="" title={toMember?.name} />
                                          </div>
                                          <div>
                                             <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                {fromMember?.id === user?.id ? "Tenés que pagarle" : `${fromMember?.name} le paga`}
                                             </p>
                                             <p className="text-xs text-slate-500">a <span className="font-bold text-slate-700 dark:text-slate-300">{toMember?.id === user?.id ? "Vos" : toMember?.name}</span></p>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-lg font-black text-blue-500">$ {tx.amount.toLocaleString('es-AR')}</p>
                                          <button
                                             onClick={() => handleSettleDebt(tx.from, tx.to, tx.amount)}
                                             disabled={!canSettle || isSettling}
                                             className={`text-[10px] font-black uppercase tracking-widest transition-colors ${canSettle && !isSettling
                                                ? 'text-slate-400 hover:text-blue-500'
                                                : 'text-slate-300 cursor-not-allowed'}`}
                                          >
                                             {isSettling ? 'Saldando...' : 'Saldar'}
                                          </button>
                                       </div>
                                    </motion.div>
                                 );
                              })
                           )}
                        </div>

                        <div className="pt-6 border-t border-border">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Resumen Individual</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.members.map(member => {
                                 const balance = balances.memberBalances[member.id];
                                 return (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-border/50">
                                       <div className="flex items-center gap-2">
                                          <img src={member.avatar} className="size-6 rounded-full" alt="" />
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{member.name}</span>
                                       </div>
                                       <span className={`text-xs font-black ${balance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                          {balance >= 0 ? '+' : '-'}$ {Math.abs(balance).toLocaleString('es-AR')}
                                       </span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Transaction Modal */}
         <AnimatePresence>
            {showModal && (
               <Portal>
                  <GroupTransactionModal
                     onClose={handleCloseModal}
                     onSave={handleSave}
                     members={group.members}
                     initialData={editingTransaction}
                  />
               </Portal>
            )}
         </AnimatePresence>

         {/* Settings Modal */}
         <AnimatePresence>
            {showSettings && (
               <Portal>
                  <GroupSettingsModal
                     group={group}
                     onClose={handleCloseSettings}
                     onBack={onBack}
                  />
               </Portal>
            )}
         </AnimatePresence>

         {/* Invite Modal */}
         <AnimatePresence>
            {showInviteModal && (
               <Portal>
                  <InviteModal
                     isOpen={showInviteModal}
                     onClose={() => setShowInviteModal(false)}
                     groupName={group.name}
                     inviteCode={group.inviteCode || ''}
                  />
               </Portal>
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
            title={(() => {
               if (deleteConfirm.id === 'MASS_DELETE') {
                  return `Eliminar ${getDeleteCopy(selectedIds).pluralLabel}`;
               }
               const tx = transactions.find(t => t.id === deleteConfirm.id);
               return `Eliminar ${isSettlementCategory(tx?.category) ? 'liquidación' : 'movimiento'}`;
            })()}
            message={(() => {
               if (deleteConfirm.id === 'MASS_DELETE') {
                  const copy = getDeleteCopy(selectedIds);
                  if (selectedIds.length === 1) {
                     return `¿Estás seguro de que querés eliminar esta ${copy.label}? Esta acción no se puede deshacer y afectará los balances del grupo.`;
                  }
                  return `¿Estás seguro de que querés eliminar estas ${selectedIds.length} ${copy.pluralLabel}? Esta acción no se puede deshacer y afectará los balances de todos los miembros del grupo.`;
               }
               const tx = transactions.find(t => t.id === deleteConfirm.id);
               return `¿Estás seguro de que querés eliminar esta ${isSettlementCategory(tx?.category) ? 'liquidación' : 'movimiento'}? Esta acción no se puede deshacer y afectará los balances del grupo.`;
            })()}
            confirmLabel="Eliminar"
            onConfirm={deleteConfirm.id === 'MASS_DELETE' ? executeMassDelete : handleConfirmDelete}
            onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
         />

         <PremiumConfirmModal
            isOpen={settleConfirmOpen}
            title="Saldar deudas"
            message={isOwner
               ? 'Esto generará movimientos de liquidación para todas las deudas del grupo. ¿Querés continuar?'
               : 'Esto generará movimientos de liquidación para tus deudas pendientes. ¿Querés continuar?'}
            confirmLabel={settling ? 'Saldando...' : 'Confirmar'}
            onConfirm={handleSettleAllDebts}
            onCancel={() => setSettleConfirmOpen(false)}
            type="info"
         />

         {/* Permission Error Modal */}
         <PremiumConfirmModal
            isOpen={permissionError.isOpen}
            title="Acción no permitida"
            message={`No puedes eliminar este movimiento porque fue cargado por ${permissionError.payerName}. Habla con él para eliminarlo.`}
            confirmLabel="Entendido"
            onConfirm={() => setPermissionError({ isOpen: false, payerName: '' })}
            onCancel={() => setPermissionError({ isOpen: false, payerName: '' })}
            type="info"
         />
      </div>
   );
};

interface GroupSettingsModalProps {
   group: any;
   onClose: () => void;
   onBack?: () => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ group, onClose, onBack }) => {
   const navigate = useNavigate();
   const { updateGroup, deleteGroup, leaveGroup, refreshInviteCode } = useGroups();
   const { user } = useAuth();
   const [name, setName] = useState(group.name);
   const [currency, setCurrency] = useState(group.currency || 'ARS');
   const [customTypeLabel, setCustomTypeLabel] = useState(group.customTypeLabel || '');
   const [saving, setSaving] = useState(false);
   const [uploading, setUploading] = useState(false);
   const [deleting, setDeleting] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);
   const fileInputRef = React.useRef<HTMLInputElement>(null);
   const isOwner = user?.id === group.createdBy;

   const handleLeave = async () => {
      setDeleting(true);
      setError(null);
      try {
         const result = await leaveGroup(group.id);
         if (result.error) throw new Error(result.error);
         onClose();
         setTimeout(() => {
            if (onBack) onBack();
            else navigate(AppRoute.DASHBOARD_GROUPS);
         }, 50);
      } catch (err: any) {
         setError(err.message);
         setDeleting(false);
      }
   };

   const handleSave = async () => {
      if (!name) return;
      setSaving(true);
      setError(null);
      const { error } = await updateGroup(group.id, {
         name,
         currency,
         custom_type_label: group.type === 'other' ? (customTypeLabel.trim() || null) : null
      });
      if (!error) {
         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            setSaving(false);
            onClose();
         }, 1500);
      } else {
         setError(error || 'Error al guardar');
         setSaving(false);
      }
   };

   const handleDelete = async () => {
      setDeleting(true);
      setError(null);
      try {
         const result = await deleteGroup(group.id);
         if (result.error) throw new Error(result.error);

         onClose();
         setTimeout(() => {
            if (onBack) onBack();
            else navigate(AppRoute.DASHBOARD_GROUPS);
         }, 50);
      } catch (err: any) {
         setError(err.message);
         setDeleting(false);
      }
   };

   const handleImageClick = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);
      setError(null);
      try {
         const webpBlob = await compressToWebP(file, 800);
         const fileName = `group_${group.id}_${Date.now()}.webp`;

         const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, webpBlob, {
               contentType: 'image/webp',
               upsert: true
            });

         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

         await updateGroup(group.id, { image_url: publicUrl });
         setSuccess(true);
         setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
         setError(err.message);
      } finally {
         setUploading(false);
      }
   };

   return (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />
          <motion.div
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative z-[110] w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface rounded-3xl p-6 shadow-2xl border border-border"
          >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ajustes del Grupo</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
               </button>
            </div>

            <div className="space-y-6">
               <div className="flex flex-col items-center gap-2">
                  <div
                     className="size-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-90 transition-all relative border-2 border-border"
                     onClick={handleImageClick}
                  >
                     {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                     ) : group.image ? (
                        <img src={group.image} alt="" className="w-full h-full object-cover" />
                     ) : (
                        <Users className="w-8 h-8 text-slate-400" />
                     )}
                  </div>
                  <button
                     onClick={handleImageClick}
                     className="text-xs font-bold text-primary hover:underline"
                  >
                     Cambiar imagen
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre del Grupo</label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Moneda principal</label>
                     <PremiumDropdown
                        value={currency}
                        onChange={setCurrency}
                        groups={[
                           {
                              title: 'Monedas',
                              options: [
                                 { id: 'ARS', label: 'ARS - Peso Argentino', icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                                 { id: 'USD', label: 'USD - Dólar Estadounidense', icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                                 { id: 'EUR', label: 'EUR - Euro', icon: DollarSign, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
                              ]
                           }
                        ]}
                     />
                  </div>
                  {group.type === 'other' && (
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Etiqueta del grupo</label>
                        <input
                           type="text"
                           value={customTypeLabel}
                           onChange={(e) => setCustomTypeLabel(e.target.value)}
                           placeholder="Ej: Amigos, Familia, Trabajo"
                           className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                        />
                     </div>
                  )}
                  <div className="pt-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Código de Invitación</label>
                     <div className="flex items-center gap-2">
                        <code className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-xs font-bold text-center border border-border">
                           {group.inviteCode || 'No generado'}
                        </code>
                        <button
                           onClick={async () => {
                              setSaving(true);
                              await refreshInviteCode(group.id);
                              setSaving(false);
                           }}
                           className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
                           title="Regenerar código"
                        >
                           <History className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                        </button>
                     </div>
                     <p className="text-[10px] text-slate-500 mt-1 font-medium">Cualquiera con este código puede unirse al grupo.</p>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-border mt-4">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Zona de Peligro</p>

                     {showDeleteConfirm ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                           <p className="text-xs font-bold text-red-600 mb-3">
                              {isOwner ? '¿Estás seguro? Esta acción eliminará el grupo para todos.' : '¿Estás seguro de que querés salir del grupo?'}
                           </p>
                           <div className="flex gap-2">
                              <button
                                 onClick={isOwner ? handleDelete : handleLeave}
                                 disabled={deleting}
                                 className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20"
                              >
                                 {deleting ? 'Procesando...' : isOwner ? 'Sí, eliminar grupo' : 'Sí, salir del grupo'}
                              </button>
                              <button
                                 onClick={() => setShowDeleteConfirm(false)}
                                 className="flex-1 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                              >
                                 Cancelar
                              </button>
                           </div>
                        </div>
                     ) : (
                        <button
                           onClick={() => setShowDeleteConfirm(true)}
                           className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                 <Trash2 className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                 <p className="text-sm font-bold text-red-600">{isOwner ? 'Eliminar Grupo' : 'Salir del Grupo'}</p>
                                 <p className="text-[10px] text-red-400 font-medium">
                                    {isOwner ? 'Se perderán todos los datos' : 'Ya no tendrás acceso a este grupo'}
                                 </p>
                              </div>
                           </div>
                           <ChevronRight className="w-4 h-4 text-red-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                     )}
                  </div>

                  {error && (
                     <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        {error}
                     </div>
                  )}

                  {success && (
                     <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Cambios guardados con éxito
                     </div>
                  )}
               </div>

               <div className="flex gap-3 mt-8">
                  <button
                     onClick={onClose}
                     className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                     Cancelar
                  </button>
                  <button
                     onClick={handleSave}
                     disabled={!name || saving || uploading}
                     className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-lg shadow-black/5 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

interface GroupTransactionModalProps {
   onClose: () => void;
   onSave: (data: any) => Promise<{ data?: any; error: any }>;
   members: any[];
   initialData?: any | null;
}

const GroupTransactionModal: React.FC<GroupTransactionModalProps> = ({ onClose, onSave, members, initialData }) => {
   const { showToast } = useToast();
   const isSettlementCategory = (category?: string | null) => {
      return (category || '').toLowerCase() === 'saldos';
   };
   const [title, setTitle] = useState(initialData?.merchant || ''); // Note: merchant is mapped from title in useTransactions
   const [amount, setAmount] = useState(initialData?.original_amount?.toString() || initialData?.amount?.toString() || '');
   const [currency, setCurrency] = useState(initialData?.original_currency || 'ARS');
   const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate?.toString() || '1');
   const [exchangeRateSource, setExchangeRateSource] = useState<'manual' | 'dolar_blue' | 'dolar_crypto'>(initialData?.exchange_rate_source || 'manual');
   const [isFetchingRate, setIsFetchingRate] = useState(false);
   const [category, setCategory] = useState(initialData?.category || 'General');
   const [saving, setSaving] = useState(false);
   const [splitBetween, setSplitBetween] = useState<string[]>(
      initialData?.splitWith?.map((m: any) => m.id) || members.map(m => m.id)
   );
   const [splitMode, setSplitMode] = useState<'equal' | 'percent' | 'amount'>('equal');
   const [customValues, setCustomValues] = useState<Record<string, string>>({});
   const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
   const [currentInstallment, setCurrentInstallment] = useState('');
   const [totalInstallments, setTotalInstallments] = useState('');
   const { categories } = useCategories();

   // Parse existing installments if any (e.g. "2/6")
   useEffect(() => {
      const pattern = initialData?.recurring_pattern || initialData?.installments;
      if (pattern && typeof pattern === 'string' && pattern.includes('/')) {
         const [curr, tot] = pattern.split('/');
         setCurrentInstallment(curr);
         setTotalInstallments(tot);
      }
   }, [initialData]);

   // Initialize custom values when mode changes or members change
   useEffect(() => {
      if (splitMode === 'equal') return;

      const newValues: Record<string, string> = {};
      const share = splitMode === 'percent'
         ? (100 / splitBetween.length).toFixed(1)
         : (parseFloat(amount || '0') / splitBetween.length).toFixed(2);

      splitBetween.forEach(id => {
         newValues[id] = share;
      });
      setCustomValues(newValues);
   }, [splitMode, splitBetween.length]);

   const fetchRate = async (source: 'dolar_blue' | 'dolar_crypto') => {
      setIsFetchingRate(true);
      try {
         const endpoint = source === 'dolar_crypto' ? 'cripto' : 'blue';
         const res = await fetch(`https://dolarapi.com/v1/dolares/${endpoint}`);
         const data = await res.json();
         if (data && data.venta) {
            setExchangeRate(data.venta.toString());
         }
      } catch (e) {
         console.error('Error fetching rate', e);
         setExchangeRate('1000');
      } finally {
         setIsFetchingRate(false);
      }
   };

   const handleSave = async () => {
      if (!title || !amount || splitBetween.length === 0) return;

      const baseAmount = parseFloat(amount);
      const rate = parseFloat(exchangeRate) || 1;
      const totalAmount = currency === 'ARS' ? baseAmount : baseAmount * rate;
      let finalSplits: { userId: string; amount: number }[] = [];

      if (splitMode === 'equal') {
         const baseShare = Math.floor((baseAmount / splitBetween.length) * 100) / 100;
         let remaining = Math.round((baseAmount - (baseShare * splitBetween.length)) * 100) / 100;

         finalSplits = splitBetween.map((id, index) => {
            const extra = index === 0 ? remaining : 0;
            const splitBase = baseShare + extra;
            const splitAmount = currency === 'ARS' ? splitBase : splitBase * rate;
            return { userId: id, amount: splitAmount };
         });
      } else if (splitMode === 'percent') {
         // Validate 100%
         const totalPct = splitBetween.reduce((acc, id) => acc + (parseFloat(customValues[id]) || 0), 0);
         if (Math.abs(totalPct - 100) > 0.1) {
            showToast('El total debe ser 100%', 'error');
            return;
         }
         finalSplits = splitBetween.map(id => {
            const splitBase = Math.round((baseAmount * (parseFloat(customValues[id]) / 100)) * 100) / 100;
            const splitAmount = currency === 'ARS' ? splitBase : splitBase * rate;
            return { userId: id, amount: splitAmount };
         });
      } else {
         // Amount mode
         const totalCalc = splitBetween.reduce((acc, id) => acc + (parseFloat(customValues[id]) || 0), 0);
         if (Math.abs(totalCalc - baseAmount) > 0.1) {
            showToast('La suma de los montos debe ser igual al total', 'error');
            return;
         }
         finalSplits = splitBetween.map(id => {
            const splitBase = parseFloat(customValues[id]);
            const splitAmount = currency === 'ARS' ? splitBase : splitBase * rate;
            return { userId: id, amount: splitAmount };
         });
      }

      setSaving(true);

      // Convert Array<{userId, amount}> to Record<userId, amount> for the hook
      const splitsRecord: Record<string, number> = {};
      finalSplits.forEach(s => {
         splitsRecord[s.userId] = s.amount;
      });

      const { error } = await onSave({
         title,
         amount: totalAmount,
         category,
         date: initialData?.date || new Date().toISOString(),
         splitBetween,
         customSplits: splitsRecord,
         is_recurring: isRecurring,
         installments: currentInstallment && totalInstallments ? `${currentInstallment}/${totalInstallments}` : null,
         original_amount: baseAmount,
         original_currency: currency,
         exchange_rate: currency === 'ARS' ? undefined : rate,
         exchange_rate_source: currency === 'ARS' ? undefined : exchangeRateSource
      });
      setSaving(false);
      if (!error) onClose();
   };

   const updateCustomValue = (id: string, val: string) => {
      setCustomValues(prev => ({ ...prev, [id]: val }));
   };

   const toggleMember = (id: string) => {
      setSplitBetween(prev =>
         prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
      );
   };

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
         />
          <motion.div
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-[2.5rem] p-7 shadow-2xl border border-border"
          >
            <div className="flex justify-between items-center mb-5">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">
               {(() => {
                  if (initialData && isSettlementCategory(initialData.category)) {
                     return 'Editar liquidación';
                  }
                  return initialData ? 'Editar gasto' : 'Nuevo gasto grupal';
               })()}
               </h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
               </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 -mx-2 scrollbar-hide">
               <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                     <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Cena en Palermo"
                        className="w-full bg-slate-50 dark:bg-black/20 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                     />
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Monto ({currency})</label>
                     <div className="relative group/input">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm transition-colors group-focus-within/input:text-primary">{currency === 'USD' ? 'u$s' : currency === 'EUR' ? '€' : '$'}</span>
                        <input
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           placeholder="0"
                           className="w-full bg-slate-50 dark:bg-black/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                     </div>
                  </div>
               </div>

               <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Moneda</label>
                     <PremiumDropdown
                        value={currency}
                        onChange={(val) => {
                           setCurrency(val);
                           if (val === 'ARS') {
                              setExchangeRateSource('manual');
                           }
                           if (val === 'EUR') {
                              setExchangeRateSource('manual');
                           }
                           if (val === 'USD' && exchangeRateSource !== 'manual') {
                              fetchRate(exchangeRateSource);
                           }
                        }}
                        groups={[
                           {
                              title: 'Monedas',
                              options: [
                                 { id: 'ARS', label: 'ARS - Pesos', icon: DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                                 { id: 'USD', label: 'USD - Dólares', icon: DollarSign, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                                 { id: 'EUR', label: 'EUR - Euros', icon: DollarSign, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' }
                              ]
                           }
                        ]}
                        className="w-full h-10"
                     />
                  </div>

                  {currency !== 'ARS' && (
                     <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-xs font-black text-blue-500 uppercase tracking-widest">Tipo de cambio (ARS)</label>
                           {currency === 'USD' && exchangeRateSource !== 'manual' && (
                              <button
                                 onClick={() => fetchRate(exchangeRateSource)}
                                 disabled={isFetchingRate}
                                 className="text-[10px] font-black text-blue-600 uppercase hover:underline disabled:opacity-50"
                              >
                                 {isFetchingRate ? 'Actualizando...' : 'Actualizar'}
                              </button>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                           <button
                              onClick={() => setExchangeRateSource('manual')}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${exchangeRateSource === 'manual'
                                 ? 'bg-blue-500 text-white'
                                 : 'bg-white/60 dark:bg-black/20 text-slate-400 border border-border'}`}
                           >
                              Manual
                           </button>
                           <button
                              onClick={() => { if (currency === 'USD') { setExchangeRateSource('dolar_blue'); fetchRate('dolar_blue'); } }}
                              disabled={currency !== 'USD'}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${exchangeRateSource === 'dolar_blue'
                                 ? 'bg-blue-600 text-white'
                                 : 'bg-white/60 dark:bg-black/20 text-slate-400 border border-border'} ${currency !== 'USD' ? 'opacity-40 cursor-not-allowed' : ''}`}
                           >
                              Blue
                           </button>
                           <button
                              onClick={() => { if (currency === 'USD') { setExchangeRateSource('dolar_crypto'); fetchRate('dolar_crypto'); } }}
                              disabled={currency !== 'USD'}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${exchangeRateSource === 'dolar_crypto'
                                 ? 'bg-blue-600 text-white'
                                 : 'bg-white/60 dark:bg-black/20 text-slate-400 border border-border'} ${currency !== 'USD' ? 'opacity-40 cursor-not-allowed' : ''}`}
                           >
                              Cripto
                           </button>
                        </div>
                        <input
                           type="number"
                           value={exchangeRate}
                           onChange={(e) => setExchangeRate(e.target.value)}
                           className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-xl font-bold text-blue-600 focus:outline-none"
                        />
                     </div>
                  )}
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Categoría</label>
                  <PremiumDropdown
                     value={category}
                     onChange={setCategory}
                     groups={[
                        {
                           title: 'Categorías',
                           options: categories.map(c => ({
                              id: c.name,
                              label: c.name,
                              icon: LayoutGrid,
                              color: c.color,
                              bgColor: c.bg_color
                           }))
                        }
                     ]}
                     className="w-full h-10"
                  />
               </div>

               <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Division:</label>
                     <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                           onClick={() => setSplitMode('equal')}
                           className={`px-2 py-1 text-[10px] font-black rounded-md transition-all ${splitMode === 'equal' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                           IGUAL
                        </button>
                        <button
                           onClick={() => setSplitMode('percent')}
                           className={`px-2 py-1 text-[10px] font-black rounded-md transition-all ${splitMode === 'percent' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                           %
                        </button>
                        <button
                           onClick={() => setSplitMode('amount')}
                           className={`px-2 py-1 text-[10px] font-black rounded-md transition-all ${splitMode === 'amount' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                           $
                        </button>
                     </div>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                     {members.map(member => {
                        const isSelected = splitBetween.includes(member.id);
                        return (
                           <div key={member.id} className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-2 rounded-xl border border-border/50">
                              <button
                                 onClick={() => toggleMember(member.id)}
                                 className={`size-10 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent opacity-50'}`}
                              >
                                 <img src={member.avatar || undefined} alt="" className="w-full h-full object-cover" />
                              </button>
                              <div className="flex-1">
                                 <p className={`text-[11px] font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{member.name}</p>
                                 {isSelected && splitMode === 'equal' && <p className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">1 / {splitBetween.length}</p>}
                              </div>

                              {isSelected && splitMode !== 'equal' && (
                                 <div className="relative w-24">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{splitMode === 'percent' ? '%' : '$'}</span>
                                    <input
                                       type="number"
                                       value={customValues[member.id] || ''}
                                       onChange={(e) => updateCustomValue(member.id, e.target.value)}
                                       className="w-full bg-white dark:bg-slate-800 border border-border rounded-lg pl-5 pr-2 py-1 text-right text-xs font-bold focus:ring-1 focus:ring-blue-500"
                                    />
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Recurring & Installments - Compact Grid */}
               <div className="pt-4 border-t border-border mt-2 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recurrente</label>
                     <button
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`flex items-center justify-between w-full p-2.5 rounded-xl border transition-all ${isRecurring ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'bg-slate-50 dark:bg-white/5 border-border text-slate-500'}`}
                     >
                        <div className="flex items-center gap-2">
                           <Repeat className="w-3.5 h-3.5" />
                           <span className="text-xs font-bold">{isRecurring ? 'Si' : 'No'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-all ${isRecurring ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                           <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${isRecurring ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                        </div>
                     </button>
                  </div>

                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">N° Cuotas</label>
                     <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-border h-[42px]">
                        <input
                           type="number"
                           placeholder="1"
                           value={currentInstallment}
                           onChange={(e) => setCurrentInstallment(e.target.value)}
                           className="w-full bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-full focus:ring-1 focus:ring-primary/30"
                        />
                        <span className="text-slate-400 text-[10px] font-black">/</span>
                        <input
                           type="number"
                           placeholder="1"
                           value={totalInstallments}
                           onChange={(e) => setTotalInstallments(e.target.value)}
                           className="w-full bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-full focus:ring-1 focus:ring-primary/30"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 mt-8">
               <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
               >
                  Cancelar
               </button>
               <button
                  onClick={handleSave}
                  disabled={!title || !amount || splitBetween.length === 0 || saving}
                  className="flex-1 py-3 rounded-xl bg-blue-gradient text-white font-bold shadow-lg shadow-blue-500/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
               >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? 'Actualizar' : 'Guardar'}
               </button>
            </div>
         </motion.div>
      </div>
   );
};

export default GroupDetails;
