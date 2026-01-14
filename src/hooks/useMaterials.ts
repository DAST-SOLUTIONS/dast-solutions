/**
 * Hook useMaterials - Gestion des matériaux
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Material {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  description?: string;
  category: string;
  category_id?: string;
  subcategory?: string;
  division_code?: string;
  unit: string;
  unit_fr?: string;
  default_quantity?: number;
  unit_price: number;
  price_type?: 'fixed' | 'variable' | 'quote' | 'material' | 'labor' | 'equipment' | 'subcontract';
  currency?: string;
  supplier_id?: string;
  supplier?: string;
  supplier_name?: string;
  supplier_code?: string;
  manufacturer?: string;
  price_date?: string;
  price_source?: string;
  price_region?: string;
  last_price_update?: string;
  waste_factor?: number;
  coverage_rate?: number;
  labor_hours_per_unit?: number;
  is_active?: boolean;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

export interface MaterialFilters {
  search?: string;
  category?: string;
  category_id?: string;
  division_code?: string;
  price_type?: string;
  supplier?: string;
  priceMin?: number;
  priceMax?: number;
  min_price?: number;
  max_price?: number;
  favoritesOnly?: boolean;
  is_favorite?: boolean;
  tags?: string[];
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filters, setFilters] = useState<MaterialFilters>({});

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (fetchError) throw fetchError;
      setMaterials(data || []);
      
      // Fetch suppliers
      const { data: suppliersData } = await supabase
        .from('fournisseurs')
        .select('id, name: company_name, contact: contact_name, phone, email')
        .eq('user_id', user.id);
      setSuppliers(suppliersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesFilters = (
      (!filters.category || m.category === filters.category) &&
      (!filters.supplier || m.supplier_id === filters.supplier) &&
      (!filters.priceMin || m.unit_price >= filters.priceMin) &&
      (!filters.priceMax || m.unit_price <= filters.priceMax) &&
      (!filters.favoritesOnly || m.is_favorite)
    );
    return matchesSearch && matchesCategory && matchesFilters;
  });

  const categories = [...new Set(materials.map(m => m.category))].filter(Boolean);

  const createMaterial = async (data: Partial<Material>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('materials')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchMaterials();
    return newItem;
  };

  const updateMaterial = async (id: string, data: Partial<Material>) => {
    const { data: updated, error } = await supabase
      .from('materials')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchMaterials();
    return updated;
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const toggleFavorite = async (id: string) => {
    const material = materials.find(m => m.id === id);
    if (!material) return;
    await updateMaterial(id, { is_favorite: !material.is_favorite });
  };

  const calculatePrice = (material: Material, quantity: number): { 
    total_price: number; 
    adjusted_quantity: number; 
    unit_price: number;
    waste_amount?: number;
  } => {
    const wasteFactor = material.waste_factor || 0;
    const adjustedQuantity = quantity * (1 + wasteFactor);
    const totalPrice = material.unit_price * adjustedQuantity;
    return {
      total_price: totalPrice,
      adjusted_quantity: adjustedQuantity,
      unit_price: material.unit_price,
      waste_amount: quantity * wasteFactor
    };
  };

  const searchMaterials = (term: string): Material[] => {
    if (!term) return materials;
    const lower = term.toLowerCase();
    return materials.filter(m => 
      m.name?.toLowerCase().includes(lower) ||
      m.code?.toLowerCase().includes(lower) ||
      m.description?.toLowerCase().includes(lower)
    );
  };

  return {
    materials: filteredMaterials,
    allMaterials: materials,
    categories,
    suppliers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    filters,
    setFilters,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
    calculatePrice,
    searchMaterials,
    refresh: fetchMaterials
  };
}

export default useMaterials;
