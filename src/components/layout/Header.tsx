import React, { useState, useEffect } from 'react';
import { ChevronRight, Sun, Moon, Monitor, Bell, Menu, X, LogOut, Settings, Split, ChevronDown, Check, Coins } from 'lucide-react';
import { AppRoute, Theme } from '@/types/index';
import { useCurrency } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/settings/hooks/useProfile';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

interface HeaderProps {
  title: string;
  route: AppRoute;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentTheme, onThemeChange, onNavigate, onLogout }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { currency, setCurrency, rateSource, setRateSource, exchangeRate, loading: ratesLoading } = useCurrency();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  // Get user display data from profile (synced with social/manual updates)
  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=007AFF&color=fff`;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [menuOrigin, setMenuOrigin] = useState({ x: 0, y: 0 });

  const getThemeBtnClass = (theme: Theme) => `size-8 flex items-center justify-center rounded-full transition-all ${currentTheme === theme ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`;

  const toggleMobileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Capture click position for the ripple effect origin
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-12 sticky top-0 z-30 transition-all duration-300">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden p-2 text-slate-900 dark:text-white relative z-50 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Split className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Splita</span>
          </div>

          {/* Desktop Breadcrumbs / Title */}
          <div className="hidden md:flex items-center gap-2 text-sm font-semibold">
            <span className="text-slate-500">Menú principal</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-slate-900 dark:text-white text-base">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">

          {/* Currency Switcher */}
          <div className="relative">
            <div className="flex items-center bg-surface border border-border rounded-full p-0.5 h-8 md:h-9">
              <button
                onClick={() => setCurrency('ARS')}
                className={`relative z-10 px-3 h-full flex items-center text-[10px] md:text-xs font-black transition-colors rounded-full ${currency === 'ARS' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ARS
              </button>
              <button
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className={`relative z-10 pl-3 pr-2 h-full flex items-center gap-1 text-[10px] md:text-xs font-black transition-colors rounded-full ${currency === 'USD' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                USD
                <ChevronDown className={`w-3 h-3 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown for USD Source */}
            <AnimatePresence>
              {isCurrencyDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsCurrencyDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-surface/90 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-border/50">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1">Tipo de cambio</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => { setCurrency('USD'); setRateSource('blue'); setIsCurrencyDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${rateSource === 'blue' ? 'bg-blue-500/10 text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold">Dolar Blue</p>
                          <p className="text-[10px] opacity-70">S {exchangeRate.toLocaleString()}</p>
                        </div>
                        {rateSource === 'blue' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setCurrency('USD'); setRateSource('cripto'); setIsCurrencyDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${rateSource === 'cripto' ? 'bg-blue-500/10 text-blue-600' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold">Dolar Cripto</p>
                          <p className="text-[10px] opacity-70">USD P2P / Exchange</p>
                        </div>
                        {rateSource === 'cripto' && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                    {ratesLoading && (
                      <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] flex items-center justify-center">
                        <Coins className="w-5 h-5 text-blue-500 animate-bounce" />
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-surface border border-border p-1 rounded-full">
            <button onClick={() => onThemeChange('light')} className={getThemeBtnClass('light')}>
              <Sun className="w-4 h-4" />
            </button>
            <button onClick={() => onThemeChange('dark')} className={getThemeBtnClass('dark')}>
              <Moon className="w-4 h-4" />
            </button>
            <button onClick={() => onThemeChange('system')} className={getThemeBtnClass('system')}>
              <Monitor className="w-4 h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-border mx-1 hidden md:block"></div>
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative size-9 md:size-10 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 size-2 bg-red-500 rounded-full border border-background"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-surface/90 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-border/50 flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Notificaciones</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => { await markAllRead(); }}
                          className="text-[10px] font-black text-primary uppercase tracking-widest px-2 hover:underline"
                        >
                          Leer todas
                        </button>
                      )}
                    </div>
                    <div className="p-2 max-h-[360px] overflow-y-auto custom-scrollbar space-y-2">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-xs font-semibold text-slate-500 text-center">No hay notificaciones nuevas.</div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read_at) {
                                markRead(notification.id);
                              }
                              if (notification.group_id) {
                                setIsNotificationsOpen(false);
                                navigate(`/grupos/${notification.group_id}`);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${notification.read_at
                              ? 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                              : 'bg-blue-500/10 text-slate-900 dark:text-white hover:bg-blue-500/15'}
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold truncate">{notification.title}</p>
                              {!notification.read_at && (
                                <span className="ml-2 size-2 rounded-full bg-red-500" />
                              )}
                            </div>
                            {notification.body && (
                              <p className="text-[11px] opacity-70 mt-1 line-clamp-2">{notification.body}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Logout - Only visible on desktop */}
          <div className="hidden md:flex items-center">
            <div className="h-6 w-px bg-border mx-1"></div>
            <button
              onClick={onLogout}
              className="relative size-10 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-slate-400 hover:text-red-500 border-transparent hover:border-red-200 dark:hover:border-red-800"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Creative Circular Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          clipPath: isMobileMenuOpen
            ? `circle(150% at ${menuOrigin.x}px ${menuOrigin.y}px)`
            : `circle(0% at ${menuOrigin.x}px ${menuOrigin.y}px)`,
          background: 'var(--surface-color)', // Uses CSS variable for dynamic theme bg
        }}
      >
        <div className="w-full h-full bg-surface relative flex flex-col">
          {/* Close Button Area */}
          <div className="flex justify-between items-center p-6">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Split className="text-white w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Splita</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="size-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white active:scale-95 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">

            {/* Mobile User Profile Header */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div
                className="size-20 rounded-full border-4 border-white dark:border-slate-700 overflow-hidden bg-cover bg-center shadow-xl"
                style={{ backgroundImage: `url(${userAvatar})` }}
              />
              <div className="text-center">
                <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{userDisplayName}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Plan Gratuito</p>
              </div>
            </div>

            <nav className="flex flex-col gap-4 w-full max-w-sm">
              <MobileMenuItem
                label="Configuración"
                icon={<Settings />}
                onClick={() => { onNavigate(AppRoute.SETTINGS); setIsMobileMenuOpen(false); }}
              />
              <MobileMenuItem
                label="Cerrar Sesión"
                icon={<LogOut />}
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
              />

              <div className="h-px bg-border w-full my-6 opacity-50" />

              <div className="flex flex-col gap-4">
                <p className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest">Apariencia</p>
                <div className="flex justify-center gap-4">
                  <ThemeButton active={currentTheme === 'light'} icon={<Sun className="w-6 h-6" />} onClick={() => onThemeChange('light')} label="Claro" />
                  <ThemeButton active={currentTheme === 'dark'} icon={<Moon className="w-6 h-6" />} onClick={() => onThemeChange('dark')} label="Oscuro" />
                  <ThemeButton active={currentTheme === 'system'} icon={<Monitor className="w-6 h-6" />} onClick={() => onThemeChange('system')} label="Sistema" />
                </div>
              </div>
            </nav>
          </div>

          <div className="p-6 text-center">
            <p className="text-xs text-slate-400 font-medium">Versión 1.0.2</p>
          </div>
        </div>
      </div>
    </>
  );
};

const MobileMenuItem = ({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 active:scale-98 transition-all group border border-transparent hover:border-border"
  >
    <div className="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-xl font-bold text-slate-900 dark:text-white">{label}</span>
    <div className="flex-1" />
    <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
  </button>
);

const ThemeButton = ({ active, icon, onClick, label }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all w-24 ${active ? 'bg-primary/10 border-primary text-primary' : 'bg-transparent border-border text-slate-400'}`}
  >
    {icon}
    <span className="text-xs font-bold">{label}</span>
  </button>
);

export default Header;
