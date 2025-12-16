/**
 * DAST Solutions - Hook Takeoff Sync
 * Synchronise les mesures du Takeoff avec Supabase
 */
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TakeoffMeasure {
  id: string
  project_id: string
  document_id?: string
  page_number: number
  type: 'line' | 'rectangle' | 'polygon' | 'count' | 'area'
  label: string
  value: number
  unit: string
  color: string
  points: Array<{ x: number; y: number }>
  scale_ratio?: number
  category?: string
  unit_price?: number
  metadata?: Record<string, any>
  soumission_item_id?: string
  created_at?: string
  updated_at?: string
}

export interface UseTakeoffSyncReturn {
  measures: TakeoffMeasure[]
  loading: boolean
  saving: boolean
  error: string | null
  
  // CRUD
  loadMeasures: (projectId: string) => Promise<void>
  saveMeasure: (measure: Omit<TakeoffMeasure, 'id' | 'created_at' | 'updated_at'>) => Promise<TakeoffMeasure | null>
  updateMeasure: (id: string, updates: Partial<TakeoffMeasure>) => Promise<boolean>
  deleteMeasure: (id: string) => Promise<boolean>
  
  // Batch operations
  saveMeasures: (measures: Omit<TakeoffMeasure, 'id' | 'created_at' | 'updated_at'>[]) => Promise<boolean>
  syncFromLocalStorage: (projectId: string, localMeasures: any[]) => Promise<boolean>
  
  // Stats
  getMeasuresByPage: (pageNumber: number) => TakeoffMeasure[]
  getMeasuresByType: (type: string) => TakeoffMeasure[]
  getTotalByType: () => Record<string, { count: number; total: number; unit: string }>
}

export function useTakeoffSync(projectId?: string): UseTakeoffSyncReturn {
  const [measures, setMeasures] = useState<TakeoffMeasure[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les mesures d'un projet
  const loadMeasures = useCallback(async (projId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: fetchError } = await supabase
        .from('takeoff_measures')
        .select('*')
        .eq('project_id', projId)
        .eq('user_id', user.id)
        .order('page_number')
        .order('created_at')

      if (fetchError) throw fetchError

      setMeasures(data || [])
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger automatiquement si projectId fourni
  useEffect(() => {
    if (projectId) {
      loadMeasures(projectId)
    }
  }, [projectId, loadMeasures])

  // Sauvegarder une mesure
  const saveMeasure = useCallback(async (
    measure: Omit<TakeoffMeasure, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TakeoffMeasure | null> => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: insertError } = await supabase
        .from('takeoff_measures')
        .insert({
          ...measure,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      setMeasures(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Erreur sauvegarde mesure:', err)
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  // Mettre à jour une mesure
  const updateMeasure = useCallback(async (
    id: string, 
    updates: Partial<TakeoffMeasure>
  ): Promise<boolean> => {
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('takeoff_measures')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) throw updateError

      setMeasures(prev => prev.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ))
      return true
    } catch (err) {
      console.error('Erreur mise à jour mesure:', err)
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // Supprimer une mesure
  const deleteMeasure = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('takeoff_measures')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setMeasures(prev => prev.filter(m => m.id !== id))
      return true
    } catch (err) {
      console.error('Erreur suppression mesure:', err)
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // Sauvegarder plusieurs mesures
  const saveMeasures = useCallback(async (
    newMeasures: Omit<TakeoffMeasure, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<boolean> => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const measuresToInsert = newMeasures.map(m => ({
        ...m,
        user_id: user.id
      }))

      const { data, error: insertError } = await supabase
        .from('takeoff_measures')
        .insert(measuresToInsert)
        .select()

      if (insertError) throw insertError

      setMeasures(prev => [...prev, ...(data || [])])
      return true
    } catch (err) {
      console.error('Erreur sauvegarde mesures:', err)
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // Synchroniser depuis localStorage (migration)
  const syncFromLocalStorage = useCallback(async (
    projId: string,
    localMeasures: any[]
  ): Promise<boolean> => {
    if (!localMeasures || localMeasures.length === 0) return true

    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Convertir le format localStorage vers Supabase
      const measuresToInsert = localMeasures.map(m => ({
        project_id: projId,
        user_id: user.id,
        page_number: m.pageNumber || m.page_number || 1,
        type: m.type || 'line',
        label: m.label || m.name || 'Mesure',
        value: m.value || m.measurement || 0,
        unit: m.unit || 'm',
        color: m.color || '#3B82F6',
        points: m.points || [],
        scale_ratio: m.scaleRatio || m.scale_ratio || 1,
        category: m.category,
        unit_price: m.unitPrice || m.unit_price || 0,
        metadata: m.metadata || {}
      }))

      const { data, error: insertError } = await supabase
        .from('takeoff_measures')
        .insert(measuresToInsert)
        .select()

      if (insertError) throw insertError

      setMeasures(prev => [...prev, ...(data || [])])
      return true
    } catch (err) {
      console.error('Erreur sync localStorage:', err)
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  // Obtenir les mesures par page
  const getMeasuresByPage = useCallback((pageNumber: number): TakeoffMeasure[] => {
    return measures.filter(m => m.page_number === pageNumber)
  }, [measures])

  // Obtenir les mesures par type
  const getMeasuresByType = useCallback((type: string): TakeoffMeasure[] => {
    return measures.filter(m => m.type === type)
  }, [measures])

  // Obtenir les totaux par type
  const getTotalByType = useCallback((): Record<string, { count: number; total: number; unit: string }> => {
    const result: Record<string, { count: number; total: number; unit: string }> = {}
    
    measures.forEach(m => {
      if (!result[m.type]) {
        result[m.type] = { count: 0, total: 0, unit: m.unit }
      }
      result[m.type].count++
      result[m.type].total += m.value
    })
    
    return result
  }, [measures])

  return {
    measures,
    loading,
    saving,
    error,
    loadMeasures,
    saveMeasure,
    updateMeasure,
    deleteMeasure,
    saveMeasures,
    syncFromLocalStorage,
    getMeasuresByPage,
    getMeasuresByType,
    getTotalByType
  }
}

export default useTakeoffSync
