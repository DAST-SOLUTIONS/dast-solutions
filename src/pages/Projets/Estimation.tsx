import { PageTitle } from '@/components/PageTitle'
import { useParams } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useState, useRef } from 'react'
import { Upload, FileText, Ruler, Square, MousePointer, Trash2 } from 'lucide-react'

export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()
  const { documents, measurements, loading, uploadDocument, createMeasurement, deleteMeasurement } = useTakeoff(projectId || '')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [activeTool, setActiveTool] = useState<'select' | 'linear' | 'area' | 'count'>('select')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      await uploadDocument(file)
      alert('Document uploadé avec succès!')
    } catch (err) {
      alert('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const tools = [
    { id: 'select', name: 'Sélectionner', icon: MousePointer },
    { id: 'linear', name: 'Mesure linéaire', icon: Ruler },
    { id: 'area', name: 'Mesure de surface', icon: Square },
    { id: 'count', name: 'Comptage', icon: FileText }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="Estimation - Takeoff" subtitle="Relevé de quantités sur plans" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar gauche - Documents */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Documents</h3>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary w-full mb-4"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Upload...' : 'Upload Plan'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? 'bg-teal-50 border-2 border-teal-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-600" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun document uploadé
                </p>
              )}
            </div>
          </div>

          {/* Outils de mesure */}
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <h3 className="font-bold text-gray-900 mb-4">Outils</h3>

            <div className="space-y-2">
              {tools.map(tool => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`w-full flex items-center gap-3 p-3 rounded ${
                      activeTool === tool.id
                        ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{tool.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Zone principale - Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4 min-h-[600px]">
            {selectedDoc ? (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">{selectedDoc.name}</h3>
                <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-4 min-h-[500px] flex items-center justify-center">
                  {selectedDoc.file_type.includes('pdf') ? (
                    <iframe
                      src={selectedDoc.file_url}
                      className="w-full h-[500px] rounded"
                      title="PDF Viewer"
                    />
                  ) : (
                    <img
                      src={selectedDoc.file_url}
                      alt={selectedDoc.name}
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Outil actif: <strong>{tools.find(t => t.id === activeTool)?.name}</strong></p>
                  <p className="text-xs mt-1">
                    🚧 Viewer interactif en développement - Pour l'instant, vue simple du document
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText size={64} className="mb-4" />
                <p className="text-lg font-medium">Aucun document sélectionné</p>
                <p className="text-sm">Uploadez un plan pour commencer</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar droite - Mesures */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Mesures ({measurements.length})</h3>

            <div className="space-y-2">
              {measurements.map(m => (
                <div key={m.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium">{m.item_name}</span>
                    <button
                      onClick={() => deleteMeasurement(m.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>{m.quantity} {m.unit}</p>
                    <p className="capitalize">{m.measurement_type}</p>
                  </div>
                </div>
              ))}

              {measurements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune mesure
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
