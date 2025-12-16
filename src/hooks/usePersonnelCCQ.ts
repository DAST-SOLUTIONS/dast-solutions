/**
 * DAST Solutions - Hook Personnel CCQ
 * Connexion Supabase pour gestion des employés CCQ
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Types
export interface MetierCCQ {
  id: string
  code: string
  nom: string
  description?: string
  taux_horaire: number
  taux_vacances: number
  taux_avantages: number
  categorie?: string
  secteur?: string
  actif: boolean
}

export interface Personnel {
  id: string
  user_id: string
  nom: string
  prenom: string
  date_naissance?: string
  telephone?: string
  telephone_urgence?: string
  email?: string
  adresse_rue?: string
  adresse_ville?: string
  adresse_province: string
  adresse_code_postal?: string
  metier_ccq_id?: string
  metier_code?: string
  metier_nom?: string
  taux_horaire_actuel?: number
  classification?: string
  numero_ccq?: string
  date_emission_carte?: string
  date_expiration_carte?: string
  competences: string[]
  langues: string[]
  status: 'actif' | 'inactif' | 'conge' | 'termine'
  type_emploi: 'temps_plein' | 'temps_partiel' | 'occasionnel'
  date_embauche?: string
  date_fin_emploi?: string
  heures_travaillees_total: number
  heures_travaillees_annee: number
  projets_assignes: string[]
  taille_vetement?: string
  taille_chaussure?: string
  equipements_fournis: string[]
  notes?: string
  photo_url?: string
  created_at: string
  updated_at: string
  // Relations
  certifications?: PersonnelCertification[]
  metier?: MetierCCQ
}

export interface PersonnelCertification {
  id: string
  personnel_id: string
  nom: string
  organisme?: string
  numero_certificat?: string
  date_obtention?: string
  date_expiration?: string
  status: 'valide' | 'expire' | 'bientot_expire'
  document_url?: string
  notes?: string
}

export interface PersonnelAssignation {
  id: string
  personnel_id: string
  project_id: string
  role?: string
  date_debut: string
  date_fin?: string
  heures_prevues?: number
  heures_travaillees: number
  taux_horaire?: number
  status: 'actif' | 'termine' | 'annule'
  notes?: string
}

export interface CreatePersonnelParams {
  nom: string
  prenom: string
  date_naissance?: string
  telephone?: string
  email?: string
  adresse_ville?: string
  metier_ccq_id?: string
  metier_code?: string
  metier_nom?: string
  taux_horaire_actuel?: number
  classification?: string
  numero_ccq?: string
  competences?: string[]
  date_embauche?: string
  type_emploi?: 'temps_plein' | 'temps_partiel' | 'occasionnel'
}

export interface CreateCertificationParams {
  personnel_id: string
  nom: string
  organisme?: string
  numero_certificat?: string
  date_obtention?: string
  date_expiration?: string
}

export function usePersonnelCCQ() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [metiers, setMetiers] = useState<MetierCCQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les métiers CCQ
  const fetchMetiers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('metiers_ccq')
        .select('*')
        .eq('actif', true)
        .order('code')

      if (error) throw error
      setMetiers(data || [])
    } catch (err: any) {
      console.error('Erreur fetch métiers:', err)
    }
  }, [])

  // Charger tout le personnel
  const fetchPersonnel = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error: fetchError } = await supabase
        .from('personnel_ccq')
        .select(`
          *,
          certifications:personnel_certifications(*),
          metier:metiers_ccq(*)
        `)
        .eq('user_id', user.id)
        .order('nom')

      if (fetchError) throw fetchError

      setPersonnel(data || [])
    } catch (err: any) {
      console.error('Erreur fetch personnel:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    fetchMetiers()
    fetchPersonnel()
  }, [fetchMetiers, fetchPersonnel])

  // Créer un employé
  const createPersonnel = async (params: CreatePersonnelParams): Promise<Personnel | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('personnel_ccq')
        .insert({
          user_id: user.id,
          ...params,
          status: 'actif',
          competences: params.competences || [],
          langues: ['Français'],
          projets_assignes: [],
          equipements_fournis: []
        })
        .select()
        .single()

      if (error) throw error

      setPersonnel(prev => [...prev, data])
      return data
    } catch (err: any) {
      console.error('Erreur création personnel:', err)
      setError(err.message)
      return null
    }
  }

  // Mettre à jour un employé
  const updatePersonnel = async (id: string, updates: Partial<Personnel>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('personnel_ccq')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setPersonnel(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      return true
    } catch (err: any) {
      console.error('Erreur mise à jour personnel:', err)
      setError(err.message)
      return false
    }
  }

  // Supprimer un employé
  const deletePersonnel = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('personnel_ccq')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPersonnel(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err: any) {
      console.error('Erreur suppression personnel:', err)
      setError(err.message)
      return false
    }
  }

  // Ajouter une certification
  const addCertification = async (params: CreateCertificationParams): Promise<PersonnelCertification | null> => {
    try {
      const { data, error } = await supabase
        .from('personnel_certifications')
        .insert(params)
        .select()
        .single()

      if (error) throw error

      // Mettre à jour l'état local
      setPersonnel(prev => prev.map(p => {
        if (p.id === params.personnel_id) {
          return { ...p, certifications: [...(p.certifications || []), data] }
        }
        return p
      }))

      return data
    } catch (err: any) {
      console.error('Erreur ajout certification:', err)
      setError(err.message)
      return null
    }
  }

  // Supprimer une certification
  const deleteCertification = async (certId: string, personnelId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('personnel_certifications')
        .delete()
        .eq('id', certId)

      if (error) throw error

      setPersonnel(prev => prev.map(p => {
        if (p.id === personnelId) {
          return { ...p, certifications: (p.certifications || []).filter(c => c.id !== certId) }
        }
        return p
      }))

      return true
    } catch (err: any) {
      console.error('Erreur suppression certification:', err)
      return false
    }
  }

  // Assigner à un projet
  const assignToProject = async (personnelId: string, projectId: string, params: {
    role?: string
    date_debut: string
    date_fin?: string
    heures_prevues?: number
    taux_horaire?: number
  }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('personnel_assignations')
        .insert({
          personnel_id: personnelId,
          project_id: projectId,
          ...params,
          status: 'actif'
        })

      if (error) throw error

      await fetchPersonnel() // Rafraîchir
      return true
    } catch (err: any) {
      console.error('Erreur assignation:', err)
      return false
    }
  }

  // Obtenir le taux horaire avec charges
  const getTauxComplet = (tauxHoraire: number, metier?: MetierCCQ): {
    tauxBase: number
    vacances: number
    avantages: number
    total: number
  } => {
    const vacances = metier?.taux_vacances || 13
    const avantages = metier?.taux_avantages || 15.5
    
    const montantVacances = tauxHoraire * (vacances / 100)
    const montantAvantages = tauxHoraire * (avantages / 100)
    
    return {
      tauxBase: tauxHoraire,
      vacances: montantVacances,
      avantages: montantAvantages,
      total: tauxHoraire + montantVacances + montantAvantages
    }
  }

  // Statistiques
  const getStats = useCallback(() => {
    const certExpirees = personnel.reduce((count, p) => {
      return count + (p.certifications || []).filter(c => 
        c.status === 'expire' || c.status === 'bientot_expire'
      ).length
    }, 0)

    return {
      total: personnel.length,
      actifs: personnel.filter(p => p.status === 'actif').length,
      inactifs: personnel.filter(p => p.status === 'inactif').length,
      enConge: personnel.filter(p => p.status === 'conge').length,
      certExpirees,
      heuresTotal: personnel.reduce((sum, p) => sum + p.heures_travaillees_total, 0),
      tauxMoyen: personnel.length > 0
        ? personnel.reduce((sum, p) => sum + (p.taux_horaire_actuel || 0), 0) / personnel.length
        : 0
    }
  }, [personnel])

  // Certifications expirant bientôt
  const getCertificationsExpirant = useCallback((joursAvant: number = 30): {
    personnel: Personnel
    certification: PersonnelCertification
  }[] => {
    const result: { personnel: Personnel; certification: PersonnelCertification }[] = []
    const today = new Date()
    const limit = new Date(today.getTime() + joursAvant * 24 * 60 * 60 * 1000)

    personnel.forEach(p => {
      (p.certifications || []).forEach(cert => {
        if (cert.date_expiration) {
          const expDate = new Date(cert.date_expiration)
          if (expDate <= limit && expDate >= today) {
            result.push({ personnel: p, certification: cert })
          }
        }
      })
    })

    return result.sort((a, b) => 
      new Date(a.certification.date_expiration!).getTime() - 
      new Date(b.certification.date_expiration!).getTime()
    )
  }, [personnel])

  return {
    personnel,
    metiers,
    loading,
    error,
    fetchPersonnel,
    fetchMetiers,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    addCertification,
    deleteCertification,
    assignToProject,
    getTauxComplet,
    getStats,
    getCertificationsExpirant
  }
}
