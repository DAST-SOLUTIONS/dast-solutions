import { PageTitle } from '@/components/PageTitle'
import { useParams } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Plus, Download } from 'lucide-react'

export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()
  const { documents, measurements, items, loading, uploadDocument, createMeasurement, deleteMeasurement, createItem } = useTakeoff(projectId || '')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: 'm',
    type: 'linear'
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const doc = await uploadDocument(file)
      setSelectedDoc(doc)
    } catch (err) {
      alert('Erreur lors de l\'upload. Vérifiez que le bucket "takeoff-documents" existe dans Supabase.')
    } finally {
      setUploading(false)
    }
  }

  const handleAddMeasurement = async () => {
    if (!newItem.name || !newItem.quantity) {
      alert('Veuillez remplir le nom et la quantité')
      return
    }

    try {
      await createMeasurement({
        document_id: selectedDoc?.id || null,
        measurement_type: newItem.type as any,
        item_name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        page_number: 1,
        color: '#3B82F6'
      })

      await createItem({
        category: newItem.type === 'linear' ? 'Linéaire' : newItem.type === 'area' ? 'Surface' : 'Comptage',
        item_name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit
      })

      setNewItem({ name: '', quantity: '', unit: 'm', type: 'linear' })
    } catch (err) {
      alert('Erreur lors de l\'ajout')
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Catégorie', 'Item', 'Quantité', 'Unité'],
      ...items.map(item => [item.category, item.item_name, item.quantity, item.unit])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `takeoff-${projectId}.csv`
    a.click()
  }

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
        
        {/* Colonne 1: Documents */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Plans ({documents.length})</h3>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary w-full mb-4"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Upload en cours...' : 'Ajouter un plan'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedDoc?.id === doc.id
                      ? 'bg-teal-50 border-2 border-teal-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun plan</p>
                  <p className="text-xs">Cliquez pour ajouter</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne 2-3: Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            {selectedDoc ? (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">{selectedDoc.name}</h3>
                <div className="border-2 border-gray-200 rounded-lg bg-gray-50 overflow-auto" style={{ maxHeight: '600px' }}>
                  {selectedDoc.file_type?.includes('pdf') ? (
                    <iframe
                      src={selectedDoc.file_url}
                      className="w-full h-[600px]"
                      title="Plan PDF"
                    />
                  ) : (
                    <img
                      src={selectedDoc.file_url}
                      alt={selectedDoc.name}
                      className="max-w-full"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-gray-500">
                <FileText size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun plan sélectionné</p>
                <p className="text-sm">Uploadez ou sélectionnez un plan</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne 4: Mesures et Items */}
        <div className="lg:col-span-1">
          
          {/* Ajouter une mesure */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-4">Ajouter une mesure</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Nom de l'item</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Ex: Mur extérieur"
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Unité</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="input-field"
                  >
                    <option value="m">m (linéaire)</option>
                    <option value="m²">m² (surface)</option>
                    <option value="m³">m³ (volume)</option>
                    <option value="unité">unité</option>
                    <option value="pi">pi</option>
                    <option value="pi²">pi²</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddMeasurement}
                className="btn btn-primary w-full"
              >
                <Plus size={16} className="mr-2" />
                Ajouter
              </button>
            </div>
          </div>

          {/* Liste des items */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Items ({items.length})</h3>
              {items.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="text-teal-600 hover:text-teal-700"
                  title="Exporter CSV"
                >
                  <Download size={18} />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="p-3 bg-teal-50 rounded border border-teal-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <p className="font-bold text-teal-700">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">Aucun item</p>
                  <p className="text-xs">Ajoutez des mesures</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
