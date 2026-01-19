import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Receipt, BarChart3, User, Search, Filter, Share, Loader2 } from 'lucide-react';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useTransactions } from '@/features/expenses/hooks/useTransactions';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
   const { transactions, loading: loadingTx, addTransaction } = useTransactions(groupId);

   const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
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

   const handleAddTransaction = async () => {
      if (!groupId || !group) return;

      // Simple MVP Prompt
      const input = window.prompt("Ingresá el gasto (Formato: Titulo, Monto):", "Cena, 5000");
      if (!input) return;

      const [title, amountStr] = input.split(',');
      if (!title || !amountStr) {
         alert("Formato inválido");
         return;
      }

      const amount = parseFloat(amountStr.trim());
      if (isNaN(amount)) {
         alert("Monto inválido");
         return;
      }

      await addTransaction({
         title: title.trim(),
         amount,
         category: 'General',
         date: new Date().toISOString(),
         splitBetween: group.members.map(m => m.id) // Split with everyone by default
      });
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
            <button className="absolute top-6 right-6 z-20 size-10 rounded-full bg-surface/50 backdrop-blur-md flex items-center justify-center text-slate-900 dark:text-white hover:bg-surface transition-all">
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

                  <div className="flex gap-3 w-full md:w-auto">
                     <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
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
                                    <div className="text-right">
                                       <p className="font-bold text-slate-900 dark:text-white">$ {tx.amount.toLocaleString('es-AR')}</p>
                                       <p className={`text-xs font-medium ${tx.payer.id === user?.id ? 'text-emerald-500' : 'text-orange-500'}`}>
                                          {tx.payer.id === user?.id ? 'Pagaste' : 'Debés (part)'}
                                       </p>
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
      </div>
   );
};

export default GroupDetails;