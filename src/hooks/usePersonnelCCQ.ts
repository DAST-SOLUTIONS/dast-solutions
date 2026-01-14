/**
 * Hook usePersonnelCCQ - Gestion du personnel CCQ
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CCQ_METIERS, CCQ_SECTEURS, CCQ_TAUX_2025_2026 } from '@/services/ccqServiceEnhanced';

export interface PersonnelCCQ {
  id: string;
  nom: string;
  prenom: string;
  numero_ccq?: string;
  metier_code: string;
  metier_nom?: string;
  secteur: string;
  classification: 'compagnon' | 'apprenti_1' | 'apprenti_2' | 'apprenti_3' | 'apprenti_4';
  taux_horaire?: number;
  telephone?: string;
  email?: string;
  date_embauche?: string;
  statut: 'actif' | 'inactif' | 'temporaire';
  notes?: string;
  user_id: string;
}

export function usePersonnelCCQ() {
  const [personnel, setPersonnel] = useState<PersonnelCCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('personnel_ccq')
        .select('*')
        .eq('user_id', user.id)
        .order('nom');

      if (fetchError) throw fetchError;
      
      // Enrich with CCQ data
      const enriched = (data || []).map(p => {
        const metier = CCQ_METIERS.find(m => m.code === p.metier_code);
        const taux = CCQ_TAUX_2025_2026[p.secteur as keyof typeof CCQ_TAUX_2025_2026]?.[p.metier_code.toLowerCase()];
        return {
          ...p,
          metier_nom: metier?.nom,
          taux_horaire: taux?.taux_base
        };
      });
      
      setPersonnel(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const createPersonnel = async (data: Partial<PersonnelCCQ>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('personnel_ccq')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchPersonnel();
    return newItem;
  };

  const updatePersonnel = async (id: string, data: Partial<PersonnelCCQ>) => {
    const { data: updated, error } = await supabase
      .from('personnel_ccq')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchPersonnel();
    return updated;
  };

  const deletePersonnel = async (id: string) => {
    const { error } = await supabase.from('personnel_ccq').delete().eq('id', id);
    if (error) throw error;
    setPersonnel(prev => prev.filter(p => p.id !== id));
  };

  const getTauxForPersonnel = (p: PersonnelCCQ) => {
    const taux = CCQ_TAUX_2025_2026[p.secteur as keyof typeof CCQ_TAUX_2025_2026]?.[p.metier_code.toLowerCase()];
    if (!taux) return null;
    
    // Apply classification factor
    const factors: Record<string, number> = {
      compagnon: 1.0,
      apprenti_1: 0.50,
      apprenti_2: 0.60,
      apprenti_3: 0.70,
      apprenti_4: 0.80
    };
    
    const factor = factors[p.classification] || 1.0;
    return {
      taux_base: taux.taux_base * factor,
      total_employeur: taux.total_employeur * factor
    };
  };

  const stats = {
    total: personnel.length,
    actifs: personnel.filter(p => p.statut === 'actif').length,
    compagnons: personnel.filter(p => p.classification === 'compagnon').length,
    apprentis: personnel.filter(p => p.classification.startsWith('apprenti')).length,
    parMetier: CCQ_METIERS.map(m => ({
      code: m.code,
      nom: m.nom,
      count: personnel.filter(p => p.metier_code === m.code).length
    })).filter(m => m.count > 0)
  };

  return {
    personnel,
    loading,
    error,
    stats,
    metiers: CCQ_METIERS,
    secteurs: CCQ_SECTEURS,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    getTauxForPersonnel,
    refresh: fetchPersonnel
  };
}

export default usePersonnelCCQ;
