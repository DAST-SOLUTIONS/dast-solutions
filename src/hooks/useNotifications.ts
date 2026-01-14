/**
 * Hook useNotifications - Gestion des notifications
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  read_at?: string;
  link?: string;
  created_at: string;
  user_id: string;
  priority?: 'low' | 'medium' | 'high';
  reference_type?: string;
  reference_id?: string;
}

// Constants for UI
export const NOTIFICATION_ICONS = {
  info: 'Info',
  warning: 'AlertTriangle',
  success: 'CheckCircle',
  error: 'XCircle'
};

export const NOTIFICATION_COLORS = {
  info: 'blue',
  warning: 'yellow',
  success: 'green',
  error: 'red'
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from('notifications').update({ read: true, read_at: now }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, read_at: now } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();
    await supabase.from('notifications').update({ read: true, read_at: now }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: now })));
    setUnreadCount(0);
  };

  const dismiss = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const generateReminders = async () => {
    // Generate automatic reminders based on upcoming deadlines
    // This would normally check for upcoming soumission expirations, facture due dates, etc.
    console.log('Generating reminders...');
  };

  const createNotification = async (data: Omit<Notification, 'id' | 'created_at' | 'user_id' | 'read'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notifications').insert([{ ...data, user_id: user.id, read: false }]);
    await fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    generateReminders,
    createNotification,
    refresh: fetchNotifications
  };
}

export default useNotifications;
