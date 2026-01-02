/**
 * DAST Solutions - Hook pour Documents de Projet
 * Upload, liste, suppression de documents
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProjectDocument {
  id: string
  project_id: string
  user_id: string
  filename: string
  original_name?: string
  storage_path: string
  file_url?: string
  file_size?: number
  mime_type?: string
  category: 'plans' | 'devis' | 'contrats' | 'photos' | 'general'
  description?: string
  version: number
  is_active: boolean
  uploaded_at: string
  created_at: string
}

export function useProjectDocuments(projectId: string) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Charger les documents
  const loadDocuments = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non authentifié')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false })

      if (fetchError) {
        // Table n'existe pas encore
        if (fetchError.code === '42P01') {
          console.warn('Table project_documents non créée')
          setDocuments([])
          return
        }
        throw fetchError
      }

      // Générer les URLs publiques
      const docsWithUrls = await Promise.all((data || []).map(async (doc) => {
        if (doc.storage_path) {
          const { data: urlData } = supabase.storage
            .from('project-documents')
            .getPublicUrl(doc.storage_path)
          return { ...doc, file_url: urlData?.publicUrl }
        }
        return doc
      }))

      setDocuments(docsWithUrls)
    } catch (err: any) {
      console.error('Erreur chargement documents:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Upload document
  const uploadDocument = async (
    file: File, 
    category: ProjectDocument['category'] = 'general',
    description?: string
  ): Promise<ProjectDocument | null> => {
    try {
      setUploading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Vérifier la taille (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Fichier trop volumineux (max 50MB)')
      }

      // Chemin de stockage: user_id/project_id/timestamp_filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Si bucket n'existe pas, message clair
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
          throw new Error('Le bucket "project-documents" n\'existe pas. Créez-le dans Supabase Dashboard > Storage.')
        }
        throw new Error(`Erreur upload: ${uploadError.message}`)
      }

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(storagePath)

      // Insérer dans la base de données
      const { data: docData, error: insertError } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          user_id: user.id,
          filename: sanitizedName,
          original_name: file.name,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          category,
          description
        })
        .select()
        .single()

      if (insertError) {
        // Nettoyer le fichier uploadé si l'insert échoue
        await supabase.storage.from('project-documents').remove([storagePath])
        
        if (insertError.code === '42P01') {
          throw new Error('Table "project_documents" non créée. Exécutez la migration SQL.')
        }
        throw insertError
      }

      const newDoc = { ...docData, file_url: urlData?.publicUrl }
      setDocuments(prev => [newDoc, ...prev])
      return newDoc

    } catch (err: any) {
      console.error('Erreur upload document:', err)
      setError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  // Supprimer document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const doc = documents.find(d => d.id === documentId)
      
      // Supprimer le fichier du storage
      if (doc?.storage_path) {
        await supabase.storage
          .from('project-documents')
          .remove([doc.storage_path])
      }

      // Supprimer de la base de données
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      setDocuments(prev => prev.filter(d => d.id !== documentId))
      return true
    } catch (err: any) {
      console.error('Erreur suppression:', err)
      setError(err.message)
      return false
    }
  }

  // Stats par catégorie
  const getStats = () => {
    return {
      plans: documents.filter(d => d.category === 'plans').length,
      devis: documents.filter(d => d.category === 'devis').length,
      contrats: documents.filter(d => d.category === 'contrats').length,
      photos: documents.filter(d => d.category === 'photos').length,
      general: documents.filter(d => d.category === 'general').length,
      total: documents.length
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  return {
    documents,
    loading,
    error,
    uploading,
    uploadDocument,
    deleteDocument,
    getStats,
    refetch: loadDocuments
  }
}
