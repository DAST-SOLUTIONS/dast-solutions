import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { 
  AppelOffre, 
  InvitationSoumission,
  CreateAppelOffreParams,
  AppelOffreStatus,
  SoumissionSTStatus
} from '@/types/entrepreneur-types'
import { generateAppelOffreNumero, findBestPrice } from '@/types/entrepreneur-types'

export function useAppelOffres(projectId?: string) {
  const [appelOffres, setAppelOffres] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les appels d'offres
  const fetchAppelOffres = async () => {
    try {
      let query = supabase
        .from('appel_offres')
        .select(`
          *,
          invitations:invitation_soumissions(
            *,
            entrepreneur:entrepreneurs(id, company_name, contact_name, email, phone, specialites)
          )
        `)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      setAppelOffres(data || [])
    } catch (err) {
      console.error('Error fetching appel offres:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    }
  }

  // Obtenir un appel d'offres avec ses invitations
  const getAppelOffre = async (id: string): Promise<AppelOffre | null> => {
    try {
      const { data, error } = await supabase
        .from('appel_offres')
        .select(`
          *,
          invitations:invitation_soumissions(
            *,
            entrepreneur:entrepreneurs(*)
          ),
          project:projects(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching appel offre:', err)
      return null
    }
  }

  // Créer un appel d'offres
  const createAppelOffre = async (params: CreateAppelOffreParams): Promise<AppelOffre | null> => {
    try {
      // Créer l'appel d'offres
      const { data: appelOffre, error: aoError } = await supabase
        .from('appel_offres')
        .insert({
          project_id: params.project_id,
          numero: generateAppelOffreNumero(),
          titre: params.titre,
          description: params.description,
          etendue_travaux: params.etendue_travaux,
          date_creation: new Date().toISOString(),
          date_limite: params.date_limite,
          status: 'brouillon'
        })
        .select()
        .single()

      if (aoError) throw aoError

      // Créer les invitations
      if (params.entrepreneur_ids.length > 0) {
        const invitations = params.entrepreneur_ids.map(entrepreneur_id => ({
          appel_offre_id: appelOffre.id,
          entrepreneur_id,
          status: 'en_attente',
          is_selected: false
        }))

        const { error: invError } = await supabase
          .from('invitation_soumissions')
          .insert(invitations)

        if (invError) throw invError
      }

      await fetchAppelOffres()
      return appelOffre
    } catch (err) {
      console.error('Error creating appel offre:', err)
      setError(err instanceof Error ? err.message : 'Erreur de création')
      return null
    }
  }

  // Mettre à jour un appel d'offres
  const updateAppelOffre = async (id: string, updates: Partial<AppelOffre>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('appel_offres')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error updating appel offre:', err)
      return false
    }
  }

  // Changer le statut d'un appel d'offres
  const updateStatus = async (id: string, status: AppelOffreStatus): Promise<boolean> => {
    const updates: Partial<AppelOffre> = { status }
    
    if (status === 'envoye') {
      updates.date_envoi = new Date().toISOString()
    }
    
    return updateAppelOffre(id, updates)
  }

  // Supprimer un appel d'offres
  const deleteAppelOffre = async (id: string): Promise<boolean> => {
    try {
      // Supprimer d'abord les invitations
      const { error: invError } = await supabase
        .from('invitation_soumissions')
        .delete()
        .eq('appel_offre_id', id)

      if (invError) throw invError

      // Puis l'appel d'offres
      const { error } = await supabase
        .from('appel_offres')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error deleting appel offre:', err)
      return false
    }
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  // Ajouter une invitation
  const addInvitation = async (appelOffreId: string, entrepreneurId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitation_soumissions')
        .insert({
          appel_offre_id: appelOffreId,
          entrepreneur_id: entrepreneurId,
          status: 'en_attente',
          is_selected: false
        })

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error adding invitation:', err)
      return false
    }
  }

  // Supprimer une invitation
  const removeInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitation_soumissions')
        .delete()
        .eq('id', invitationId)

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error removing invitation:', err)
      return false
    }
  }

  // Mettre à jour une invitation (recevoir une soumission)
  const updateInvitation = async (invitationId: string, updates: Partial<InvitationSoumission>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitation_soumissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error updating invitation:', err)
      return false
    }
  }

  // Enregistrer la réception d'une soumission
  const receiveSoumission = async (
    invitationId: string, 
    montant: number, 
    details: { inclusions?: string; exclusions?: string; conditions?: string; validite_jours?: number }
  ): Promise<boolean> => {
    return updateInvitation(invitationId, {
      status: 'recu',
      date_reception: new Date().toISOString(),
      montant,
      ...details
    })
  }

  // Sélectionner une soumission
  const selectSoumission = async (appelOffreId: string, invitationId: string): Promise<boolean> => {
    try {
      // Désélectionner toutes les autres
      const { error: deselectError } = await supabase
        .from('invitation_soumissions')
        .update({ is_selected: false })
        .eq('appel_offre_id', appelOffreId)

      if (deselectError) throw deselectError

      // Sélectionner celle-ci
      const { error: selectError } = await supabase
        .from('invitation_soumissions')
        .update({ 
          is_selected: true,
          status: 'accepte'
        })
        .eq('id', invitationId)

      if (selectError) throw selectError

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error selecting soumission:', err)
      return false
    }
  }

  // Marquer les invitations comme envoyées
  const markInvitationsSent = async (appelOffreId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invitation_soumissions')
        .update({ 
          date_envoi: new Date().toISOString() 
        })
        .eq('appel_offre_id', appelOffreId)
        .eq('status', 'en_attente')

      if (error) throw error

      await fetchAppelOffres()
      return true
    } catch (err) {
      console.error('Error marking invitations sent:', err)
      return false
    }
  }

  // ============================================================================
  // COMPARAISON
  // ============================================================================

  // Obtenir le tableau comparatif pour un appel d'offres
  const getComparaison = async (appelOffreId: string) => {
    const ao = await getAppelOffre(appelOffreId)
    if (!ao || !ao.invitations) return null

    const soumissionsRecues = ao.invitations.filter(i => i.status === 'recu' && i.montant)
    const meilleurPrix = findBestPrice(soumissionsRecues)

    return {
      appel_offre: ao,
      soumissions: soumissionsRecues,
      meilleur_prix: meilleurPrix,
      total_invitations: ao.invitations.length,
      total_recu: soumissionsRecues.length,
      en_attente: ao.invitations.filter(i => i.status === 'en_attente').length
    }
  }

  // ============================================================================
  // INTÉGRATION À L'ESTIMATION
  // ============================================================================

  // Intégrer la soumission sélectionnée dans l'estimation
  const integrateToEstimation = async (invitationId: string): Promise<boolean> => {
    try {
      // Récupérer l'invitation avec l'entrepreneur et l'appel d'offres
      const { data: invitation, error: invError } = await supabase
        .from('invitation_soumissions')
        .select(`
          *,
          entrepreneur:entrepreneurs(company_name),
          appel_offre:appel_offres(project_id, titre)
        `)
        .eq('id', invitationId)
        .single()

      if (invError || !invitation) throw invError || new Error('Invitation non trouvée')

      // Créer un item dans le takeoff
      const { error: itemError } = await supabase
        .from('takeoff_items')
        .insert({
          project_id: invitation.appel_offre.project_id,
          category: 'Sous-traitants',
          item_name: `${invitation.entrepreneur.company_name} - ${invitation.appel_offre.titre}`,
          quantity: 1,
          unit: 'forfait',
          unit_price: invitation.montant,
          total_price: invitation.montant,
          notes: `Soumission acceptée. ${invitation.inclusions || ''}`
        })

      if (itemError) throw itemError

      return true
    } catch (err) {
      console.error('Error integrating to estimation:', err)
      return false
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchAppelOffres()
      setLoading(false)
    }

    loadData()
  }, [projectId])

  return {
    appelOffres,
    loading,
    error,
    getAppelOffre,
    createAppelOffre,
    updateAppelOffre,
    updateStatus,
    deleteAppelOffre,
    addInvitation,
    removeInvitation,
    updateInvitation,
    receiveSoumission,
    selectSoumission,
    markInvitationsSent,
    getComparaison,
    integrateToEstimation,
    refetch: fetchAppelOffres
  }
}