import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppRoute, Theme } from '@/types/index';
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
import Categories from '@/features/analytics/pages/Categories';
import CategoryDetail from '@/features/analytics/pages/CategoryDetail';
import AIHistory from '@/features/expenses/pages/AIHistory';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';

// Helper component for legacy redirect
const RedirectToJoin: React.FC = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    return <Navigate to={`/unirse/${inviteCode}`} replace />;
};

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
        }
        return 'dark';
    });
    const { user, signOut } = useAuthContext();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const syncOnboarding = async () => {
            if (!user) return;

            // Handle Invite/Deep Link Redirects
            const redirectPath = localStorage.getItem('splita_redirect_path');
            if (redirectPath) {
                const currentFn = () => location.pathname + location.search + location.hash;

                // Loop Guard: If we are already there, don't redirect again
                if (currentFn() !== redirectPath) {
                    navigate(redirectPath, { replace: true });
                }

                // Clear only after successful check/redirect
                localStorage.removeItem('splita_redirect_path');
                return; // Prioritize redirect over onboarding sync
            }

            const pendingData = localStorage.getItem('pending_onboarding');
            if (pendingData) {
                try {
                    const onboardingData = JSON.parse(pendingData);
                    const { supabase } = await import('@/lib/supabase');

                    // 1. Save user settings
                    await supabase
                        .from('user_settings')
                        .upsert({
                            user_id: user.id,
                            usage_type: onboardingData.usageType,
                            detect_recurring: onboardingData.settings.detectRecurring,
                            split_default: onboardingData.settings.splitDefault,
                            notify_new: onboardingData.settings.notifyNew
                        });

                    // 2. Create group if needed
                    if (onboardingData.groupName) {
                        const { data: group } = await supabase
                            .from('groups')
                            .insert({
                                name: onboardingData.groupName,
                                type: onboardingData.usageType === 'solo' ? 'other' : onboardingData.usageType,
                                created_by: user.id
                            })
                            .select()
                            .single();

                        if (group) {
                            await supabase
                                .from('group_members')
                                .insert({
                                    group_id: group.id,
                                    user_id: user.id,
                                    role: 'admin'
                                });
                        }
                    }

                    // 3. Clear and notify
                    localStorage.removeItem('pending_onboarding');
                    console.log('Onboarding synced successfully');
                } catch (err) {
                    console.error('Error syncing onboarding data:', err);
                }
            }
        };

        syncOnboarding();
    }, [user]);

    const getRouteTitle = (pathname: string): string => {
        // Handle dynamic routes first
        if (pathname.startsWith('/grupos/') && pathname !== '/grupos') return 'Detalle del grupo';
        if (pathname.startsWith('/categorias/') && pathname !== '/categorias') return 'Detalle de categoría';
        if (pathname.startsWith('/unirse/')) return 'Unirse al grupo';

        switch (pathname) {
            case AppRoute.DASHBOARD_PERSONAL: return 'Finanzas personales';
            case AppRoute.DASHBOARD_HEALTH: return 'Salud económica';
            case AppRoute.DASHBOARD_GROUPS: return 'Mis grupos';
            case AppRoute.IMPORT: return 'Importar gastos IA';
            case AppRoute.SETTINGS: return 'Configuración';
            case AppRoute.CATEGORIES: return 'Categorías';
            case AppRoute.AI_HISTORY: return 'Historial AI';
            default: return 'Splita';
        }
    };

    const currentRoute = location.pathname as AppRoute;

    // Handle Theme Logic (consolidated)
    useEffect(() => {
        localStorage.setItem('theme', theme);
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
        if (route === AppRoute.GROUP_DETAILS) {
            if (selectedGroupId) navigate(AppRoute.DASHBOARD_GROUPS + '/' + selectedGroupId);
            else navigate(AppRoute.DASHBOARD_GROUPS);
        } else {
            navigate(route);
        }
    };

    const handleLogOut = async () => {
        try {
            await signOut();
            navigate(AppRoute.LOGIN);
        } catch (err) {
            console.error("Error signing out:", err);
            navigate(AppRoute.LOGIN);
        }
    };

    const handleGroupSelect = (groupId: string) => {
        setSelectedGroupId(groupId);
        navigate(AppRoute.DASHBOARD_GROUPS + '/' + groupId);
    };

    const isAuthRoute = location.pathname === AppRoute.LOGIN || location.pathname === AppRoute.ONBOARDING;

    if (isAuthRoute) {
        return (
            <Routes>
                <Route path={AppRoute.LOGIN} element={<Login onLogin={() => navigate(AppRoute.DASHBOARD_PERSONAL)} onRegister={() => navigate(AppRoute.ONBOARDING)} />} />
                <Route path={AppRoute.ONBOARDING} element={<Onboarding onComplete={() => navigate(AppRoute.DASHBOARD_PERSONAL)} onLogin={() => navigate(AppRoute.LOGIN)} />} />
            </Routes>
        );
    }

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

            {/* Sidebar */}
            <div className={sidebarClassName}>
                <Sidebar
                    currentRoute={currentRoute}
                    onNavigate={handleNavigate}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onLogout={handleLogOut}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 z-10 bg-background/50">
                <Header
                    title={getRouteTitle(location.pathname)}
                    route={currentRoute}
                    currentTheme={theme}
                    onThemeChange={setTheme}
                    onNavigate={handleNavigate}
                    onLogout={handleLogOut}
                />
                <main className="flex-1 overflow-y-auto relative scroll-smooth pb-[calc(88px+env(safe-area-inset-bottom)+1rem)] md:pb-0">
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            <Route path={AppRoute.DASHBOARD_PERSONAL} element={<PersonalFinance />} />
                            <Route path={AppRoute.DASHBOARD_HEALTH} element={<EconomicHealth />} />
                            <Route path={AppRoute.DASHBOARD_GROUPS} element={<Groups onGroupSelect={handleGroupSelect} />} />
                            <Route path={AppRoute.GROUP_DETAILS} element={<GroupDetails groupId={selectedGroupId} onBack={() => navigate(AppRoute.DASHBOARD_GROUPS)} />} />
                            <Route path={AppRoute.CATEGORIES} element={<Categories />} />
                            <Route path={`${AppRoute.CATEGORIES}/:scope/:categoryId`} element={<CategoryDetail />} />
                            <Route path={AppRoute.IMPORT} element={<ImportExpenses />} />
                            <Route path={AppRoute.AI_HISTORY} element={<AIHistory />} />
                            <Route path={AppRoute.SETTINGS} element={<Settings />} />
                        </Route>
                        <Route path="/unirse/:inviteCode" element={<JoinGroup />} />
                        {/* Backward compatibility for legacy links */}
                        <Route path="/join/:inviteCode" element={<RedirectToJoin />} />
                        <Route path="*" element={<Navigate to={AppRoute.DASHBOARD_PERSONAL} replace />} />
                    </Routes>
                </main>

                {/* Bottom Nav */}
                <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
            </div>
        </div>
    );
};

export default App;
