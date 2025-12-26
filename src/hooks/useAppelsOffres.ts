/**
 * DAST Solutions - Hook Appels d'Offres
 * NOTE: Colonnes renommées - ao_statut, invitation_statut, soumission_recue_statut
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AppelOffre, AppelOffreInvitation, AppelOffreSoumission, AppelOffreComparatif } from '@/types/modules'

export function useAppelsOffres() {
  const [appelsOffres, setAppelsOffres] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppelsOffres = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('appels_offres')
        .select(`*, invitations:appels_offres_invitations(*), soumissions_recues:appels_offres_soumissions(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Mapper ao_statut vers statut pour l'interface
      const mapped = (data || []).map(ao => ({ ...ao, statut: ao.ao_statut }))
      setAppelsOffres(mapped)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAppelsOffres() }, [])

  const genererNumero = async (): Promise<string> => {
    const annee = new Date().getFullYear()
    const { count } = await supabase.from('appels_offres').select('*', { count: 'exact', head: true })
    return `AO${annee}-${String((count || 0) + 1).padStart(4, '0')}`
  }

  const createAppelOffre = async (data: Partial<AppelOffre>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const numero = await genererNumero()
    const insertData = { ...data, user_id: user.id, numero, ao_statut: data.statut || 'brouillon' }
    delete (insertData as any).statut
    const { data: result } = await supabase.from('appels_offres').insert(insertData).select().single()
    if (result) {
      const mapped = { ...result, statut: result.ao_statut }
      setAppelsOffres([mapped, ...appelsOffres])
      return mapped
    }
    return null
  }

  const updateAppelOffre = async (id: string, data: Partial<AppelOffre>) => {
    const updateData = { ...data }
    if (updateData.statut) {
      (updateData as any).ao_statut = updateData.statut
      delete updateData.statut
    }
    const { error } = await supabase.from('appels_offres').update(updateData).eq('id', id)
    if (!error) fetchAppelsOffres()
    return !error
  }

  const deleteAppelOffre = async (id: string) => {
    const { error } = await supabase.from('appels_offres').delete().eq('id', id)
    if (!error) setAppelsOffres(appelsOffres.filter(ao => ao.id !== id))
    return !error
  }

  return { appelsOffres, loading, refetch: fetchAppelsOffres, genererNumero, createAppelOffre, updateAppelOffre, deleteAppelOffre }
}

export function useAppelOffreDetail(appelOffreId: string) {
  const [appelOffre, setAppelOffre] = useState<AppelOffre | null>(null)
  const [invitations, setInvitations] = useState<AppelOffreInvitation[]>([])
  const [soumissionsRecues, setSoumissionsRecues] = useState<AppelOffreSoumission[]>([])
  const [comparatif, setComparatif] = useState<AppelOffreComparatif | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDetail = async () => {
    if (!appelOffreId) return
    try {
      setLoading(true)
      const { data: aoData } = await supabase.from('appels_offres').select('*').eq('id', appelOffreId).single()
      const { data: invData } = await supabase.from('appels_offres_invitations').select('*').eq('appel_offre_id', appelOffreId)
      const { data: soumData } = await supabase.from('appels_offres_soumissions').select('*').eq('appel_offre_id', appelOffreId).order('montant_total')
      const { data: compData } = await supabase.from('appels_offres_comparatifs').select('*').eq('appel_offre_id', appelOffreId).single()

      if (aoData) setAppelOffre({ ...aoData, statut: aoData.ao_statut })
      setInvitations((invData || []).map(i => ({ ...i, statut: i.invitation_statut })))
      setSoumissionsRecues((soumData || []).map(s => ({ ...s, statut: s.soumission_recue_statut })))
      setComparatif(compData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [appelOffreId])

  const createInvitation = async (data: Partial<AppelOffreInvitation>) => {
    const insertData = { ...data, appel_offre_id: appelOffreId, invitation_statut: data.statut || 'a_envoyer' }
    delete (insertData as any).statut
    const { data: result } = await supabase.from('appels_offres_invitations').insert(insertData).select().single()
    if (result) setInvitations([...invitations, { ...result, statut: result.invitation_statut }])
    return result
  }

  const updateInvitation = async (id: string, data: Partial<AppelOffreInvitation>) => {
    const updateData = { ...data }
    if (updateData.statut) { (updateData as any).invitation_statut = updateData.statut; delete updateData.statut }
    const { error } = await supabase.from('appels_offres_invitations').update(updateData).eq('id', id)
    if (!error) fetchDetail()
    return !error
  }

  const deleteInvitation = async (id: string) => {
    const { error } = await supabase.from('appels_offres_invitations').delete().eq('id', id)
    if (!error) setInvitations(invitations.filter(i => i.id !== id))
    return !error
  }

  const envoyerToutesInvitations = async () => {
    const now = new Date().toISOString()
    for (const inv of invitations.filter(i => i.statut === 'a_envoyer')) {
      await updateInvitation(inv.id, { statut: 'envoye', date_envoi: now })
    }
    if (appelOffre) await supabase.from('appels_offres').update({ ao_statut: 'envoye' }).eq('id', appelOffreId)
    fetchDetail()
  }

  const createSoumissionRecue = async (data: Partial<AppelOffreSoumission>) => {
    const insertData = { ...data, appel_offre_id: appelOffreId, soumission_recue_statut: 'recu' }
    delete (insertData as any).statut
    const { data: result } = await supabase.from('appels_offres_soumissions').insert(insertData).select().single()
    if (result) {
      setSoumissionsRecues([...soumissionsRecues, { ...result, statut: result.soumission_recue_statut }])
      if (data.invitation_id) await updateInvitation(data.invitation_id, { statut: 'soumis', a_soumissionne: true })
    }
    return result
  }

  const updateSoumissionRecue = async (id: string, data: Partial<AppelOffreSoumission>) => {
    const updateData = { ...data }
    if (updateData.statut) { (updateData as any).soumission_recue_statut = updateData.statut; delete updateData.statut }
    const { error } = await supabase.from('appels_offres_soumissions').update(updateData).eq('id', id)
    if (!error) fetchDetail()
    return !error
  }

  const retenirSoumission = async (soumissionId: string) => {
    for (const s of soumissionsRecues) {
      if (s.est_retenu) await updateSoumissionRecue(s.id, { est_retenu: false, statut: 'en_evaluation' })
    }
    const soum = soumissionsRecues.find(s => s.id === soumissionId)
    if (soum) {
      await updateSoumissionRecue(soumissionId, { est_retenu: true, statut: 'retenu' })
      await supabase.from('appels_offres').update({ soumissionnaire_choisi_id: soumissionId, montant_retenu: soum.montant_total, ao_statut: 'ferme' }).eq('id', appelOffreId)
    }
    fetchDetail()
  }

  const getStats = () => {
    const prix = soumissionsRecues.map(s => s.montant_total)
    return {
      totalInvitations: invitations.length,
      invitationsEnvoyees: invitations.filter(i => i.statut !== 'a_envoyer').length,
      soumissionsRecues: soumissionsRecues.length,
      prixMin: prix.length ? Math.min(...prix) : 0,
      prixMax: prix.length ? Math.max(...prix) : 0,
    }
  }

  return {
    appelOffre, invitations, soumissionsRecues, comparatif, loading,
    refetch: fetchDetail,
    createInvitation, updateInvitation, deleteInvitation, envoyerToutesInvitations,
    createSoumissionRecue, updateSoumissionRecue, retenirSoumission,
    getStats
  }
}

export default useAppelsOffres
