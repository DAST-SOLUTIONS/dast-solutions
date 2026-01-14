/**
 * Hook useAppelsOffres - Gestion des appels d'offres
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { appelsOffresCanadaService, type AppelOffre } from '@/services/appelsOffresCanadaService';

export interface AppelOffreLocal {
  id: string;
  source_id: string;
  source: string;
  titre: string;
  organisme: string;
  date_publication: string;
  date_fermeture: string;
  budget_estime?: number;
  region?: string;
  statut: 'nouveau' | 'en_analyse' | 'soumis' | 'gagne' | 'perdu' | 'archive';
  notes?: string;
  user_id: string;
}

export function useAppelsOffres() {
  const [appelsLocaux, setAppelsLocaux] = useState<AppelOffreLocal[]>([]);
  const [appelsExternes, setAppelsExternes] = useState<AppelOffre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppels = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch local saved appeals
      if (user) {
        const { data } = await supabase
          .from('appels_offres')
          .select('*')
          .eq('user_id', user.id)
          .order('date_fermeture');
        setAppelsLocaux(data || []);
      }

      // Fetch external appeals
      const externes = await appelsOffresCanadaService.rechercher({
        province: 'QC',
        statut: 'ouvert'
      });
      setAppelsExternes(externes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppels();
  }, [fetchAppels]);

  const saveAppel = async (appel: AppelOffre) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('appels_offres')
      .insert([{
        source_id: appel.id,
        source: appel.source,
        titre: appel.titre,
        organisme: appel.organisme,
        date_publication: appel.date_publication,
        date_fermeture: appel.date_fermeture,
        budget_estime: appel.budget_estime,
        region: appel.region,
        statut: 'nouveau',
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    setAppelsLocaux(prev => [...prev, data]);
    return data;
  };

  const updateStatut = async (id: string, statut: AppelOffreLocal['statut']) => {
    const { error } = await supabase
      .from('appels_offres')
      .update({ statut })
      .eq('id', id);

    if (error) throw error;
    setAppelsLocaux(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
  };

  return {
    appelsLocaux,
    appelsExternes,
    loading,
    error,
    saveAppel,
    updateStatut,
    refresh: fetchAppels
  };
}

// Alias
export const useAppelOffres = useAppelsOffres;

export default useAppelsOffres;
