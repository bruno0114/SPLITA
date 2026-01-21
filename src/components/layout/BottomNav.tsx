import React, { useState } from 'react';
import { Wallet, LineChart, Users, Sparkles, Plus, X, Receipt, DollarSign, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types/index';

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
      {/* Action Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface rounded-t-[2.5rem] p-8 pb-32 space-y-6 shadow-2xl border-t border-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Acciones rápidas</h3>
                <button onClick={() => setIsMenuOpen(false)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleAction(AppRoute.CATEGORIES)}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl bg-purple-500/10 active:bg-purple-500/20 transition-all group border border-purple-500/20"
                >
                  <div className="size-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <LayoutGrid className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">Ver Categorías</p>
                    <p className="text-xs text-slate-500">Analizar gastos por categoría</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAction()} // TODO: Add specific route if needed, currently just closes menu? The original was buttons that don't nav? No, existing buttons didn't have onClick. I need to check where they go.
                  // The existing buttons were just UI mocks? "Nuevo Gasto Grupal" etc.
                  // The previous code didn't have onClick handlers for the buttons inside the grid!
                  // I should probably make them functional or leave them as is if they are placeholders.
                  // But I'm adding Categories which IS functional.
                  className="w-full flex items-center gap-4 p-5 rounded-3xl bg-blue-500/10 active:bg-blue-500/20 transition-all group border border-blue-500/20"
                >
                  <div className="size-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Nuevo Gasto Grupal</p>
                    <p className="text-xs text-slate-500">Dividir una compra con amigos</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 active:bg-emerald-500/20 transition-all group border border-emerald-500/20">
                  <div className="size-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Nuevo Movimiento Personal</p>
                    <p className="text-xs text-slate-500">Registrar ingreso o gasto propio</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border z-50 pb-safe-area-inset-bottom h-[72px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-2 h-full">

          <div className="flex-1 flex justify-around">
            <NavButton
              active={currentRoute === AppRoute.DASHBOARD_PERSONAL}
              icon={<Wallet className="w-5 h-5" />}
              label="Finanzas"
              onClick={() => handleAction(AppRoute.DASHBOARD_PERSONAL)}
            />
            <NavButton
              active={currentRoute === AppRoute.DASHBOARD_GROUPS || currentRoute === AppRoute.GROUP_DETAILS}
              icon={<Users className="w-5 h-5" />}
              label="Grupos"
              onClick={() => handleAction(AppRoute.DASHBOARD_GROUPS)}
            />
          </div>

          {/* Central Action Button - Tightened */}
          <div className="relative -top-5 px-1">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`size-14 rounded-full bg-blue-gradient text-white flex items-center justify-center shadow-[0_8px_25px_rgba(0,122,255,0.4)] transition-transform duration-200 active:scale-95 ${isMenuOpen ? 'rotate-45' : ''}`}
            >
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 flex justify-around">
            <NavButton
              active={currentRoute === AppRoute.DASHBOARD_HEALTH}
              icon={<LineChart className="w-5 h-5" />}
              label="Salud"
              onClick={() => handleAction(AppRoute.DASHBOARD_HEALTH)}
            />
            <NavButton
              active={currentRoute === AppRoute.IMPORT}
              icon={<Sparkles className="w-5 h-5" />}
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
    className={`flex flex-col items-center justify-center gap-1.5 p-2 w-16 rounded-2xl transition-all ${active
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