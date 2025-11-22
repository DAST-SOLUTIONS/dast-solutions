import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDocumentVersioning } from '@/hooks/useDocumentVersioning'
import { Upload, FileText, File, Boxes, Download, Eye, Trash2, Clock, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { PageTitle } from '@/components/PageTitle'
import { useToast } from '@/components/ToastProvider'

export default function CloudStorage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { 
    documents, 
    loading, 
    uploading, 
    uploadDocument, 
    getDocumentUrl, 
    deleteVersion,
    updateDrawingMetadata 
  } = useDocumentVersioning(projectId || null)
  
  const { toast } = useToast()
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [viewerMode, setViewerMode] = useState<'viewer' | 'metadata' | null>(null)
  const [editingMetadata, setEditingMetadata] = useState<any>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<'plan' | 'model' | 'document' | 'spreadsheet'>('plan')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [changeNotes, setChangeNotes] = useState('')

  const toggleExpand = (docId: string) => {
    const newExpanded = new Set(expandedDocs)
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId)
    } else {
      newExpanded.add(docId)
    }
    setExpandedDocs(newExpanded)
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="text-red-600" />
      case 'dwg':
      case 'dxf': return <File className="text-indigo-600" />
      case 'rvt':
      case 'ifc': return <Boxes className="text-emerald-600" />
      case 'docx': return <FileText className="text-blue-600" />
      case 'xlsx': return <FileText className="text-green-600" />
      default: return <File className="text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      processing: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-gray-100 text-gray-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status === 'completed' ? '✓ OCR' : 
         status === 'processing' ? '⟳ OCR...' : 
         status === 'failed' ? '✗ OCR' : '⋯ En attente'}
      </span>
    )
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const openViewer = (doc: any, version: any) => {
    setSelectedDoc({ ...doc, selectedVersion: version })
    setViewerMode('viewer')
  }

  const openMetadataEditor = (doc: any, version: any) => {
    setEditingMetadata({
      versionId: version.id,
      drawingNumber: version.drawing_number || '',
      drawingTitle: version.drawing_title || ''
    })
    setSelectedDoc({ ...doc, selectedVersion: version })
    setViewerMode('metadata')
  }

  const saveMetadata = async () => {
    try {
      await updateDrawingMetadata(
        editingMetadata.versionId,
        editingMetadata.drawingNumber,
        editingMetadata.drawingTitle
      )
      toast('Métadonnées mises à jour', 'success')
      setViewerMode(null)
      setEditingMetadata(null)
    } catch (error) {
      toast('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      toast('Veuillez sélectionner un fichier', 'error')
      return
    }

    try {
      await uploadDocument(uploadFile, uploadCategory, changeNotes)
      toast('Document uploadé avec succès', 'success')
      setUploadModalOpen(false)
      setUploadFile(null)
      setChangeNotes('')
    } catch (error) {
      toast('Erreur lors de l\'upload', 'error')
    }
  }

  const handleDelete = async (versionId: string, storagePath: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette version ?')) {
      try {
        await deleteVersion(versionId, storagePath)
        toast('Version supprimée', 'success')
      } catch (error) {
        toast('Erreur lors de la suppression', 'error')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="☁️ Cloud Storage" subtitle="Gestion centralisée des documents avec versioning" />
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => setUploadModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
          disabled={uploading}
        >
          <Upload size={20} />
          {uploading ? 'Upload en cours...' : 'Uploader un document'}
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
        <button className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium">
          📄 Tous ({documents.length})
        </button>
        <button className="px-4 py-2 hover:bg-gray-100 rounded-lg">
          📐 Plans ({documents.filter(d => d.category === 'plan').length})
        </button>
        <button className="px-4 py-2 hover:bg-gray-100 rounded-lg">
          🏗️ Maquettes ({documents.filter(d => d.category === 'model').length})
        </button>
        <button className="px-4 py-2 hover:bg-gray-100 rounded-lg">
          📝 Documents ({documents.filter(d => d.category === 'document').length})
        </button>
      </div>

      {/* DOCUMENTS LIST */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-2">Aucun document</p>
          <p className="text-gray-500 text-sm">Uploadez votre premier document pour commencer</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => {
            const isExpanded = expandedDocs.has(doc.id)
            const latestVersion = doc.versions.find(v => v.is_latest)

            return (
              <div key={doc.id} className="bg-white rounded-lg shadow overflow-hidden">
                
                {/* DOCUMENT HEADER */}
                <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                     onClick={() => toggleExpand(doc.id)}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">{getIcon(doc.document_type)}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{doc.original_name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          v{doc.current_version}
                        </span>
                        {latestVersion?.ocr_status && getStatusBadge(latestVersion.ocr_status)}
                      </div>
                      
                      {latestVersion?.drawing_number && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="font-medium">{latestVersion.drawing_number}</span>
                          <span>•</span>
                          <span>{latestVersion.drawing_title}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {formatBytes(latestVersion?.file_size || 0)} • 
                        Dernière mise à jour: {new Date(latestVersion?.uploaded_at || '').toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openViewer(doc, latestVersion) }}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                      title="Voir le document"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation()
                        window.open(getDocumentUrl(latestVersion?.storage_path || ''), '_blank')
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg" 
                      title="Télécharger"
                    >
                      <Download size={18} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* VERSIONS LIST */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock size={16} />
                      Historique des versions ({doc.versions.length})
                    </h4>
                    
                    <div className="space-y-2">
                      {doc.versions.map((version) => (
                        <div key={version.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold ${version.is_latest ? 'text-teal-600' : 'text-gray-600'}`}>
                                Version {version.version_number}
                              </span>
                              {version.is_latest && (
                                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
                                  ACTUELLE
                                </span>
                              )}
                              {version.ocr_status && getStatusBadge(version.ocr_status)}
                            </div>
                            
                            {version.drawing_number && (
                              <div className="text-sm text-gray-600 mt-1">
                                {version.drawing_number} - {version.drawing_title}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 mt-1">
                              {formatBytes(version.file_size)} • {new Date(version.uploaded_at).toLocaleDateString('fr-CA')}
                              {version.change_notes && ` • ${version.change_notes}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.category === 'plan' && (
                              <button 
                                onClick={() => openMetadataEditor(doc, version)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                title="Modifier les métadonnées"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => openViewer(doc, version)}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                              title="Voir cette version"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => window.open(getDocumentUrl(version.storage_path), '_blank')}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" 
                              title="Télécharger"
                            >
                              <Download size={16} />
                            </button>
                            {!version.is_latest && (
                              <button 
                                onClick={() => handleDelete(version.id, version.storage_path)}
                                className="p-2 hover:bg-red-100 rounded-lg text-red-600" 
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Uploader un document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="plan">📐 Plan (PDF, DWG, DXF)</option>
                  <option value="model">🏗️ Maquette (RVT, IFC)</option>
                  <option value="document">📝 Document (DOCX, PDF)</option>
                  <option value="spreadsheet">📊 Tableur (XLSX)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fichier
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.dwg,.dxf,.rvt,.ifc,.docx,.xlsx"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    {uploadFile.name} ({formatBytes(uploadFile.size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes de changement (optionnel)
                </label>
                <textarea
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="Ex: Révision suite aux commentaires du client"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setUploadModalOpen(false)
                  setUploadFile(null)
                  setChangeNotes('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Annuler
              </button>
              <button 
                onClick={handleUpload}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Upload...' : 'Uploader'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWER MODAL */}
      {viewerMode === 'viewer' && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedDoc.original_name}</h3>
                <p className="text-sm text-gray-600">Version {selectedDoc.selectedVersion.version_number}</p>
              </div>
              <button 
                onClick={() => setViewerMode(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Fermer
              </button>
            </div>
            
            <div className="flex-1 p-8 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">{getIcon(selectedDoc.document_type)}</div>
                <p className="text-gray-600 text-lg font-semibold mb-2">
                  Viewer {selectedDoc.document_type.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  🚧 Intégration à venir avec pdf.js / IFC.js / Viewer DWG
                </p>
                <button
                  onClick={() => window.open(getDocumentUrl(selectedDoc.selectedVersion.storage_path), '_blank')}
                  className="btn btn-primary"
                >
                  Télécharger pour ouvrir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METADATA EDITOR MODAL */}
      {viewerMode === 'metadata' && editingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Modifier les métadonnées</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de plan
                </label>
                <input
                  type="text"
                  value={editingMetadata.drawingNumber}
                  onChange={(e) => setEditingMetadata({...editingMetadata, drawingNumber: e.target.value})}
                  placeholder="Ex: A-101"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du plan
                </label>
                <input
                  type="text"
                  value={editingMetadata.drawingTitle}
                  onChange={(e) => setEditingMetadata({...editingMetadata, drawingTitle: e.target.value})}
                  placeholder="Ex: PLAN SOUS-SOL"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setViewerMode(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={saveMetadata}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}