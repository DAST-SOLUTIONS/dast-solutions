/**
 * DAST Solutions - Hook Takeoff CORRIGÉ
 * Upload fonctionnel avec gestion des erreurs
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface TakeoffPlan {
  id: string
  project_id: string
  user_id: string
  filename: string
  original_name: string
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

      // Générer les URLs publiques
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

  // Charger la calibration active
  const loadCalibration = useCallback(async () => {
    if (!activePlan) {
      setCalibration(null)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('takeoff_calibrations')
        .select('*')
        .eq('plan_id', activePlan.id)
        .eq('page_number', activePage)
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError
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

      if (activePlan) {
        query = query.eq('plan_id', activePlan.id)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setMeasures(data || [])
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
    }
  }, [projectId, activePlan])

  // Upload d'un plan
  const uploadPlan = async (file: File, name?: string, numero?: string): Promise<TakeoffPlan | null> => {
    try {
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Validation du fichier
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error('Le fichier est trop volumineux (max 50MB)')
      }

      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez PDF, PNG, JPEG ou TIFF.')
      }

      // Générer un nom unique
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

      console.log('Uploading to:', storagePath)

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('takeoff-plans')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Erreur upload: ${uploadError.message}`)
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('takeoff-plans')
        .getPublicUrl(storagePath)

      // Créer l'entrée dans la base de données
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
          page_count: 1, // Sera mis à jour après le parsing PDF
          name: name || file.name.replace(/\.[^/.]+$/, ''),
          numero: numero || `P-${String(nextOrder).padStart(3, '0')}`,
          sort_order: nextOrder
        })
        .select()
        .single()

      if (insertError) {
        // Nettoyer le fichier uploadé en cas d'erreur
        await supabase.storage.from('takeoff-plans').remove([storagePath])
        throw insertError
      }

      const newPlan = { ...planData, file_url: urlData?.publicUrl }
      setPlans([...plans, newPlan])
      setActivePlan(newPlan)

      return newPlan
    } catch (err: any) {
      console.error('Erreur upload plan:', err)
      setError(err.message)
      return null
    }
  }

  // Supprimer un plan
  const deletePlan = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      // Supprimer du storage
      if (plan.storage_path) {
        await supabase.storage.from('takeoff-plans').remove([plan.storage_path])
      }

      // Supprimer de la base de données
      const { error: deleteError } = await supabase
        .from('takeoff_plans')
        .delete()
        .eq('id', planId)

      if (deleteError) throw deleteError

      const updatedPlans = plans.filter(p => p.id !== planId)
      setPlans(updatedPlans)

      if (activePlan?.id === planId) {
        setActivePlan(updatedPlans[0] || null)
      }
    } catch (err: any) {
      console.error('Erreur suppression plan:', err)
      setError(err.message)
    }
  }

  // Mettre à jour un plan (nom, numéro)
  const updatePlan = async (planId: string, updates: { name?: string; numero?: string }) => {
    try {
      const { data, error: updateError } = await supabase
        .from('takeoff_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single()

      if (updateError) throw updateError

      setPlans(plans.map(p => p.id === planId ? { ...p, ...data } : p))
      if (activePlan?.id === planId) {
        setActivePlan({ ...activePlan, ...data })
      }
    } catch (err: any) {
      console.error('Erreur mise à jour plan:', err)
      setError(err.message)
    }
  }

  // Sauvegarder la calibration
  const saveCalibration = async (calibrationData: Partial<TakeoffCalibration>) => {
    if (!activePlan) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const payload = {
        ...calibrationData,
        plan_id: activePlan.id,
        page_number: activePage,
        user_id: user.id
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
      console.error('Erreur sauvegarde calibration:', err)
      setError(err.message)
      return null
    }
  }

  // Ajouter une mesure
  const addMeasure = async (measureData: Partial<TakeoffMeasure>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error: insertError } = await supabase
        .from('takeoff_measures')
        .insert({
          ...measureData,
          project_id: projectId,
          plan_id: activePlan?.id,
          page_number: activePage,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      setMeasures([data, ...measures])
      return data
    } catch (err: any) {
      console.error('Erreur ajout mesure:', err)
      setError(err.message)
      return null
    }
  }

  // Supprimer une mesure
  const deleteMeasure = async (measureId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('takeoff_measures')
        .delete()
        .eq('id', measureId)

      if (deleteError) throw deleteError

      setMeasures(measures.filter(m => m.id !== measureId))
    } catch (err: any) {
      console.error('Erreur suppression mesure:', err)
      setError(err.message)
    }
  }

  // Obtenir les statistiques
  const getStats = () => {
    const totalMeasures = measures.length
    const totalValue = measures.reduce((sum, m) => sum + (m.total_price || 0), 0)
    const byCategory = measures.reduce((acc, m) => {
      const cat = m.category || 'Non catégorisé'
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 }
      acc[cat].count++
      acc[cat].total += m.total_price || 0
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return { totalMeasures, totalValue, byCategory }
  }

  // Effets
  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useEffect(() => {
    loadCalibration()
  }, [loadCalibration])

  useEffect(() => {
    loadMeasures()
  }, [loadMeasures])

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
    updatePlan,
    saveCalibration,
    addMeasure,
    deleteMeasure,
    getStats,
    refetch: loadPlans
  }
}
