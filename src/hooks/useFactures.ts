/**
 * Hook useFactures - Gestion des factures
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Facture {
  id: string;
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  numero: string;
  date_facture: string;
  date_echeance: string;
  montant_ht: number;
  tps: number;
  tvq: number;
  montant_total: number;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  notes?: string;
  user_id: string;
}

export function useFactures() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('factures')
        .select(`*, projects(name), clients(name)`)
        .eq('user_id', user.id)
        .order('date_facture', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formatted = (data || []).map(f => ({
        ...f,
        project_name: f.projects?.name,
        client_name: f.clients?.name
      }));
      
      setFactures(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  const createFacture = async (data: Partial<Facture>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('factures')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchFactures();
    return newItem;
  };

  const updateFacture = async (id: string, data: Partial<Facture>) => {
    const { data: updated, error } = await supabase
      .from('factures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchFactures();
    return updated;
  };

  const stats = {
    total: factures.length,
    enAttente: factures.filter(f => f.statut === 'envoyee').length,
    payees: factures.filter(f => f.statut === 'payee').length,
    enRetard: factures.filter(f => f.statut === 'en_retard').length,
    montantTotal: factures.reduce((sum, f) => sum + (f.montant_total || 0), 0),
    montantEnAttente: factures
      .filter(f => f.statut === 'envoyee')
      .reduce((sum, f) => sum + (f.montant_total || 0), 0)
  };

  return { factures, loading, error, stats, createFacture, updateFacture, refresh: fetchFactures };
}

export default useFactures;
