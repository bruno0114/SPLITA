import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppRoute, Theme, Currency } from '@/types/index';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import Onboarding from '@/features/auth/pages/Onboarding';
import Login from '@/features/auth/pages/Login';
import ImportExpenses from '@/features/expenses/pages/ImportExpenses';
import PersonalFinance from '@/features/dashboard/pages/PersonalFinance';
import EconomicHealth from '@/features/dashboard/pages/EconomicHealth';
import Groups from '@/features/groups/pages/Groups';
import GroupDetails from '@/features/groups/pages/GroupDetails';
import JoinGroup from '@/features/groups/pages/JoinGroup';
import Settings from '@/features/settings/pages/Settings';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [currency, setCurrency] = useState<Currency>('ARS');
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    const getAppRoute = (pathname: string): AppRoute => {
        switch (pathname) {
            case '/': return AppRoute.DASHBOARD_PERSONAL;
            case '/health': return AppRoute.DASHBOARD_HEALTH;
            case '/groups': return AppRoute.DASHBOARD_GROUPS;
            case '/import': return AppRoute.IMPORT;
            case '/settings': return AppRoute.SETTINGS;
            case '/login': return AppRoute.LOGIN;
            case '/onboarding': return AppRoute.ONBOARDING;
            default:
                if (pathname.startsWith('/groups/')) return AppRoute.DASHBOARD_GROUPS;
                return AppRoute.DASHBOARD_PERSONAL;
        }
    };

    const currentRoute = getAppRoute(location.pathname);

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
        switch (route) {
            case AppRoute.DASHBOARD_PERSONAL: navigate('/'); break;
            case AppRoute.DASHBOARD_HEALTH: navigate('/health'); break;
            case AppRoute.DASHBOARD_GROUPS: navigate('/groups'); break;
            case AppRoute.IMPORT: navigate('/import'); break;
            case AppRoute.SETTINGS: navigate('/settings'); break;
            case AppRoute.LOGIN: navigate('/login'); break;
            case AppRoute.ONBOARDING: navigate('/onboarding'); break;
            case AppRoute.GROUP_DETAILS:
                if (selectedGroupId) navigate('/groups/' + selectedGroupId);
                else navigate('/groups');
                break;
        }
    };

    const handleFinishOnboarding = () => {
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/');
    };

    const handleLogout = () => {
        // AuthContext handles the actual signOut, here we just navigate
        navigate('/login');
    };

    const handleGroupSelect = (groupId: string) => {
        setSelectedGroupId(groupId);
        navigate('/groups/' + groupId);
    };

    const isAuthRoute = location.pathname === '/login' || location.pathname === '/onboarding';

    if (isAuthRoute) {
        return (
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} onRegister={() => navigate('/onboarding')} />} />
                <Route path="/onboarding" element={<Onboarding onComplete={handleFinishOnboarding} onLogin={() => navigate('/login')} />} />
            </Routes>
        );
    }

    // Use string concatenation for className to avoid template literal issues in tool writing
    const sidebarClassName = "hidden md:flex h-full z-20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] " + (isSidebarCollapsed ? "w-20" : "w-64");

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
            <div className={sidebarClassName}>
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
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<PersonalFinance />} />
                            <Route path="/health" element={<EconomicHealth />} />
                            <Route path="/groups" element={<Groups onGroupSelect={handleGroupSelect} />} />
                            <Route path="/groups/:groupId" element={<GroupDetails groupId={selectedGroupId} onBack={() => navigate('/groups')} />} />
                            <Route path="/import" element={<ImportExpenses />} />
                            <Route path="/settings" element={<Settings currentExchangeRate={exchangeRate} onExchangeRateChange={setExchangeRate} />} />
                        </Route>
                        <Route path="/join/:inviteCode" element={<JoinGroup />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
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
