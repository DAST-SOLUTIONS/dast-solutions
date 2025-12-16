/**
 * DAST Solutions - Hook Entrepreneurs CRUD
 * Connexion Supabase pour gestion des sous-traitants
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface Entrepreneur {
  id: string
  user_id: string
  nom: string
  nom_legal?: string
  neq?: string
  rbq_licence?: string
  rbq_categories: string[]
  rbq_status: 'valide' | 'suspendu' | 'expire' | 'non_verifie'
  rbq_date_verification?: string
  rbq_date_expiration?: string
  adresse_rue?: string
  adresse_ville?: string
  adresse_province: string
  adresse_code_postal?: string
  specialites: string[]
  corps_metier?: string
  evaluation_moyenne: number
  nb_evaluations: number
  projets_completes: number
  valeur_totale_projets: number
  notes?: string
  tags: string[]
  is_favori: boolean
  is_actif: boolean
  date_premiere_collaboration?: string
  derniere_activite?: string
  created_at: string
  updated_at: string
  // Relations
  contacts?: EntrepreneurContact[]
  evaluations?: EntrepreneurEvaluation[]
}

export interface EntrepreneurContact {
  id: string
  entrepreneur_id: string
  nom: string
  prenom?: string
  poste?: string
  telephone?: string
  telephone_mobile?: string
  email?: string
  is_principal: boolean
  notes?: string
}

export interface EntrepreneurEvaluation {
  id: string
  entrepreneur_id: string
  project_id?: string
  projet_nom?: string
  projet_valeur?: number
  note_globale: number
  note_qualite?: number
  note_delais?: number
  note_communication?: number
  note_prix?: number
  note_securite?: number
  recommande: boolean
  travaillerait_encore: boolean
  commentaire?: string
  points_forts: string[]
  points_amelioration: string[]
  date_evaluation: string
  is_public: boolean
}

export interface CreateEntrepreneurParams {
  nom: string
  nom_legal?: string
  neq?: string
  rbq_licence?: string
  rbq_categories?: string[]
  adresse_rue?: string
  adresse_ville?: string
  adresse_code_postal?: string
  specialites?: string[]
  corps_metier?: string
  notes?: string
  tags?: string[]
}

export interface CreateEvaluationParams {
  entrepreneur_id: string
  project_id?: string
  projet_nom?: string
  projet_valeur?: number
  note_globale: number
  note_qualite?: number
  note_delais?: number
  note_communication?: number
  note_prix?: number
  note_securite?: number
  recommande?: boolean
  travaillerait_encore?: boolean
  commentaire?: string
  points_forts?: string[]
  points_amelioration?: string[]
}

export function useEntrepreneursCRUD() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les entrepreneurs
  const fetchEntrepreneurs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: fetchError } = await supabase
        .from('entrepreneurs')
        .select(`
          *,
          contacts:entrepreneur_contacts(*),
          evaluations:entrepreneur_evaluations(*)
        `)
        .eq('user_id', user.id)
        .order('nom')

      if (fetchError) throw fetchError

      setEntrepreneurs(data || [])
    } catch (err: any) {
      console.error('Erreur fetch entrepreneurs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    fetchEntrepreneurs()
  }, [fetchEntrepreneurs])

  // Créer un entrepreneur
  const createEntrepreneur = async (params: CreateEntrepreneurParams): Promise<Entrepreneur | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('entrepreneurs')
        .insert({
          user_id: user.id,
          ...params,
          rbq_status: 'non_verifie',
          specialites: params.specialites || [],
          rbq_categories: params.rbq_categories || [],
          tags: params.tags || []
        })
        .select()
        .single()

      if (error) throw error

      setEntrepreneurs(prev => [...prev, data])
      return data
    } catch (err: any) {
      console.error('Erreur création entrepreneur:', err)
      setError(err.message)
      return null
    }
  }

  // Mettre à jour un entrepreneur
  const updateEntrepreneur = async (id: string, updates: Partial<Entrepreneur>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('entrepreneurs')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setEntrepreneurs(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
      return true
    } catch (err: any) {
      console.error('Erreur mise à jour entrepreneur:', err)
      setError(err.message)
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

      setEntrepreneurs(prev => prev.filter(e => e.id !== id))
      return true
    } catch (err: any) {
      console.error('Erreur suppression entrepreneur:', err)
      setError(err.message)
      return false
    }
  }

  // Toggle favori
  const toggleFavori = async (id: string): Promise<boolean> => {
    const entrepreneur = entrepreneurs.find(e => e.id === id)
    if (!entrepreneur) return false

    return updateEntrepreneur(id, { is_favori: !entrepreneur.is_favori })
  }

  // Ajouter un contact
  const addContact = async (entrepreneurId: string, contact: Omit<EntrepreneurContact, 'id' | 'entrepreneur_id'>): Promise<EntrepreneurContact | null> => {
    try {
      const { data, error } = await supabase
        .from('entrepreneur_contacts')
        .insert({
          entrepreneur_id: entrepreneurId,
          ...contact
        })
        .select()
        .single()

      if (error) throw error

      // Mettre à jour l'état local
      setEntrepreneurs(prev => prev.map(e => {
        if (e.id === entrepreneurId) {
          return { ...e, contacts: [...(e.contacts || []), data] }
        }
        return e
      }))

      return data
    } catch (err: any) {
      console.error('Erreur ajout contact:', err)
      setError(err.message)
      return null
    }
  }

  // Ajouter une évaluation
  const addEvaluation = async (params: CreateEvaluationParams): Promise<EntrepreneurEvaluation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('entrepreneur_evaluations')
        .insert({
          ...params,
          user_id: user.id,
          date_evaluation: new Date().toISOString().split('T')[0],
          points_forts: params.points_forts || [],
          points_amelioration: params.points_amelioration || []
        })
        .select()
        .single()

      if (error) throw error

      // Rafraîchir les entrepreneurs pour avoir la nouvelle moyenne
      await fetchEntrepreneurs()

      return data
    } catch (err: any) {
      console.error('Erreur ajout évaluation:', err)
      setError(err.message)
      return null
    }
  }

  // Charger les évaluations d'un entrepreneur
  const getEvaluations = async (entrepreneurId: string): Promise<EntrepreneurEvaluation[]> => {
    try {
      const { data, error } = await supabase
        .from('entrepreneur_evaluations')
        .select('*')
        .eq('entrepreneur_id', entrepreneurId)
        .order('date_evaluation', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err: any) {
      console.error('Erreur fetch évaluations:', err)
      return []
    }
  }

  // Rechercher des entrepreneurs
  const searchEntrepreneurs = async (query: string): Promise<Entrepreneur[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('entrepreneurs')
        .select('*')
        .eq('user_id', user.id)
        .or(`nom.ilike.%${query}%,neq.ilike.%${query}%,rbq_licence.ilike.%${query}%`)
        .order('nom')
        .limit(20)

      if (error) throw error

      return data || []
    } catch (err: any) {
      console.error('Erreur recherche:', err)
      return []
    }
  }

  // Statistiques
  const getStats = useCallback(() => {
    return {
      total: entrepreneurs.length,
      actifs: entrepreneurs.filter(e => e.is_actif).length,
      rbqValides: entrepreneurs.filter(e => e.rbq_status === 'valide').length,
      rbqSuspendus: entrepreneurs.filter(e => e.rbq_status === 'suspendu').length,
      favoris: entrepreneurs.filter(e => e.is_favori).length,
      evaluationMoyenne: entrepreneurs.length > 0
        ? entrepreneurs.reduce((sum, e) => sum + e.evaluation_moyenne, 0) / entrepreneurs.length
        : 0,
      totalEvaluations: entrepreneurs.reduce((sum, e) => sum + e.nb_evaluations, 0)
    }
  }, [entrepreneurs])

  return {
    entrepreneurs,
    loading,
    error,
    fetchEntrepreneurs,
    createEntrepreneur,
    updateEntrepreneur,
    deleteEntrepreneur,
    toggleFavori,
    addContact,
    addEvaluation,
    getEvaluations,
    searchEntrepreneurs,
    getStats
  }
}
