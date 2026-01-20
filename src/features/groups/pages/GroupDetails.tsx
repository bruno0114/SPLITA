import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Receipt, BarChart3, User, Search, Filter, Share, Loader2, Edit2, Trash2, X, Users, History, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import InviteModal from '@/features/groups/components/InviteModal';
import { compressToWebP } from '@/lib/image-utils';
import { supabase } from '@/lib/supabase';

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
                     Balances
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
                           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Historial</div>
                           {loadingTx ? (
                              <div className="flex justify-center p-4">
                                 <Loader2 className="animate-spin text-slate-400" />
                              </div>
                           ) : transactions.length === 0 ? (
                              <div className="text-center p-4 text-slate-500">No hay movimientos aún.</div>
                           ) : (
                              transactions.map(tx => (
                                 <div key={tx.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:bg-surface/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                       <div className="flex flex-col items-center justify-center w-12 text-center">
                                          <span className="text-xs text-slate-500 font-semibold">{tx.date.split(' ')[0]}</span>
                                          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{tx.date.split(' ')[1]}</span>
                                       </div>
                                       <div className={`size-10 rounded-full ${tx.iconBg} flex items-center justify-center ${tx.iconColor}`}>
                                          <Receipt className="w-5 h-5" />
                                       </div>
                                       <div>
                                          <p className="font-bold text-sm text-slate-900 dark:text-white">{tx.merchant}</p>
                                          <p className="text-xs text-slate-500">Pagó <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.payer.name}</span></p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                       <div className="text-right flex flex-col items-end">
                                          <p className="font-bold text-slate-900 dark:text-white">$ {tx.amount.toLocaleString('es-AR')}</p>
                                          <p className={`text-xs font-medium ${tx.payer.id === user?.id ? 'text-emerald-500' : 'text-orange-500'}`}>
                                             {tx.payer.id === user?.id ? 'Pagaste' : 'Debés (part)'}
                                          </p>
                                       </div>

                                       {/* Actions - visible on group hover */}
                                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                             onClick={(e) => { e.stopPropagation(); handleEdit(tx); }}
                                             className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                             title="Editar"
                                          >
                                             <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                             onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                                             className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                             title="Eliminar"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.members.filter(m => m.id !== user?.id).map(member => {
                           const balance = balances.memberBalances[member.id];
                           return (
                              <div key={member.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <img src={member.avatar || undefined} alt={member.name} className="size-12 rounded-full border-2 border-surface" />
                                    <div>
                                       <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                                       <p className="text-xs text-slate-500">
                                          {balance >= 0 ? "Le deben" : "Debe"} $ {Math.abs(balance).toLocaleString('es-AR')}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className={`text-xl font-black ${balance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                       {balance >= 0 ? '+' : '-'}$ {Math.abs(balance).toLocaleString('es-AR')}
                                    </p>
                                 </div>
                              </div>
                           );
                        })}
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
   const { updateGroup, deleteGroup, refreshInviteCode } = useGroups();
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

   const handleSave = async () => {
      if (!name) return;
      setSaving(true);
      setError(null);
      const { error } = await updateGroup(group.id, { name, currency });
      setSaving(true); // Small delay to show success
      if (!error) {
         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            setSaving(false);
            onClose();
         }, 1500);
      } else {
         setError(error);
         setSaving(false);
      }
   };

   const handleDelete = async () => {
      setDeleting(true);
      setError(null);
      try {
         const result = await deleteGroup(group.id);
         if (result.error) throw new Error(result.error);

         // Close modal first
         onClose();
         // Small delay ensures React state updates propagate
         setTimeout(() => {
            if (onBack) onBack();
            else navigate('/groups');
         }, 50);
      } catch (err: any) {
         setError(err.message);
         setDeleting(false);
      }
      // Don't reset deleting in finally - we're navigating away on success
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
                  {isOwner && (
                     <div className="pt-6 border-t border-border mt-4">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Zona de Peligro</p>

                        {showDeleteConfirm ? (
                           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                              <p className="text-xs font-bold text-red-600 mb-3">¿Estás seguro? Esta acción es irreversible.</p>
                              <div className="flex gap-2">
                                 <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/20"
                                 >
                                    {deleting ? 'Eliminando...' : 'Sí, eliminar grupo'}
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
                                    <p className="text-sm font-bold text-red-600">Eliminar Grupo</p>
                                    <p className="text-[10px] text-red-400 font-medium">Se perderán todos los datos</p>
                                 </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-red-300 group-hover:translate-x-1 transition-transform" />
                           </button>
                        )}
                     </div>
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
   const [splitBetween, setSplitBetween] = useState<string[]>(
      initialData?.splitWith?.map((m: any) => m.id) || members.map(m => m.id)
   );
   const [saving, setSaving] = useState(false);

   const handleSave = async () => {
      if (!title || !amount || splitBetween.length === 0) return;
      setSaving(true);
      const { error } = await onSave({
         title,
         amount: parseFloat(amount),
         category,
         date: new Date().toISOString(),
         splitBetween
      });
      setSaving(false);
      if (!error) onClose();
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Dividir con:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                     {members.map(member => (
                        <button
                           key={member.id}
                           onClick={() => toggleMember(member.id)}
                           className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${splitBetween.includes(member.id)
                              ? 'bg-blue-500/10 border-blue-500 text-blue-600'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500'
                              }`}
                        >
                           <img src={member.avatar || undefined} alt="" className="size-6 rounded-full" />
                           <span className="text-xs font-bold truncate">{member.name}</span>
                        </button>
                     ))}
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