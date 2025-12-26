/**
 * DAST Solutions - Hook Bottin Ressources
 * NOTE: La DB utilise equipement_statut, ce hook mappe vers statut
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Individu, Equipement, Equipe } from '@/types/modules'

export function useBottin() {
  const [individus, setIndividus] = useState<Individu[]>([])
  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const [indRes, equipRes, equipeRes] = await Promise.all([
        supabase.from('bottin_individus').select('*').eq('user_id', user.id).order('nom'),
        supabase.from('bottin_equipements').select('*').eq('user_id', user.id).order('nom'),
        supabase.from('bottin_equipes').select(`
          *,
          membres:bottin_equipe_membres(*, individu:bottin_individus(*)),
          equipements:bottin_equipe_equipements(*, equipement:bottin_equipements(*))
        `).eq('user_id', user.id).order('nom')
      ])

      if (indRes.data) setIndividus(indRes.data)
      // Mapper equipement_statut vers statut
      if (equipRes.data) {
        const mapped = equipRes.data.map((eq: any) => ({ ...eq, statut: eq.equipement_statut }))
        setEquipements(mapped)
      }
      if (equipeRes.data) setEquipes(equipeRes.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // INDIVIDUS
  const createIndividu = async (data: Partial<Individu>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: result } = await supabase.from('bottin_individus').insert({ ...data, user_id: user.id }).select().single()
    if (result) setIndividus([...individus, result])
    return result
  }

  const updateIndividu = async (id: string, data: Partial<Individu>) => {
    const { error } = await supabase.from('bottin_individus').update(data).eq('id', id)
    if (!error) setIndividus(individus.map(i => i.id === id ? { ...i, ...data } : i))
    return !error
  }

  const deleteIndividu = async (id: string) => {
    const { error } = await supabase.from('bottin_individus').delete().eq('id', id)
    if (!error) setIndividus(individus.filter(i => i.id !== id))
    return !error
  }

  // ÉQUIPEMENTS
  const createEquipement = async (data: Partial<Equipement>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    // Mapper statut vers equipement_statut pour la DB
    const insertData: any = { ...data, user_id: user.id }
    if (insertData.statut) {
      insertData.equipement_statut = insertData.statut
      delete insertData.statut
    }
    const { data: result } = await supabase.from('bottin_equipements').insert(insertData).select().single()
    if (result) {
      const mapped = { ...result, statut: result.equipement_statut }
      setEquipements([...equipements, mapped])
      return mapped
    }
    return null
  }

  const updateEquipement = async (id: string, data: Partial<Equipement>) => {
    // Mapper statut vers equipement_statut pour la DB
    const updateData: any = { ...data }
    if (updateData.statut) {
      updateData.equipement_statut = updateData.statut
      delete updateData.statut
    }
    const { error } = await supabase.from('bottin_equipements').update(updateData).eq('id', id)
    if (!error) {
      setEquipements(equipements.map(e => e.id === id ? { ...e, ...data } : e))
    }
    return !error
  }

  const deleteEquipement = async (id: string) => {
    const { error } = await supabase.from('bottin_equipements').delete().eq('id', id)
    if (!error) setEquipements(equipements.filter(e => e.id !== id))
    return !error
  }

  // ÉQUIPES
  const createEquipe = async (data: Partial<Equipe>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: result } = await supabase.from('bottin_equipes').insert({ ...data, user_id: user.id }).select().single()
    if (result) setEquipes([...equipes, { ...result, membres: [], equipements: [] }])
    return result
  }

  const updateEquipe = async (id: string, data: Partial<Equipe>) => {
    const { error } = await supabase.from('bottin_equipes').update(data).eq('id', id)
    if (!error) setEquipes(equipes.map(e => e.id === id ? { ...e, ...data } : e))
    return !error
  }

  const deleteEquipe = async (id: string) => {
    const { error } = await supabase.from('bottin_equipes').delete().eq('id', id)
    if (!error) setEquipes(equipes.filter(e => e.id !== id))
    return !error
  }

  // MEMBRES D'ÉQUIPE
  const addMembreEquipe = async (equipeId: string, individuId: string, role?: string) => {
    const { data: result } = await supabase.from('bottin_equipe_membres').insert({ equipe_id: equipeId, individu_id: individuId, role_equipe: role }).select('*, individu:bottin_individus(*)').single()
    if (result) { await recalculerCoutsEquipe(equipeId); fetchAll() }
    return result
  }

  const removeMembreEquipe = async (membreId: string, equipeId: string) => {
    const { error } = await supabase.from('bottin_equipe_membres').delete().eq('id', membreId)
    if (!error) { await recalculerCoutsEquipe(equipeId); fetchAll() }
    return !error
  }

  // ÉQUIPEMENTS D'ÉQUIPE
  const addEquipementEquipe = async (equipeId: string, equipementId: string, quantite: number = 1) => {
    const { data: result } = await supabase.from('bottin_equipe_equipements').insert({ equipe_id: equipeId, equipement_id: equipementId, quantite }).select('*, equipement:bottin_equipements(*)').single()
    if (result) { await recalculerCoutsEquipe(equipeId); fetchAll() }
    return result
  }

  const removeEquipementEquipe = async (equipEquipeId: string, equipeId: string) => {
    const { error } = await supabase.from('bottin_equipe_equipements').delete().eq('id', equipEquipeId)
    if (!error) { await recalculerCoutsEquipe(equipeId); fetchAll() }
    return !error
  }

  const recalculerCoutsEquipe = async (equipeId: string) => {
    const equipe = equipes.find(e => e.id === equipeId)
    if (!equipe) return
    let coutHoraire = 0, coutJournalier = 0
    if (equipe.membres) {
      for (const m of equipe.membres) {
        if (m.individu) {
          coutHoraire += m.individu.taux_horaire_base || 0
          coutJournalier += (m.individu.taux_horaire_base || 0) * (m.heures_par_jour || 8)
        }
      }
    }
    if (equipe.equipements) {
      for (const ee of equipe.equipements) {
        if (ee.equipement) {
          coutHoraire += (ee.equipement.cout_horaire || 0) * (ee.quantite || 1)
          coutJournalier += (ee.equipement.cout_journalier || 0) * (ee.quantite || 1)
        }
      }
    }
    await supabase.from('bottin_equipes').update({ cout_horaire_total: coutHoraire, cout_journalier_total: coutJournalier }).eq('id', equipeId)
  }

  const getIndividusByType = (type: string) => individus.filter(i => i.type === type)
  const getEquipementsByCategorie = (cat: string) => equipements.filter(e => e.categorie === cat)
  const getEquipementsDisponibles = () => equipements.filter(e => e.statut === 'disponible' && e.actif)

  return {
    individus, equipements, equipes, loading, error,
    refetch: fetchAll,
    createIndividu, updateIndividu, deleteIndividu, getIndividusByType,
    createEquipement, updateEquipement, deleteEquipement, getEquipementsByCategorie, getEquipementsDisponibles,
    createEquipe, updateEquipe, deleteEquipe,
    addMembreEquipe, removeMembreEquipe, addEquipementEquipe, removeEquipementEquipe, recalculerCoutsEquipe
  }
}

export default useBottin
