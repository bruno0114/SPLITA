import React, { useState, useEffect } from 'react';
import { ChevronRight, Sun, Moon, Monitor, Bell, Menu, X, DollarSign, LogOut, Settings, Split } from 'lucide-react';
import { AppRoute, Theme, Currency } from '@/types/index';

interface HeaderProps {
  title: string;
  route: AppRoute;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onNavigate: (route: AppRoute) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, currentTheme, onThemeChange, onNavigate, currency, onCurrencyChange, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <div className="flex items-center bg-surface border border-border rounded-full p-0.5 h-8 md:h-9 relative">
            <div
              className={`absolute top-0.5 bottom-0.5 w-[50%] bg-slate-200 dark:bg-slate-700 rounded-full transition-transform duration-300 shadow-sm ${currency === 'USD' ? 'translate-x-[95%]' : 'translate-x-0'}`}
            />
            <button
              onClick={() => onCurrencyChange('ARS')}
              className={`relative z-10 px-3 text-[10px] md:text-xs font-bold transition-colors ${currency === 'ARS' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
            >
              ARS
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`relative z-10 px-3 text-[10px] md:text-xs font-bold transition-colors ${currency === 'USD' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}
            >
              USD
            </button>
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
          <button className="relative size-9 md:size-10 flex items-center justify-center rounded-full bg-surface border border-border hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 size-2 bg-red-500 rounded-full border border-background"></span>
          </button>

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
        className={`fixed inset-0 z-50 md:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
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