/**
 * Hooks Entrepreneurs - Gestion des entrepreneurs et sous-traitants
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Entrepreneur {
  id: string;
  company_name: string;
  nom?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  adresse_rue?: string;
  adresse_ville?: string;
  city?: string;
  province?: string;
  adresse_province?: string;
  postal_code?: string;
  adresse_code_postal?: string;
  rbq_license?: string;
  rbq_licence?: string;
  rbq_status?: string;
  rbq_categories?: string[];
  rbq_expiration?: string;
  neq?: string;
  specialties?: string[];
  specialites?: string[];
  rating?: number;
  evaluation_moyenne?: number;
  nb_evaluations?: number;
  evaluations?: EntrepreneurEvaluation[];
  projets_completes?: number;
  is_favori?: boolean;
  contacts?: EntrepreneurContact[];
  notes?: string;
  status?: string;
  created_at: string;
  user_id: string;
}

export interface EntrepreneurContact {
  id: string;
  name: string;
  nom?: string;
  prenom?: string;
  title?: string;
  titre?: string;
  poste?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  is_primary?: boolean;
  is_principal?: boolean;
}

export interface EntrepreneurEvaluation {
  id: string;
  entrepreneur_id: string;
  project_id?: string;
  project_name?: string;
  projet_nom?: string;
  rating: number;
  score_global?: number;
  note_globale?: number;
  score_qualite?: number;
  note_qualite?: number;
  score_delais?: number;
  note_delais?: number;
  score_communication?: number;
  note_communication?: number;
  score_prix?: number;
  note_prix?: number;
  score_securite?: number;
  note_securite?: number;
  comment?: string;
  commentaire?: string;
  recommande?: boolean;
  criteria?: {
    quality: number;
    timeliness: number;
    communication: number;
    price: number;
  };
  date: string;
  date_evaluation?: string;
  user_id: string;
}

export interface CreateEntrepreneurParams {
  company_name: string;
  nom?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  adresse_rue?: string;
  city?: string;
  adresse_ville?: string;
  province?: string;
  adresse_province?: string;
  postal_code?: string;
  adresse_code_postal?: string;
  rbq_license?: string;
  rbq_licence?: string;
  neq?: string;
  specialties?: string[];
  specialites?: string[];
  notes?: string;
}

export interface CreateEvaluationParams {
  entrepreneur_id: string;
  project_id?: string;
  project_name?: string;
  rating?: number;
  score_qualite?: number;
  note_qualite?: number;
  score_delais?: number;
  note_delais?: number;
  score_communication?: number;
  note_communication?: number;
  score_prix?: number;
  note_prix?: number;
  score_securite?: number;
  note_securite?: number;
  comment?: string;
  commentaire?: string;
  recommande?: boolean;
  criteria?: {
    quality: number;
    timeliness: number;
    communication: number;
    price: number;
  };
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
      
      const enriched = (data || []).map(e => ({
        ...e,
        nom: e.company_name,
        rbq_licence: e.rbq_license,
        adresse_ville: e.city,
        adresse_rue: e.address,
        adresse_province: e.province,
        adresse_code_postal: e.postal_code,
        specialites: e.specialties,
        status: 'actif'
      }));
      
      setEntrepreneurs(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntrepreneurs();
  }, [fetchEntrepreneurs]);

  return { entrepreneurs, loading, error, refresh: fetchEntrepreneurs, fetchEntrepreneurs };
}

export function useEntrepreneursCRUD() {
  const { entrepreneurs, loading, error, refresh, fetchEntrepreneurs } = useEntrepreneurs();

  const createEntrepreneur = async (data: CreateEntrepreneurParams) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const mapped = {
      company_name: data.company_name || data.nom || '',
      contact_name: data.contact_name,
      email: data.email,
      phone: data.phone,
      address: data.address || data.adresse_rue,
      city: data.city || data.adresse_ville,
      province: data.province || data.adresse_province,
      postal_code: data.postal_code || data.adresse_code_postal,
      rbq_license: data.rbq_license || data.rbq_licence,
      neq: data.neq,
      specialties: data.specialties || data.specialites,
      notes: data.notes,
      user_id: user.id
    };

    const { data: newItem, error } = await supabase
      .from('entrepreneurs')
      .insert([mapped])
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

  const toggleFavori = async (id: string) => {
    const entrepreneur = entrepreneurs.find(e => e.id === id);
    if (!entrepreneur) return;
    await updateEntrepreneur(id, { is_favori: !entrepreneur.is_favori });
  };

  const verifyRBQ = async (id: string, licenseNumber: string) => {
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

  const createEvaluation = async (params: CreateEvaluationParams) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const score = params.rating || (
      ((params.score_qualite || params.note_qualite || 0) + 
       (params.score_delais || params.note_delais || 0) + 
       (params.score_communication || params.note_communication || 0) + 
       (params.score_prix || params.note_prix || 0)) / 4
    );

    const { data: evaluation, error } = await supabase
      .from('entrepreneur_evaluations')
      .insert([{ 
        ...params, 
        rating: score,
        score_global: score,
        note_globale: score,
        user_id: user.id, 
        date: new Date().toISOString(),
        date_evaluation: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    const { data: evals } = await supabase
      .from('entrepreneur_evaluations')
      .select('rating')
      .eq('entrepreneur_id', params.entrepreneur_id);
    
    if (evals && evals.length > 0) {
      const avg = evals.reduce((sum, e) => sum + e.rating, 0) / evals.length;
      await updateEntrepreneur(params.entrepreneur_id, {
        evaluation_moyenne: avg,
        nb_evaluations: evals.length
      });
    }
    
    return evaluation;
  };

  const addEvaluation = createEvaluation;

  const getEvaluations = async (entrepreneurId: string): Promise<EntrepreneurEvaluation[]> => {
    const { data, error } = await supabase
      .from('entrepreneur_evaluations')
      .select('*')
      .eq('entrepreneur_id', entrepreneurId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(e => ({
      ...e,
      projet_nom: e.project_name,
      note_globale: e.score_global || e.rating,
      note_qualite: e.score_qualite,
      note_delais: e.score_delais,
      note_communication: e.score_communication,
      note_prix: e.score_prix,
      note_securite: e.score_securite
    }));
  };

  const stats = {
    total: entrepreneurs.length,
    actifs: entrepreneurs.filter(e => !e.is_favori).length,
    favoris: entrepreneurs.filter(e => e.is_favori).length
  };

  const getStats = () => stats;

  return {
    entrepreneurs,
    loading,
    error,
    stats,
    getStats,
    createEntrepreneur,
    updateEntrepreneur,
    deleteEntrepreneur,
    toggleFavori,
    verifyRBQ,
    createEvaluation,
    addEvaluation,
    getEvaluations,
    fetchEntrepreneurs,
    refresh
  };
}

export default useEntrepreneurs;
