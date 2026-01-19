import React, { useState } from 'react';
import { Wallet, LineChart, Users, Sparkles, Plus, X, Receipt, DollarSign } from 'lucide-react';
import { AppRoute } from '../types';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAction = (route?: AppRoute) => {
    setIsMenuOpen(false);
    if (route) onNavigate(route);
  };

  return (
    <>
      {/* Action Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
           <div className="bg-surface rounded-t-[2rem] p-6 pb-28 space-y-4 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Acciones rápidas</h3>
                 <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 active:bg-blue-500/20 transition-colors group">
                 <div className="size-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Nuevo Gasto Grupal</p>
                    <p className="text-xs text-slate-500">Dividir una compra con amigos</p>
                 </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 active:bg-emerald-500/20 transition-colors group">
                 <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <DollarSign className="w-6 h-6" />
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Nuevo Movimiento Personal</p>
                    <p className="text-xs text-slate-500">Registrar ingreso o gasto propio</p>
                 </div>
              </button>
           </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border z-50 pb-safe-area-inset-bottom h-[88px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-end justify-between px-2 h-full pb-4">
          
          <div className="flex-1 flex justify-around">
             <NavButton 
               active={currentRoute === AppRoute.DASHBOARD_PERSONAL} 
               icon={<Wallet className="w-6 h-6" />} 
               label="Finanzas"
               onClick={() => handleAction(AppRoute.DASHBOARD_PERSONAL)} 
             />
             <NavButton 
               active={currentRoute === AppRoute.DASHBOARD_GROUPS || currentRoute === AppRoute.GROUP_DETAILS} 
               icon={<Users className="w-6 h-6" />} 
               label="Grupos"
               onClick={() => handleAction(AppRoute.DASHBOARD_GROUPS)} 
             />
          </div>

          {/* Central Action Button */}
          <div className="relative -top-8 px-2">
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className={`size-16 rounded-full bg-blue-gradient text-white flex items-center justify-center shadow-[0_8px_25px_rgba(0,122,255,0.4)] transition-transform duration-200 active:scale-95 ${isMenuOpen ? 'rotate-45' : ''}`}
             >
                <Plus className="w-8 h-8" strokeWidth={2.5} />
             </button>
          </div>

          <div className="flex-1 flex justify-around">
             <NavButton 
               active={currentRoute === AppRoute.DASHBOARD_HEALTH} 
               icon={<LineChart className="w-6 h-6" />} 
               label="Salud"
               onClick={() => handleAction(AppRoute.DASHBOARD_HEALTH)} 
             />
             <NavButton 
               active={currentRoute === AppRoute.IMPORT} 
               icon={<Sparkles className="w-6 h-6" />} 
               label="Importar IA"
               onClick={() => handleAction(AppRoute.IMPORT)} 
             />
          </div>

        </div>
      </div>
    </>
  );
};

const NavButton = ({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 p-2 w-16 rounded-2xl transition-all ${
      active 
        ? 'text-primary' 
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
    }`}
  >
    <div className={`transition-transform duration-200 ${active ? '-translate-y-1' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>{label}</span>
  </button>
);

export default BottomNav;