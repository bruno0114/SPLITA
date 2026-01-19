import React, { useState } from 'react';
import { ChevronLeft, Plus, Settings, Receipt, BarChart3, User, Search, Filter, Share } from 'lucide-react';
import { MOCK_GROUPS, MOCK_TRANSACTIONS } from '../constants';

interface GroupDetailsProps {
  groupId: string | null;
  onBack: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
  const group = MOCK_GROUPS.find(g => g.id === groupId);

  if (!group) return <div>Grupo no encontrado</div>;

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
          onClick={onBack}
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
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-gradient text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all">
                   <Plus className="w-4 h-4" />
                   Añadir gasto
                </button>
             </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="glass-panel p-4 rounded-2xl">
                <p className="text-xs uppercase font-bold text-slate-500 mb-1">Gasto total</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">$ 124.500</p>
             </div>
             <div className="glass-panel p-4 rounded-2xl">
                <p className="text-xs uppercase font-bold text-slate-500 mb-1">Tu gasto</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">$ 45.200</p>
             </div>
             <div className="glass-panel p-4 rounded-2xl relative overflow-hidden">
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${group.userBalance >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                <p className="text-xs uppercase font-bold text-slate-500 mb-1">Tu situación</p>
                <p className={`text-xl font-black ${group.userBalance >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                   {group.userBalance >= 0 ? `+ $${group.userBalance}` : `- $${Math.abs(group.userBalance)}`}
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
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Octubre 2023</div>
                     {MOCK_TRANSACTIONS.map(tx => (
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
                              <p className={`text-xs font-medium ${tx.payer.id === 'u1' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                 {tx.payer.id === 'u1' ? 'Te deben' : 'Debés'}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.members.filter(m => m.id !== 'u1').map(member => (
                     <div key={member.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <img src={member.avatar} alt={member.name} className="size-12 rounded-full border-2 border-surface" />
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                              <p className="text-xs text-slate-500">Debe $12.500 en total</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-semibold text-orange-500 uppercase">Te debe</p>
                           <p className="text-xl font-black text-emerald-500">$ 4.250</p>
                        </div>
                     </div>
                  ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;