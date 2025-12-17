/**
 * DAST Solutions - Hook Clients CRM
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Client {
  id: string
  type: 'particulier' | 'entreprise'
  name: string
  company?: string
  contact_name?: string
  contact_title?: string
  email?: string
  phone?: string
  mobile?: string
  address?: string
  city?: string
  province: string
  postal_code?: string
  country: string
  credit_limit?: number
  payment_terms: number
  tax_exempt: boolean
  category?: string
  source?: string
  tags?: string[]
  notes?: string
  status: 'actif' | 'inactif' | 'prospect'
  total_projects: number
  total_revenue: number
  last_project_date?: string
  created_at: string
  updated_at: string
}

export const CLIENT_CATEGORIES = [
  { value: 'residentiel', label: 'Résidentiel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'institutionnel', label: 'Institutionnel' },
  { value: 'industriel', label: 'Industriel' },
  { value: 'gouvernemental', label: 'Gouvernemental' }
]

export const CLIENT_SOURCES = [
  { value: 'reference', label: 'Référence' },
  { value: 'web', label: 'Site web' },
  { value: 'appel', label: 'Appel entrant' },
  { value: 'seao', label: 'SEAO' },
  { value: 'reseau', label: 'Réseautage' },
  { value: 'publicite', label: 'Publicité' },
  { value: 'autre', label: 'Autre' }
]

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Erreur chargement clients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const createClient = async (client: Partial<Client>): Promise<Client | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          ...client,
          type: client.type || 'entreprise',
          province: client.province || 'QC',
          country: client.country || 'Canada',
          payment_terms: client.payment_terms || 30,
          tax_exempt: client.tax_exempt || false,
          status: client.status || 'actif',
          total_projects: 0,
          total_revenue: 0
        })
        .select()
        .single()

      if (error) throw error
      await fetchClients()
      return data
    } catch (err) {
      console.error('Erreur création client:', err)
      return null
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await fetchClients()
      return true
    } catch (err) {
      console.error('Erreur mise à jour client:', err)
      return false
    }
  }

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchClients()
      return true
    } catch (err) {
      console.error('Erreur suppression client:', err)
      return false
    }
  }

  const getStats = () => {
    const total = clients.length
    const actifs = clients.filter(c => c.status === 'actif').length
    const prospects = clients.filter(c => c.status === 'prospect').length
    const totalRevenue = clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0)
    
    return { total, actifs, prospects, totalRevenue }
  }

  const searchClients = (query: string): Client[] => {
    const q = query.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    getStats,
    searchClients,
    refetch: fetchClients
  }
}

export default useClients
