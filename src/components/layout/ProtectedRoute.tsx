import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AppRoute } from '@/types/index';

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        const hasVisited = localStorage.getItem('has_visited');
        if (!hasVisited) {
            return <Navigate to={AppRoute.ONBOARDING} replace />;
        }
        return <Navigate to={AppRoute.LOGIN} replace />;
    }

    return <Outlet />;
};
