/**
 * DAST Solutions - Hook Takeoff CORRIGÉ
 * 100% Compatible avec TakeoffV2.tsx
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface TakeoffPlan {
  id: string
  project_id: string
  user_id?: string
  filename: string
  original_name?: string
  storage_path: string
  file_url?: string
  file_size?: number
  page_count: number
  name?: string
  numero?: string
  sort_order: number
  created_at: string
}

export interface TakeoffCalibration {
  id: string
  plan_id: string
  page_number: number
  point1_x: number
  point1_y: number
  point2_x: number
  point2_y: number
  real_distance: number
  real_unit: string
  pixels_per_unit: number
  scale_ratio?: string
}

export interface TakeoffMeasure {
  id: string
  project_id: string
  plan_id?: string
  page_number: number
  type: 'line' | 'rectangle' | 'polygon' | 'count' | 'area'
  points: Array<{ x: number; y: number }>
  value: number
  unit: string
  label: string
  category?: string
  subcategory?: string
  color: string
  unit_price: number
  total_price: number
  notes?: string
  created_at: string
}

export interface Point {
  x: number
  y: number
}

export interface TakeoffStats {
  totalMeasures: number
  totalValue: number
  totalItems: number
  totalPrice: number
  byCategory: Record<string, { count: number; total: number }>
}

// Catégories CSC MasterFormat
export const CSC_DIVISIONS = [
  { code: '01', name: 'Exigences générales' },
  { code: '02', name: 'Conditions existantes' },
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois, plastiques, composites' },
  { code: '07', name: 'Protection thermique et humidité' },
  { code: '08', name: 'Ouvertures' },
  { code: '09', name: 'Finitions' },
  { code: '10', name: 'Spécialités' },
  { code: '11', name: 'Équipements' },
  { code: '12', name: 'Ameublement' },
  { code: '13', name: 'Constructions spéciales' },
  { code: '14', name: 'Équipements de transport' },
  { code: '21', name: 'Protection incendie' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVCA' },
  { code: '26', name: 'Électricité' },
  { code: '31', name: 'Terrassement' },
  { code: '32', name: 'Aménagement extérieur' },
  { code: '33', name: 'Services publics' }
]

export function useTakeoff(projectId: string) {
  const [plans, setPlans] = useState<TakeoffPlan[]>([])
  const [activePlan, setActivePlan] = useState<TakeoffPlan | null>(null)
  const [activePage, setActivePage] = useState(1)
  const [calibration, setCalibration] = useState<TakeoffCalibration | null>(null)
  const [measures, setMeasures] = useState<TakeoffMeasure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les plans
  const loadPlans = useCallback(async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non authentifié')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('takeoff_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('sort_order')

      if (fetchError) throw fetchError

      const plansWithUrls = await Promise.all((data || []).map(async (plan) => {
        if (plan.storage_path) {
          const { data: urlData } = supabase.storage
            .from('takeoff-plans')
            .getPublicUrl(plan.storage_path)
          return { ...plan, file_url: urlData?.publicUrl }
        }
        return plan
      }))

      setPlans(plansWithUrls)
      if (plansWithUrls.length > 0 && !activePlan) {
        setActivePlan(plansWithUrls[0])
      }
    } catch (err: any) {
      console.error('Erreur chargement plans:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, activePlan])

  // Charger la calibration
  const loadCalibration = useCallback(async () => {
    if (!activePlan) { setCalibration(null); return }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('takeoff_calibrations')
        .select('*')
        .eq('plan_id', activePlan.id)
        .eq('page_number', activePage)
        .eq('user_id', user.id)
        .maybeSingle()

      setCalibration(data || null)
    } catch (err) {
      console.error('Erreur chargement calibration:', err)
    }
  }, [activePlan, activePage])

  // Charger les mesures
  const loadMeasures = useCallback(async () => {
    if (!projectId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('takeoff_measures')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activePlan) query = query.eq('plan_id', activePlan.id)

      const { data } = await query
      setMeasures(data || [])
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
    }
  }, [projectId, activePlan])

  // Upload plan
  const uploadPlan = async (file: File): Promise<TakeoffPlan | null> => {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      if (file.size > 50 * 1024 * 1024) throw new Error('Fichier trop volumineux (max 50MB)')

      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

      const { error: uploadError } = await supabase.storage
        .from('takeoff-plans')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(`Erreur upload: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from('takeoff-plans').getPublicUrl(storagePath)
      const nextOrder = plans.length > 0 ? Math.max(...plans.map(p => p.sort_order)) + 1 : 1

      const { data: planData, error: insertError } = await supabase
        .from('takeoff_plans')
        .insert({
          project_id: projectId,
          user_id: user.id,
          filename: sanitizedName,
          original_name: file.name,
          storage_path: storagePath,
          file_size: file.size,
          page_count: 1,
          name: file.name.replace(/\.[^/.]+$/, ''),
          numero: `P-${String(nextOrder).padStart(3, '0')}`,
          sort_order: nextOrder
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage.from('takeoff-plans').remove([storagePath])
        throw insertError
      }

      const newPlan = { ...planData, file_url: urlData?.publicUrl }
      setPlans([...plans, newPlan])
      setActivePlan(newPlan)
      return newPlan
    } catch (err: any) {
      console.error('Erreur upload:', err)
      setError(err.message)
      return null
    }
  }

  // Supprimer plan
  const deletePlan = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (plan?.storage_path) {
        await supabase.storage.from('takeoff-plans').remove([plan.storage_path])
      }
      await supabase.from('takeoff_plans').delete().eq('id', planId)
      const updated = plans.filter(p => p.id !== planId)
      setPlans(updated)
      if (activePlan?.id === planId) setActivePlan(updated[0] || null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Sauvegarder calibration - SIGNATURE COMPATIBLE TakeoffV2
  // Appel: saveCalibration(point1, point2, distance, unit)
  const saveCalibration = async (
    point1: Point,
    point2: Point,
    distance: number,
    unit: string
  ): Promise<TakeoffCalibration | null> => {
    if (!activePlan) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const pixelDistance = Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      )

      const payload = {
        plan_id: activePlan.id,
        page_number: activePage,
        user_id: user.id,
        point1_x: point1.x,
        point1_y: point1.y,
        point2_x: point2.x,
        point2_y: point2.y,
        real_distance: distance,
        real_unit: unit,
        pixels_per_unit: pixelDistance / distance
      }

      let result
      if (calibration?.id) {
        const { data, error } = await supabase
          .from('takeoff_calibrations')
          .update(payload)
          .eq('id', calibration.id)
          .select()
          .single()
        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabase
          .from('takeoff_calibrations')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        result = data
      }

      setCalibration(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // Ajouter mesure - SIGNATURE COMPATIBLE TakeoffV2
  // Appel: addMeasure(type, points, label, category, color, unitPrice)
  const addMeasure = async (
    type: string,
    points: Point[],
    label: string,
    category?: string,
    color?: string,
    unitPrice?: number
  ): Promise<TakeoffMeasure | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      let value = 0
      let unit = 'unité'

      if (calibration) {
        const ppu = calibration.pixels_per_unit

        if (type === 'line' && points.length >= 2) {
          let totalDist = 0
          for (let i = 0; i < points.length - 1; i++) {
            totalDist += Math.sqrt(
              Math.pow(points[i + 1].x - points[i].x, 2) +
              Math.pow(points[i + 1].y - points[i].y, 2)
            )
          }
          value = totalDist / ppu
          unit = calibration.real_unit
        } else if (type === 'rectangle' && points.length >= 2) {
          const width = Math.abs(points[1].x - points[0].x) / ppu
          const height = Math.abs(points[1].y - points[0].y) / ppu
          value = width * height
          unit = `${calibration.real_unit}²`
        } else if (type === 'polygon' && points.length >= 3) {
          let area = 0
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length
            area += points[i].x * points[j].y
            area -= points[j].x * points[i].y
          }
          value = Math.abs(area / 2) / (ppu * ppu)
          unit = `${calibration.real_unit}²`
        } else if (type === 'count') {
          value = points.length
          unit = 'unité'
        }
      } else if (type === 'count') {
        value = points.length
        unit = 'unité'
      }

      const price = unitPrice || 0
      const { data, error } = await supabase
        .from('takeoff_measures')
        .insert({
          project_id: projectId,
          plan_id: activePlan?.id,
          page_number: activePage,
          user_id: user.id,
          type,
          points,
          value,
          unit,
          label: label || `Mesure ${measures.length + 1}`,
          category: category || 'Autre',
          color: color || '#3B82F6',
          unit_price: price,
          total_price: value * price
        })
        .select()
        .single()

      if (error) throw error
      setMeasures([data, ...measures])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  // Supprimer mesure
  const deleteMeasure = async (measureId: string) => {
    try {
      await supabase.from('takeoff_measures').delete().eq('id', measureId)
      setMeasures(measures.filter(m => m.id !== measureId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Stats - COMPATIBLE TakeoffV2 (totalItems, totalPrice)
  const getStats = (): TakeoffStats => {
    const totalMeasures = measures.length
    const totalValue = measures.reduce((sum, m) => sum + (m.total_price || 0), 0)
    const byCategory = measures.reduce((acc, m) => {
      const cat = m.category || 'Non catégorisé'
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 }
      acc[cat].count++
      acc[cat].total += m.total_price || 0
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return {
      totalMeasures,
      totalValue,
      totalItems: totalMeasures,
      totalPrice: totalValue,
      byCategory
    }
  }

  useEffect(() => { loadPlans() }, [loadPlans])
  useEffect(() => { loadCalibration() }, [loadCalibration])
  useEffect(() => { loadMeasures() }, [loadMeasures])

  return {
    plans,
    activePlan,
    setActivePlan,
    activePage,
    setActivePage,
    calibration,
    measures,
    loading,
    error,
    uploadPlan,
    deletePlan,
    saveCalibration,
    addMeasure,
    deleteMeasure,
    getStats,
    refetch: loadPlans
  }
}
