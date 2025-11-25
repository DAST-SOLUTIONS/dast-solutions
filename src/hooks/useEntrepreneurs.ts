import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  Entrepreneur, 
  CreateEntrepreneurParams, 
  EntrepreneurStatus,
  SpecialiteCode 
} from '@/types/entrepreneur-types'

export function useEntrepreneurs() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les entrepreneurs
  const fetchEntrepreneurs = async () => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurs')
        .select('*')
        .order('company_name', { ascending: true })

      if (error) throw error
      setEntrepreneurs(data || [])
    } catch (err) {
      console.error('Error fetching entrepreneurs:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
  }

  // Obtenir un entrepreneur par ID
  const getEntrepreneur = async (id: string): Promise<Entrepreneur | null> => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching entrepreneur:', err)
      return null
    }
  }

  // Créer un entrepreneur
  const createEntrepreneur = async (params: CreateEntrepreneurParams): Promise<Entrepreneur | null> => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurs')
        .insert({
          company_name: params.company_name,
          contact_name: params.contact_name,
          email: params.email,
          phone: params.phone,
          cell: params.cell,
          address: params.address,
          city: params.city,
          province: params.province || 'QC',
          postal_code: params.postal_code,
          rbq_license: params.rbq_license,
          specialites: params.specialites || [],
          notes: params.notes,
          source: params.source || 'manuel',
          status: 'actif',
          rbq_status: params.rbq_license ? 'inconnu' : null
        })
        .select()
        .single()

      if (error) throw error

      await fetchEntrepreneurs()
      return data
    } catch (err) {
      console.error('Error creating entrepreneur:', err)
      setError(err instanceof Error ? err.message : 'Erreur de création')
      return null
    }
  }

  // Mettre à jour un entrepreneur
  const updateEntrepreneur = async (id: string, updates: Partial<Entrepreneur>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('entrepreneurs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await fetchEntrepreneurs()
      return true
    } catch (err) {
      console.error('Error updating entrepreneur:', err)
      return false
    }
  }

  // Supprimer un entrepreneur
  const deleteEntrepreneur = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('entrepreneurs')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchEntrepreneurs()
      return true
    } catch (err) {
      console.error('Error deleting entrepreneur:', err)
      return false
    }
  }

  // Changer le statut
  const updateStatus = async (id: string, status: EntrepreneurStatus): Promise<boolean> => {
    return updateEntrepreneur(id, { status })
  }

  // Rechercher par nom ou spécialité
  const searchEntrepreneurs = async (query: string, specialite?: SpecialiteCode): Promise<Entrepreneur[]> => {
    try {
      let queryBuilder = supabase
        .from('entrepreneurs')
        .select('*')
        .eq('status', 'actif')

      if (query) {
        queryBuilder = queryBuilder.or(`company_name.ilike.%${query}%,contact_name.ilike.%${query}%`)
      }

      if (specialite) {
        queryBuilder = queryBuilder.contains('specialites', [specialite])
      }

      const { data, error } = await queryBuilder.order('company_name')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error searching entrepreneurs:', err)
      return []
    }
  }

  // Filtrer par spécialité
  const getBySpecialite = (specialite: SpecialiteCode): Entrepreneur[] => {
    return entrepreneurs.filter(e => 
      e.status === 'actif' && e.specialites?.includes(specialite)
    )
  }

  // Importer depuis RBQ (données déjà récupérées)
  const importFromRBQ = async (rbqData: Record<string, any>): Promise<Entrepreneur | null> => {
    try {
      // Vérifier si déjà importé
      if (rbqData.rbq_license) {
        const existing = entrepreneurs.find(e => e.rbq_license === rbqData.rbq_license)
        if (existing) {
          // Mettre à jour les données
          await updateEntrepreneur(existing.id, {
            ...rbqData,
            rbq_data: rbqData,
            rbq_last_verified: new Date().toISOString()
          })
          return existing
        }
      }

      // Créer nouveau
      const { data, error } = await supabase
        .from('entrepreneurs')
        .insert({
          company_name: rbqData.company_name || rbqData.nom,
          contact_name: rbqData.contact_name,
          email: rbqData.email,
          phone: rbqData.phone || rbqData.telephone,
          address: rbqData.address || rbqData.adresse,
          city: rbqData.city || rbqData.ville,
          province: 'QC',
          postal_code: rbqData.postal_code || rbqData.code_postal,
          rbq_license: rbqData.rbq_license || rbqData.numero_licence,
          rbq_status: rbqData.rbq_status || 'valide',
          rbq_categories: rbqData.categories || [],
          rbq_last_verified: new Date().toISOString(),
          specialites: rbqData.specialites || [],
          source: 'rbq',
          rbq_data: rbqData,
          status: 'actif'
        })
        .select()
        .single()

      if (error) throw error

      await fetchEntrepreneurs()
      return data
    } catch (err) {
      console.error('Error importing from RBQ:', err)
      return null
    }
  }

  // Statistiques
  const getStats = () => {
    const actifs = entrepreneurs.filter(e => e.status === 'actif').length
    const inactifs = entrepreneurs.filter(e => e.status === 'inactif').length
    const bloques = entrepreneurs.filter(e => e.status === 'bloque').length
    const avecRBQ = entrepreneurs.filter(e => e.rbq_license).length
    
    return { total: entrepreneurs.length, actifs, inactifs, bloques, avecRBQ }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchEntrepreneurs()
      setLoading(false)
    }

    loadData()
  }, [])

  return {
    entrepreneurs,
    loading,
    error,
    getEntrepreneur,
    createEntrepreneur,
    updateEntrepreneur,
    deleteEntrepreneur,
    updateStatus,
    searchEntrepreneurs,
    getBySpecialite,
    importFromRBQ,
    getStats,
    refetch: fetchEntrepreneurs
  }
}