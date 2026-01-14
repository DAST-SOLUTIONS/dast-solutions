/**
 * Hook useSoumissions - Gestion des soumissions
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Soumission {
  id: string;
  project_id: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  numero: string;
  titre: string;
  description?: string;
  montant_ht: number;
  tps: number;
  tvq: number;
  montant_total: number;
  statut: 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree';
  date_creation: string;
  date_envoi?: string;
  date_expiration?: string;
  notes?: string;
  items?: SoumissionItem[];
  user_id: string;
}

export interface SoumissionItem {
  id: string;
  soumission_id: string;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
  categorie?: string;
}

export function useSoumissions() {
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSoumissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('soumissions')
        .select(`
          *,
          projects(name),
          clients(name)
        `)
        .eq('user_id', user.id)
        .order('date_creation', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formatted = (data || []).map(s => ({
        ...s,
        project_name: s.projects?.name,
        client_name: s.clients?.name
      }));
      
      setSoumissions(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoumissions();
  }, [fetchSoumissions]);

  const createSoumission = async (data: Partial<Soumission>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('soumissions')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchSoumissions();
    return newItem;
  };

  const updateSoumission = async (id: string, data: Partial<Soumission>) => {
    const { data: updated, error } = await supabase
      .from('soumissions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchSoumissions();
    return updated;
  };

  const deleteSoumission = async (id: string) => {
    const { error } = await supabase.from('soumissions').delete().eq('id', id);
    if (error) throw error;
    setSoumissions(prev => prev.filter(s => s.id !== id));
  };

  const stats = {
    total: soumissions.length,
    brouillon: soumissions.filter(s => s.statut === 'brouillon').length,
    envoyees: soumissions.filter(s => s.statut === 'envoyee').length,
    acceptees: soumissions.filter(s => s.statut === 'acceptee').length,
    refusees: soumissions.filter(s => s.statut === 'refusee').length,
    montantTotal: soumissions.reduce((sum, s) => sum + (s.montant_total || 0), 0),
    tauxAcceptation: soumissions.length > 0 
      ? (soumissions.filter(s => s.statut === 'acceptee').length / soumissions.length * 100).toFixed(1)
      : '0'
  };

  return {
    soumissions,
    loading,
    error,
    stats,
    createSoumission,
    updateSoumission,
    deleteSoumission,
    refresh: fetchSoumissions
  };
}

export default useSoumissions;
