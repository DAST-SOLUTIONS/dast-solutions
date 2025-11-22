import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  drawing_number?: string // Numéro de plan extrait par OCR
  drawing_title?: string // Titre extrait par OCR
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed'
  ocr_data?: any
  uploaded_by: string
  uploaded_at: string
  is_latest: boolean
  change_notes?: string
}

export interface Document {
  id: string
  project_id: string
  original_name: string
  document_type: 'pdf' | 'dwg' | 'dxf' | 'rvt' | 'ifc' | 'docx' | 'xlsx'
  category: 'plan' | 'model' | 'document' | 'spreadsheet'
  current_version: number
  created_at: string
  updated_at: string
  versions: DocumentVersion[]
}

export function useDocumentVersioning(projectId: string | null) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Récupérer les documents avec leurs versions
      const { data: docs, error: fetchError } = await supabase
        .from('documents')
        .select(`
          *,
          versions:document_versions(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setDocuments(docs || [])
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

  const uploadDocument = async (
    file: File,
    category: Document['category'],
    changeNotes?: string
  ) => {
    if (!projectId || !user) throw new Error('Project or user not found')

    setUploading(true)
    setError(null)

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase() as Document['document_type']
      const timestamp = Date.now()
      const storagePath = `${projectId}/${timestamp}-${file.name}`

      // 1. Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(storagePath, file, { upsert: false })

      if (uploadError) throw uploadError

      // 2. Vérifier si document existe déjà (même nom)
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id, current_version')
        .eq('project_id', projectId)
        .eq('original_name', file.name)
        .single()

      let documentId: string
      let versionNumber: number

      if (existingDoc) {
        // Document existe → nouvelle version
        documentId = existingDoc.id
        versionNumber = existingDoc.current_version + 1

        // Mettre à jour le document parent
        await supabase
          .from('documents')
          .update({ 
            current_version: versionNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)

        // Marquer les anciennes versions comme non-latest
        await supabase
          .from('document_versions')
          .update({ is_latest: false })
          .eq('document_id', documentId)

      } else {
        // Nouveau document
        versionNumber = 1
        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert([{
            project_id: projectId,
            original_name: file.name,
            document_type: fileType,
            category,
            current_version: 1,
          }])
          .select()
          .single()

        if (docError) throw docError
        documentId = newDoc.id
      }

      // 3. Créer la version
      const { data: version, error: versionError } = await supabase
        .from('document_versions')
        .insert([{
          document_id: documentId,
          version_number: versionNumber,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          storage_path: uploadData.path,
          uploaded_by: user.id,
          is_latest: true,
          change_notes: changeNotes,
          ocr_status: category === 'plan' ? 'pending' : null,
        }])
        .select()
        .single()

      if (versionError) throw versionError

      // 4. Déclencher OCR si c'est un plan
      if (category === 'plan') {
        triggerOCR(version.id, uploadData.path, fileType)
      }

      await fetchDocuments()
      return version

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const triggerOCR = async (versionId: string, path: string, type: string) => {
    try {
      // Mettre à jour le statut
      await supabase
        .from('document_versions')
        .update({ ocr_status: 'processing' })
        .eq('id', versionId)

      // Appeler l'Edge Function pour OCR
      const { data, error } = await supabase.functions.invoke('extract-plan-metadata', {
        body: { versionId, path, type }
      })

      if (error) throw error

      // Mettre à jour avec les résultats OCR
      await supabase
        .from('document_versions')
        .update({
          ocr_status: 'completed',
          drawing_number: data.drawingNumber,
          drawing_title: data.drawingTitle,
          ocr_data: data.fullData,
        })
        .eq('id', versionId)

      await fetchDocuments()

    } catch (err) {
      console.error('OCR failed:', err)
      await supabase
        .from('document_versions')
        .update({ ocr_status: 'failed' })
        .eq('id', versionId)
    }
  }

  const getDocumentUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('project-documents')
      .getPublicUrl(storagePath)
    return data.publicUrl
  }

  const deleteVersion = async (versionId: string, storagePath: string) => {
    try {
      // Supprimer du storage
      await supabase.storage
        .from('project-documents')
        .remove([storagePath])

      // Supprimer de la BD
      await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId)

      await fetchDocuments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      setError(message)
      throw err
    }
  }

  const updateDrawingMetadata = async (
    versionId: string,
    drawingNumber: string,
    drawingTitle: string
  ) => {
    try {
      await supabase
        .from('document_versions')
        .update({ drawing_number: drawingNumber, drawing_title: drawingTitle })
        .eq('id', versionId)

      await fetchDocuments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      setError(message)
      throw err
    }
  }

  return {
    documents,
    loading,
    uploading,
    error,
    uploadDocument,
    getDocumentUrl,
    deleteVersion,
    updateDrawingMetadata,
    refetch: fetchDocuments,
  }
}