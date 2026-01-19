import React from 'react';
import { PieChart, TrendingUp, Lightbulb, PiggyBank, AlertTriangle, Rocket, Sparkles, CheckCircle2 } from 'lucide-react';

const EconomicHealth: React.FC = () => {
  // Score Config
  const score = 85;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

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
                <p className="text-emerald-500 dark:text-emerald-400 font-bold text-lg">Muy buena</p>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">Tus finanzas están en un gran momento. Has cumplido el 92% de tus metas este mes.</p>
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

          {/* AI Analysis Summary (Google-like) */}
          <div className="bg-white dark:bg-[#0F1623] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
             
             <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Análisis de Gemini</h3>
             </div>
             
             <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                   Tu puntuación de <strong className="text-slate-900 dark:text-white">85/100</strong> se basa en un excelente manejo de la deuda (menos del 10% de tus ingresos) y una tasa de ahorro consistente del 20%.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white">Fondo de emergencia</p>
                         <p className="text-[11px] text-slate-500">Cubierto por 3 meses</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                         <p className="text-xs font-bold text-slate-900 dark:text-white">Pagos al día</p>
                         <p className="text-[11px] text-slate-500">Sin deudas vencidas</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Sub Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="glass-panel rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Distribución</h3>
                <div className="flex items-center justify-center py-4">
                   <div className="relative size-24 rounded-full border-[6px] border-primary border-t-slate-200 dark:border-t-white/10 flex items-center justify-center">
                      <PieChart className="text-slate-400 w-8 h-8" />
                   </div>
                </div>
                <div className="space-y-1 text-center md:text-left">
                   <p className="text-xl font-bold text-slate-900 dark:text-white">Gastos fijos</p>
                   <p className="text-xs text-slate-500">62% del ingreso mensual</p>
                </div>
             </div>

             <div className="glass-panel rounded-3xl p-6 space-y-6">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meta de ahorro</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">$125.000</p>
                      <p className="text-xs text-slate-500">75%</p>
                   </div>
                   <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-gradient h-full w-3/4 shadow-[0_0_10px_rgba(0,122,255,0.5)]"></div>
                   </div>
                   <p className="text-xs text-slate-500">Faltan $41.000 para tu meta: <span className="text-slate-900 dark:text-white font-medium">Viaje Japón</span></p>
                </div>
             </div>

             <div className="glass-panel rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gasto diario</h3>
                <div className="space-y-1 py-4">
                   <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">$8.450</p>
                   <p className="text-xs text-slate-500 italic">Monto sugerido para hoy</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">
                   <TrendingUp className="w-4 h-4" />
                   <span>+12% vs ayer</span>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recomendaciones AI</h2>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                 <Rocket className="text-primary w-5 h-5" />
              </div>
           </div>
           
           <div className="space-y-4">
              <InsightCard 
                 icon={<Lightbulb className="w-5 h-5" />} 
                 color="text-primary" 
                 bg="bg-blue-500/10" 
                 title="Reducir suscripciones" 
                 desc="Detectamos 2 servicios de streaming que no usaste en 30 días. Podrías ahorrar $5.400/mes."
              />
              <InsightCard 
                 icon={<PiggyBank className="w-5 h-5" />} 
                 color="text-emerald-600 dark:text-emerald-400" 
                 bg="bg-emerald-500/10" 
                 title="Optimización de ahorro" 
                 desc="Tu capacidad de ahorro subió. ¿Querés ajustar tu meta de 'Fondo de Emergencia'?"
                 highlight
              />
              <InsightCard 
                 icon={<AlertTriangle className="w-5 h-5" />} 
                 color="text-orange-600 dark:text-orange-400" 
                 bg="bg-orange-500/10" 
                 title="Gasto en 'Cafés' fuera de rango" 
                 desc="Llevas gastado un 15% más que el promedio mensual en esta categoría."
              />
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