import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserPlus, ArrowRight, Loader2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppRoute } from '@/types/index';

const JoinGroup: React.FC = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const { user, loading: authLoading } = useAuth();
    const { getGroupByInviteCode, joinGroup, groups } = useGroups();
    const navigate = useNavigate();

    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        const fetchInviteGroup = async () => {
            if (!inviteCode) return;

            setLoading(true);
            const { data, error } = await getGroupByInviteCode(inviteCode);

            if (error) {
                setError("El enlace de invitación es inválido o el grupo ya no existe.");
            } else {
                setGroup(data);
                // Check if already a member
                if (user && data.members.some((m: any) => m.profiles.id === user.id)) {
                    setIsJoined(true);
                }
            }
            setLoading(false);
        };

        if (!authLoading) {
            fetchInviteGroup();
        }
    }, [inviteCode, user, authLoading]);

    const handleJoin = async () => {
        if (!user) {
            // Redirect to login but save the current path to return after
            const target = location.pathname + location.search + location.hash;
            localStorage.setItem('splita_redirect_path', target);
            navigate(AppRoute.LOGIN);
            return;
        }

        if (!group || !inviteCode) return;

        setJoining(true);
        // Updated: Pass inviteCode directly to secure RPC wrapper
        const { error } = await joinGroup(inviteCode);
        setJoining(false);

        if (error) {
            setError("Error al unirte al grupo: " + error);
        } else {
            setIsJoined(true);
            setTimeout(() => {
                navigate(`/grupos/${group.id}`);
            }, 1000);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-slate-500 font-medium">Cargando invitación...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-blue-500/10 text-blue-600 mb-6 font-black text-2xl">
                        S
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Unirse al Grupo</h1>
                    <p className="text-slate-500 mt-2 font-medium">Te invitaron a compartir gastos</p>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] border-2 border-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    {error ? (
                        <div className="text-center space-y-6">
                            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-bold">{error}</p>
                            <Link to={AppRoute.DASHBOARD_GROUPS} className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                                Volver a mis grupos <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : group ? (
                        <div className="space-y-8 relative z-10">
                            <div className="flex flex-col items-center">
                                <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 overflow-hidden shadow-xl border-2 border-background">
                                    {group.image_url ? (
                                        <img src={group.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{group.name}</h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="flex -space-x-1.5 mr-1">
                                        {group.members.slice(0, 3).map((m: any) => (
                                            <img key={m.profiles.id} src={m.profiles.avatar_url} className="size-5 rounded-full border border-background" />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">
                                        {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'}
                                    </p>
                                </div>
                            </div>

                            {isJoined ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600">
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-bold">Ya sos parte de este grupo.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/grupos/${group.id}`)}
                                        className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all"
                                    >
                                        Ver Grupo <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-500/5 rounded-2xl text-center">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                            Al unirte podrás registrar gastos, ver balances y compartir deudas con los demás miembros.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="w-full py-4 rounded-2xl bg-blue-gradient text-white font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {joining ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                Unirme ahora
                                            </>
                                        )}
                                    </button>

                                    {!user && (
                                        <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                                            Se requiere iniciar sesión
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-sm text-slate-500 font-bold hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        Cancelar y volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default JoinGroup;
