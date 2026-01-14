/**
 * Hook useClients - Gestion des clients
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Client {
  id: string;
  name: string;
  company_name?: string;
  type: 'entreprise' | 'particulier' | 'company' | 'individual' | 'government';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  contact_name?: string;
  notes?: string;
  status: 'actif' | 'inactif' | 'prospect' | 'active' | 'inactive';
  total_projects?: number;
  total_revenue?: number;
  created_at: string;
  user_id: string;
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Partial<Client>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('clients')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchClients();
    return newItem;
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    const { data: updated, error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchClients();
    return updated;
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const searchClients = (term: string): Client[] => {
    if (!term) return clients;
    const lower = term.toLowerCase();
    return clients.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      c.company_name?.toLowerCase().includes(lower) ||
      c.email?.toLowerCase().includes(lower)
    );
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'actif' || c.status === 'active').length,
    actifs: clients.filter(c => c.status === 'actif' || c.status === 'active').length,
    prospect: clients.filter(c => c.status === 'prospect').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    totalRevenue: clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
  };

  const getStats = () => stats;

  return {
    clients,
    loading,
    error,
    stats,
    getStats,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
    refresh: fetchClients
  };
}

export default useClients;
