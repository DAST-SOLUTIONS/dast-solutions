import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Material {
  id: string
  project_id: string
  category: string
  description: string
  unit: string
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CostSummary {
  totalMaterials: number
  totalLabor: number
  totalEquipment: number
  totalSubcontractors: number
  totalOverhead: number
  grandTotal: number
}

export function useCosts(projectId: string | null) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCosts = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId)
      if (fetchError) throw fetchError
      setMaterials(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch costs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCosts()
  }, [projectId])

  const calculateSummary = (): CostSummary => {
    const totalMaterials = materials.reduce((sum, m) => sum + m.subtotal, 0)
    return {
      totalMaterials,
      totalLabor: 0,
      totalEquipment: 0,
      totalSubcontractors: 0,
      totalOverhead: 0,
      grandTotal: totalMaterials,
    }
  }

  const addMaterial = async (data: Partial<Material>) => {
    const { error } = await supabase.from('materials').insert([data])
    if (error) throw error
    await fetchCosts()
  }

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id)
    if (error) throw error
    await fetchCosts()
  }

  return {
    materials,
    labor: [],
    equipment: [],
    subcontractors: [],
    overhead: [],
    loading,
    error,
    calculateSummary,
    addMaterial,
    addLabor: async () => {},
    addEquipment: async () => {},
    addSubcontractor: async () => {},
    addOverhead: async () => {},
    deleteMaterial,
    deleteLabor: async () => {},
    deleteEquipment: async () => {},
    deleteSubcontractor: async () => {},
    deleteOverhead: async () => {},
    refetch: fetchCosts,
  }
}
