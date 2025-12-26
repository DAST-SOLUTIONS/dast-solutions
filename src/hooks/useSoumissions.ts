/**
 * DAST Solutions - Hook Soumissions V2
 * NOTE: Colonne renommée soumission_statut dans la DB
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { SoumissionV2, SoumissionSection, SoumissionItem } from '@/types/modules'

export function useSoumissions() {
  const [soumissions, setSoumissions] = useState<SoumissionV2[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const fetchSoumissions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('soumissions_v2')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      // Mapper soumission_statut vers statut pour l'interface
      const mapped = (data || []).map(s => ({ ...s, statut: s.soumission_statut }))
      setSoumissions(mapped)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSoumissions() }, [])

  const genererNumero = async (): Promise<string> => {
    const annee = new Date().getFullYear()
    const { count } = await supabase.from('soumissions_v2').select('*', { count: 'exact', head: true })
    return `S${annee}-${String((count || 0) + 1).padStart(4, '0')}`
  }

  const createSoumission = async (data: Partial<SoumissionV2>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const numero = await genererNumero()
    const insertData = { ...data, user_id: user.id, numero, soumission_statut: data.statut || 'brouillon' }
    delete (insertData as any).statut
    const { data: result, error } = await supabase.from('soumissions_v2').insert(insertData).select().single()
    if (result) {
      const mapped = { ...result, statut: result.soumission_statut }
      setSoumissions([mapped, ...soumissions])
      return mapped
    }
    return null
  }

  const updateSoumission = async (id: string, data: Partial<SoumissionV2>) => {
    const updateData = { ...data }
    if (updateData.statut) { (updateData as any).soumission_statut = updateData.statut; delete updateData.statut }
    const { error } = await supabase.from('soumissions_v2').update(updateData).eq('id', id)
    if (!error) fetchSoumissions()
    return !error
  }

  const deleteSoumission = async (id: string) => {
    const { error } = await supabase.from('soumissions_v2').delete().eq('id', id)
    if (!error) setSoumissions(soumissions.filter(s => s.id !== id))
    return !error
  }

  const dupliquerSoumission = async (id: string) => {
    const original = soumissions.find(s => s.id === id)
    if (!original) return null
    const { id: _, numero, created_at, updated_at, ...rest } = original
    return createSoumission({ ...rest, statut: 'brouillon' })
  }

  const getByProject = (projectId: string) => soumissions.filter(s => s.project_id === projectId)

  return { soumissions, loading, error, refetch: fetchSoumissions, genererNumero, createSoumission, updateSoumission, deleteSoumission, dupliquerSoumission, getByProject }
}

export function useSoumissionDetail(soumissionId: string) {
  const [soumission, setSoumission] = useState<SoumissionV2 | null>(null)
  const [sections, setSections] = useState<SoumissionSection[]>([])
  const [items, setItems] = useState<SoumissionItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDetail = async () => {
    if (!soumissionId) return
    try {
      setLoading(true)
      const { data: soumData } = await supabase.from('soumissions_v2').select('*').eq('id', soumissionId).single()
      const { data: sectionsData } = await supabase.from('soumissions_sections').select('*').eq('soumission_id', soumissionId).order('ordre')
      const sectionIds = sectionsData?.map(s => s.id) || []
      const { data: itemsData } = sectionIds.length > 0 
        ? await supabase.from('soumissions_items').select('*').in('section_id', sectionIds).order('ordre')
        : { data: [] }

      if (soumData) setSoumission({ ...soumData, statut: soumData.soumission_statut })
      setSections(sectionsData || [])
      setItems(itemsData || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [soumissionId])

  const createSection = async (data: Partial<SoumissionSection>) => {
    const ordre = sections.length
    const { data: result } = await supabase.from('soumissions_sections').insert({ ...data, soumission_id: soumissionId, ordre }).select().single()
    if (result) setSections([...sections, result])
    return result
  }

  const updateSection = async (id: string, data: Partial<SoumissionSection>) => {
    const { error } = await supabase.from('soumissions_sections').update(data).eq('id', id)
    if (!error) setSections(sections.map(s => s.id === id ? { ...s, ...data } : s))
    return !error
  }

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from('soumissions_sections').delete().eq('id', id)
    if (!error) { setSections(sections.filter(s => s.id !== id)); setItems(items.filter(i => i.section_id !== id)) }
    return !error
  }

  const createItem = async (data: Partial<SoumissionItem>) => {
    const ordre = items.filter(i => i.section_id === data.section_id).length
    const { data: result } = await supabase.from('soumissions_items').insert({ ...data, ordre }).select().single()
    if (result) { setItems([...items, result]); await recalculerTotaux() }
    return result
  }

  const updateItem = async (id: string, data: Partial<SoumissionItem>) => {
    const { error } = await supabase.from('soumissions_items').update(data).eq('id', id)
    if (!error) { setItems(items.map(i => i.id === id ? { ...i, ...data } : i)); await recalculerTotaux() }
    return !error
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('soumissions_items').delete().eq('id', id)
    if (!error) { setItems(items.filter(i => i.id !== id)); await recalculerTotaux() }
    return !error
  }

  const recalculerTotaux = async () => {
    if (!soumission) return
    for (const section of sections) {
      const sectionItems = items.filter(i => i.section_id === section.id)
      const sousTotalMo = sectionItems.reduce((sum, i) => sum + (i.mo_cout_total || 0), 0)
      const sousTotalMat = sectionItems.reduce((sum, i) => sum + (i.mat_cout_total || 0), 0)
      const sousTotal = sectionItems.reduce((sum, i) => sum + (i.cout_total || 0), 0)
      await supabase.from('soumissions_sections').update({ sous_total_mo: sousTotalMo, sous_total_materiaux: sousTotalMat, sous_total: sousTotal }).eq('id', section.id)
    }
    const totalMo = items.reduce((sum, i) => sum + (i.mo_cout_total || 0), 0)
    const totalMat = items.reduce((sum, i) => sum + (i.mat_cout_total || 0), 0)
    const totalEquip = items.reduce((sum, i) => sum + (i.equip_cout_total || 0), 0)
    const totalST = items.reduce((sum, i) => sum + (i.st_cout_total || 0), 0)
    const soustotalDirect = totalMo + totalMat + totalEquip + totalST
    const fgMontant = soustotalDirect * (soumission.frais_generaux_pct / 100)
    const adminMontant = soustotalDirect * (soumission.administration_pct / 100)
    const profitMontant = soustotalDirect * (soumission.profit_pct / 100)
    const contingenceMontant = soustotalDirect * (soumission.contingence_pct / 100)
    const totalAvantTaxes = soustotalDirect + fgMontant + adminMontant + profitMontant + contingenceMontant
    const tps = totalAvantTaxes * 0.05
    const tvq = totalAvantTaxes * 0.09975
    const totalAvecTaxes = totalAvantTaxes + tps + tvq
    const updates = { sous_total_mo: totalMo, sous_total_materiaux: totalMat, sous_total_equipements: totalEquip, sous_total_sous_traitants: totalST, sous_total_direct: soustotalDirect, frais_generaux_montant: fgMontant, administration_montant: adminMontant, profit_montant: profitMontant, contingence_montant: contingenceMontant, total_avant_taxes: totalAvantTaxes, tps, tvq, total_avec_taxes: totalAvecTaxes }
    await supabase.from('soumissions_v2').update(updates).eq('id', soumissionId)
    setSoumission({ ...soumission, ...updates })
    fetchDetail()
  }

  const updateMarges = async (marges: { frais_generaux_pct?: number; administration_pct?: number; profit_pct?: number; contingence_pct?: number }) => {
    await supabase.from('soumissions_v2').update(marges).eq('id', soumissionId)
    if (soumission) setSoumission({ ...soumission, ...marges })
    await recalculerTotaux()
  }

  return { soumission, sections, items, loading, refetch: fetchDetail, createSection, updateSection, deleteSection, createItem, updateItem, deleteItem, recalculerTotaux, updateMarges }
}

export default useSoumissions
