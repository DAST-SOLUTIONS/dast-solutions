/**
 * Hook useCosts - Base de données des coûts de construction
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CostItem {
  id: string;
  code: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_cost: number;
  labor_hours?: number;
  productivity_factor?: number;
  source?: string;
  last_updated: string;
  user_id?: string;
}

// Base de données de coûts par défaut (style ProEst)
export const DEFAULT_COSTS: CostItem[] = [
  { id: '1', code: '03-11-10', description: 'Coffrage mur - standard', category: 'Béton', subcategory: 'Coffrage', unit: 'm²', material_cost: 15.00, labor_cost: 35.00, equipment_cost: 5.00, total_cost: 55.00, labor_hours: 0.75, last_updated: '2025-01-01' },
  { id: '2', code: '03-21-10', description: 'Armature 10M posée', category: 'Béton', subcategory: 'Armature', unit: 'kg', material_cost: 1.85, labor_cost: 0.80, equipment_cost: 0.10, total_cost: 2.75, labor_hours: 0.015, last_updated: '2025-01-01' },
  { id: '3', code: '03-31-10', description: 'Béton 30 MPa placé', category: 'Béton', subcategory: 'Béton', unit: 'm³', material_cost: 185.00, labor_cost: 45.00, equipment_cost: 25.00, total_cost: 255.00, labor_hours: 0.8, last_updated: '2025-01-01' },
  { id: '4', code: '04-21-10', description: 'Maçonnerie brique', category: 'Maçonnerie', subcategory: 'Brique', unit: 'm²', material_cost: 65.00, labor_cost: 85.00, equipment_cost: 8.00, total_cost: 158.00, labor_hours: 1.8, last_updated: '2025-01-01' },
  { id: '5', code: '04-22-10', description: 'Bloc de béton 20cm', category: 'Maçonnerie', subcategory: 'Bloc', unit: 'm²', material_cost: 45.00, labor_cost: 55.00, equipment_cost: 5.00, total_cost: 105.00, labor_hours: 1.2, last_updated: '2025-01-01' },
  { id: '6', code: '06-11-10', description: 'Charpente bois 2x6', category: 'Bois', subcategory: 'Charpente', unit: 'ml', material_cost: 8.50, labor_cost: 12.00, equipment_cost: 2.00, total_cost: 22.50, labor_hours: 0.25, last_updated: '2025-01-01' },
  { id: '7', code: '07-21-10', description: 'Isolation R-20', category: 'Isolation', subcategory: 'Fibre de verre', unit: 'm²', material_cost: 8.50, labor_cost: 6.00, equipment_cost: 0.50, total_cost: 15.00, labor_hours: 0.12, last_updated: '2025-01-01' },
  { id: '8', code: '09-21-10', description: 'Gypse 1/2" posé', category: 'Finition', subcategory: 'Gypse', unit: 'm²', material_cost: 4.50, labor_cost: 12.00, equipment_cost: 1.00, total_cost: 17.50, labor_hours: 0.25, last_updated: '2025-01-01' },
  { id: '9', code: '09-91-10', description: 'Peinture 2 couches', category: 'Finition', subcategory: 'Peinture', unit: 'm²', material_cost: 3.00, labor_cost: 8.00, equipment_cost: 0.50, total_cost: 11.50, labor_hours: 0.15, last_updated: '2025-01-01' },
  { id: '10', code: '31-23-10', description: 'Excavation', category: 'Terrassement', subcategory: 'Excavation', unit: 'm³', material_cost: 0.00, labor_cost: 8.00, equipment_cost: 18.00, total_cost: 26.00, labor_hours: 0.1, last_updated: '2025-01-01' },
];

export function useCosts() {
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: fetchError } = await supabase
        .from('cost_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id || 'none'}`)
        .order('code');

      if (fetchError) {
        setCosts(DEFAULT_COSTS);
      } else {
        setCosts(data?.length ? data : DEFAULT_COSTS);
      }
    } catch {
      setCosts(DEFAULT_COSTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const filteredCosts = costs.filter(c => {
    const matchesSearch = !searchTerm || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(costs.map(c => c.category))].filter(Boolean);

  const createCost = async (data: Partial<CostItem>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const total = (data.material_cost || 0) + (data.labor_cost || 0) + (data.equipment_cost || 0);
    
    const { data: newItem, error } = await supabase
      .from('cost_items')
      .insert([{ ...data, total_cost: total, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchCosts();
    return newItem;
  };

  const updateCost = async (id: string, data: Partial<CostItem>) => {
    const total = (data.material_cost || 0) + (data.labor_cost || 0) + (data.equipment_cost || 0);
    
    const { data: updated, error } = await supabase
      .from('cost_items')
      .update({ ...data, total_cost: total })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchCosts();
    return updated;
  };

  return {
    costs: filteredCosts,
    allCosts: costs,
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    createCost,
    updateCost,
    refresh: fetchCosts
  };
}

export default useCosts;
