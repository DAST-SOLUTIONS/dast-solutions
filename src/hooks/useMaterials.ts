/**
 * Hook useMaterials - Gestion des matériaux
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Material {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  unit_price: number;
  supplier_id?: string;
  supplier_name?: string;
  last_price_update?: string;
  notes?: string;
  user_id: string;
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
    return matchesSearch && matchesCategory;
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

  return {
    materials: filteredMaterials,
    allMaterials: materials,
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    createMaterial,
    updateMaterial,
    refresh: fetchMaterials
  };
}

export default useMaterials;
