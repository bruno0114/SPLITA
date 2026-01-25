import React, { useEffect, useRef, useState } from 'react';
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
import Savings from '@/features/savings/pages/Savings';
import ChatBubble from '@/features/assistant/components/ChatBubble';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useGroups } from '@/context/GroupsContext';
import PremiumConfirmModal from '@/components/ui/PremiumConfirmModal';

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
    const { joinGroup } = useGroups();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [inviteToJoin, setInviteToJoin] = useState<{ inviteCode: string, groupId: string, groupName: string } | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const prevMainRoute = useRef<string | null>(null);

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

                            // Store for redirect
                            localStorage.setItem('splita_new_group_id', group.id);
                        }
                    }

                    // 3. Clear and notify
                    localStorage.removeItem('pending_onboarding');
                    console.log('Onboarding synced successfully');

                    // 4. Handle Redirection to the new group or dashboard
                    const newGroupId = localStorage.getItem('splita_new_group_id');
                    if (newGroupId) {
                        localStorage.removeItem('splita_new_group_id');
                        navigate(`/grupos/${newGroupId}`, { replace: true });
                    }
                } catch (err) {
                    console.error('Error syncing onboarding data:', err);
                }
            }
        };

        syncOnboarding();
    }, [user, navigate]);

    // Invite Observer: Shows a modal if user is authenticated and came from an invite
    useEffect(() => {
        if (!user) return;

        const inviteContext = localStorage.getItem('splita_invite_context');
        if (inviteContext) {
            try {
                const parsed = JSON.parse(inviteContext);
                // Check if user is already a member could be done here, 
                // but joinGroup RPC handles it anyway or we can just show the modal.
                setInviteToJoin(parsed);
                // We keep it in localStorage until they interact with the modal 
                // or we can remove it now and rely on state.
                // localStorage.removeItem('splita_invite_context'); 
            } catch (e) {
                console.error("Error parsing invite context:", e);
                localStorage.removeItem('splita_invite_context');
            }
        }
    }, [user, location.pathname]);

    const handleConfirmJoin = async () => {
        if (!inviteToJoin) return;

        try {
            const { error } = await joinGroup(inviteToJoin.inviteCode);
            if (!error) {
                const gid = inviteToJoin.groupId;
                setInviteToJoin(null);
                localStorage.removeItem('splita_invite_context');
                navigate(`/grupos/${gid}`);
            } else {
                console.error("Join error:", error);
                setInviteToJoin(null);
                localStorage.removeItem('splita_invite_context');
            }
        } catch (e) {
            console.error("Join error:", e);
            setInviteToJoin(null);
            localStorage.removeItem('splita_invite_context');
        }
    };

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

    useEffect(() => {
        document.body.style.overflowX = 'hidden';
        return () => {
            document.body.style.overflowX = '';
        };
    }, []);

    const handleNavigate = (route: AppRoute) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const mainRoutes = new Set<string>([
        AppRoute.DASHBOARD_PERSONAL,
        AppRoute.DASHBOARD_HEALTH,
        AppRoute.DASHBOARD_GROUPS,
        AppRoute.CATEGORIES,
        AppRoute.IMPORT,
        AppRoute.AI_HISTORY,
        AppRoute.SETTINGS,
        AppRoute.SAVINGS
    ]);

    useEffect(() => {
        if (!mainRoutes.has(location.pathname)) return;
        if (prevMainRoute.current !== location.pathname) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            prevMainRoute.current = location.pathname;
        }
    }, [location.pathname]);

    // Public routes: Login, Onboarding, and Invite/Join (no sidebar/header/bottomnav)
    const isPublicRoute =
        location.pathname === AppRoute.LOGIN ||
        location.pathname === AppRoute.ONBOARDING ||
        location.pathname.startsWith('/unirse/') ||
        location.pathname.startsWith('/join/');

    if (isPublicRoute) {
        return (
            <Routes>
                <Route path={AppRoute.LOGIN} element={<Login onLogin={() => navigate(AppRoute.DASHBOARD_PERSONAL)} onRegister={() => navigate(AppRoute.ONBOARDING)} />} />
                <Route path={AppRoute.ONBOARDING} element={<Onboarding onComplete={() => navigate(AppRoute.DASHBOARD_PERSONAL)} onLogin={() => navigate(AppRoute.LOGIN)} />} />
                <Route path="/unirse/:inviteCode" element={<JoinGroup />} />
                <Route path="/join/:inviteCode" element={<RedirectToJoin />} />
            </Routes>
        );
    }

    const sidebarClassName = "hidden md:flex h-full z-20 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] " + (isSidebarCollapsed ? "w-20" : "w-64");

    return (
        <div className="flex min-h-screen w-full bg-background relative text-slate-900 dark:text-slate-100 transition-colors duration-300 items-start">
            {/* Background Ambience */}
            <div className="fixed top-[-10%] right-[-5%] pointer-events-none opacity-10 dark:opacity-20 z-0 transition-opacity duration-300">
                <div className="w-[600px] h-[600px] bg-blue-600 rounded-full blur-[140px]" />
            </div>
            <div className="fixed bottom-[-10%] left-[-5%] pointer-events-none opacity-5 dark:opacity-10 z-0 transition-opacity duration-300">
                <div className="w-[500px] h-[500px] bg-blue-900 rounded-full blur-[120px]" />
            </div>

            {/* Sidebar */}
            <div className={`${sidebarClassName} md:sticky md:top-0 md:h-screen`}>
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
                <main className="relative pb-[calc(140px+env(safe-area-inset-bottom))] md:pb-0">
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            <Route path={AppRoute.DASHBOARD_PERSONAL} element={<PersonalFinance />} />
                            <Route path={AppRoute.DASHBOARD_HEALTH} element={<EconomicHealth />} />
                            <Route path={AppRoute.DASHBOARD_GROUPS} element={<Groups onGroupSelect={handleGroupSelect} />} />
                            <Route path={AppRoute.GROUP_DETAILS} element={<GroupDetails groupId={selectedGroupId} onBack={() => navigate(AppRoute.DASHBOARD_GROUPS)} />} />
                            <Route path={AppRoute.CATEGORIES} element={<Categories />} />
                            <Route path={AppRoute.SAVINGS} element={<Savings />} />
                            <Route path={`${AppRoute.CATEGORIES}/:scope/:categoryId`} element={<CategoryDetail />} />
                            <Route path={AppRoute.IMPORT} element={<ImportExpenses />} />
                            <Route path={AppRoute.AI_HISTORY} element={<AIHistory />} />
                            <Route path={AppRoute.SETTINGS} element={<Settings />} />
                        </Route>
                        <Route path="*" element={<Navigate to={AppRoute.DASHBOARD_PERSONAL} replace />} />
                    </Routes>
                </main>

                {/* Bottom Nav */}
                <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
                <ChatBubble />
            </div>

            {/* Global Invite Confirmation Modal */}
            <PremiumConfirmModal
                isOpen={!!inviteToJoin}
                title="¿Unirse al grupo?"
                message={`Te invitaron a compartir gastos en "${inviteToJoin?.groupName}". ¿Querés unirte ahora?`}
                confirmLabel="Unirme"
                cancelLabel="Ahora no"
                onConfirm={handleConfirmJoin}
                onCancel={() => {
                    setInviteToJoin(null);
                    localStorage.removeItem('splita_invite_context');
                }}
                type="info"
            />
        </div>
    );
};

export default App;
