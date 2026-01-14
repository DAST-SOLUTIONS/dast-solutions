/**
 * Hook useMateriauxPrix - Prix des matériaux au Québec
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface MateriauxPrix {
  id: string;
  code: string;
  nom: string;
  categorie: string;
  categorie_csc?: string;
  sous_categorie?: string;
  unite: string;
  prix_base: number;
  prix_unitaire?: number;
  prix_montreal?: number;
  prix_quebec_city?: number;
  prix_sherbrooke?: number;
  fournisseur?: string;
  fournisseur_nom?: string;
  facteur_perte?: number;
  date_mise_a_jour: string;
  source?: string;
  favori?: boolean;
  actif?: boolean;
}

export interface Productivite {
  id: string;
  code?: string;
  nom?: string;
  materiau_id: string;
  metier: string;
  categorie?: string;
  taux_horaire: number;
  unite_par_heure: number;
  quantite_par_heure?: number;
  unite_travail?: string;
  facteur_simple?: number;
  facteur_moyen?: number;
  facteur_complexe?: number;
  facteur_tres_complexe?: number;
  notes?: string;
}

export interface CategorieCSC {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

export const CATEGORIES_CSC: CategorieCSC[] = [
  { id: '03', code: '03', nom: 'Béton' },
  { id: '04', code: '04', nom: 'Maçonnerie' },
  { id: '05', code: '05', nom: 'Métaux' },
  { id: '06', code: '06', nom: 'Bois' },
  { id: '07', code: '07', nom: 'Isolation' },
  { id: '08', code: '08', nom: 'Portes et fenêtres' },
  { id: '09', code: '09', nom: 'Finition' },
  { id: '31', code: '31', nom: 'Terrassement' }
];

export const MATERIAUX_QUEBEC: MateriauxPrix[] = [
  { id: '1', code: 'BET-30', nom: 'Béton 30 MPa', categorie: 'Béton', categorie_csc: '03', unite: 'm³', prix_base: 185, prix_montreal: 190, prix_quebec_city: 180, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '2', code: 'BET-25', nom: 'Béton 25 MPa', categorie: 'Béton', categorie_csc: '03', unite: 'm³', prix_base: 175, prix_montreal: 180, prix_quebec_city: 170, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '3', code: 'ARM-10M', nom: 'Armature 10M', categorie: 'Acier', categorie_csc: '03', unite: 'kg', prix_base: 1.85, prix_montreal: 1.90, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '4', code: 'ARM-15M', nom: 'Armature 15M', categorie: 'Acier', categorie_csc: '03', unite: 'kg', prix_base: 1.80, prix_montreal: 1.85, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '5', code: 'BRI-STD', nom: 'Brique standard', categorie: 'Maçonnerie', categorie_csc: '04', unite: 'unité', prix_base: 0.85, prix_montreal: 0.90, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '6', code: 'BLC-STD', nom: 'Bloc de béton 20cm', categorie: 'Maçonnerie', categorie_csc: '04', unite: 'unité', prix_base: 3.25, prix_montreal: 3.40, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '7', code: 'ISO-R20', nom: 'Isolant R-20', categorie: 'Isolation', categorie_csc: '07', unite: 'm²', prix_base: 8.50, prix_montreal: 8.75, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '8', code: 'GYP-12', nom: 'Gypse 1/2"', categorie: 'Finition', categorie_csc: '09', unite: 'feuille', prix_base: 14.50, prix_montreal: 15.00, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '9', code: 'BOS-2X4', nom: 'Bois 2x4 8\'', categorie: 'Bois', categorie_csc: '06', unite: 'pièce', prix_base: 6.25, prix_montreal: 6.50, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '10', code: 'BOS-2X6', nom: 'Bois 2x6 8\'', categorie: 'Bois', categorie_csc: '06', unite: 'pièce', prix_base: 9.75, prix_montreal: 10.00, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
];

export function useMateriauxPrix() {
  const [materiaux, setMateriaux] = useState<MateriauxPrix[]>(MATERIAUX_QUEBEC);
  const [productivites, setProductivites] = useState<Productivite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('prix_base');

  const fetchMateriaux = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('materiaux_prix')
        .select('*')
        .order('nom');

      if (fetchError) {
        setMateriaux(MATERIAUX_QUEBEC);
      } else {
        const enriched = (data || MATERIAUX_QUEBEC).map(m => ({
          ...m,
          prix_unitaire: m.prix_base,
          fournisseur_nom: m.fournisseur,
          actif: true
        }));
        setMateriaux(enriched.length ? enriched : MATERIAUX_QUEBEC);
      }
      
      const { data: prodData } = await supabase
        .from('productivites')
        .select('*');
      
      const enrichedProd = (prodData || []).map(p => ({
        ...p,
        quantite_par_heure: p.unite_par_heure,
        facteur_simple: 1.0,
        facteur_moyen: 1.15,
        facteur_complexe: 1.35,
        facteur_tres_complexe: 1.6
      }));
      setProductivites(enrichedProd);
    } catch {
      setMateriaux(MATERIAUX_QUEBEC);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMateriaux();
  }, [fetchMateriaux]);

  const filteredMateriaux = materiaux.filter(m => {
    const matchesSearch = !searchTerm || 
      m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Categories as objects
  const categoriesArray = [...new Set(materiaux.map(m => m.categorie))].filter(Boolean);
  const categories: CategorieCSC[] = categoriesArray.map((cat, idx) => ({
    id: String(idx + 1),
    code: cat.substring(0, 3).toUpperCase(),
    nom: cat
  }));

  const getPrix = (materiau: MateriauxPrix): number => {
    switch (regionFilter) {
      case 'prix_montreal': return materiau.prix_montreal || materiau.prix_base;
      case 'prix_quebec_city': return materiau.prix_quebec_city || materiau.prix_base;
      case 'prix_sherbrooke': return materiau.prix_sherbrooke || materiau.prix_base;
      default: return materiau.prix_base;
    }
  };

  const createMateriau = async (data: Partial<MateriauxPrix>) => {
    const { data: newItem, error } = await supabase
      .from('materiaux_prix')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    await fetchMateriaux();
    return newItem;
  };

  const updateMateriau = async (id: string, data: Partial<MateriauxPrix>) => {
    const { data: updated, error } = await supabase
      .from('materiaux_prix')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await fetchMateriaux();
    return updated;
  };

  const deleteMateriau = async (id: string) => {
    const { error } = await supabase.from('materiaux_prix').delete().eq('id', id);
    if (error) throw error;
    setMateriaux(prev => prev.filter(m => m.id !== id));
  };

  const toggleFavori = async (id: string) => {
    const materiau = materiaux.find(m => m.id === id);
    if (!materiau) return;
    await updateMateriau(id, { favori: !materiau.favori });
  };

  const createProductivite = async (data: Partial<Productivite>) => {
    const { data: newItem, error } = await supabase
      .from('productivites')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    await fetchMateriaux();
    return newItem;
  };

  const updateProductivite = async (id: string, data: Partial<Productivite>) => {
    const { data: updated, error } = await supabase
      .from('productivites')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await fetchMateriaux();
    return updated;
  };

  const deleteProductivite = async (id: string) => {
    const { error } = await supabase.from('productivites').delete().eq('id', id);
    if (error) throw error;
    setProductivites(prev => prev.filter(p => p.id !== id));
  };

  return {
    materiaux: filteredMateriaux,
    allMateriaux: materiaux,
    productivites,
    categories,
    categoriesCSC: CATEGORIES_CSC,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    regionFilter,
    setRegionFilter,
    getPrix,
    createMateriau,
    updateMateriau,
    deleteMateriau,
    toggleFavori,
    createProductivite,
    updateProductivite,
    deleteProductivite,
    refresh: fetchMateriaux
  };
}

export default useMateriauxPrix;
