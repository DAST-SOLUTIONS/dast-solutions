/**
 * Hooks React pour les données Supabase
 * Utilise 'any' pour éviter les erreurs TypeScript strictes
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

// ==================== PROJETS ====================

export function useProjects(options?: { status?: string; limit?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: err } = await query;
      if (err) throw err;
      setData(result || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options?.status, options?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (err) throw err;
        setProject(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchProject();
  }, [projectId]);

  const updateProject = async (updates: any) => {
    const { data, error: err } = await (supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single() as any);

    if (err) throw err;
    setProject(data);
    return data;
  };

  return { project, loading, error, updateProject };
}

export function useCreateProject() {
  const [loading, setLoading] = useState(false);

  const createProject = async (project: any) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await (supabase
        .from('projects')
        .insert({
          ...project,
          user_id: userData.user?.id
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { createProject, loading };
}

// ==================== TAKEOFFS ====================

export function useTakeoffs(projectId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        let query = supabase
          .from('takeoffs')
          .select('*')
          .order('updated_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data: result, error: err } = await query;
        if (err) throw err;
        setData(result || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  return { data, loading, error };
}

export function useTakeoff(takeoffId: string) {
  const [takeoff, setTakeoff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('takeoffs')
        .select('*')
        .eq('id', takeoffId)
        .single();
      setTakeoff(data);
      setLoading(false);
    };
    if (takeoffId) fetch();
  }, [takeoffId]);

  const updateTakeoff = async (updates: any) => {
    const { data } = await (supabase
      .from('takeoffs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', takeoffId)
      .select()
      .single() as any);
    setTakeoff(data);
    return data;
  };

  return { takeoff, loading, updateTakeoff };
}

// ==================== FACTURES ====================

export function useInvoices(options?: { status?: string; projectId?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        let query = supabase
          .from('invoices')
          .select('*')
          .order('issue_date', { ascending: false });

        if (options?.status) {
          query = query.eq('status', options.status);
        }
        if (options?.projectId) {
          query = query.eq('project_id', options.projectId);
        }

        const { data: result, error: err } = await query;
        if (err) throw err;
        setData(result || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [options?.status, options?.projectId]);

  return { data, loading, error };
}

export function useInvoiceStats() {
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: invoices } = await supabase.from('invoices').select('*');
      
      if (invoices && invoices.length > 0) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        setStats({
          total: invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
          paid: invoices.filter((inv: any) => inv.status === 'paid').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
          pending: invoices.filter((inv: any) => inv.status === 'sent').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
          overdue: invoices.filter((inv: any) => inv.status === 'overdue').reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
          thisMonth: invoices
            .filter((inv: any) => new Date(inv.issue_date) >= startOfMonth)
            .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
        });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { stats, loading };
}

// ==================== CLIENTS ====================

export function useClients(options?: { limit?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result } = await query;
      setData(result || []);
      setLoading(false);
    };
    fetch();
  }, [options?.limit]);

  return { data, loading };
}

// ==================== FOURNISSEURS ====================

export function useFournisseurs(category?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('fournisseurs')
        .select('*')
        .order('company_name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data: result } = await query;
      setData(result || []);
      setLoading(false);
    };
    fetch();
  }, [category]);

  return { data, loading };
}

// ==================== ÉQUIPE ====================

export function useTeamMembers(projectId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: result } = await query;
      setData(result || []);
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  return { data, loading };
}

// ==================== RAPPORTS TERRAIN ====================

export function useFieldReports(projectId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result } = await supabase
        .from('field_reports')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      setData(result || []);
      setLoading(false);
    };
    if (projectId) fetch();
  }, [projectId]);

  return { data, loading };
}

// ==================== DOCUMENTS ====================

export function useDocuments(projectId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: result } = await query;
      setData(result || []);
      setLoading(false);
    };
    fetch();
  }, [projectId]);

  return { data, loading };
}

// ==================== NOTIFICATIONS ====================

export function useNotifications() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: result } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    setData(result || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsRead = async (id: string) => {
    await (supabase.from('notifications').update({ read: true } as any).eq('id', id) as any);
    fetchData();
  };

  const markAllAsRead = async () => {
    const { data: userData } = await supabase.auth.getUser();
    await (supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('user_id', userData.user?.id)
      .eq('read', false) as any);
    fetchData();
  };

  const unreadCount = data.filter((n: any) => !n.read).length;

  return { notifications: data, loading, unreadCount, markAsRead, markAllAsRead };
}

// ==================== ACTIVITÉS ====================

export function useActivities(options?: { projectId?: string; limit?: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 20);

      if (options?.projectId) {
        query = query.eq('project_id', options.projectId);
      }

      const { data: result } = await query;
      setData(result || []);
      setLoading(false);
    };
    fetch();
  }, [options?.projectId, options?.limit]);

  return { data, loading };
}

// ==================== DASHBOARD STATS ====================

export function useDashboardStats() {
  const [stats, setStats] = useState({
    projectsActive: 0,
    projectsTotal: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    teamSize: 0,
    takeoffsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: projects } = await supabase.from('projects').select('status');
        const { data: invoices } = await supabase.from('invoices').select('status, total');
        const { data: team } = await supabase.from('team_members').select('id').eq('status', 'active');
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { data: takeoffs } = await supabase
          .from('takeoffs')
          .select('id')
          .gte('created_at', startOfMonth.toISOString());

        const projectsArr = projects || [];
        const invoicesArr = invoices || [];

        setStats({
          projectsActive: projectsArr.filter((p: any) => p.status === 'active').length,
          projectsTotal: projectsArr.length,
          totalRevenue: invoicesArr.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          pendingInvoices: invoicesArr.filter((i: any) => i.status === 'sent' || i.status === 'overdue').reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          teamSize: team?.length || 0,
          takeoffsThisMonth: takeoffs?.length || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { stats, loading };
}

// ==================== OFFLINE SUPPORT ====================

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pending = localStorage.getItem('pending_sync_count');
    setPendingSync(parseInt(pending || '0', 10));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingSync };
}
