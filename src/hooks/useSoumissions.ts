/**
 * Hook useSoumissions - Gestion des soumissions
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Soumission {
  id: string;
  project_id: string;
  project_name?: string;
  projet_nom?: string;
  client_id?: string;
  client_name?: string;
  client_nom?: string;
  numero: string;
  titre: string;
  description?: string;
  montant_ht: number;
  total_avant_taxes?: number;
  tps: number;
  tvq: number;
  montant_total: number;
  total_avec_taxes?: number;
  statut: 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree' | 'envoye' | 'accepte';
  date_creation: string;
  date_soumission?: string;
  date_envoi?: string;
  date_expiration?: string;
  notes?: string;
  items?: SoumissionItem[];
  sections?: SoumissionSection[];
  frais_generaux_pct?: number;
  frais_generaux_montant?: number;
  administration_pct?: number;
  administration_montant?: number;
  profit_pct?: number;
  profit_montant?: number;
  contingence_pct?: number;
  contingence_montant?: number;
  sous_total_mo?: number;
  sous_total_materiaux?: number;
  sous_total_equipements?: number;
  sous_total_sous_traitance?: number;
  sous_total_sous_traitants?: number;
  sous_total_direct?: number;
  user_id: string;
}

export interface SoumissionItem {
  id: string;
  soumission_id: string;
  section_id?: string;
  description: string;
  quantite: number;
  quantity?: number;
  unite: string;
  unit?: string;
  prix_unitaire: number;
  unit_price?: number;
  montant: number;
  total_price?: number;
  categorie?: string;
  type?: 'materiau' | 'main_oeuvre' | 'equipement' | 'sous_traitance';
  sort_order?: number;
  mo_cout_total?: number;
  mat_cout_total?: number;
  cout_total?: number;
  facteur_complexite?: number;
}

export interface SoumissionSection {
  id: string;
  soumission_id: string;
  nom: string;
  description?: string;
  sort_order: number;
  items?: SoumissionItem[];
  sous_total?: number;
  sous_total_mo?: number;
  sous_total_materiaux?: number;
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
        .select(`*, projects(name), clients(name)`)
        .eq('user_id', user.id)
        .order('date_creation', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formatted = (data || []).map(s => ({
        ...s,
        project_name: s.projects?.name,
        client_name: s.clients?.name,
        projet_nom: s.projects?.name,
        client_nom: s.clients?.name,
        total_avant_taxes: s.montant_ht,
        total_avec_taxes: s.montant_total,
        date_soumission: s.date_creation
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

  const dupliquerSoumission = async (id: string) => {
    const original = soumissions.find(s => s.id === id);
    if (!original) throw new Error('Soumission non trouvée');

    const { id: _, ...rest } = original;
    return createSoumission({
      ...rest,
      numero: `${original.numero}-COPIE`,
      statut: 'brouillon',
      date_creation: new Date().toISOString()
    });
  };

  const stats = {
    total: soumissions.length,
    brouillon: soumissions.filter(s => s.statut === 'brouillon').length,
    envoyees: soumissions.filter(s => s.statut === 'envoyee' || s.statut === 'envoye').length,
    acceptees: soumissions.filter(s => s.statut === 'acceptee' || s.statut === 'accepte').length,
    refusees: soumissions.filter(s => s.statut === 'refusee').length,
    montantTotal: soumissions.reduce((sum, s) => sum + (s.montant_total || 0), 0),
    tauxAcceptation: soumissions.length > 0 
      ? (soumissions.filter(s => s.statut === 'acceptee' || s.statut === 'accepte').length / soumissions.length * 100).toFixed(1)
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
    dupliquerSoumission,
    refresh: fetchSoumissions
  };
}

export function useSoumissionDetail(id: string) {
  const [soumission, setSoumission] = useState<Soumission | null>(null);
  const [sections, setSections] = useState<SoumissionSection[]>([]);
  const [items, setItems] = useState<SoumissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSoumission = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('soumissions')
        .select(`*, projects(name), clients(name)`)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      
      const { data: sectionsData } = await supabase
        .from('soumission_sections')
        .select('*')
        .eq('soumission_id', id)
        .order('sort_order');
      
      const { data: itemsData } = await supabase
        .from('soumission_items')
        .select('*')
        .eq('soumission_id', id)
        .order('sort_order');
      
      const enrichedSections = (sectionsData || []).map(s => ({
        ...s,
        sous_total_mo: 0,
        sous_total_materiaux: 0
      }));

      const enrichedItems = (itemsData || []).map(i => ({
        ...i,
        mo_cout_total: i.montant * 0.4,
        mat_cout_total: i.montant * 0.6,
        cout_total: i.montant
      }));

      const sousTotal = enrichedItems.reduce((sum, i) => sum + (i.montant || 0), 0);

      setSoumission({
        ...data,
        project_name: data.projects?.name,
        client_name: data.clients?.name,
        sections: enrichedSections,
        items: enrichedItems,
        frais_generaux_montant: sousTotal * (data.frais_generaux_pct || 0) / 100,
        administration_montant: sousTotal * (data.administration_pct || 0) / 100,
        profit_montant: sousTotal * (data.profit_pct || 0) / 100,
        contingence_montant: sousTotal * (data.contingence_pct || 0) / 100,
        sous_total_direct: sousTotal,
        sous_total_sous_traitants: data.sous_total_sous_traitance
      });
      setSections(enrichedSections);
      setItems(enrichedItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSoumission();
  }, [fetchSoumission]);

  const createSection = async (data: Partial<SoumissionSection>) => {
    const { data: newSection, error } = await supabase
      .from('soumission_sections')
      .insert([{ ...data, soumission_id: id }])
      .select()
      .single();
    if (error) throw error;
    await fetchSoumission();
    return newSection;
  };

  const updateSection = async (sectionId: string, data: Partial<SoumissionSection>) => {
    const { error } = await supabase
      .from('soumission_sections')
      .update(data)
      .eq('id', sectionId);
    if (error) throw error;
    await fetchSoumission();
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase.from('soumission_sections').delete().eq('id', sectionId);
    if (error) throw error;
    await fetchSoumission();
  };

  const createItem = async (data: Partial<SoumissionItem>) => {
    const { data: newItem, error } = await supabase
      .from('soumission_items')
      .insert([{ ...data, soumission_id: id }])
      .select()
      .single();
    if (error) throw error;
    await fetchSoumission();
    return newItem;
  };

  const updateItem = async (itemId: string, data: Partial<SoumissionItem>) => {
    const { facteur_complexite, mo_cout_total, mat_cout_total, cout_total, ...rest } = data as any;
    const { error } = await supabase
      .from('soumission_items')
      .update(rest)
      .eq('id', itemId);
    if (error) throw error;
    await fetchSoumission();
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from('soumission_items').delete().eq('id', itemId);
    if (error) throw error;
    await fetchSoumission();
  };

  const updateMarges = async (marges: {
    frais_generaux_pct?: number;
    administration_pct?: number;
    profit_pct?: number;
    contingence_pct?: number;
  }) => {
    const { error } = await supabase
      .from('soumissions')
      .update(marges)
      .eq('id', id);
    if (error) throw error;
    await fetchSoumission();
  };

  return { 
    soumission, 
    sections,
    items,
    loading, 
    error, 
    createSection,
    updateSection,
    deleteSection,
    createItem,
    updateItem,
    deleteItem,
    updateMarges,
    refresh: fetchSoumission 
  };
}

export default useSoumissions;
