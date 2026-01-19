import React, { useState, useEffect } from 'react';
import { AppRoute, Theme, Currency } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import ImportExpenses from './pages/ImportExpenses';
import PersonalFinance from './pages/PersonalFinance';
import EconomicHealth from './pages/EconomicHealth';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.ONBOARDING);
  const [theme, setTheme] = useState<Theme>('dark');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Currency State
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [exchangeRate, setExchangeRate] = useState<number>(1); // 1 USD = X ARS

  // Handle Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
  };

  const handleFinishOnboarding = () => {
    // setIsOnboardingComplete(true); // No longer needed as we use explicit routes
    setCurrentRoute(AppRoute.DASHBOARD_PERSONAL);
  };

  const handleLogin = () => {
    setCurrentRoute(AppRoute.DASHBOARD_PERSONAL);
  }

  const handleLogout = () => {
    setCurrentRoute(AppRoute.LOGIN);
  }

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentRoute(AppRoute.GROUP_DETAILS);
  };

  // Auth Routes Container (No Sidebar/Header)
  if (currentRoute === AppRoute.ONBOARDING) {
    return <Onboarding onComplete={handleFinishOnboarding} onLogin={() => setCurrentRoute(AppRoute.LOGIN)} />;
  }

  if (currentRoute === AppRoute.LOGIN) {
    return <Login onLogin={handleLogin} onRegister={() => setCurrentRoute(AppRoute.ONBOARDING)} />;
  }

  // Main App Container
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Background Ambience */}
      <div className="fixed top-[-10%] right-[-5%] pointer-events-none opacity-10 dark:opacity-20 z-0 transition-opacity duration-300">
        <div className="w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px]" />
      </div>
      <div className="fixed bottom-[-10%] left-[-5%] pointer-events-none opacity-5 dark:opacity-10 z-0 transition-opacity duration-300">
        <div className="w-[500px] h-[500px] bg-blue-900 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar - Hidden on mobile, collapsible on desktop */}
      <div className={`hidden md:flex h-full z-20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar 
          currentRoute={currentRoute} 
          onNavigate={handleNavigate} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={handleLogout}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 z-10 bg-background/50">
        <Header 
          title={getRouteTitle(currentRoute)} 
          route={currentRoute} 
          currentTheme={theme}
          onThemeChange={setTheme}
          onNavigate={handleNavigate}
          currency={currency}
          onCurrencyChange={setCurrency}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto relative scroll-smooth pb-24 md:pb-0">
          {currentRoute === AppRoute.DASHBOARD_PERSONAL && <PersonalFinance />}
          {currentRoute === AppRoute.DASHBOARD_HEALTH && <EconomicHealth />}
          {currentRoute === AppRoute.DASHBOARD_GROUPS && <Groups onGroupSelect={handleGroupSelect} />}
          {currentRoute === AppRoute.GROUP_DETAILS && <GroupDetails groupId={selectedGroupId} onBack={() => setCurrentRoute(AppRoute.DASHBOARD_GROUPS)} />}
          {currentRoute === AppRoute.IMPORT && <ImportExpenses />}
          {currentRoute === AppRoute.SETTINGS && <Settings currentExchangeRate={exchangeRate} onExchangeRateChange={setExchangeRate} />}
        </main>
        
        {/* Bottom Nav - Visible on mobile */}
        <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

function getRouteTitle(route: AppRoute): string {
  switch (route) {
    case AppRoute.DASHBOARD_PERSONAL: return 'Finanzas personales';
    case AppRoute.DASHBOARD_HEALTH: return 'Salud económica';
    case AppRoute.DASHBOARD_GROUPS: return 'Mis grupos';
    case AppRoute.GROUP_DETAILS: return 'Detalle del grupo';
    case AppRoute.IMPORT: return 'Importar gastos IA';
    case AppRoute.SETTINGS: return 'Configuración';
    default: return 'Splita';
  }
}

export default App;