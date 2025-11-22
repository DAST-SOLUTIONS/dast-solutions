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
// ... autres interfaces (Labor, Equipment, Subcontractor, Overhead, CostSummary)
export function useCosts(projectId: string | null) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [labor, setLabor] = useState<Labor[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [overhead, setOverhead] = useState<Overhead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchCosts = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [materialsData, laborData, equipmentData, subcontractorsData, overheadData] = await Promise.all([
        supabase.from('materials').select('*').eq('project_id', projectId),
        supabase.from('labor').select('*').eq('project_id', projectId),
        supabase.from('equipment').select('*').eq('project_id', projectId),
        supabase.from('subcontractors').select('*').eq('project_id', projectId),
        supabase.from('overhead').select('*').eq('project_id', projectId),
      ])
      setMaterials(materialsData.data || [])
      setLabor(laborData.data || [])
      setEquipment(equipmentData.data || [])
      setSubcontractors(subcontractorsData.data || [])
      setOverhead(overheadData.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch costs'
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchCosts()
  }, [projectId])
  // ... reste du hook (calculateSummary, add*, delete*)
  return {
    materials, labor, equipment, subcontractors, overhead, loading, error,
    calculateSummary, addMaterial, addLabor, addEquipment,
    addSubcontractor, addOverhead, deleteMaterial, deleteLabor,
    deleteEquipment, deleteSubcontractor, deleteOverhead, refetch: fetchCosts,
  }
}