
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
    // Get state from context
    const { user, session, loading, signOut } = useAuthContext();

    // Define actions that interact with Supabase directly
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/onboarding`,
            },
        });
        if (error) throw error;
    };

    const signInWithPassword = async ({ email, password }: any) => {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signUp = async ({ email, password, options }: any) => {
        return await supabase.auth.signUp({
            email,
            password,
            options
        });
    };

    const signInWithOAuth = async (args: any) => {
        return await supabase.auth.signInWithOAuth(args);
    }

    return {
        // State
        user,
        session,
        loading,

        // Actions
        signOut,
        signInWithGoogle,
        signInWithPassword,
        signUp,
        signInWithOAuth
    };
};
