/**
 * DAST Solutions - Hook Facturation
 * Gestion complète des factures et paiements
 */
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface FactureItem {
  id?: string
  facture_id?: string
  description: string
  category?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  sort_order?: number
  notes?: string
}

export interface Paiement {
  id: string
  facture_id: string
  montant: number
  date_paiement: string
  methode: 'virement' | 'cheque' | 'comptant' | 'carte' | 'autre'
  reference?: string
  notes?: string
  created_at: string
}

export interface Facture {
  id: string
  soumission_id?: string
  project_id?: string
  facture_number: string
  revision: number
  
  // Client
  client_name: string
  client_company?: string
  client_address?: string
  client_city?: string
  client_province: string
  client_postal_code?: string
  client_phone?: string
  client_email?: string
  
  // Projet
  project_name?: string
  project_address?: string
  
  // Montants
  subtotal: number
  tps_rate: number
  tps_amount: number
  tvq_rate: number
  tvq_amount: number
  total: number
  
  // Paiements
  amount_paid: number
  balance_due: number
  
  // Dates
  date_facture: string
  date_echeance?: string
  date_paid?: string
  
  // Statut
  status: 'brouillon' | 'envoyee' | 'payee' | 'partielle' | 'en_retard' | 'annulee'
  
  // Autres
  conditions?: string
  notes?: string
  notes_internes?: string
  
  // Relations
  items?: FactureItem[]
  paiements?: Paiement[]
  
  created_at: string
  updated_at: string
}

export interface CreateFactureParams {
  soumission_id?: string
  project_id?: string
  client: {
    name: string
    company?: string
    address?: string
    city?: string
    province?: string
    postal_code?: string
    phone?: string
    email?: string
  }
  project_name?: string
  project_address?: string
  items: Omit<FactureItem, 'id' | 'facture_id'>[]
  date_echeance?: string
  conditions?: string
  notes?: string
}

// Constantes
export const TPS_RATE = 0.05
export const TVQ_RATE = 0.09975

export const FACTURE_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  partielle: 'Paiement partiel',
  en_retard: 'En retard',
  annulee: 'Annulée'
}

export const FACTURE_STATUS_COLORS: Record<string, string> = {
  brouillon: '#6B7280',
  envoyee: '#3B82F6',
  payee: '#10B981',
  partielle: '#F59E0B',
  en_retard: '#EF4444',
  annulee: '#9CA3AF'
}

export const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'comptant', label: 'Comptant' },
  { value: 'carte', label: 'Carte de crédit' },
  { value: 'autre', label: 'Autre' }
]

// Fonction utilitaire pour calculer les totaux
export function calculateFactureTotals(items: Omit<FactureItem, 'id' | 'facture_id'>[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const tps_amount = subtotal * TPS_RATE
  const tvq_amount = subtotal * TVQ_RATE
  const total = subtotal + tps_amount + tvq_amount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tps_amount: Math.round(tps_amount * 100) / 100,
    tvq_amount: Math.round(tvq_amount * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

// Hook principal
export function useFactures() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger toutes les factures
  const fetchFactures = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('factures')
        .select('*')
        .order('date_facture', { ascending: false })

      if (fetchError) throw fetchError
      setFactures(data || [])
    } catch (err) {
      console.error('Erreur chargement factures:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFactures()
  }, [fetchFactures])

  // Obtenir une facture avec items et paiements
  const getFacture = useCallback(async (id: string): Promise<Facture | null> => {
    try {
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .select('*')
        .eq('id', id)
        .single()

      if (factureError) throw factureError

      // Charger les items
      const { data: items } = await supabase
        .from('facture_items')
        .select('*')
        .eq('facture_id', id)
        .order('sort_order')

      // Charger les paiements
      const { data: paiements } = await supabase
        .from('paiements')
        .select('*')
        .eq('facture_id', id)
        .order('date_paiement', { ascending: false })

      return {
        ...facture,
        items: items || [],
        paiements: paiements || []
      }
    } catch (err) {
      console.error('Erreur chargement facture:', err)
      return null
    }
  }, [])

  // Créer une facture
  const createFacture = useCallback(async (params: CreateFactureParams): Promise<Facture | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Générer le numéro de facture
      const { data: numData } = await supabase.rpc('generate_facture_number')
      const factureNumber = numData || `FACT-${Date.now()}`

      // Calculer les totaux
      const totals = calculateFactureTotals(params.items)

      // Créer la facture
      const { data: facture, error: factureError } = await supabase
        .from('factures')
        .insert({
          user_id: user.id,
          soumission_id: params.soumission_id,
          project_id: params.project_id,
          facture_number: factureNumber,
          
          client_name: params.client.name,
          client_company: params.client.company,
          client_address: params.client.address,
          client_city: params.client.city,
          client_province: params.client.province || 'QC',
          client_postal_code: params.client.postal_code,
          client_phone: params.client.phone,
          client_email: params.client.email,
          
          project_name: params.project_name,
          project_address: params.project_address,
          
          ...totals,
          tps_rate: TPS_RATE,
          tvq_rate: TVQ_RATE,
          balance_due: totals.total,
          
          date_facture: new Date().toISOString().split('T')[0],
          date_echeance: params.date_echeance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          
          conditions: params.conditions,
          notes: params.notes,
          
          status: 'brouillon'
        })
        .select()
        .single()

      if (factureError) throw factureError

      // Créer les items
      if (params.items.length > 0) {
        const itemsToInsert = params.items.map((item, index) => ({
          facture_id: facture.id,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          sort_order: index
        }))

        await supabase.from('facture_items').insert(itemsToInsert)
      }

      await fetchFactures()
      return facture
    } catch (err) {
      console.error('Erreur création facture:', err)
      setError(err instanceof Error ? err.message : 'Erreur de création')
      return null
    }
  }, [fetchFactures])

  // Créer facture depuis soumission
  const createFromSoumission = useCallback(async (soumissionId: string): Promise<Facture | null> => {
    try {
      // Charger la soumission
      const { data: soumission, error: soumError } = await supabase
        .from('soumissions')
        .select('*')
        .eq('id', soumissionId)
        .single()

      if (soumError) throw soumError

      // Charger les items de la soumission
      const { data: items } = await supabase
        .from('soumission_items')
        .select('*')
        .eq('soumission_id', soumissionId)
        .order('sort_order')

      // Convertir en facture
      return createFacture({
        soumission_id: soumissionId,
        project_id: soumission.project_id,
        client: {
          name: soumission.client_name,
          company: soumission.client_company,
          address: soumission.client_address,
          city: soumission.client_city,
          province: soumission.client_province,
          postal_code: soumission.client_postal_code,
          phone: soumission.client_phone,
          email: soumission.client_email
        },
        project_name: soumission.project_name,
        project_address: soumission.project_address,
        items: (items || []).map(item => ({
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        conditions: soumission.conditions
      })
    } catch (err) {
      console.error('Erreur création facture depuis soumission:', err)
      return null
    }
  }, [createFacture])

  // Mettre à jour le statut
  const updateStatus = useCallback(async (
    id: string, 
    status: Facture['status']
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('factures')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      await fetchFactures()
      return true
    } catch (err) {
      console.error('Erreur mise à jour statut:', err)
      return false
    }
  }, [fetchFactures])

  // Ajouter un paiement
  const addPaiement = useCallback(async (
    factureId: string,
    paiement: {
      montant: number
      methode: Paiement['methode']
      date_paiement?: string
      reference?: string
      notes?: string
    }
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('paiements')
        .insert({
          facture_id: factureId,
          user_id: user.id,
          montant: paiement.montant,
          date_paiement: paiement.date_paiement || new Date().toISOString().split('T')[0],
          methode: paiement.methode,
          reference: paiement.reference,
          notes: paiement.notes
        })

      if (error) throw error

      await fetchFactures()
      return true
    } catch (err) {
      console.error('Erreur ajout paiement:', err)
      return false
    }
  }, [fetchFactures])

  // Supprimer une facture
  const deleteFacture = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Supprimer items et paiements (cascade)
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchFactures()
      return true
    } catch (err) {
      console.error('Erreur suppression facture:', err)
      return false
    }
  }, [fetchFactures])

  // Stats
  const getStats = useCallback(() => {
    const totalFacture = factures.reduce((sum, f) => sum + f.total, 0)
    const totalPaye = factures.reduce((sum, f) => sum + f.amount_paid, 0)
    const totalDu = factures.reduce((sum, f) => sum + f.balance_due, 0)
    
    const byStatus = factures.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const enRetard = factures.filter(f => 
      f.status !== 'payee' && 
      f.status !== 'annulee' && 
      f.date_echeance && 
      new Date(f.date_echeance) < new Date()
    ).length

    return {
      totalFacture,
      totalPaye,
      totalDu,
      byStatus,
      enRetard,
      count: factures.length
    }
  }, [factures])

  return {
    factures,
    loading,
    error,
    getFacture,
    createFacture,
    createFromSoumission,
    updateStatus,
    addPaiement,
    deleteFacture,
    getStats,
    refetch: fetchFactures
  }
}

export default useFactures
