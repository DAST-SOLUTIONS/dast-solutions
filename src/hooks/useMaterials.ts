/**
 * DAST Solutions - Hook pour la gestion des matériaux et prix
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Material, MaterialCategory, MaterialFilters, MaterialAssembly } from '@/types/pricing-types'

export function useMaterials(initialFilters?: MaterialFilters) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MaterialFilters>(initialFilters || {})

  // Charger les catégories
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erreur chargement catégories:', err)
    }
  }, [])

  // Charger les matériaux avec filtres
  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('materials')
        .select(`
          *,
          category:material_categories(*)
        `)
        .eq('is_active', true)
        .order('name')

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.division_code) {
        query = query.eq('category.division_code', filters.division_code)
      }
      if (filters.price_type) {
        query = query.eq('price_type', filters.price_type)
      }
      if (filters.supplier) {
        query = query.eq('supplier', filters.supplier)
      }
      if (filters.is_favorite) {
        query = query.eq('is_favorite', true)
      }
      if (filters.min_price !== undefined) {
        query = query.gte('unit_price', filters.min_price)
      }
      if (filters.max_price !== undefined) {
        query = query.lte('unit_price', filters.max_price)
      }

      const { data, error } = await query.limit(500)

      if (error) throw error
      setMaterials(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement matériaux:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadMaterials()
  }, [loadMaterials])

  // Recherche rapide - retourne des matériaux complets
  const searchMaterials = useCallback(async (query: string): Promise<Material[]> => {
    if (!query || query.length < 2) {
      return []
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
        .limit(20)

      if (error) throw error
      return (data as Material[]) || []
    } catch (err) {
      console.error('Erreur recherche:', err)
      return []
    }
  }, [])

  // Obtenir un matériau par ID
  const getMaterial = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          category:material_categories(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur récupération matériau:', err)
      return null
    }
  }, [])

  // Créer un matériau
  const createMaterial = useCallback(async (material: Partial<Material>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single()

      if (error) throw error
      setMaterials(prev => [...prev, data])
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [])

  // Mettre à jour un matériau
  const updateMaterial = useCallback(async (id: string, updates: Partial<Material>) => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setMaterials(prev => prev.map(m => m.id === id ? data : m))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [])

  // Supprimer un matériau (soft delete)
  const deleteMaterial = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      setMaterials(prev => prev.filter(m => m.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [])

  // Toggle favori
  const toggleFavorite = useCallback(async (id: string) => {
    const material = materials.find(m => m.id === id)
    if (!material) return

    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_favorite: !material.is_favorite })
        .eq('id', id)

      if (error) throw error
      setMaterials(prev => prev.map(m => 
        m.id === id ? { ...m, is_favorite: !m.is_favorite } : m
      ))
    } catch (err) {
      console.error('Erreur toggle favori:', err)
    }
  }, [materials])

  // Calculer le prix avec perte
  const calculatePrice = useCallback((material: Material, quantity: number) => {
    const wasteMultiplier = 1 + (material.waste_factor || 0) / 100
    const adjustedQty = quantity * wasteMultiplier
    const totalPrice = adjustedQty * material.unit_price
    
    return {
      quantity,
      adjusted_quantity: adjustedQty,
      unit_price: material.unit_price,
      total_price: totalPrice,
      waste_amount: (adjustedQty - quantity) * material.unit_price
    }
  }, [])

  // Obtenir les fournisseurs uniques
  const suppliers = [...new Set(materials.filter(m => m.supplier).map(m => m.supplier!))]

  // Obtenir les divisions uniques
  const divisions = [...new Set(categories.map(c => ({ code: c.division_code, name: c.division_name })))]
    .filter((v, i, a) => a.findIndex(t => t.code === v.code) === i)

  return {
    materials,
    categories,
    loading,
    error,
    filters,
    setFilters,
    suppliers,
    divisions,
    searchMaterials,
    getMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
    calculatePrice,
    refresh: loadMaterials
  }
}

// Hook pour les assemblages
export function useAssemblies() {
  const [assemblies, setAssemblies] = useState<MaterialAssembly[]>([])
  const [loading, setLoading] = useState(true)

  const loadAssemblies = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('material_assemblies')
        .select(`
          *,
          items:assembly_items(
            *,
            material:materials(*)
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAssemblies(data || [])
    } catch (err) {
      console.error('Erreur chargement assemblages:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssemblies()
  }, [loadAssemblies])

  const createAssembly = useCallback(async (assembly: Partial<MaterialAssembly>, items: { material_id: string; quantity: number }[]) => {
    try {
      // Créer l'assemblage
      const { data: assemblyData, error: assemblyError } = await supabase
        .from('material_assemblies')
        .insert(assembly)
        .select()
        .single()

      if (assemblyError) throw assemblyError

      // Ajouter les items
      if (items.length > 0) {
        const assemblyItems = items.map((item, index) => ({
          assembly_id: assemblyData.id,
          material_id: item.material_id,
          quantity: item.quantity,
          sort_order: index
        }))

        const { error: itemsError } = await supabase
          .from('assembly_items')
          .insert(assemblyItems)

        if (itemsError) throw itemsError
      }

      await loadAssemblies()
      return { data: assemblyData, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [loadAssemblies])

  return {
    assemblies,
    loading,
    createAssembly,
    refresh: loadAssemblies
  }
}
