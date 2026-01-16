import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { SoumissionV2, SoumissionTemplate, SoumissionFilters, SoumissionItem } from '@/types/pricing-types';

export function useSoumissionsV2(filters?: SoumissionFilters) {
  const [soumissions, setSoumissions] = useState<SoumissionV2[]>([]);
  const [templates, setTemplates] = useState<SoumissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSoumissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('soumissions').select('*').eq('user_id', user.id);
      
      if (filters?.statut) query = query.eq('statut', filters.statut);
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      if (filters?.project_id) query = query.eq('project_id', filters.project_id);

      const { data, error: err } = await query.order('date_creation', { ascending: false });
      if (err) throw err;
      setSoumissions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchSoumissions(); }, [fetchSoumissions]);

  const createSoumission = async (data: Partial<SoumissionV2>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: newItem, error } = await supabase.from('soumissions').insert([{ ...data, user_id: user.id }]).select().single();
    if (error) throw error;
    await fetchSoumissions();
    return newItem;
  };

  const updateSoumission = async (id: string, data: Partial<SoumissionV2>) => {
    const { error } = await supabase.from('soumissions').update(data).eq('id', id);
    if (error) throw error;
    await fetchSoumissions();
  };

  const deleteSoumission = async (id: string) => {
    const { error } = await supabase.from('soumissions').delete().eq('id', id);
    if (error) throw error;
    setSoumissions(prev => prev.filter(s => s.id !== id));
  };

  return { soumissions, templates, loading, error, createSoumission, updateSoumission, deleteSoumission, refresh: fetchSoumissions };
}

export default useSoumissionsV2;
