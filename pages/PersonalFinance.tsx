import React from 'react';
import { Plus, ArrowDown, ArrowUp, Users, ShoppingBag, DollarSign, Car, Utensils } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../constants';

const PersonalFinance: React.FC = () => {
  return (
    <div className="px-6 md:px-12 py-6 md:py-10 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Finanzas personales</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestioná tus ahorros y gastos individuales.</p>
        </div>
        <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-gradient px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:brightness-110 transition-all active:scale-95">
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
            <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white">$245.850</span>
            <span className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium">ARS</span>
          </div>
          <div className="mt-6 flex gap-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
              <ArrowUp className="w-3 h-3" />
              +12.5% este mes
            </div>
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
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">$310.200</p>
          </div>
        </div>
        <div className="glass-panel p-5 md:p-6 rounded-2xl flex flex-row md:flex-col items-center md:items-start gap-4 group hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all">
          <div className="size-10 md:size-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
            <ArrowUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Gastos propios</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">$45.320</p>
          </div>
        </div>
        <div className="glass-panel p-5 md:p-6 rounded-2xl flex flex-row md:flex-col items-center md:items-start gap-4 group hover:bg-black/5 dark:hover:bg-white/[0.07] transition-all">
          <div className="size-10 md:size-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">En grupos</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-slate-900 dark:text-white">$19.030</p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Movimientos personales</h3>
          <button className="text-sm text-blue-500 hover:text-blue-600 font-semibold hover:underline">Ver todos</button>
        </div>
        <div className="space-y-3">
          <TransactionCard 
             icon={<ShoppingBag className="w-5 h-5 text-slate-600 dark:text-slate-300" />} 
             bg="bg-slate-100 dark:bg-slate-800" 
             title="Supermercado Coto" 
             subtitle="Compras • Hoy, 14:30" 
             amount="-$12.450" 
             type="Débito"
          />
          <TransactionCard 
             icon={<DollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400" />} 
             bg="bg-blue-500/10 dark:bg-blue-500/20" 
             title="Sueldo Mensual" 
             subtitle="Ingresos • Ayer" 
             amount="+$285.000" 
             type="Transferencia"
             positive
             highlight
          />
          <TransactionCard 
             icon={<Car className="w-5 h-5 text-slate-600 dark:text-slate-300" />} 
             bg="bg-slate-100 dark:bg-slate-800" 
             title="Carga Combustible Shell" 
             subtitle="Transporte • 12 Oct" 
             amount="-$8.900" 
             type="Crédito"
          />
          <TransactionCard 
             icon={<Utensils className="w-5 h-5 text-purple-600 dark:text-purple-400" />} 
             bg="bg-purple-500/10" 
             title="Hamburguesería La Birra" 
             subtitle="Comida • 11 Oct" 
             amount="-$4.200" 
             type="Mercado Pago"
          />
        </div>
      </section>
    </div>
  );
};

const TransactionCard = ({ icon, bg, title, subtitle, amount, type, positive = false, highlight = false }: any) => (
  <div className={`glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-transparent hover:border-black/5 dark:hover:border-white/10 ${highlight ? 'border-l-4 border-l-blue-500' : ''}`}>
    <div className="flex items-center gap-4">
      <div className={`size-12 rounded-xl ${bg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-bold text-sm ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{amount}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-tight">{type}</p>
    </div>
  </div>
);

export default PersonalFinance;