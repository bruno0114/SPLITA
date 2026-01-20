import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Receipt, Plane, Home, Beer, Loader2, X, Users, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group } from '@/types/index';
import { useGroups } from '@/features/groups/hooks/useGroups';

interface GroupsProps {
   onGroupSelect?: (groupId: string) => void;
}

const Groups: React.FC<GroupsProps> = ({ onGroupSelect }) => {
   const { groups, loading, createGroup } = useGroups();
   const [showCreateModal, setShowCreateModal] = useState(false);

   // Calculate totals based on real groups
   const totalOwedToUser = groups.reduce((acc, g) => acc + (g.userBalance > 0 ? g.userBalance : 0), 0);
   const totalUserOwes = groups.reduce((acc, g) => acc + (g.userBalance < 0 ? Math.abs(g.userBalance) : 0), 0);

   const handleCreateGroup = async (name: string, type: string, currency: string) => {
      const result = await createGroup(name, type);
      if (!result.error) {
         setShowCreateModal(false);
      }
      return result;
   };

   if (loading) {
      return (
         <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
         </div>
      );
   }

   return (
      <div className="px-6 md:px-12 py-10 pb-32 max-w-7xl mx-auto">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
               <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mis grupos</h2>
               <p className="text-slate-500 dark:text-slate-400 mt-1">Gestioná gastos compartidos en viajes, casa y salidas.</p>
            </div>
            <button
               onClick={() => setShowCreateModal(true)}
               className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-gradient px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 transition-all active:scale-95"
            >
               <Plus className="w-5 h-5" />
               Nuevo grupo
            </button>
         </header>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between group border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
               <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Te deben en total</span>
                  <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">$ {totalOwedToUser.toLocaleString('es-AR')}</span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">En {groups.filter(g => g.userBalance > 0).length} grupos</span>
               </div>
               <div className="size-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-6 h-6" />
               </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between group border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-all">
               <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Debés en total</span>
                  <span className="text-3xl font-black text-orange-700 dark:text-orange-400">$ {totalUserOwes.toLocaleString('es-AR')}</span>
                  <span className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">En {groups.filter(g => g.userBalance < 0).length} grupos</span>
               </div>
               <div className="size-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <ArrowUpRight className="w-6 h-6" />
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Active Groups List */}
            <div className="lg:col-span-2 space-y-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Grupos activos</h3>
               {groups.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-12 text-center">
                     <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                     <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin grupos todavía</h4>
                     <p className="text-slate-500 text-sm mb-6">Creá tu primer grupo para empezar a dividir gastos con amigos y familia.</p>
                     <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-gradient px-6 py-3 rounded-xl font-bold text-sm text-white"
                     >
                        <Plus className="w-4 h-4" />
                        Crear grupo
                     </button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {groups.map(group => (
                        <GroupCard key={group.id} group={group} onClick={() => onGroupSelect?.(group.id)} />
                     ))}
                  </div>
               )}
            </div>

            {/* Sidebar Activity */}
            <div className="lg:col-span-1">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actividad reciente</h3>
               <div className="glass-panel rounded-2xl p-0 overflow-hidden border border-border">
                  <div className="p-6 text-center text-sm text-slate-500">
                     Próximamente: Actividad en tiempo real de todos tus grupos.
                  </div>
               </div>
            </div>
         </div>

         {/* Create Group Modal */}
         <AnimatePresence>
            {showCreateModal && (
               <CreateGroupModal
                  onClose={() => setShowCreateModal(false)}
                  onSave={handleCreateGroup}
               />
            )}
         </AnimatePresence>
      </div>
   );
};

interface CreateGroupModalProps {
   onClose: () => void;
   onSave: (name: string, type: string, currency: string) => Promise<{ data?: any; error: any }>;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSave }) => {
   const [name, setName] = useState('');
   const [type, setType] = useState('other');
   const [currency, setCurrency] = useState('ARS');
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const groupTypes = [
      { id: 'trip', label: 'Viaje', icon: <Plane className="w-5 h-5" /> },
      { id: 'house', label: 'Casa', icon: <Home className="w-5 h-5" /> },
      { id: 'other', label: 'Otro', icon: <Beer className="w-5 h-5" /> },
   ];

   const currencies = [
      { code: 'ARS', label: 'Peso Argentino', symbol: '$' },
      { code: 'USD', label: 'Dólar', symbol: 'US$' },
      { code: 'EUR', label: 'Euro', symbol: '€' },
   ];

   const handleSave = async () => {
      if (!name.trim()) {
         setError('Por favor, ingresá un nombre para el grupo');
         return;
      }
      setError(null);
      setSaving(true);
      const result = await onSave(name.trim(), type, currency);
      setSaving(false);
      if (result.error) {
         setError(result.error);
      }
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-surface rounded-3xl p-6 shadow-2xl border border-border"
         >
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Crear nuevo grupo</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
               </button>
            </div>

            <div className="space-y-6">
               {/* Group Name */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre del grupo</label>
                  <input
                     type="text"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder="Ej: Viaje a Bariloche, Gastos del depto..."
                     className="w-full bg-white dark:bg-black/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none text-slate-900 dark:text-white"
                     autoFocus
                  />
               </div>

               {/* Group Type */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Tipo de grupo</label>
                  <div className="grid grid-cols-3 gap-3">
                     {groupTypes.map((gt) => (
                        <button
                           key={gt.id}
                           onClick={() => setType(gt.id)}
                           className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${type === gt.id
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-border bg-white dark:bg-black/10 text-slate-500 hover:border-slate-300'
                              }`}
                        >
                           {gt.icon}
                           <span className="text-sm font-semibold">{gt.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Currency */}
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Moneda principal</label>
                  <div className="grid grid-cols-3 gap-3">
                     {currencies.map((c) => (
                        <button
                           key={c.code}
                           onClick={() => setCurrency(c.code)}
                           className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${currency === c.code
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-border bg-white dark:bg-black/10 text-slate-500 hover:border-slate-300'
                              }`}
                        >
                           <span className="text-lg font-bold">{c.symbol}</span>
                           <span className="text-xs font-medium">{c.code}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Error Message */}
               {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                     {error}
                  </div>
               )}
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
                  disabled={!name.trim() || saving}
                  className="flex-1 py-3 rounded-xl bg-blue-gradient text-white font-bold shadow-lg shadow-blue-500/30 hover:brightness-110 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
               >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Crear grupo
               </button>
            </div>
         </motion.div>
      </div>
   );
};

const GroupCard: React.FC<{ group: Group, onClick?: () => void }> = ({ group, onClick }) => {
   const getIcon = () => {
      switch (group.type) {
         case 'trip': return <Plane className="w-5 h-5 text-white" />;
         case 'house': return <Home className="w-5 h-5 text-white" />;
         default: return <Beer className="w-5 h-5 text-white" />;
      }
   };

   const getStatusColor = () => {
      if (group.userBalance > 0) return 'text-emerald-500 dark:text-emerald-400';
      if (group.userBalance < 0) return 'text-orange-500 dark:text-orange-400';
      return 'text-slate-500';
   };

   return (
      <div
         onClick={onClick}
         className="glass-panel rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-pointer relative overflow-hidden active:scale-[0.99]"
      >
         {/* Background Image Fade */}
         <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 mask-linear-gradient pointer-events-none">
            {group.image && <img src={group.image} alt="" className="w-full h-full object-cover" />}
         </div>

         <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
               <div className="size-16 rounded-2xl bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-lg">
                  {group.image ? (
                     <>
                        <div className="absolute inset-0 bg-black/30 z-10" />
                        <img src={group.image} alt={group.name} className="w-full h-full object-cover absolute" />
                        <div className="relative z-20">{getIcon()}</div>
                     </>
                  ) : (
                     <div className="bg-blue-600 w-full h-full flex items-center justify-center">{getIcon()}</div>
                  )}
               </div>

               <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{group.name}</h4>
                  <div className="flex items-center gap-2">
                     <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map(m => (
                           <img key={m.id} src={m.avatar} alt={m.name} className="size-6 rounded-full border-2 border-white dark:border-slate-900" />
                        ))}
                        {group.members.length > 3 && (
                           <div className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
                              +{group.members.length - 3}
                           </div>
                        )}
                     </div>
                     <span className="text-xs text-slate-500 dark:text-slate-400">• {group.lastActivity}</span>
                  </div>
               </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
               <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {group.userBalance === 0 ? 'Estás al día' : (group.userBalance > 0 ? 'Te deben' : 'Debés')}
               </span>
               {group.userBalance !== 0 && (
                  <span className={`text-xl font-black ${getStatusColor()}`}>
                     $ {Math.abs(group.userBalance).toLocaleString('es-AR')}
                  </span>
               )}
               {group.userBalance === 0 && (
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                     <Receipt className="w-3 h-3" />
                     Saldado
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Groups;