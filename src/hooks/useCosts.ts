/**
 * Hook useCosts - Base de données des coûts de construction
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CostItem {
  id: string;
  code: string;
  description: string;
  category: string;
  subcategory?: string;
  type?: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'overhead';
  unit: string;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  total_cost: number;
  labor_hours?: number;
  productivity_factor?: number;
  source?: string;
  last_updated: string;
  project_id?: string;
  quantity?: number;
  user_id?: string;
}

export interface CostSummary {
  materials: number;
  labor: number;
  equipment: number;
  subcontractors: number;
  overhead: number;
  total: number;
}

// Base de données de coûts par défaut (style ProEst)
export const DEFAULT_COSTS: CostItem[] = [
  { id: '1', code: '03-11-10', description: 'Coffrage mur - standard', category: 'Béton', subcategory: 'Coffrage', type: 'material', unit: 'm²', material_cost: 15.00, labor_cost: 35.00, equipment_cost: 5.00, total_cost: 55.00, labor_hours: 0.75, last_updated: '2025-01-01' },
  { id: '2', code: '03-21-10', description: 'Armature 10M posée', category: 'Béton', subcategory: 'Armature', type: 'material', unit: 'kg', material_cost: 1.85, labor_cost: 0.80, equipment_cost: 0.10, total_cost: 2.75, labor_hours: 0.015, last_updated: '2025-01-01' },
  { id: '3', code: '03-31-10', description: 'Béton 30 MPa placé', category: 'Béton', subcategory: 'Béton', type: 'material', unit: 'm³', material_cost: 185.00, labor_cost: 45.00, equipment_cost: 25.00, total_cost: 255.00, labor_hours: 0.8, last_updated: '2025-01-01' },
  { id: '4', code: '04-21-10', description: 'Maçonnerie brique', category: 'Maçonnerie', subcategory: 'Brique', type: 'material', unit: 'm²', material_cost: 65.00, labor_cost: 85.00, equipment_cost: 8.00, total_cost: 158.00, labor_hours: 1.8, last_updated: '2025-01-01' },
  { id: '5', code: '04-22-10', description: 'Bloc de béton 20cm', category: 'Maçonnerie', subcategory: 'Bloc', type: 'material', unit: 'm²', material_cost: 45.00, labor_cost: 55.00, equipment_cost: 5.00, total_cost: 105.00, labor_hours: 1.2, last_updated: '2025-01-01' },
  { id: '6', code: '06-11-10', description: 'Charpente bois 2x6', category: 'Bois', subcategory: 'Charpente', type: 'material', unit: 'ml', material_cost: 8.50, labor_cost: 12.00, equipment_cost: 2.00, total_cost: 22.50, labor_hours: 0.25, last_updated: '2025-01-01' },
  { id: '7', code: '07-21-10', description: 'Isolation R-20', category: 'Isolation', subcategory: 'Fibre de verre', type: 'material', unit: 'm²', material_cost: 8.50, labor_cost: 6.00, equipment_cost: 0.50, total_cost: 15.00, labor_hours: 0.12, last_updated: '2025-01-01' },
  { id: '8', code: '09-21-10', description: 'Gypse 1/2" posé', category: 'Finition', subcategory: 'Gypse', type: 'material', unit: 'm²', material_cost: 4.50, labor_cost: 12.00, equipment_cost: 1.00, total_cost: 17.50, labor_hours: 0.25, last_updated: '2025-01-01' },
  { id: '9', code: '09-91-10', description: 'Peinture 2 couches', category: 'Finition', subcategory: 'Peinture', type: 'material', unit: 'm²', material_cost: 3.00, labor_cost: 8.00, equipment_cost: 0.50, total_cost: 11.50, labor_hours: 0.15, last_updated: '2025-01-01' },
  { id: '10', code: '31-23-10', description: 'Excavation', category: 'Terrassement', subcategory: 'Excavation', type: 'equipment', unit: 'm³', material_cost: 0.00, labor_cost: 8.00, equipment_cost: 18.00, total_cost: 26.00, labor_hours: 0.1, last_updated: '2025-01-01' },
];

export function useCosts(projectId?: string) {
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('cost_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id || 'none'}`);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error: fetchError } = await query.order('code');

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
  }, [projectId]);

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

  // Filtered by type
  const materials = useMemo(() => costs.filter(c => c.type === 'material' || c.material_cost > 0), [costs]);
  const labor = useMemo(() => costs.filter(c => c.type === 'labor' || c.labor_cost > 0), [costs]);
  const equipment = useMemo(() => costs.filter(c => c.type === 'equipment' || c.equipment_cost > 0), [costs]);
  const subcontractors = useMemo(() => costs.filter(c => c.type === 'subcontractor'), [costs]);
  const overhead = useMemo(() => costs.filter(c => c.type === 'overhead'), [costs]);

  const calculateSummary = useCallback((items?: CostItem[]): CostSummary => {
    const data = items || costs;
    return {
      materials: data.reduce((sum, c) => sum + (c.material_cost || 0), 0),
      labor: data.reduce((sum, c) => sum + (c.labor_cost || 0), 0),
      equipment: data.reduce((sum, c) => sum + (c.equipment_cost || 0), 0),
      subcontractors: data.filter(c => c.type === 'subcontractor').reduce((sum, c) => sum + (c.total_cost || 0), 0),
      overhead: data.filter(c => c.type === 'overhead').reduce((sum, c) => sum + (c.total_cost || 0), 0),
      total: data.reduce((sum, c) => sum + (c.total_cost || 0), 0)
    };
  }, [costs]);

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

  const deleteCost = async (id: string) => {
    const { error } = await supabase.from('cost_items').delete().eq('id', id);
    if (error) throw error;
    setCosts(prev => prev.filter(c => c.id !== id));
  };

  // Convenience methods
  const addMaterial = (data: Partial<CostItem>) => createCost({ ...data, type: 'material' });
  const deleteMaterial = deleteCost;
  const addLabor = (data: Partial<CostItem>) => createCost({ ...data, type: 'labor' });
  const deleteLabor = deleteCost;
  const addEquipment = (data: Partial<CostItem>) => createCost({ ...data, type: 'equipment' });
  const deleteEquipment = deleteCost;
  const addSubcontractor = (data: Partial<CostItem>) => createCost({ ...data, type: 'subcontractor' });
  const deleteSubcontractor = deleteCost;
  const addOverhead = (data: Partial<CostItem>) => createCost({ ...data, type: 'overhead' });
  const deleteOverhead = deleteCost;

  return {
    costs: filteredCosts,
    allCosts: costs,
    categories,
    materials,
    labor,
    equipment,
    subcontractors,
    overhead,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    calculateSummary,
    createCost,
    updateCost,
    deleteCost,
    addMaterial,
    deleteMaterial,
    addLabor,
    deleteLabor,
    addEquipment,
    deleteEquipment,
    addSubcontractor,
    deleteSubcontractor,
    addOverhead,
    deleteOverhead,
    refresh: fetchCosts
  };
}

export default useCosts;
