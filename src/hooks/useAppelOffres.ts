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
import { sendBatchInvitations, isValidEmail, type SendInvitationEmailParams } from '@/services/emailService'

export function useAppelOffres(projectId?: string) {
  const [appelOffres, setAppelOffres] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const createAppelOffre = async (params: CreateAppelOffreParams): Promise<AppelOffre | null> => {
    try {
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

  const updateStatus = async (id: string, status: AppelOffreStatus): Promise<boolean> => {
    const updates: Partial<AppelOffre> = { status }
    
    if (status === 'envoye') {
      updates.date_envoi = new Date().toISOString()
    }
    
    return updateAppelOffre(id, updates)
  }

  const deleteAppelOffre = async (id: string): Promise<boolean> => {
    try {
      const { error: invError } = await supabase
        .from('invitation_soumissions')
        .delete()
        .eq('appel_offre_id', id)

      if (invError) throw invError

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

  const selectSoumission = async (appelOffreId: string, invitationId: string): Promise<boolean> => {
    try {
      const { error: deselectError } = await supabase
        .from('invitation_soumissions')
        .update({ is_selected: false })
        .eq('appel_offre_id', appelOffreId)

      if (deselectError) throw deselectError

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

  /**
   * NOUVELLE FONCTION: Envoyer les invitations par courriel
   */
  const sendInvitationEmails = async (appelOffreId: string): Promise<{ success: number; failed: number; errors: string[] }> => {
    try {
      // Récupérer l'appel d'offres complet avec toutes les données
      const appelOffre = await getAppelOffre(appelOffreId)
      
      if (!appelOffre) {
        return { success: 0, failed: 0, errors: ['Appel d\'offres introuvable'] }
      }

      const invitations = appelOffre.invitations || []
      const errors: string[] = []

      // Filtrer les invitations valides (avec email)
      const validInvitations = invitations.filter(inv => {
        if (!inv.entrepreneur?.email) {
          errors.push(`${inv.entrepreneur?.company_name || 'Entrepreneur inconnu'}: Pas de courriel`)
          return false
        }
        if (!isValidEmail(inv.entrepreneur.email)) {
          errors.push(`${inv.entrepreneur.company_name}: Courriel invalide (${inv.entrepreneur.email})`)
          return false
        }
        return true
      })

      if (validInvitations.length === 0) {
        return { success: 0, failed: invitations.length, errors: ['Aucun entrepreneur avec courriel valide'] }
      }

      // Préparer les données pour l'envoi
      const emailParams: SendInvitationEmailParams[] = validInvitations.map(inv => ({
        to: inv.entrepreneur!.email!,
        entrepreneurName: inv.entrepreneur!.company_name,
        contactName: inv.entrepreneur!.contact_name,
        appelOffreNumero: appelOffre.numero,
        appelOffreTitre: appelOffre.titre,
        projectName: appelOffre.project?.name || 'Projet',
        description: appelOffre.description || '',
        etendueGravaux: appelOffre.etendue_travaux || '',
        dateLimite: appelOffre.date_limite,
        documents: appelOffre.documents || []
      }))

      // Envoyer les courriels
      const result = await sendBatchInvitations(emailParams)

      // Marquer les invitations comme envoyées
      if (result.success > 0) {
        await markInvitationsSent(appelOffreId)
        await updateStatus(appelOffreId, 'envoye')
      }

      return { ...result, errors }

    } catch (err) {
      console.error('Error sending invitations:', err)
      return { 
        success: 0, 
        failed: 0, 
        errors: [err instanceof Error ? err.message : 'Erreur inconnue'] 
      }
    }
  }

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

  const integrateToEstimation = async (invitationId: string): Promise<boolean> => {
    try {
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
    sendInvitationEmails, // NOUVELLE FONCTION
    getComparaison,
    integrateToEstimation,
    refetch: fetchAppelOffres
  }
}