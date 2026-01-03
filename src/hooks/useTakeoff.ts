import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { TakeoffDocument, TakeoffMeasurement, TakeoffItem } from '@/types/takeoff-types'

export function useTakeoff(projectId: string) {
  const [documents, setDocuments] = useState<TakeoffDocument[]>([])
  const [measurements, setMeasurements] = useState<TakeoffMeasurement[]>([])
  const [items, setItems] = useState<TakeoffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les documents
  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('takeoff_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setDocuments(data || [])
  }

  // Charger les mesures
  const fetchMeasurements = async () => {
    const { data, error } = await supabase
      .from('takeoff_measurements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setMeasurements(data || [])
  }

  // Charger les items
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('takeoff_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setItems(data || [])
  }

  // Upload d'un document
  const uploadDocument = async (file: File): Promise<TakeoffDocument> => {
    try {
      // Upload du fichier dans Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('takeoff-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('takeoff-documents')
        .getPublicUrl(fileName)

      // Créer l'entrée dans la base de données
      const { data, error } = await supabase
        .from('takeoff_documents')
        .insert({
          project_id: projectId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          page_count: 1
        })
        .select()
        .single()

      if (error) throw error

      await fetchDocuments()
      return data
    } catch (err) {
      console.error('Upload error:', err)
      throw err
    }
  }

  // Supprimer un document
  const deleteDocument = async (id: string, fileUrl: string) => {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = fileUrl.split('/takeoff-documents/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('takeoff-documents')
          .remove([filePath])
      }

      // Supprimer l'entrée de la base de données
      const { error } = await supabase
        .from('takeoff_documents')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchDocuments()
    } catch (err) {
      console.error('Delete document error:', err)
      throw err
    }
  }

  // Créer une mesure
  const createMeasurement = async (measurement: Partial<TakeoffMeasurement>): Promise<TakeoffMeasurement> => {
    const { data, error } = await supabase
      .from('takeoff_measurements')
      .insert({
        ...measurement,
        project_id: projectId
      })
      .select()
      .single()

    if (error) throw error

    await fetchMeasurements()
    return data
  }

  // Supprimer une mesure
  const deleteMeasurement = async (id: string) => {
    const { error } = await supabase
      .from('takeoff_measurements')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetchMeasurements()
  }

  // Créer un item
  const createItem = async (item: Partial<TakeoffItem>): Promise<TakeoffItem> => {
    const { data, error } = await supabase
      .from('takeoff_items')
      .insert({
        ...item,
        project_id: projectId
      })
      .select()
      .single()

    if (error) throw error

    await fetchItems()
    return data
  }

  // Mettre à jour un item
  const updateItem = async (id: string, updates: Partial<TakeoffItem>): Promise<TakeoffItem> => {
    const { data, error } = await supabase
      .from('takeoff_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await fetchItems()
    return data
  }

  // Supprimer un item
  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('takeoff_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    await fetchItems()
  }

  // Dupliquer un item
  const duplicateItem = async (item: TakeoffItem): Promise<TakeoffItem> => {
    const { id, created_at, updated_at, ...itemData } = item
    const { data, error } = await supabase
      .from('takeoff_items')
      .insert({
        ...itemData,
        item_name: `${item.item_name} (copie)`,
        project_id: projectId
      })
      .select()
      .single()

    if (error) throw error

    await fetchItems()
    return data
  }

  // Exporter vers estimation
  const exportToEstimate = async () => {
    // Cette fonction sera complétée plus tard
    console.log('Export vers estimation:', items)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([
          fetchDocuments(),
          fetchMeasurements(),
          fetchItems()
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load takeoff data')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId])

  return {
    documents,
    measurements,
    items,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    createMeasurement,
    deleteMeasurement,
    createItem,
    updateItem,
    deleteItem,
    duplicateItem,
    exportToEstimate,
    refetch: () => {
      fetchDocuments()
      fetchMeasurements()
      fetchItems()
    }
  }
}