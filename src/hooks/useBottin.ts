/**
 * Hook useBottin - Bottin des ressources (entrepreneurs, fournisseurs, individus, équipements, équipes)
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface BottinEntry {
  id: string;
  type: 'entrepreneur' | 'fournisseur' | 'professionnel' | 'individu' | 'equipement' | 'equipe' | 'autre';
  company_name: string;
  name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  specialties?: string[];
  rbq_license?: string;
  rating?: number;
  notes?: string;
  metier?: string;
  taux_horaire?: number;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  membres?: string[];
  chef_equipe?: string;
}

export interface Individu {
  id: string;
  nom: string;
  prenom?: string;
  metier: string;
  metier_ccq?: string;
  type?: string;
  taux_horaire: number;
  taux_horaire_base?: number;
  phone?: string;
  telephone?: string;
  email?: string;
  certifications?: string[];
  notes?: string;
  actif?: boolean;
}

export interface Equipement {
  id: string;
  nom: string;
  type: string;
  categorie?: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  taux_horaire?: number;
  cout_horaire?: number;
  cout_journalier?: number;
  est_loue?: boolean;
  statut: 'disponible' | 'en_service' | 'maintenance' | 'en_utilisation';
  actif?: boolean;
  notes?: string;
}

export interface Equipe {
  id: string;
  nom: string;
  chef_equipe?: string;
  membres: string[];
  equipements?: string[];
  specialite?: string;
  notes?: string;
}

export function useBottin() {
  const [entries, setEntries] = useState<BottinEntry[]>([]);
  const [individus, setIndividus] = useState<Individu[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [entrepreneurs, fournisseurs, individuData, equipementData, equipeData] = await Promise.all([
        supabase.from('entrepreneurs').select('*').eq('user_id', user.id),
        supabase.from('fournisseurs').select('*').eq('user_id', user.id),
        supabase.from('individus').select('*').eq('user_id', user.id),
        supabase.from('equipements').select('*').eq('user_id', user.id),
        supabase.from('equipes').select('*').eq('user_id', user.id)
      ]);

      const combined: BottinEntry[] = [
        ...(entrepreneurs.data || []).map(e => ({ ...e, type: 'entrepreneur' as const })),
        ...(fournisseurs.data || []).map(f => ({ ...f, type: 'fournisseur' as const }))
      ];

      setEntries(combined);
      
      const enrichedIndividus = (individuData.data || []).map(i => ({
        ...i,
        telephone: i.phone,
        metier_ccq: i.metier,
        taux_horaire_base: i.taux_horaire
      }));
      setIndividus(enrichedIndividus);
      
      const enrichedEquipements = (equipementData.data || []).map(e => ({
        ...e,
        cout_horaire: e.taux_horaire,
        cout_journalier: (e.taux_horaire || 0) * 8,
        actif: e.statut !== 'maintenance'
      }));
      setEquipements(enrichedEquipements);
      setEquipes(equipeData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || entry.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const createIndividu = async (data: Partial<Individu>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: newItem, error } = await supabase.from('individus').insert([{ ...data, user_id: user.id }]).select().single();
    if (error) throw error;
    setIndividus(prev => [...prev, newItem]);
    return newItem;
  };

  const updateIndividu = async (id: string, data: Partial<Individu>) => {
    const { data: updated, error } = await supabase.from('individus').update(data).eq('id', id).select().single();
    if (error) throw error;
    setIndividus(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const deleteIndividu = async (id: string) => {
    const { error } = await supabase.from('individus').delete().eq('id', id);
    if (error) throw error;
    setIndividus(prev => prev.filter(i => i.id !== id));
  };

  const createEquipement = async (data: Partial<Equipement>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: newItem, error } = await supabase.from('equipements').insert([{ ...data, user_id: user.id }]).select().single();
    if (error) throw error;
    setEquipements(prev => [...prev, newItem]);
    return newItem;
  };

  const updateEquipement = async (id: string, data: Partial<Equipement>) => {
    const { data: updated, error } = await supabase.from('equipements').update(data).eq('id', id).select().single();
    if (error) throw error;
    setEquipements(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteEquipement = async (id: string) => {
    const { error } = await supabase.from('equipements').delete().eq('id', id);
    if (error) throw error;
    setEquipements(prev => prev.filter(e => e.id !== id));
  };

  const createEquipe = async (data: Partial<Equipe>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');
    const { data: newItem, error } = await supabase.from('equipes').insert([{ ...data, user_id: user.id }]).select().single();
    if (error) throw error;
    setEquipes(prev => [...prev, newItem]);
    return newItem;
  };

  const updateEquipe = async (id: string, data: Partial<Equipe>) => {
    const { data: updated, error } = await supabase.from('equipes').update(data).eq('id', id).select().single();
    if (error) throw error;
    setEquipes(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteEquipe = async (id: string) => {
    const { error } = await supabase.from('equipes').delete().eq('id', id);
    if (error) throw error;
    setEquipes(prev => prev.filter(e => e.id !== id));
  };

  const addMembreEquipe = async (equipeId: string, membreId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    if (!equipe) throw new Error('Équipe non trouvée');
    const newMembres = [...(equipe.membres || []), membreId];
    return updateEquipe(equipeId, { membres: newMembres });
  };

  const removeMembreEquipe = async (equipeId: string, membreId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    if (!equipe) throw new Error('Équipe non trouvée');
    const newMembres = (equipe.membres || []).filter(m => m !== membreId);
    return updateEquipe(equipeId, { membres: newMembres });
  };

  const addEquipementEquipe = async (equipeId: string, equipementId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    if (!equipe) throw new Error('Équipe non trouvée');
    const newEquipements = [...(equipe.equipements || []), equipementId];
    return updateEquipe(equipeId, { equipements: newEquipements });
  };

  const removeEquipementEquipe = async (equipeId: string, equipementId: string) => {
    const equipe = equipes.find(e => e.id === equipeId);
    if (!equipe) throw new Error('Équipe non trouvée');
    const newEquipements = (equipe.equipements || []).filter(e => e !== equipementId);
    return updateEquipe(equipeId, { equipements: newEquipements });
  };

  return {
    entries: filteredEntries,
    allEntries: entries,
    individus,
    equipements,
    equipes,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    createIndividu,
    updateIndividu,
    deleteIndividu,
    createEquipement,
    updateEquipement,
    deleteEquipement,
    createEquipe,
    updateEquipe,
    deleteEquipe,
    addMembreEquipe,
    removeMembreEquipe,
    addEquipementEquipe,
    removeEquipementEquipe,
    refresh: fetchEntries
  };
}

export default useBottin;
