/**
 * Hooks React pour les données Supabase
 * Remplacent les mock data par des données réelles
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { 
  Project, Takeoff, Estimate, Invoice, Client, 
  Fournisseur, TeamMember, FieldReport, Document,
  Notification, Activity 
} from '../lib/supabase/types';

// Hook générique pour les queries
function useSupabaseQuery<T>(
  tableName: string,
  options?: {
    filter?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    realtime?: boolean;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select('*');

      // Appliquer les filtres
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Appliquer le tri
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Appliquer la limite
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: err } = await query;

      if (err) throw err;
      setData(result as T[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [tableName, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();

    // Subscription realtime si activée
    if (options?.realtime) {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchData, options?.realtime]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== PROJETS ====================

export function useProjects(options?: { status?: string; limit?: number }) {
  return useSupabaseQuery<Project>('projects', {
    filter: options?.status ? { status: options.status } : undefined,
    orderBy: { column: 'updated_at', ascending: false },
    limit: options?.limit,
    realtime: true
  });
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
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

  const updateProject = async (updates: Partial<Project>) => {
    const { data, error: err } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single();

    if (err) throw err;
    setProject(data);
    return data;
  };

  return { project, loading, error, updateProject };
}

export function useCreateProject() {
  const [loading, setLoading] = useState(false);

  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          user_id: user?.id
        })
        .select()
        .single();

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
  return useSupabaseQuery<Takeoff>('takeoffs', {
    filter: projectId ? { project_id: projectId } : undefined,
    orderBy: { column: 'updated_at', ascending: false },
    realtime: true
  });
}

export function useTakeoff(takeoffId: string) {
  const [takeoff, setTakeoff] = useState<Takeoff | null>(null);
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

  const updateTakeoff = async (updates: Partial<Takeoff>) => {
    const { data } = await supabase
      .from('takeoffs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', takeoffId)
      .select()
      .single();
    setTakeoff(data);
    return data;
  };

  return { takeoff, loading, updateTakeoff };
}

// ==================== FACTURES ====================

export function useInvoices(options?: { status?: string; projectId?: string }) {
  const filter: Record<string, any> = {};
  if (options?.status) filter.status = options.status;
  if (options?.projectId) filter.project_id = options.projectId;

  return useSupabaseQuery<Invoice>('invoices', {
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    orderBy: { column: 'issue_date', ascending: false },
    realtime: true
  });
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
      
      if (invoices) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        setStats({
          total: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
          paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0),
          pending: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.total || 0), 0),
          overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total || 0), 0),
          thisMonth: invoices
            .filter(inv => new Date(inv.issue_date) >= startOfMonth)
            .reduce((sum, inv) => sum + (inv.total || 0), 0)
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
  return useSupabaseQuery<Client>('clients', {
    orderBy: { column: 'company_name', ascending: true },
    limit: options?.limit
  });
}

// ==================== FOURNISSEURS ====================

export function useFournisseurs(category?: string) {
  return useSupabaseQuery<Fournisseur>('fournisseurs', {
    filter: category ? { category } : undefined,
    orderBy: { column: 'company_name', ascending: true }
  });
}

// ==================== ÉQUIPE ====================

export function useTeamMembers(projectId?: string) {
  return useSupabaseQuery<TeamMember>('team_members', {
    filter: projectId ? { project_id: projectId } : undefined,
    orderBy: { column: 'name', ascending: true }
  });
}

// ==================== RAPPORTS TERRAIN ====================

export function useFieldReports(projectId: string) {
  return useSupabaseQuery<FieldReport>('field_reports', {
    filter: { project_id: projectId },
    orderBy: { column: 'date', ascending: false }
  });
}

// ==================== DOCUMENTS ====================

export function useDocuments(projectId?: string) {
  return useSupabaseQuery<Document>('documents', {
    filter: projectId ? { project_id: projectId } : undefined,
    orderBy: { column: 'created_at', ascending: false }
  });
}

// ==================== NOTIFICATIONS ====================

export function useNotifications() {
  const { data, loading, refetch } = useSupabaseQuery<Notification>('notifications', {
    orderBy: { column: 'created_at', ascending: false },
    limit: 50,
    realtime: true
  });

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    refetch();
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false);
    refetch();
  };

  const unreadCount = data.filter(n => !n.read).length;

  return { notifications: data, loading, unreadCount, markAsRead, markAllAsRead };
}

// ==================== ACTIVITÉS ====================

export function useActivities(options?: { projectId?: string; limit?: number }) {
  return useSupabaseQuery<Activity>('activities', {
    filter: options?.projectId ? { project_id: options.projectId } : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: options?.limit || 20
  });
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
        // Projets
        const { data: projects } = await supabase.from('projects').select('status');
        
        // Factures
        const { data: invoices } = await supabase.from('invoices').select('status, total');
        
        // Équipe
        const { data: team } = await supabase.from('team_members').select('id').eq('status', 'active');
        
        // Takeoffs ce mois
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const { data: takeoffs } = await supabase
          .from('takeoffs')
          .select('id')
          .gte('created_at', startOfMonth.toISOString());

        setStats({
          projectsActive: projects?.filter(p => p.status === 'active').length || 0,
          projectsTotal: projects?.length || 0,
          totalRevenue: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0) || 0,
          pendingInvoices: invoices?.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0) || 0,
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

    // Check pending items in IndexedDB
    const checkPending = async () => {
      try {
        const pending = localStorage.getItem('pending_sync_count');
        setPendingSync(parseInt(pending || '0', 10));
      } catch {
        // Ignore
      }
    };
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingSync };
}
