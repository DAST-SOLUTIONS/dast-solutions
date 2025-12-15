/**
 * DAST Solutions - useTakeoffPersistence
 * Hook pour la persistance automatique des mesures dans Supabase
 * 
 * Fonctionnalités:
 * - Sauvegarde automatique des mesures
 * - Chargement au montage
 * - Sync en temps réel
 * - Export vers Soumission
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Measurement } from '@/types/takeoff-measure-types'

interface Plan {
  id: string
  name: string
  file_path: string
  file_type: string
  page_count: number
  scale_x: number
  scale_y: number
  scale_unit: string
}

interface UseTakeoffPersistenceOptions {
  projectId: string
  autoSave?: boolean
  autoSaveDelay?: number // ms
}

interface UseTakeoffPersistenceReturn {
  // Plans
  plans: Plan[]
  loadingPlans: boolean
  savePlan: (plan: Omit<Plan, 'id'>) => Promise<Plan | null>
  deletePlan: (planId: string) => Promise<boolean>
  
  // Mesures
  measurements: Measurement[]
  loadingMeasurements: boolean
  saveMeasurement: (measurement: Measurement) => Promise<boolean>
  saveMeasurements: (measurements: Measurement[]) => Promise<boolean>
  deleteMeasurement: (measurementId: string) => Promise<boolean>
  
  // Sync
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  
  // Export
  exportToBid: (measurements: Measurement[]) => Promise<boolean>
}

export function useTakeoffPersistence({
  projectId,
  autoSave = true,
  autoSaveDelay = 2000
}: UseTakeoffPersistenceOptions): UseTakeoffPersistenceReturn {
  // État
  const [plans, setPlans] = useState<Plan[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingMeasurements, setLoadingMeasurements] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Ref pour le debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingMeasurementsRef = useRef<Measurement[]>([])

  // Charger les plans au montage
  useEffect(() => {
    loadPlans()
  }, [projectId])

  // Charger les mesures au montage
  useEffect(() => {
    loadMeasurements()
  }, [projectId])

  // Charger les plans
  const loadPlans = useCallback(async () => {
    if (!projectId) return
    
    setLoadingPlans(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('takeoff_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setPlans(data?.map(p => ({
        id: p.id,
        name: p.name,
        file_path: p.file_path,
        file_type: p.file_type,
        page_count: p.page_count,
        scale_x: p.scale_x,
        scale_y: p.scale_y,
        scale_unit: p.scale_unit
      })) || [])
    } catch (err) {
      console.error('Erreur chargement plans:', err)
      setError('Impossible de charger les plans')
    } finally {
      setLoadingPlans(false)
    }
  }, [projectId])

  // Charger les mesures
  const loadMeasurements = useCallback(async () => {
    if (!projectId) return
    
    setLoadingMeasurements(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('takeoff_measurements')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      
      // Convertir les données DB en format Measurement
      const loadedMeasurements: Measurement[] = (data || []).map(m => ({
        id: m.id,
        type: m.measure_type as any,
        label: m.label,
        description: m.description,
        category: m.category,
        color: m.color,
        points: m.points,
        value: parseFloat(m.value),
        unit: m.unit,
        planId: m.plan_id,
        page: m.page_number,
        dimensions: {
          height: m.height ? parseFloat(m.height) : undefined,
          width: m.width ? parseFloat(m.width) : undefined,
          depth: m.depth ? parseFloat(m.depth) : undefined,
          thickness: m.thickness ? parseFloat(m.thickness) : undefined,
          quantity: m.quantity
        },
        calculated: {
          length: m.calculated_length ? parseFloat(m.calculated_length) : undefined,
          area: m.calculated_area ? parseFloat(m.calculated_area) : undefined,
          volume: m.calculated_volume ? parseFloat(m.calculated_volume) : undefined,
          count: m.calculated_count
        },
        costs: {
          laborTradeCode: m.labor_trade_code,
          laborTradeName: m.labor_trade_name,
          laborHourlyRate: m.labor_hourly_rate ? parseFloat(m.labor_hourly_rate) : undefined,
          laborHours: m.labor_hours ? parseFloat(m.labor_hours) : undefined,
          laborCost: m.labor_cost ? parseFloat(m.labor_cost) : undefined,
          materialName: m.material_name,
          materialUnit: m.material_unit,
          materialUnitPrice: m.material_unit_price ? parseFloat(m.material_unit_price) : undefined,
          materialQuantity: m.material_quantity ? parseFloat(m.material_quantity) : undefined,
          materialCost: m.material_cost ? parseFloat(m.material_cost) : undefined,
          totalCost: m.total_cost ? parseFloat(m.total_cost) : undefined,
          markup: m.markup_percent ? parseFloat(m.markup_percent) : undefined,
          totalWithMarkup: m.total_with_markup ? parseFloat(m.total_with_markup) : undefined
        },
        notes: m.notes,
        createdAt: m.created_at,
        updatedAt: m.updated_at
      }))
      
      setMeasurements(loadedMeasurements)
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
      setError('Impossible de charger les mesures')
    } finally {
      setLoadingMeasurements(false)
    }
  }, [projectId])

  // Sauvegarder un plan
  const savePlan = useCallback(async (plan: Omit<Plan, 'id'>): Promise<Plan | null> => {
    if (!projectId) return null
    
    setIsSaving(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: insertError } = await supabase
        .from('takeoff_plans')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: plan.name,
          file_path: plan.file_path,
          file_type: plan.file_type,
          page_count: plan.page_count,
          scale_x: plan.scale_x,
          scale_y: plan.scale_y,
          scale_unit: plan.scale_unit
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      const newPlan: Plan = {
        id: data.id,
        name: data.name,
        file_path: data.file_path,
        file_type: data.file_type,
        page_count: data.page_count,
        scale_x: data.scale_x,
        scale_y: data.scale_y,
        scale_unit: data.scale_unit
      }
      
      setPlans(prev => [newPlan, ...prev])
      setLastSaved(new Date())
      
      return newPlan
    } catch (err) {
      console.error('Erreur sauvegarde plan:', err)
      setError('Impossible de sauvegarder le plan')
      return null
    } finally {
      setIsSaving(false)
    }
  }, [projectId])

  // Supprimer un plan
  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    
    try {
      const { error: deleteError } = await supabase
        .from('takeoff_plans')
        .delete()
        .eq('id', planId)

      if (deleteError) throw deleteError
      
      setPlans(prev => prev.filter(p => p.id !== planId))
      // Supprimer aussi les mesures associées localement
      setMeasurements(prev => prev.filter(m => m.planId !== planId))
      
      return true
    } catch (err) {
      console.error('Erreur suppression plan:', err)
      setError('Impossible de supprimer le plan')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Sauvegarder une mesure
  const saveMeasurement = useCallback(async (measurement: Measurement): Promise<boolean> => {
    if (!projectId) return false
    
    setIsSaving(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const dbRecord = {
        id: measurement.id,
        project_id: projectId,
        user_id: user.id,
        plan_id: measurement.planId,
        label: measurement.label,
        description: measurement.description,
        category: measurement.category,
        color: measurement.color,
        measure_type: measurement.type,
        points: measurement.points,
        page_number: measurement.page || measurement.pageNumber,
        value: measurement.value,
        unit: measurement.unit,
        height: measurement.dimensions?.height,
        width: measurement.dimensions?.width,
        depth: measurement.dimensions?.depth,
        thickness: measurement.dimensions?.thickness,
        quantity: measurement.dimensions?.quantity || 1,
        calculated_length: measurement.calculated?.length,
        calculated_area: measurement.calculated?.area,
        calculated_volume: measurement.calculated?.volume,
        calculated_count: measurement.calculated?.count,
        labor_trade_code: measurement.costs?.laborTradeCode,
        labor_trade_name: measurement.costs?.laborTradeName,
        labor_hourly_rate: measurement.costs?.laborHourlyRate,
        labor_hours: measurement.costs?.laborHours,
        labor_cost: measurement.costs?.laborCost,
        material_name: measurement.costs?.materialName,
        material_unit: measurement.costs?.materialUnit,
        material_unit_price: measurement.costs?.materialUnitPrice,
        material_quantity: measurement.costs?.materialQuantity,
        material_cost: measurement.costs?.materialCost,
        total_cost: measurement.costs?.totalCost,
        markup_percent: measurement.costs?.markup,
        total_with_markup: measurement.costs?.totalWithMarkup,
        notes: measurement.notes
      }

      const { error: upsertError } = await supabase
        .from('takeoff_measurements')
        .upsert(dbRecord, { onConflict: 'id' })

      if (upsertError) throw upsertError
      
      // Mettre à jour l'état local
      setMeasurements(prev => {
        const exists = prev.find(m => m.id === measurement.id)
        if (exists) {
          return prev.map(m => m.id === measurement.id ? measurement : m)
        }
        return [...prev, measurement]
      })
      
      setLastSaved(new Date())
      return true
    } catch (err) {
      console.error('Erreur sauvegarde mesure:', err)
      setError('Impossible de sauvegarder la mesure')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [projectId])

  // Sauvegarder plusieurs mesures (batch)
  const saveMeasurements = useCallback(async (measurementsToSave: Measurement[]): Promise<boolean> => {
    if (!projectId || measurementsToSave.length === 0) return false
    
    setIsSaving(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const dbRecords = measurementsToSave.map(m => ({
        id: m.id,
        project_id: projectId,
        user_id: user.id,
        plan_id: m.planId,
        label: m.label,
        description: m.description,
        category: m.category,
        color: m.color,
        measure_type: m.type,
        points: m.points,
        page_number: m.page || m.pageNumber,
        value: m.value,
        unit: m.unit,
        height: m.dimensions?.height,
        width: m.dimensions?.width,
        depth: m.dimensions?.depth,
        thickness: m.dimensions?.thickness,
        quantity: m.dimensions?.quantity || 1,
        calculated_length: m.calculated?.length,
        calculated_area: m.calculated?.area,
        calculated_volume: m.calculated?.volume,
        calculated_count: m.calculated?.count,
        labor_trade_code: m.costs?.laborTradeCode,
        labor_trade_name: m.costs?.laborTradeName,
        labor_hourly_rate: m.costs?.laborHourlyRate,
        labor_hours: m.costs?.laborHours,
        labor_cost: m.costs?.laborCost,
        material_name: m.costs?.materialName,
        material_unit: m.costs?.materialUnit,
        material_unit_price: m.costs?.materialUnitPrice,
        material_quantity: m.costs?.materialQuantity,
        material_cost: m.costs?.materialCost,
        total_cost: m.costs?.totalCost,
        markup_percent: m.costs?.markup,
        total_with_markup: m.costs?.totalWithMarkup,
        notes: m.notes
      }))

      const { error: upsertError } = await supabase
        .from('takeoff_measurements')
        .upsert(dbRecords, { onConflict: 'id' })

      if (upsertError) throw upsertError
      
      setMeasurements(measurementsToSave)
      setLastSaved(new Date())
      return true
    } catch (err) {
      console.error('Erreur sauvegarde mesures:', err)
      setError('Impossible de sauvegarder les mesures')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [projectId])

  // Supprimer une mesure
  const deleteMeasurement = useCallback(async (measurementId: string): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    
    try {
      const { error: deleteError } = await supabase
        .from('takeoff_measurements')
        .delete()
        .eq('id', measurementId)

      if (deleteError) throw deleteError
      
      setMeasurements(prev => prev.filter(m => m.id !== measurementId))
      return true
    } catch (err) {
      console.error('Erreur suppression mesure:', err)
      setError('Impossible de supprimer la mesure')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Export vers Soumission
  const exportToBid = useCallback(async (measurementsToExport: Measurement[]): Promise<boolean> => {
    if (!projectId || measurementsToExport.length === 0) return false
    
    setIsSaving(true)
    setError(null)
    
    try {
      // Grouper les mesures par catégorie
      const grouped = measurementsToExport.reduce((acc, m) => {
        if (!acc[m.category]) {
          acc[m.category] = []
        }
        acc[m.category].push(m)
        return acc
      }, {} as Record<string, Measurement[]>)

      // Créer les items de soumission
      const bidItems = Object.entries(grouped).map(([category, items], index) => {
        const totalMaterial = items.reduce((sum, m) => sum + (m.costs?.materialCost || 0), 0)
        const totalLabor = items.reduce((sum, m) => sum + (m.costs?.laborCost || 0), 0)
        const totalQuantity = items.reduce((sum, m) => {
          if (m.calculated?.area) return sum + m.calculated.area
          if (m.calculated?.volume) return sum + m.calculated.volume
          return sum + m.value
        }, 0)
        const unit = items[0].unit

        return {
          project_id: projectId,
          measurement_ids: items.map(m => m.id),
          category,
          item_number: `${(index + 1).toString().padStart(3, '0')}`,
          description: `${category} - ${items.length} mesure(s)`,
          quantity: totalQuantity,
          unit,
          material_cost: totalMaterial,
          labor_cost: totalLabor,
          equipment_cost: 0,
          subtotal: totalMaterial + totalLabor,
          overhead_percent: 10,
          profit_percent: 10,
          total_cost: (totalMaterial + totalLabor) * 1.21, // 10% overhead + 10% profit
          unit_price: totalQuantity > 0 ? ((totalMaterial + totalLabor) * 1.21) / totalQuantity : 0
        }
      })

      const { error: insertError } = await supabase
        .from('bid_items_from_takeoff')
        .insert(bidItems)

      if (insertError) throw insertError

      // Marquer les mesures comme exportées
      const ids = measurementsToExport.map(m => m.id)
      await supabase
        .from('takeoff_measurements')
        .update({ exported_to_bid: true })
        .in('id', ids)

      return true
    } catch (err) {
      console.error('Erreur export vers soumission:', err)
      setError('Impossible d\'exporter vers la soumission')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [projectId])

  // Auto-save avec debounce
  useEffect(() => {
    if (!autoSave || pendingMeasurementsRef.current.length === 0) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveMeasurements(pendingMeasurementsRef.current)
      pendingMeasurementsRef.current = []
    }, autoSaveDelay)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [autoSave, autoSaveDelay, saveMeasurements])

  return {
    plans,
    loadingPlans,
    savePlan,
    deletePlan,
    measurements,
    loadingMeasurements,
    saveMeasurement,
    saveMeasurements,
    deleteMeasurement,
    isSaving,
    lastSaved,
    error,
    exportToBid
  }
}

export default useTakeoffPersistence
