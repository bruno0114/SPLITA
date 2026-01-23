import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface NotificationItem {
  id: string;
  user_id: string;
  group_id: string | null;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
}

interface CreateNotificationInput {
  userId: string;
  groupId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, any> | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as NotificationItem[]);
    } catch (err) {
      console.error('[useNotifications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read_at).length, [notifications]);

  const markRead = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch (err) {
      console.error('[useNotifications] Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }));
    } catch (err) {
      console.error('[useNotifications] Mark all read error:', err);
    }
  };

  const createNotifications = async (items: CreateNotificationInput[]) => {
    if (!items.length) return { error: null };

    try {
      const { error } = await supabase
        .from('notifications')
        .insert(items.map(item => ({
          user_id: item.userId,
          group_id: item.groupId || null,
          type: item.type,
          title: item.title,
          body: item.body || null,
          metadata: item.metadata || null
        })));

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('[useNotifications] Create error:', err);
      return { error: err.message || 'Error creating notifications' };
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
    createNotifications
  };
};
