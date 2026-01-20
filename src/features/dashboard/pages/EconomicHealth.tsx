import React from 'react';
import { PieChart, TrendingUp, Lightbulb, PiggyBank, AlertTriangle, Rocket, Sparkles, CheckCircle2, Loader2, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEconomicHealth } from '../hooks/useEconomicHealth';

const EconomicHealth: React.FC = () => {
   const { data, loading } = useEconomicHealth();
   const navigate = useNavigate();

   // Score Config
   const score = data.score;
   const radius = 40;
   const circumference = 2 * Math.PI * radius;
   const offset = circumference - (score / 100) * circumference;

   const formatCurrency = (val: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

   if (loading) {
      return (
         <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
      );
   }

   const getScoreColor = () => {
      if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
      if (score >= 60) return 'text-blue-500 dark:text-blue-400';
      if (score >= 40) return 'text-orange-500 dark:text-orange-400';
      return 'text-red-500 dark:text-red-400';
   };

   return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-32">
         <div className="grid grid-cols-12 gap-6 md:gap-8">
            {/* Main Stats Column */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

               {/* Main Score Card */}
               <div className="glass-panel rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-8">
                  <div className="space-y-4 text-center md:text-left z-10">
                     <h2 className="text-slate-500 dark:text-slate-400 font-medium">Score de salud general</h2>
                     <div className="space-y-1">
                        <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{score}<span className="text-2xl text-slate-400 dark:text-slate-500 font-normal ml-1">/100</span></p>
                        <p className={`${getScoreColor()} font-bold text-lg`}>{data.statusLabel}</p>
                     </div>
                     {data.transactionCount > 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                           Basado en {data.transactionCount} movimientos. Tasa de ahorro: {data.savingsRate}%.
                        </p>
                     ) : (
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                           Cargá tus primeros movimientos para calcular tu score.
                        </p>
                     )}
                  </div>

                  {/* Centered Chart SVG */}
                  <div className="relative size-48 flex items-center justify-center flex-shrink-0">
                     <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                           className="text-slate-200 dark:text-white/5"
                           cx="50"
                           cy="50"
                           fill="transparent"
                           r={radius}
                           stroke="currentColor"
                           strokeWidth="8"
                        />
                        {/* Progress Circle */}
                        <circle
                           className="text-blue-500 transition-all duration-1000 ease-out"
                           cx="50"
                           cy="50"
                           fill="transparent"
                           r={radius}
                           stroke="url(#gradient)"
                           strokeWidth="8"
                           strokeDasharray={circumference}
                           strokeDashoffset={offset}
                           strokeLinecap="round"
                        />
                        <defs>
                           <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#007AFF" />
                              <stop offset="100%" stopColor="#0056b3" />
                           </linearGradient>
                        </defs>
                     </svg>
                     <span className="absolute text-3xl font-bold text-slate-900 dark:text-white">{score}%</span>
                  </div>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
               </div>

               {/* AI Analysis Summary */}
               <div className="bg-white dark:bg-[#0F1623] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Análisis con Inteligencia Artificial</h3>
                     </div>
                     {data.isAiLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  </div>

                  <div className="space-y-4">
                     {data.aiInsights && data.aiInsights.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                           {data.aiInsights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-4 bg-blue-500/5 dark:bg-white/5 border border-blue-500/10 rounded-2xl relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50" />
                                 <div className="size-6 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                 </div>
                                 <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{insight}</p>
                              </div>
                           ))}
                        </div>
                     ) : !data.isAiLoading && (
                        <div className="flex flex-col items-center py-6 text-center space-y-4">
                           <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                              <BrainCircuit className="w-6 h-6" />
                           </div>
                           <div className="max-w-xs">
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Potenciá tu análisis con Gemini</p>
                              <p className="text-xs text-slate-500">Configurá tu propia API Key para obtener consejos financieros expertos basados en tus gastos.</p>
                           </div>
                           <button
                              onClick={() => navigate('/settings')}
                              className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                           >
                              Configurar ahora
                           </button>
                        </div>
                     )}

                     {/* Instant Rule-based insights footer */}
                     <div className="pt-4 border-t border-border mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Escaneo rápido</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {data.insights.map((insight, idx) => (
                              <div key={idx} className="flex items-center gap-2 opacity-60">
                                 <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                 <p className="text-[11px] text-slate-500">{insight}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Sub Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-panel rounded-3xl p-6 space-y-4">
                     <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasa de Ahorro</h3>
                     <div className="space-y-1 py-4">
                        <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{data.savingsRate}%</p>
                        <p className="text-xs text-slate-500">del ingreso mensual</p>
                     </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-6 space-y-6">
                     <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos</h3>
                     <div className="space-y-1 py-4">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.monthlyIncome)}</p>
                        <p className="text-xs text-slate-500">este período</p>
                     </div>
                  </div>

                  <div className="glass-panel rounded-3xl p-6 space-y-4">
                     <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gastos</h3>
                     <div className="space-y-1 py-4">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.monthlyExpenses)}</p>
                        <p className="text-xs text-slate-500">este período</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Sidebar Insights */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recomendaciones</h2>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                     <Rocket className="text-primary w-5 h-5" />
                  </div>
               </div>

               <div className="space-y-4">
                  {data.savingsRate < 20 && (
                     <InsightCard
                        icon={<Lightbulb className="w-5 h-5" />}
                        color="text-primary"
                        bg="bg-blue-500/10"
                        title="Aumentá tu ahorro"
                        desc="Intentá ahorrar al menos el 20% de tus ingresos para mejorar tu score."
                     />
                  )}
                  {data.savingsRate >= 20 && (
                     <InsightCard
                        icon={<PiggyBank className="w-5 h-5" />}
                        color="text-emerald-600 dark:text-emerald-400"
                        bg="bg-emerald-500/10"
                        title="¡Excelente ahorro!"
                        desc="Estás ahorrando más del 20% de tus ingresos. ¡Seguí así!"
                        highlight
                     />
                  )}
                  {data.transactionCount < 5 && (
                     <InsightCard
                        icon={<AlertTriangle className="w-5 h-5" />}
                        color="text-orange-600 dark:text-orange-400"
                        bg="bg-orange-500/10"
                        title="Más datos = mejor análisis"
                        desc="Cargá más movimientos para obtener un análisis más preciso."
                     />
                  )}
               </div>

               <div className="bg-blue-gradient rounded-2xl p-6 relative overflow-hidden mt-8 group cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all text-white">
                  <div className="relative z-10 space-y-2">
                     <p className="text-xs font-bold uppercase opacity-80">Plan Premium</p>
                     <h4 className="font-extrabold text-lg">Desbloqueá consejos avanzados</h4>
                     <button className="bg-white text-[#001A33] px-4 py-2 rounded-lg text-xs font-bold mt-2 hover:bg-slate-100 transition-colors">
                        Saber más
                     </button>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-110 transition-transform">
                     <Rocket className="w-32 h-32" />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const InsightCard = ({ icon, color, bg, title, desc, highlight }: any) => (
   <div className={`glass-panel rounded-2xl p-5 group hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer ${highlight ? 'border-l-2 border-l-primary' : ''}`}>
      <div className="flex gap-4">
         <div className={`size-10 rounded-xl ${bg} flex items-center justify-center ${color} flex-shrink-0`}>
            {icon}
         </div>
         <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
         </div>
      </div>
   </div>
);

export default EconomicHealth;