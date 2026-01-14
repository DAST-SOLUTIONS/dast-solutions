/**
 * Hooks Entrepreneurs - Gestion des entrepreneurs et sous-traitants
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Entrepreneur {
  id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  rbq_license?: string;
  rbq_status?: string;
  rbq_categories?: string[];
  rbq_expiration?: string;
  specialties?: string[];
  rating?: number;
  notes?: string;
  created_at: string;
  user_id: string;
}

export function useEntrepreneurs() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntrepreneurs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('entrepreneurs')
        .select('*')
        .eq('user_id', user.id)
        .order('company_name');

      if (fetchError) throw fetchError;
      setEntrepreneurs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntrepreneurs();
  }, [fetchEntrepreneurs]);

  return { entrepreneurs, loading, error, refresh: fetchEntrepreneurs };
}

export function useEntrepreneursCRUD() {
  const { entrepreneurs, loading, error, refresh } = useEntrepreneurs();

  const createEntrepreneur = async (data: Partial<Entrepreneur>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('entrepreneurs')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await refresh();
    return newItem;
  };

  const updateEntrepreneur = async (id: string, data: Partial<Entrepreneur>) => {
    const { data: updated, error } = await supabase
      .from('entrepreneurs')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await refresh();
    return updated;
  };

  const deleteEntrepreneur = async (id: string) => {
    const { error } = await supabase.from('entrepreneurs').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const verifyRBQ = async (id: string, licenseNumber: string) => {
    // Import dynamically to avoid circular deps
    const { verifyRBQLicense } = await import('@/services/rbqService');
    const result = await verifyRBQLicense(licenseNumber);
    
    if (result.success) {
      await updateEntrepreneur(id, {
        rbq_status: result.data?.status,
        rbq_categories: result.data?.categories,
        rbq_expiration: result.data?.expirationDate
      });
    }
    
    return result;
  };

  return {
    entrepreneurs,
    loading,
    error,
    createEntrepreneur,
    updateEntrepreneur,
    deleteEntrepreneur,
    verifyRBQ,
    refresh
  };
}

export default useEntrepreneurs;
