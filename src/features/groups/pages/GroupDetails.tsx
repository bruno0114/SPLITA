import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Receipt, BarChart3, User, Search, Filter, Share, Loader2, Edit2, Trash2, X, Users, History, Check, ChevronRight, AlertCircle, Sparkles, LayoutGrid, Repeat, CreditCard } from 'lucide-react';
import { useCategories } from '@/features/analytics/hooks/useCategories';
import PremiumDropdown from '@/components/ui/PremiumDropdown';
import { motion } from 'framer-motion';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import InviteModal from '@/features/groups/components/InviteModal';
import { compressToWebP } from '@/lib/image-utils';
import { supabase } from '@/lib/supabase';
import { simplifyDebts as expertSimplifyDebts } from '@/lib/expert-math';
import { Transaction } from '@/types/index';
import TransactionCard from '@/features/expenses/components/TransactionCard';
import BulkActionsBar from '@/features/expenses/components/BulkActionsBar';

interface GroupDetailsProps {
   groupId?: string | null;
   onBack?: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId: propGroupId, onBack }) => {
   const { groupId: paramGroupId } = useParams<{ groupId: string }>();
   const navigate = useNavigate();
   const groupId = propGroupId || paramGroupId;
   const { user } = useAuth();

   const { groups } = useGroups();
   const { transactions, loading: loadingTx, addTransaction, updateTransaction, deleteTransaction } = useTransactions(groupId);

   const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
   const [showModal, setShowModal] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showInviteModal, setShowInviteModal] = useState(false);
   const [inviteCopied, setInviteCopied] = useState(false);
   const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
   const [selectedIds, setSelectedIds] = useState<string[]>([]);

   const group = groups.find(g => g.id === groupId);

   // Calculate Group Balances
   const balances = useMemo(() => {
      if (!group || !user) return { userBalance: 0, totalSpent: 0, userSpent: 0, memberBalances: {} as Record<string, number> };

      let userBalance = 0;
      let totalSpent = 0;
      let userSpent = 0;
      const memberBalances: Record<string, number> = {};

      // Initialize member balances
      group.members.forEach(m => memberBalances[m.id] = 0);

      transactions.forEach(tx => {
         totalSpent += tx.amount;

         // Equal split assumption for now based on UI
         const splitCount = tx.splitWith.length || 1;
         const amountPerPerson = tx.amount / splitCount;

         // Payer gets credit (+)
         if (memberBalances[tx.payer.id] !== undefined) {
            memberBalances[tx.payer.id] += tx.amount;
         }

         // Splitters get debit (-)
         tx.splitWith.forEach(member => {
            if (memberBalances[member.id] !== undefined) {
               memberBalances[member.id] -= amountPerPerson;
            }
         });

         // Current User specific stats
         const iAmInSplit = tx.splitWith.find(m => m.id === user.id);
         if (iAmInSplit) {
            userSpent += amountPerPerson;
         }
      });

      userBalance = memberBalances[user.id] || 0;

      return { userBalance, totalSpent, userSpent, memberBalances };
   }, [transactions, group, user]);


   const handleBack = () => {
      if (onBack) onBack();
      else navigate('/groups');
   };

   const handleAddTransaction = () => {
      setEditingTransaction(null);
      setShowModal(true);
   };

   const handleEdit = (tx: any) => {
      setEditingTransaction(tx);
      setShowModal(true);
   };

   const handleDelete = async (id: string) => {
      if (window.confirm('¿Estás seguro de que querés eliminar este gasto?')) {
         await deleteTransaction(id);
      }
   };

   const handleInvite = () => {
      setShowInviteModal(true);
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
         .from('transactions')
         .delete()
         .in('id', selectedIds);

      if (!error) {
         setSelectedIds([]);
         // We might need a refresh function from useTransactions
         window.location.reload(); // Quick fix or add refresh to hook
      }
   };

   const handleMassMove = async (newCategoryId: string) => {
      const { error } = await supabase
         .from('transactions')
         .update({ category: newCategoryId })
         .in('id', selectedIds);

      if (!error) {
         setSelectedIds([]);
         window.location.reload();
      }
   };

   const handleCloseSettings = () => {
      setShowSettings(false);
   };

   if (!group) {
      if (groups.length === 0) return <div className="p-10 text-center">Cargando grupos...</div>;
      return <div className="p-10 text-center">Grupo no encontrado.</div>;
   }

   return (
      <div className="flex flex-col h-full bg-background relative overflow-hidden">
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
         <div className="flex-1 -mt-12 relative z-20 px-4 md:px-8 pb-10 overflow-y-auto">
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
                           <button className="size-8 rounded-full border-2 border-background bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                              <Plus className="w-4 h-4" />
                           </button>
                        </div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{group.type.toUpperCase()}</span>
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
                     <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:brightness-110 transition-all">
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
                     <div className={`absolute right-0 top-0 bottom-0 w-1 ${balances.userBalance >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                     <p className="text-xs uppercase font-bold text-slate-500 mb-1">Tu situación</p>
                     <p className={`text-xl font-black ${balances.userBalance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {balances.userBalance >= 0 ? `+ $${balances.userBalance.toLocaleString('es-AR')}` : `- $${Math.abs(balances.userBalance).toLocaleString('es-AR')}`}
                     </p>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-surface/50 transition-colors">
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
                                    onDelete={() => handleDelete(tx.id)}
                                    onSelect={handleSelect}
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
                           {(() => {
                              const simplified = expertSimplifyDebts(balances.memberBalances, group.members);
                              if (simplified.length === 0) {
                                 return <div className="col-span-2 py-10 text-center text-slate-500 font-medium">No hay deudas pendientes. ¡Están al día!</div>;
                              }
                              return simplified.map((tx, i) => {
                                 const fromMember = group.members.find(m => m.id === tx.from);
                                 const toMember = group.members.find(m => m.id === tx.to);
                                 return (
                                    <motion.div
                                       key={i}
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
                                          <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors">Saldar</button>
                                       </div>
                                    </motion.div>
                                 );
                              });
                           })()}
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
         {showModal && (
            <GroupTransactionModal
               onClose={handleCloseModal}
               onSave={handleSave}
               members={group.members}
               initialData={editingTransaction}
            />
         )}

         {/* Settings Modal */}
         {showSettings && (
            <GroupSettingsModal
               group={group}
               onClose={handleCloseSettings}
               onBack={onBack}
            />
         )}

         {/* Invite Modal */}
         <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            groupName={group.name}
            inviteCode={group.inviteCode || ''}
         />

         <BulkActionsBar
            selectedCount={selectedIds.length}
            onClear={() => setSelectedIds([])}
            onDelete={handleMassDelete}
            onMove={handleMassMove}
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
            else navigate('/groups');
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
      const { error } = await updateGroup(group.id, { name, currency });
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
            else navigate('/groups');
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
         const webpBlob = await compressToWebP(file);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
         <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in-95">
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
                     <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                     >
                        <option value="ARS">ARS - Peso Argentino</option>
                        <option value="USD">USD - Dólar Estadounidense</option>
                        <option value="EUR">EUR - Euro</option>
                     </select>
                  </div>
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
         </div>
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
   const [title, setTitle] = useState(initialData?.merchant || ''); // Note: merchant is mapped from title in useTransactions
   const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
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

   const handleSave = async () => {
      if (!title || !amount || splitBetween.length === 0) return;

      const totalAmount = parseFloat(amount);
      let finalSplits: { userId: string; amount: number }[] = [];

      if (splitMode === 'equal') {
         const base = Math.floor((totalAmount / splitBetween.length) * 100) / 100;
         let remaining = Math.round((totalAmount - (base * splitBetween.length)) * 100) / 100;

         finalSplits = splitBetween.map((id, index) => {
            // Assign remainder to the first person in the split (often the payer if they are in it)
            const extra = index === 0 ? remaining : 0;
            return { userId: id, amount: base + extra };
         });
      } else if (splitMode === 'percent') {
         // Validate 100%
         const totalPct = splitBetween.reduce((acc, id) => acc + (parseFloat(customValues[id]) || 0), 0);
         if (Math.abs(totalPct - 100) > 0.1) {
            alert('El total debe ser 100%');
            return;
         }
         finalSplits = splitBetween.map(id => ({
            userId: id,
            amount: Math.round((totalAmount * (parseFloat(customValues[id]) / 100)) * 100) / 100
         }));
      } else {
         // Amount mode
         const totalCalc = splitBetween.reduce((acc, id) => acc + (parseFloat(customValues[id]) || 0), 0);
         if (Math.abs(totalCalc - totalAmount) > 0.1) {
            alert('La suma de los montos debe ser igual al total');
            return;
         }
         finalSplits = splitBetween.map(id => ({
            userId: id,
            amount: parseFloat(customValues[id])
         }));
      }

      setSaving(true);
      const { error } = await onSave({
         title,
         amount: totalAmount,
         category,
         date: new Date().toISOString(),
         splitBetween, // IDs for backward compatibility
         customSplits: finalSplits, // Precise calculations
         is_recurring: isRecurring,
         installments: currentInstallment && totalInstallments ? `${currentInstallment}/${totalInstallments}` : null
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
         <div className="w-full max-w-md bg-surface rounded-3xl p-6 shadow-2xl border border-border animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {initialData ? 'Editar gasto' : 'Nuevo gasto'}
               </h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
               </button>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Descripción</label>
                  <input
                     type="text"
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder="Ej: Cena en Palermo"
                     className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Monto</label>
                     <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                           type="number"
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           placeholder="0"
                           className="w-full bg-white dark:bg-black/20 border border-border rounded-xl pl-10 pr-4 py-3 text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Categoría</label>
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
                        className="w-full h-[54px]"
                     />
                  </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dividir con:</label>
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

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                     {members.map(member => {
                        const isSelected = splitBetween.includes(member.id);
                        return (
                           <div key={member.id} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-border/50">
                              <button
                                 onClick={() => toggleMember(member.id)}
                                 className={`size-10 rounded-full border-2 transition-all overflow-hidden ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent opacity-50'}`}
                              >
                                 <img src={member.avatar || undefined} alt="" className="w-full h-full object-cover" />
                              </button>
                              <div className="flex-1">
                                 <p className={`text-xs font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{member.name}</p>
                                 {isSelected && splitMode === 'equal' && <p className="text-[10px] font-bold text-blue-500 uppercase">1 / {splitBetween.length}</p>}
                              </div>

                              {isSelected && splitMode !== 'equal' && (
                                 <div className="relative w-20">
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

               {/* Recurring & Installments */}
               <div className="pt-4 border-t border-border mt-2">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isRecurring ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <Repeat className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Recurrente</p>
                           <p className="text-[10px] text-slate-500 font-medium">Auto-remitente mensual</p>
                        </div>
                     </div>
                     <button
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-10 h-5 rounded-full transition-all relative ${isRecurring ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                     >
                        <div className={`absolute top-0.5 size-4 bg-white rounded-full transition-all ${isRecurring ? 'left-5.5' : 'left-0.5'}`} />
                     </button>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${currentInstallment ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Cuotas</p>
                           <p className="text-[10px] text-slate-500 font-medium">Ej: 2 de 12</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-border">
                        <input
                           type="number"
                           placeholder="1"
                           value={currentInstallment}
                           onChange={(e) => setCurrentInstallment(e.target.value)}
                           className="w-10 bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-7"
                        />
                        <span className="text-slate-400 text-[10px] font-bold">/</span>
                        <input
                           type="number"
                           placeholder="1"
                           value={totalInstallments}
                           onChange={(e) => setTotalInstallments(e.target.value)}
                           className="w-10 bg-white dark:bg-black/40 border-none rounded-lg text-center font-bold text-xs h-7"
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
         </div>
      </div>
   );
};

export default GroupDetails;