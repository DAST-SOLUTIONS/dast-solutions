/**
 * DAST Solutions - Hook Matériaux & Prix
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Materiau, MateriauCategorie, Productivite, PrixHistorique } from '@/types/modules'

export function useMateriauxPrix() {
  const [materiaux, setMateriaux] = useState<Materiau[]>([])
  const [categories, setCategories] = useState<MateriauCategorie[]>([])
  const [productivites, setProductivites] = useState<Productivite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [matRes, catRes, prodRes] = await Promise.all([
        supabase.from('materiaux_catalogue').select('*').eq('user_id', user.id).order('nom'),
        supabase.from('materiaux_categories').select('*').order('code'),
        supabase.from('materiaux_productivites').select('*').eq('user_id', user.id).order('nom')
      ])

      if (matRes.data) setMateriaux(matRes.data)
      if (catRes.data) setCategories(catRes.data)
      if (prodRes.data) setProductivites(prodRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // MATÉRIAUX
  const createMateriau = async (data: Partial<Materiau>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: result } = await supabase
      .from('materiaux_catalogue')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (result) setMateriaux([...materiaux, result])
    return result
  }

  const updateMateriau = async (id: string, data: Partial<Materiau>) => {
    const { error } = await supabase.from('materiaux_catalogue').update(data).eq('id', id)
    if (!error) setMateriaux(materiaux.map(m => m.id === id ? { ...m, ...data } : m))
    return !error
  }

  const deleteMateriau = async (id: string) => {
    const { error } = await supabase.from('materiaux_catalogue').delete().eq('id', id)
    if (!error) setMateriaux(materiaux.filter(m => m.id !== id))
    return !error
  }

  const toggleFavori = async (id: string) => {
    const mat = materiaux.find(m => m.id === id)
    if (!mat) return false
    return updateMateriau(id, { favori: !mat.favori })
  }

  const getHistoriquePrix = async (materiauId: string): Promise<PrixHistorique[]> => {
    const { data } = await supabase
      .from('materiaux_prix_historique')
      .select('*')
      .eq('materiau_id', materiauId)
      .order('date_prix', { ascending: false })
      .limit(20)
    return data || []
  }

  // PRODUCTIVITÉS
  const createProductivite = async (data: Partial<Productivite>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: result } = await supabase
      .from('materiaux_productivites')
      .insert({ ...data, user_id: user.id })
      .select()
      .single()
    if (result) setProductivites([...productivites, result])
    return result
  }

  const updateProductivite = async (id: string, data: Partial<Productivite>) => {
    const { error } = await supabase.from('materiaux_productivites').update(data).eq('id', id)
    if (!error) setProductivites(productivites.map(p => p.id === id ? { ...p, ...data } : p))
    return !error
  }

  const deleteProductivite = async (id: string) => {
    const { error } = await supabase.from('materiaux_productivites').delete().eq('id', id)
    if (!error) setProductivites(productivites.filter(p => p.id !== id))
    return !error
  }

  // CALCULS
  const calculerCoutMateriau = (materiauId: string, quantite: number, facteurPerte?: number) => {
    const mat = materiaux.find(m => m.id === materiauId)
    if (!mat) return { quantite_brute: quantite, cout_total: 0 }
    const perte = facteurPerte ?? mat.facteur_perte ?? 0
    const quantiteBrute = quantite * (1 + perte / 100)
    const coutTotal = quantiteBrute * mat.prix_unitaire
    return { quantite_brute: quantiteBrute, cout_total: coutTotal }
  }

  const calculerMainOeuvre = (productiviteId: string, quantite: number, tauxHoraire: number, complexite: string = 'simple') => {
    const prod = productivites.find(p => p.id === productiviteId)
    if (!prod) return { heures: 0, cout_total: 0 }
    
    const facteur = complexite === 'simple' ? prod.facteur_simple :
                    complexite === 'moyen' ? prod.facteur_moyen :
                    complexite === 'complexe' ? prod.facteur_complexe :
                    prod.facteur_tres_complexe
    
    const heures = (quantite / prod.quantite_par_heure) * facteur
    const coutTotal = heures * tauxHoraire
    return { heures, cout_total: coutTotal }
  }

  return {
    materiaux, categories, productivites, loading,
    refetch: fetchAll,
    createMateriau, updateMateriau, deleteMateriau, toggleFavori,
    getHistoriquePrix,
    createProductivite, updateProductivite, deleteProductivite,
    calculerCoutMateriau, calculerMainOeuvre
  }
}

export default useMateriauxPrix
