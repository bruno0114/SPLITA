import React from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Receipt, MoreVertical, Plane, Home, Beer, Loader2 } from 'lucide-react';
import { Group } from '@/types/index';
import { useGroups } from '@/features/groups/hooks/useGroups';

interface GroupsProps {
   onGroupSelect?: (groupId: string) => void;
}

const Groups: React.FC<GroupsProps> = ({ onGroupSelect }) => {
   const { groups, loading, createGroup } = useGroups();

   // Calculate totals based on real groups
   const totalOwedToUser = groups.reduce((acc, g) => acc + (g.userBalance > 0 ? g.userBalance : 0), 0);
   const totalUserOwes = groups.reduce((acc, g) => acc + (g.userBalance < 0 ? Math.abs(g.userBalance) : 0), 0);

   const handleCreateGroup = async () => {
      const name = window.prompt("Nombre del grupo:");
      if (!name) return;
      await createGroup(name, 'other');
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
               onClick={handleCreateGroup}
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
                  <div className="text-center py-10 text-slate-500">No tenés grupos activos. ¡Creá uno!</div>
               ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {groups.map(group => (
                        <GroupCard key={group.id} group={group} onClick={() => onGroupSelect?.(group.id)} />
                     ))}
                  </div>
               )}
            </div>

            {/* Sidebar Activity - MOCKED FOR NOW */}
            <div className="lg:col-span-1">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Actividad reciente</h3>
               <div className="glass-panel rounded-2xl p-0 overflow-hidden border border-border">
                  <div className="p-6 text-center text-sm text-slate-500">
                     Próximamente: Actividad en tiempo real de todos tus grupos.
                  </div>
               </div>
            </div>
         </div>
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