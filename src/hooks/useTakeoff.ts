/**
 * DAST Solutions - Hook Takeoff Complet
 * Gestion des plans, calibrations et mesures
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface TakeoffPlan {
  id: string
  project_id: string
  filename: string
  storage_path: string
  file_url?: string
  file_size?: number
  page_count: number
  name?: string
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

  // Charger les plans
  const loadPlans = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('takeoff_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('sort_order')

      if (error) throw error
      setPlans(data || [])
      
      if (data && data.length > 0 && !activePlan) {
        setActivePlan(data[0])
      }
    } catch (err) {
      console.error('Erreur chargement plans:', err)
    }
  }, [projectId, activePlan])

  // Charger la calibration active
  const loadCalibration = useCallback(async () => {
    if (!activePlan) {
      setCalibration(null)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('takeoff_calibrations')
        .select('*')
        .eq('plan_id', activePlan.id)
        .eq('page_number', activePage)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCalibration(data || null)
    } catch (err) {
      console.error('Erreur chargement calibration:', err)
    }
  }, [activePlan, activePage])

  // Charger les mesures
  const loadMeasures = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('takeoff_measures')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activePlan) {
        query = query.eq('plan_id', activePlan.id).eq('page_number', activePage)
      }

      const { data, error } = await query
      if (error) throw error
      
      setMeasures((data || []).map(m => ({
        ...m,
        points: typeof m.points === 'string' ? JSON.parse(m.points) : m.points
      })))
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId, activePlan, activePage])

  // Chargement initial
  useEffect(() => {
    if (projectId) {
      loadPlans()
    }
  }, [projectId, loadPlans])

  useEffect(() => {
    loadCalibration()
    loadMeasures()
  }, [activePlan, activePage, loadCalibration, loadMeasures])

  // Upload un plan PDF
  const uploadPlan = async (file: File): Promise<TakeoffPlan | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const fileName = `${user.id}/${projectId}/${Date.now()}_${file.name}`
      
      // Upload vers Storage
      const { error: uploadError } = await supabase.storage
        .from('takeoff-plans')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtenir URL signée
      const { data: urlData } = await supabase.storage
        .from('takeoff-plans')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 an

      // Créer l'entrée dans la BD
      const { data, error } = await supabase
        .from('takeoff_plans')
        .insert({
          user_id: user.id,
          project_id: projectId,
          filename: file.name,
          storage_path: fileName,
          file_url: urlData?.signedUrl,
          file_size: file.size,
          name: file.name.replace('.pdf', ''),
          page_count: 1, // À améliorer avec pdf.js
          sort_order: plans.length
        })
        .select()
        .single()

      if (error) throw error
      
      await loadPlans()
      return data
    } catch (err) {
      console.error('Erreur upload plan:', err)
      return null
    }
  }

  // Supprimer un plan
  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        await supabase.storage.from('takeoff-plans').remove([plan.storage_path])
      }

      const { error } = await supabase
        .from('takeoff_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
      
      if (activePlan?.id === planId) {
        setActivePlan(null)
      }
      
      await loadPlans()
      return true
    } catch (err) {
      console.error('Erreur suppression plan:', err)
      return false
    }
  }

  // Sauvegarder une calibration
  const saveCalibration = async (
    point1: Point,
    point2: Point,
    realDistance: number,
    realUnit: string = 'pi',
    scaleRatio?: string
  ): Promise<TakeoffCalibration | null> => {
    if (!activePlan) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Calculer pixels par unité
      const pixelDistance = Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
      )
      const pixelsPerUnit = pixelDistance / realDistance

      // Supprimer l'ancienne calibration si existe
      if (calibration) {
        await supabase.from('takeoff_calibrations').delete().eq('id', calibration.id)
      }

      const { data, error } = await supabase
        .from('takeoff_calibrations')
        .insert({
          user_id: user.id,
          plan_id: activePlan.id,
          page_number: activePage,
          point1_x: point1.x,
          point1_y: point1.y,
          point2_x: point2.x,
          point2_y: point2.y,
          real_distance: realDistance,
          real_unit: realUnit,
          pixels_per_unit: pixelsPerUnit,
          scale_ratio: scaleRatio
        })
        .select()
        .single()

      if (error) throw error
      
      setCalibration(data)
      return data
    } catch (err) {
      console.error('Erreur sauvegarde calibration:', err)
      return null
    }
  }

  // Calculer une mesure basée sur la calibration
  const calculateMeasure = (points: Point[], type: TakeoffMeasure['type']): number => {
    if (!calibration || points.length < 2) return 0

    const ppu = calibration.pixels_per_unit

    switch (type) {
      case 'line': {
        let total = 0
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i - 1].x
          const dy = points[i].y - points[i - 1].y
          total += Math.sqrt(dx * dx + dy * dy)
        }
        return total / ppu
      }
      case 'rectangle': {
        if (points.length < 2) return 0
        const width = Math.abs(points[1].x - points[0].x) / ppu
        const height = Math.abs(points[1].y - points[0].y) / ppu
        return width * height
      }
      case 'polygon':
      case 'area': {
        if (points.length < 3) return 0
        // Formule du lacet (Shoelace formula)
        let area = 0
        const n = points.length
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n
          area += points[i].x * points[j].y
          area -= points[j].x * points[i].y
        }
        return Math.abs(area / 2) / (ppu * ppu)
      }
      case 'count':
        return points.length
      default:
        return 0
    }
  }

  // Ajouter une mesure
  const addMeasure = async (
    type: TakeoffMeasure['type'],
    points: Point[],
    label: string,
    category?: string,
    color: string = '#14b8a6',
    unitPrice: number = 0
  ): Promise<TakeoffMeasure | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const value = calculateMeasure(points, type)
      const unit = type === 'count' ? 'unité' : 
                   (type === 'line' ? calibration?.real_unit || 'pi' : 
                   `${calibration?.real_unit || 'pi'}²`)

      const { data, error } = await supabase
        .from('takeoff_measures')
        .insert({
          user_id: user.id,
          project_id: projectId,
          plan_id: activePlan?.id,
          page_number: activePage,
          type,
          points: JSON.stringify(points),
          value,
          unit,
          label,
          category,
          color,
          unit_price: unitPrice,
          total_price: value * unitPrice
        })
        .select()
        .single()

      if (error) throw error
      
      const newMeasure = { ...data, points }
      setMeasures(prev => [newMeasure, ...prev])
      return newMeasure
    } catch (err) {
      console.error('Erreur ajout mesure:', err)
      return null
    }
  }

  // Mettre à jour une mesure
  const updateMeasure = async (
    measureId: string,
    updates: Partial<Pick<TakeoffMeasure, 'label' | 'category' | 'color' | 'unit_price' | 'notes'>>
  ): Promise<boolean> => {
    try {
      const measure = measures.find(m => m.id === measureId)
      if (!measure) return false

      const total_price = updates.unit_price !== undefined 
        ? measure.value * updates.unit_price 
        : measure.total_price

      const { error } = await supabase
        .from('takeoff_measures')
        .update({ ...updates, total_price, updated_at: new Date().toISOString() })
        .eq('id', measureId)

      if (error) throw error
      
      setMeasures(prev => prev.map(m => 
        m.id === measureId ? { ...m, ...updates, total_price } : m
      ))
      return true
    } catch (err) {
      console.error('Erreur mise à jour mesure:', err)
      return false
    }
  }

  // Supprimer une mesure
  const deleteMeasure = async (measureId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('takeoff_measures')
        .delete()
        .eq('id', measureId)

      if (error) throw error
      
      setMeasures(prev => prev.filter(m => m.id !== measureId))
      return true
    } catch (err) {
      console.error('Erreur suppression mesure:', err)
      return false
    }
  }

  // Statistiques
  const getStats = () => {
    const totalItems = measures.length
    const totalValue = measures.reduce((sum, m) => sum + m.value, 0)
    const totalPrice = measures.reduce((sum, m) => sum + m.total_price, 0)
    
    const byCategory = measures.reduce((acc, m) => {
      const cat = m.category || 'Non classé'
      if (!acc[cat]) acc[cat] = { count: 0, value: 0, price: 0 }
      acc[cat].count++
      acc[cat].value += m.value
      acc[cat].price += m.total_price
      return acc
    }, {} as Record<string, { count: number; value: number; price: number }>)

    return { totalItems, totalValue, totalPrice, byCategory }
  }

  return {
    // Plans
    plans,
    activePlan,
    setActivePlan,
    activePage,
    setActivePage,
    uploadPlan,
    deletePlan,
    
    // Calibration
    calibration,
    saveCalibration,
    
    // Mesures
    measures,
    calculateMeasure,
    addMeasure,
    updateMeasure,
    deleteMeasure,
    
    // Utils
    loading,
    getStats,
    refetch: loadMeasures
  }
}

export default useTakeoff
