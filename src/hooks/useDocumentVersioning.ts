/**
 * DAST Solutions - Hook Versioning Documents
 * Gestion des versions et historique des modifications
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  notes?: string;
  changes?: string[];
  isLatest: boolean;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: 'plan' | 'devis' | 'contrat' | 'rapport' | 'photo' | 'autre';
  currentVersion: number;
  latestVersionId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface VersionCompare {
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  differences: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// ============================================================================
// HOOK
// ============================================================================
export function useDocumentVersioning(documentId?: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Charger le document et ses versions
  const loadDocument = useCallback(async (docId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger le document
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single();
      
      if (docError) throw docError;
      setDocument(doc);
      
      // Charger les versions
      const { data: vers, error: versError } = await supabase
        .from('document_versions')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .eq('document_id', docId)
        .order('version', { ascending: false });
      
      if (versError) throw versError;
      
      setVersions(vers?.map(v => ({
        ...v,
        createdByName: v.profiles?.full_name
      })) || []);
      
    } catch (err) {
      console.error('Erreur chargement document:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Charger au montage si documentId fourni
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);
  
  // Créer une nouvelle version
  const createVersion = useCallback(async (
    file: File,
    notes?: string,
    changes?: string[]
  ): Promise<DocumentVersion | null> => {
    if (!document) {
      setError('Document non chargé');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const newVersionNum = document.currentVersion + 1;
      const timestamp = Date.now();
      const fileName = `${document.id}/v${newVersionNum}_${timestamp}_${file.name}`;
      
      // Upload le fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      // Obtenir l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      
      // Marquer l'ancienne version comme non-latest
      await supabase
        .from('document_versions')
        .update({ is_latest: false })
        .eq('document_id', document.id)
        .eq('is_latest', true);
      
      // Créer la nouvelle version
      const { data: newVersion, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version: newVersionNum,
          filename: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          created_by: user?.id,
          notes,
          changes,
          is_latest: true
        })
        .select()
        .single();
      
      if (versionError) throw versionError;
      
      // Mettre à jour le document
      const { error: docUpdateError } = await supabase
        .from('documents')
        .update({
          current_version: newVersionNum,
          latest_version_id: newVersion.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);
      
      if (docUpdateError) throw docUpdateError;
      
      // Recharger
      await loadDocument(document.id);
      
      return newVersion;
      
    } catch (err) {
      console.error('Erreur création version:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  }, [document, loadDocument]);
  
  // Restaurer une version antérieure
  const restoreVersion = useCallback(async (
    versionId: string
  ): Promise<boolean> => {
    if (!document) {
      setError('Document non chargé');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const versionToRestore = versions.find(v => v.id === versionId);
      if (!versionToRestore) throw new Error('Version non trouvée');
      
      const newVersionNum = document.currentVersion + 1;
      const { data: { user } } = await supabase.auth.getUser();
      
      // Marquer l'ancienne version comme non-latest
      await supabase
        .from('document_versions')
        .update({ is_latest: false })
        .eq('document_id', document.id)
        .eq('is_latest', true);
      
      // Créer une nouvelle version à partir de l'ancienne
      const { data: newVersion, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version: newVersionNum,
          filename: versionToRestore.filename,
          file_url: versionToRestore.fileUrl,
          file_size: versionToRestore.fileSize,
          mime_type: versionToRestore.mimeType,
          created_by: user?.id,
          notes: `Restauré depuis la version ${versionToRestore.version}`,
          is_latest: true
        })
        .select()
        .single();
      
      if (versionError) throw versionError;
      
      // Mettre à jour le document
      await supabase
        .from('documents')
        .update({
          current_version: newVersionNum,
          latest_version_id: newVersion.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);
      
      await loadDocument(document.id);
      return true;
      
    } catch (err) {
      console.error('Erreur restauration version:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, [document, versions, loadDocument]);
  
  // Supprimer une version (sauf la dernière)
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    const version = versions.find(v => v.id === versionId);
    if (!version) {
      setError('Version non trouvée');
      return false;
    }
    
    if (version.isLatest) {
      setError('Impossible de supprimer la version courante');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Supprimer le fichier du storage
      const filePath = new URL(version.fileUrl).pathname.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('documents')
          .remove([`${document?.id}/${filePath}`]);
      }
      
      // Supprimer la version
      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId);
      
      if (error) throw error;
      
      setVersions(prev => prev.filter(v => v.id !== versionId));
      return true;
      
    } catch (err) {
      console.error('Erreur suppression version:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setLoading(false);
    }
  }, [document, versions]);
  
  // Comparer deux versions
  const compareVersions = useCallback((
    oldVersionId: string,
    newVersionId: string
  ): VersionCompare | null => {
    const oldVersion = versions.find(v => v.id === oldVersionId);
    const newVersion = versions.find(v => v.id === newVersionId);
    
    if (!oldVersion || !newVersion) return null;
    
    const differences: VersionCompare['differences'] = [];
    
    if (oldVersion.filename !== newVersion.filename) {
      differences.push({
        field: 'Nom du fichier',
        oldValue: oldVersion.filename,
        newValue: newVersion.filename
      });
    }
    
    if (oldVersion.fileSize !== newVersion.fileSize) {
      differences.push({
        field: 'Taille',
        oldValue: formatFileSize(oldVersion.fileSize),
        newValue: formatFileSize(newVersion.fileSize)
      });
    }
    
    return {
      oldVersion,
      newVersion,
      differences
    };
  }, [versions]);
  
  // Obtenir la version la plus récente
  const getLatestVersion = useCallback((): DocumentVersion | null => {
    return versions.find(v => v.isLatest) || versions[0] || null;
  }, [versions]);
  
  // Obtenir une version spécifique
  const getVersion = useCallback((versionNum: number): DocumentVersion | null => {
    return versions.find(v => v.version === versionNum) || null;
  }, [versions]);
  
  return {
    document,
    versions,
    loading,
    error,
    loadDocument,
    createVersion,
    restoreVersion,
    deleteVersion,
    compareVersions,
    getLatestVersion,
    getVersion,
    refresh: () => document && loadDocument(document.id)
  };
}

// ============================================================================
// HELPERS
// ============================================================================
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default useDocumentVersioning;
