/**
 * DAST Solutions - Hook pour gestion des soumissions v2
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SoumissionV2, SoumissionTemplate, SoumissionFilters, SoumissionItem } from '@/types/pricing-types'

export function useSoumissionsV2(projectId?: string) {
  const [soumissions, setSoumissions] = useState<SoumissionV2[]>([])
  const [templates, setTemplates] = useState<SoumissionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les soumissions
  const loadSoumissions = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('soumissions_v2')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      setSoumissions(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement soumissions:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Charger les templates
  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('soumission_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Erreur chargement templates:', err)
    }
  }, [])

  useEffect(() => {
    loadSoumissions()
    loadTemplates()
  }, [loadSoumissions, loadTemplates])

  // Générer un nouveau numéro
  const generateNumero = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('soumissions_v2')
      .select('*', { count: 'exact', head: true })
      .like('numero', `SOU-${year}%`)

    const seq = (count || 0) + 1
    return `SOU-${year}-${String(seq).padStart(4, '0')}`
  }

  // Créer une soumission
  const createSoumission = useCallback(async (data: Partial<SoumissionV2>) => {
    try {
      const numero = await generateNumero()
      
      const newSoumission = {
        ...data,
        numero,
        status: 'draft' as const,
        date_creation: new Date().toISOString().split('T')[0],
        date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sections: data.sections || [],
        subtotal_materials: 0,
        subtotal_labor: 0,
        subtotal_equipment: 0,
        subtotal_subcontracts: 0,
        subtotal: 0,
        discount_percent: 0,
        discount_amount: 0,
        contingency_percent: 0,
        contingency_amount: 0,
        profit_percent: 0,
        profit_amount: 0,
        tps_amount: 0,
        tvq_amount: 0,
        grand_total: 0,
        viewed_count: 0,
      }

      const { data: result, error } = await supabase
        .from('soumissions_v2')
        .insert(newSoumission)
        .select()
        .single()

      if (error) throw error
      setSoumissions(prev => [result, ...prev])
      return { data: result, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [])

  // Mettre à jour une soumission
  const updateSoumission = useCallback(async (id: string, updates: Partial<SoumissionV2>) => {
    try {
      // Recalculer les totaux si sections modifiées
      if (updates.sections) {
        const calculated = calculateTotals(updates)
        updates = { ...updates, ...calculated }
      }

      const { data, error } = await supabase
        .from('soumissions_v2')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setSoumissions(prev => prev.map(s => s.id === id ? data : s))
      return { data, error: null }
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [])

  // Supprimer une soumission
  const deleteSoumission = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('soumissions_v2')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSoumissions(prev => prev.filter(s => s.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [])

  // Dupliquer une soumission
  const duplicateSoumission = useCallback(async (id: string) => {
    try {
      const original = soumissions.find(s => s.id === id)
      if (!original) throw new Error('Soumission non trouvée')

      const { id: _, numero: __, created_at: ___, updated_at: ____, ...data } = original
      
      return await createSoumission({
        ...data,
        status: 'draft',
        revision: (original.revision || 1) + 1,
        date_envoi: undefined,
        date_reponse: undefined,
        signature_client: undefined,
        date_signature_client: undefined,
        pdf_url: undefined,
        viewed_at: undefined,
        viewed_count: 0,
      })
    } catch (err: any) {
      return { data: null, error: err.message }
    }
  }, [soumissions, createSoumission])

  // Envoyer une soumission
  const sendSoumission = useCallback(async (id: string, email: string) => {
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('soumissions_v2')
        .update({
          status: 'sent',
          date_envoi: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)

      if (updateError) throw updateError

      // TODO: Envoyer l'email via edge function
      // await supabase.functions.invoke('send-soumission-email', { body: { id, email } })

      await loadSoumissions()
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }, [loadSoumissions])

  // Calculer les totaux
  const calculateTotals = (soumission: Partial<SoumissionV2>) => {
    let subtotal_materials = 0
    let subtotal_labor = 0
    let subtotal_equipment = 0
    let subtotal_subcontracts = 0

    // Calculer depuis les sections
    if (soumission.sections) {
      soumission.sections.forEach(section => {
        section.items?.forEach(item => {
          if (item.is_included) {
            const price = item.total_price || 0
            subtotal_materials += price // Simplification pour l'instant
          }
        })
      })
    }

    const subtotal = subtotal_materials + subtotal_labor + subtotal_equipment + subtotal_subcontracts

    // Ajustements
    const discount_amount = (soumission.discount_percent || 0) / 100 * subtotal
    const after_discount = subtotal - discount_amount
    
    const contingency_amount = (soumission.contingency_percent || 0) / 100 * after_discount
    const profit_amount = (soumission.profit_percent || 0) / 100 * after_discount

    const subtotal_adjusted = after_discount + contingency_amount + profit_amount

    // Taxes Québec
    const tps_rate = 0.05
    const tvq_rate = 0.09975
    const tps_amount = subtotal_adjusted * tps_rate
    const tvq_amount = subtotal_adjusted * tvq_rate

    const grand_total = subtotal_adjusted + tps_amount + tvq_amount

    return {
      subtotal_materials,
      subtotal_labor,
      subtotal_equipment,
      subtotal_subcontracts,
      subtotal,
      discount_amount,
      contingency_amount,
      profit_amount,
      tps_amount,
      tvq_amount,
      grand_total,
    }
  }

  // Obtenir une soumission par ID
  const getSoumission = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('soumissions_v2')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur récupération soumission:', err)
      return null
    }
  }, [])

  return {
    soumissions,
    templates,
    loading,
    error,
    createSoumission,
    updateSoumission,
    deleteSoumission,
    duplicateSoumission,
    sendSoumission,
    getSoumission,
    calculateTotals,
    refresh: loadSoumissions
  }
}
