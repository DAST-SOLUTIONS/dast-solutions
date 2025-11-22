import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface ProjectDocument {
  id: string
  project_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_at: string
}

export function useProjectDocuments(projectId: string | null) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchDocuments = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError
      setDocuments(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  const uploadDocument = async (file: File) => {
    if (!projectId || !user) throw new Error('Project or user not found')

    setUploading(true)
    setError(null)

    try {
      // Créer un chemin unique
      const timestamp = Date.now()
      const fileName = `${projectId}/${timestamp}-${file.name}`

      // Uploader le fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, file, {
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Enregistrer dans la BD
      const { data: dbData, error: dbError } = await supabase
        .from('project_documents')
        .insert([
          {
            project_id: projectId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: uploadData.path,
            uploaded_by: user.id,
          },
        ])
        .select()
        .single()

      if (dbError) throw dbError

      // Actualiser la liste
      await fetchDocuments()

      return dbData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (documentId: string, storagePath: string) => {
    try {
      // Supprimer du storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([storagePath])

      if (storageError) throw storageError

      // Supprimer de la BD
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId)

      if (dbError) throw dbError

      // Actualiser la liste
      await fetchDocuments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document'
      setError(message)
      throw err
    }
  }

  const getDocumentUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(storagePath)

    return data.publicUrl
  }

  return {
    documents,
    loading,
    error,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    refetch: fetchDocuments,
  }
}