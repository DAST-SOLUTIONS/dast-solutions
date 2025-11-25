import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Soumission, 
  SoumissionItem, 
  SoumissionSummary, 
  CreateSoumissionParams,
  SoumissionStatus 
} from '@/types/soumission-types'
import { generateSoumissionNumber, calculateSoumissionTotals } from '@/types/soumission-types'

export function useSoumissions(projectId?: string) {
  const [soumissions, setSoumissions] = useState<SoumissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les soumissions
  const fetchSoumissions = async () => {
    try {
      let query = supabase
        .from('soumissions')
        .select('id, soumission_number, client_name, client_company, project_name, total, status, date_created, date_valid_until')
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      setSoumissions(data || [])
    } catch (err) {
      console.error('Error fetching soumissions:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
  }

  // Obtenir une soumission avec ses items
  const getSoumission = async (id: string): Promise<Soumission | null> => {
    try {
      const { data: soumission, error: soumissionError } = await supabase
        .from('soumissions')
        .select('*')
        .eq('id', id)
        .single()

      if (soumissionError) throw soumissionError

      const { data: items, error: itemsError } = await supabase
        .from('soumission_items')
        .select('*')
        .eq('soumission_id', id)
        .order('sort_order', { ascending: true })

      if (itemsError) throw itemsError

      return { ...soumission, items: items || [] }
    } catch (err) {
      console.error('Error fetching soumission:', err)
      return null
    }
  }

  // Créer une nouvelle soumission
  const createSoumission = async (params: CreateSoumissionParams): Promise<Soumission | null> => {
    try {
      // Calculer les totaux
      const totals = calculateSoumissionTotals(params.items)

      // Générer le numéro de soumission
      const soumissionNumber = generateSoumissionNumber()

      // Créer la soumission
      const { data: soumission, error: soumissionError } = await supabase
        .from('soumissions')
        .insert({
          project_id: params.project_id,
          soumission_number: soumissionNumber,
          revision: 1,
          
          // Client
          client_name: params.client.name,
          client_company: params.client.company,
          client_address: params.client.address,
          client_city: params.client.city,
          client_province: params.client.province || 'QC',
          client_postal_code: params.client.postal_code,
          client_phone: params.client.phone,
          client_email: params.client.email,
          
          // Projet
          project_name: params.project_name,
          project_address: params.project_address,
          project_description: params.project_description,
          
          // Montants
          subtotal: totals.subtotal,
          tps_amount: totals.tps_amount,
          tvq_amount: totals.tvq_amount,
          total: totals.total,
          
          // Dates
          date_created: new Date().toISOString(),
          date_valid_until: params.date_valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          
          // Statut
          status: 'brouillon',
          
          // Conditions
          conditions: params.conditions,
          exclusions: params.exclusions,
          notes_internes: params.notes_internes
        })
        .select()
        .single()

      if (soumissionError) throw soumissionError

      // Créer les items
      if (params.items.length > 0) {
        const itemsToInsert = params.items.map((item, index) => ({
          soumission_id: soumission.id,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          notes: item.notes,
          sort_order: index,
          takeoff_item_id: item.takeoff_item_id
        }))

        const { error: itemsError } = await supabase
          .from('soumission_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      await fetchSoumissions()
      return soumission
    } catch (err) {
      console.error('Error creating soumission:', err)
      setError(err instanceof Error ? err.message : 'Erreur de création')
      return null
    }
  }

  // Mettre à jour une soumission
  const updateSoumission = async (id: string, updates: Partial<Soumission>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('soumissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await fetchSoumissions()
      return true
    } catch (err) {
      console.error('Error updating soumission:', err)
      return false
    }
  }

  // Changer le statut
  const updateStatus = async (id: string, status: SoumissionStatus): Promise<boolean> => {
    const updates: Partial<Soumission> = { status }
    
    if (status === 'envoyee') {
      updates.date_sent = new Date().toISOString()
    }
    
    return updateSoumission(id, updates)
  }

  // Supprimer une soumission
  const deleteSoumission = async (id: string): Promise<boolean> => {
    try {
      // Supprimer d'abord les items
      const { error: itemsError } = await supabase
        .from('soumission_items')
        .delete()
        .eq('soumission_id', id)

      if (itemsError) throw itemsError

      // Puis la soumission
      const { error } = await supabase
        .from('soumissions')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchSoumissions()
      return true
    } catch (err) {
      console.error('Error deleting soumission:', err)
      return false
    }
  }

  // Dupliquer une soumission (nouvelle révision)
  const duplicateSoumission = async (id: string): Promise<Soumission | null> => {
    try {
      const original = await getSoumission(id)
      if (!original) return null

      // Incrémenter la révision
      const newRevision = (original.revision || 1) + 1

      // Créer la copie
      const { data: newSoumission, error: soumissionError } = await supabase
        .from('soumissions')
        .insert({
          ...original,
          id: undefined,
          soumission_number: `${original.soumission_number}-R${newRevision}`,
          revision: newRevision,
          status: 'brouillon',
          date_created: new Date().toISOString(),
          date_sent: null,
          created_at: undefined,
          updated_at: undefined
        })
        .select()
        .single()

      if (soumissionError) throw soumissionError

      // Copier les items
      if (original.items && original.items.length > 0) {
        const itemsToInsert = original.items.map(item => ({
          soumission_id: newSoumission.id,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
          sort_order: item.sort_order
        }))

        const { error: itemsError } = await supabase
          .from('soumission_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      await fetchSoumissions()
      return newSoumission
    } catch (err) {
      console.error('Error duplicating soumission:', err)
      return null
    }
  }

  // Ajouter un item
  const addItem = async (soumissionId: string, item: Omit<SoumissionItem, 'id' | 'soumission_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('soumission_items')
        .insert({
          soumission_id: soumissionId,
          ...item,
          total_price: item.quantity * item.unit_price
        })

      if (error) throw error

      // Recalculer les totaux
      await recalculateTotals(soumissionId)
      return true
    } catch (err) {
      console.error('Error adding item:', err)
      return false
    }
  }

  // Supprimer un item
  const deleteItem = async (soumissionId: string, itemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('soumission_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Recalculer les totaux
      await recalculateTotals(soumissionId)
      return true
    } catch (err) {
      console.error('Error deleting item:', err)
      return false
    }
  }

  // Recalculer les totaux
  const recalculateTotals = async (soumissionId: string): Promise<boolean> => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('soumission_items')
        .select('quantity, unit_price')
        .eq('soumission_id', soumissionId)

      if (itemsError) throw itemsError

      const totals = calculateSoumissionTotals(items || [])

      const { error } = await supabase
        .from('soumissions')
        .update(totals)
        .eq('id', soumissionId)

      if (error) throw error

      return true
    } catch (err) {
      console.error('Error recalculating totals:', err)
      return false
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchSoumissions()
      setLoading(false)
    }

    loadData()
  }, [projectId])

  return {
    soumissions,
    loading,
    error,
    getSoumission,
    createSoumission,
    updateSoumission,
    updateStatus,
    deleteSoumission,
    duplicateSoumission,
    addItem,
    deleteItem,
    recalculateTotals,
    refetch: fetchSoumissions
  }
}