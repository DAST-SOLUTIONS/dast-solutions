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
  sous_categorie?: string;
  unite: string;
  prix_base: number;
  prix_montreal?: number;
  prix_quebec_city?: number;
  prix_sherbrooke?: number;
  fournisseur?: string;
  date_mise_a_jour: string;
  source?: string;
}

// Prix de base pour matériaux courants au Québec (2025)
export const MATERIAUX_QUEBEC: MateriauxPrix[] = [
  { id: '1', code: 'BET-30', nom: 'Béton 30 MPa', categorie: 'Béton', unite: 'm³', prix_base: 185, prix_montreal: 190, prix_quebec_city: 180, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '2', code: 'BET-25', nom: 'Béton 25 MPa', categorie: 'Béton', unite: 'm³', prix_base: 175, prix_montreal: 180, prix_quebec_city: 170, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '3', code: 'ARM-10M', nom: 'Armature 10M', categorie: 'Acier', unite: 'kg', prix_base: 1.85, prix_montreal: 1.90, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '4', code: 'ARM-15M', nom: 'Armature 15M', categorie: 'Acier', unite: 'kg', prix_base: 1.80, prix_montreal: 1.85, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '5', code: 'BRI-STD', nom: 'Brique standard', categorie: 'Maçonnerie', unite: 'unité', prix_base: 0.85, prix_montreal: 0.90, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '6', code: 'BLC-STD', nom: 'Bloc de béton 20cm', categorie: 'Maçonnerie', unite: 'unité', prix_base: 3.25, prix_montreal: 3.40, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '7', code: 'ISO-R20', nom: 'Isolant R-20', categorie: 'Isolation', unite: 'm²', prix_base: 8.50, prix_montreal: 8.75, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '8', code: 'GYP-12', nom: 'Gypse 1/2"', categorie: 'Finition', unite: 'feuille', prix_base: 14.50, prix_montreal: 15.00, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '9', code: 'BOS-2X4', nom: 'Bois 2x4 8\'', categorie: 'Bois', unite: 'pièce', prix_base: 6.25, prix_montreal: 6.50, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
  { id: '10', code: 'BOS-2X6', nom: 'Bois 2x6 8\'', categorie: 'Bois', unite: 'pièce', prix_base: 9.75, prix_montreal: 10.00, date_mise_a_jour: '2025-01-01', source: 'Prix moyen Québec' },
];

export function useMateriauxPrix() {
  const [materiaux, setMateriaux] = useState<MateriauxPrix[]>(MATERIAUX_QUEBEC);
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
        // Use default data if table doesn't exist
        setMateriaux(MATERIAUX_QUEBEC);
      } else {
        setMateriaux(data?.length ? data : MATERIAUX_QUEBEC);
      }
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

  const categories = [...new Set(materiaux.map(m => m.categorie))].filter(Boolean);

  const getPrix = (materiau: MateriauxPrix): number => {
    switch (regionFilter) {
      case 'prix_montreal': return materiau.prix_montreal || materiau.prix_base;
      case 'prix_quebec_city': return materiau.prix_quebec_city || materiau.prix_base;
      case 'prix_sherbrooke': return materiau.prix_sherbrooke || materiau.prix_base;
      default: return materiau.prix_base;
    }
  };

  return {
    materiaux: filteredMateriaux,
    allMateriaux: materiaux,
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    regionFilter,
    setRegionFilter,
    getPrix,
    refresh: fetchMateriaux
  };
}

export default useMateriauxPrix;
