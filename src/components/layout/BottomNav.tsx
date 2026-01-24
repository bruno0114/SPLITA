import React, { useState } from 'react';
import { Wallet, LineChart, Users, Sparkles, Plus, X, Receipt, DollarSign, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppRoute } from '@/types/index';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/context/GroupsContext';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const { groups } = useGroups();
  const navigate = useNavigate();

  const handleAction = (route?: AppRoute) => {
    setIsMenuOpen(false);
    if (route) onNavigate(route);
  };

  const handleNewPersonal = () => {
    setIsMenuOpen(false);
    navigate(`${AppRoute.DASHBOARD_PERSONAL}?newTransaction=1`);
  };

  const handleNewGroup = () => {
    setIsMenuOpen(false);
    setIsGroupPickerOpen(true);
  };

  const handleSelectGroup = (groupId: string) => {
    setIsGroupPickerOpen(false);
    navigate(`/grupos/${groupId}?newExpense=1`);
  };

  return (
    <>
      {/* Action Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[40] flex flex-col justify-end md:hidden">
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
              className="relative z-[45] bg-surface rounded-t-[2.5rem] p-8 pb-6 space-y-6 shadow-2xl border-t border-border mb-[calc(80px+env(safe-area-inset-bottom))]"
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
                  onClick={handleNewGroup}
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

                <button
                  onClick={handleNewPersonal}
                  className="w-full flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 active:bg-emerald-500/20 transition-all group border border-emerald-500/20"
                >
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border z-50 pb-safe-area-inset-bottom h-[80px] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
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
          <div className="relative -top-3 px-1">
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

      {/* Group Picker */}
      <AnimatePresence>
        {isGroupPickerOpen && (
          <div className="fixed inset-0 z-[40] flex flex-col justify-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGroupPickerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="relative z-[45] bg-surface rounded-t-[2.5rem] p-6 pb-6 space-y-4 shadow-2xl border-t border-border mb-[calc(80px+env(safe-area-inset-bottom))]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Elegí un grupo</h3>
                <button onClick={() => setIsGroupPickerOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {groups.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No tenés grupos. Creá uno para cargar gastos compartidos.
                </div>
              ) : (
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {groups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => handleSelectGroup(group.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-slate-50/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                    >
                      <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                        {group.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{group.name}</p>
                        <p className="text-[11px] text-slate-500">{group.members.length} miembros</p>
                      </div>
                      <Receipt className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
