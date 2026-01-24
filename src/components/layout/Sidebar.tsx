import React from 'react';
import { Wallet, Users, Upload, Settings, LogOut, Split, LineChart, Sparkles, PanelLeftClose, PanelLeftOpen, PieChart, Clock } from 'lucide-react';
import { AppRoute } from '@/types/index';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/settings/hooks/useProfile';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, isCollapsed, onToggleCollapse, onLogout }) => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Get user display data from profile (synced with social/manual updates)
  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=007AFF&color=fff`;

  return (
    <aside className={`relative border-r border-border bg-surface/80 backdrop-blur-md flex flex-col h-screen transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>

      {/* Header */}
      <div className="h-20 flex items-center px-5 shrink-0 relative">
        <div className={`flex items-center gap-3 transition-all duration-500 ${isCollapsed ? 'w-full justify-center' : ''}`}>
          <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 z-10">
            <Split className="text-white w-5 h-5" />
          </div>

          <div className={`overflow-hidden transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Splita
            </h1>
          </div>
        </div>

        {/* Toggle Button - Visible next to logo area */}
        <button
          onClick={onToggleCollapse}
          className={`absolute z-50 size-7 flex items-center justify-center bg-surface border border-border rounded-full shadow-sm text-slate-500 hover:text-primary hover:border-primary/30 transition-all duration-300 ${isCollapsed ? '-right-3 top-20' : 'right-4 top-1/2 -translate-y-1/2'}`}
        >
          {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 px-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="mb-8">
          <div className={`h-6 mb-2 px-3 flex items-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Principal</p>
          </div>
          <ul className="space-y-1">
            <NavItem
              active={currentRoute === AppRoute.DASHBOARD_PERSONAL}
              icon={<Wallet className="w-[20px] h-[20px]" />}
              label="Finanzas"
              onClick={() => onNavigate(AppRoute.DASHBOARD_PERSONAL)}
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={currentRoute === AppRoute.DASHBOARD_HEALTH}
              icon={<LineChart className="w-[20px] h-[20px]" />}
              label="Salud económica"
              onClick={() => onNavigate(AppRoute.DASHBOARD_HEALTH)}
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={currentRoute === AppRoute.DASHBOARD_GROUPS}
              icon={<Users className="w-[20px] h-[20px]" />}
              label="Mis Grupos"
              onClick={() => onNavigate(AppRoute.DASHBOARD_GROUPS)}
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={currentRoute === AppRoute.CATEGORIES}
              icon={<PieChart className="w-[20px] h-[20px]" />}
              label="Categorías"
              onClick={() => onNavigate(AppRoute.CATEGORIES)}
              isCollapsed={isCollapsed}
            />
            <NavItem
              active={currentRoute === AppRoute.IMPORT}
              icon={
                <div className="relative group-hover:scale-110 transition-transform">
                  <Upload className="w-[20px] h-[20px]" />
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-2 h-2 text-blue-500 animate-[pulse_2s_ease-in-out_infinite]" fill="currentColor" />
                  </div>
                </div>
              }
              label="Importar con IA"
              onClick={() => onNavigate(AppRoute.IMPORT)}
              isCollapsed={isCollapsed}
              highlight
            />
            <NavItem
              active={currentRoute === AppRoute.AI_HISTORY}
              icon={<Clock className="w-[20px] h-[20px]" />}
              label="Historial AI"
              onClick={() => onNavigate(AppRoute.AI_HISTORY)}
              isCollapsed={isCollapsed}
            />
          </ul>
        </div>

        <div>
          <div className={`h-6 mb-2 px-3 flex items-center transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ajustes</p>
          </div>
          <ul className="space-y-1">
            <NavItem
              active={currentRoute === AppRoute.SETTINGS}
              icon={<Settings className="w-[20px] h-[20px]" />}
              label="Configuración"
              onClick={() => onNavigate(AppRoute.SETTINGS)}
              isCollapsed={isCollapsed}
            />
          </ul>
        </div>
      </nav>

      {/* Footer User */}
      <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-black/20 backdrop-blur-sm shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className={`size-9 rounded-full border-2 border-white dark:border-slate-700 overflow-hidden bg-cover bg-center shrink-0 shadow-sm transition-all duration-300 ${isCollapsed ? 'scale-100' : 'scale-100'}`} style={{ backgroundImage: `url(${userAvatar})` }}>
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{userDisplayName}</p>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide truncate">Plan Gratuito</p>
          </div>
          {!isCollapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ active, icon, label, onClick, isCollapsed, highlight }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void, isCollapsed: boolean, highlight?: boolean }) => (
  <li>
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center h-11 rounded-xl transition-all duration-200 group relative overflow-hidden mb-1 ${active
        ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        } ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}
    >
      {active && !isCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />}

      <div className={`shrink-0 flex items-center justify-center transition-transform duration-300 ${isCollapsed && active ? 'scale-110 text-primary' : ''}`}>
        {icon}
      </div>

      {/* Label with smooth collapse transition */}
      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed
        ? 'w-0 opacity-0'
        : 'w-auto opacity-100'
        }`}>
        {label}
      </span>

      {highlight && !active && !isCollapsed && (
        <div className="ml-auto size-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
    </button>
  </li>
);

export default Sidebar;
