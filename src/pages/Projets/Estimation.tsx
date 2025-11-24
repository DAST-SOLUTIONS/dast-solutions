import { PageTitle } from '@/components/PageTitle'
import { useParams } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useState, useRef } from 'react'
import { Upload, FileText, Plus, Download, DollarSign, Layers, Save } from 'lucide-react'

// Catégories prédéfinies pour la construction
const CATEGORIES = [
  { id: 'site', name: 'Travaux de site', color: '#8B4513' },
  { id: 'fondation', name: 'Fondation', color: '#6B7280' },
  { id: 'structure', name: 'Structure / Charpente', color: '#B45309' },
  { id: 'enveloppe', name: 'Enveloppe / Revêtement', color: '#0891B2' },
  { id: 'toiture', name: 'Toiture', color: '#7C3AED' },
  { id: 'portes-fenetres', name: 'Portes et fenêtres', color: '#2563EB' },
  { id: 'mecanique', name: 'Mécanique / Plomberie', color: '#059669' },
  { id: 'electrique', name: 'Électricité', color: '#FBBF24' },
  { id: 'ventilation', name: 'Ventilation / CVAC', color: '#6366F1' },
  { id: 'isolation', name: 'Isolation', color: '#EC4899' },
  { id: 'gypse', name: 'Gypse / Plâtrage', color: '#9CA3AF' },
  { id: 'peinture', name: 'Peinture / Finition', color: '#F472B6' },
  { id: 'plancher', name: 'Revêtement de sol', color: '#A16207' },
  { id: 'armoires', name: 'Armoires / Comptoirs', color: '#78350F' },
  { id: 'autre', name: 'Autre', color: '#374151' }
]

// Templates de takeoff prédéfinis
const TEMPLATES = {
  maison: [
    { category: 'fondation', name: 'Semelles', unit: 'm³', unitPrice: 250 },
    { category: 'fondation', name: 'Murs de fondation', unit: 'm²', unitPrice: 180 },
    { category: 'structure', name: 'Solives de plancher', unit: 'pi.l.', unitPrice: 4.50 },
    { category: 'structure', name: 'Colombages muraux', unit: 'pi.l.', unitPrice: 3.25 },
    { category: 'enveloppe', name: 'Revêtement extérieur', unit: 'm²', unitPrice: 85 },
    { category: 'toiture', name: 'Bardeaux d\'asphalte', unit: 'm²', unitPrice: 45 },
    { category: 'isolation', name: 'Isolation murs', unit: 'm²', unitPrice: 12 },
    { category: 'gypse', name: 'Gypse 1/2"', unit: 'm²', unitPrice: 8 },
    { category: 'peinture', name: 'Peinture intérieure', unit: 'm²', unitPrice: 6 }
  ],
  commercial: [
    { category: 'site', name: 'Excavation', unit: 'm³', unitPrice: 35 },
    { category: 'fondation', name: 'Dalle de béton', unit: 'm²', unitPrice: 120 },
    { category: 'structure', name: 'Acier structural', unit: 'kg', unitPrice: 3.50 },
    { category: 'enveloppe', name: 'Mur-rideau', unit: 'm²', unitPrice: 450 },
    { category: 'mecanique', name: 'Plomberie', unit: 'forfait', unitPrice: 1 },
    { category: 'electrique', name: 'Électricité', unit: 'forfait', unitPrice: 1 },
    { category: 'ventilation', name: 'Système CVAC', unit: 'forfait', unitPrice: 1 }
  ]
}

export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()
  const { documents, items, loading, uploadDocument, createMeasurement, createItem } = useTakeoff(projectId || '')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  
  const [newItem, setNewItem] = useState({
    category: 'structure',
    name: '',
    quantity: '',
    unit: 'm',
    unitPrice: ''
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const doc = await uploadDocument(file)
      setSelectedDoc(doc)
    } catch (err) {
      alert('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity) {
      alert('Veuillez remplir le nom et la quantité')
      return
    }

    const categoryName = CATEGORIES.find(c => c.id === newItem.category)?.name || newItem.category

    try {
      await createMeasurement({
        document_id: selectedDoc?.id || null,
        measurement_type: 'linear',
        item_name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        page_number: 1,
        color: CATEGORIES.find(c => c.id === newItem.category)?.color || '#3B82F6'
      })

      await createItem({
        category: categoryName,
        item_name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        unit: newItem.unit,
        unit_price: newItem.unitPrice ? parseFloat(newItem.unitPrice) : undefined,
        total_price: newItem.unitPrice ? parseFloat(newItem.quantity) * parseFloat(newItem.unitPrice) : undefined
      })

      setNewItem({ category: newItem.category, name: '', quantity: '', unit: 'm', unitPrice: '' })
    } catch (err) {
      alert('Erreur lors de l\'ajout')
    }
  }

  const applyTemplate = async (templateKey: 'maison' | 'commercial') => {
    const template = TEMPLATES[templateKey]
    if (!confirm(`Appliquer le template "${templateKey}"? Cela ajoutera ${template.length} items.`)) return

    for (const item of template) {
      const categoryName = CATEGORIES.find(c => c.id === item.category)?.name || item.category
      await createItem({
        category: categoryName,
        item_name: item.name,
        quantity: 0,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: 0
      })
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Catégorie', 'Item', 'Quantité', 'Unité', 'Prix unitaire', 'Total'],
      ...items.map(item => [
        item.category,
        item.item_name,
        item.quantity,
        item.unit,
        item.unit_price || '',
        item.total_price || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `takeoff-${projectId}.csv`
    a.click()
  }

  // Calculs
  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(i => i.category === CATEGORIES.find(c => c.id === activeCategory)?.name)

  const totalCost = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const itemsWithCost = items.filter(i => i.total_price && i.total_price > 0).length

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

      {/* Barre de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Layers className="text-teal-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Items</p>
            <p className="text-xl font-bold text-gray-900">{items.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Documents</p>
            <p className="text-xl font-bold text-gray-900">{documents.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Items avec prix</p>
            <p className="text-xl font-bold text-gray-900">{itemsWithCost} / {items.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <DollarSign className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total estimé</p>
            <p className="text-xl font-bold text-orange-600">{totalCost.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Colonne 1: Documents + Templates */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Plans ({documents.length})</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary w-full mb-4"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Upload...' : 'Ajouter un plan'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedDoc?.id === doc.id ? 'bg-teal-50 border-2 border-teal-500' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucun plan</p>
              )}
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => applyTemplate('maison')}
                className="btn btn-secondary w-full text-left"
              >
                <Save size={16} className="mr-2" />
                Maison résidentielle
              </button>
              <button
                onClick={() => applyTemplate('commercial')}
                className="btn btn-secondary w-full text-left"
              >
                <Save size={16} className="mr-2" />
                Commercial
              </button>
            </div>
          </div>
        </div>

        {/* Colonne 2-3: Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            {selectedDoc ? (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">{selectedDoc.name}</h3>
                <div className="border-2 border-gray-200 rounded-lg bg-gray-50 overflow-auto" style={{ maxHeight: '500px' }}>
                  {selectedDoc.file_type?.includes('pdf') ? (
                    <iframe src={selectedDoc.file_url} className="w-full h-[500px]" title="Plan PDF" />
                  ) : (
                    <img src={selectedDoc.file_url} alt={selectedDoc.name} className="max-w-full" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <FileText size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun plan sélectionné</p>
                <p className="text-sm">Uploadez ou sélectionnez un plan</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne 4: Formulaire + Items */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Formulaire ajout */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-4">Ajouter un item</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Catégorie</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="input-field"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
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
                    <option value="m">m</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="pi">pi</option>
                    <option value="pi²">pi²</option>
                    <option value="pi.l.">pi.l.</option>
                    <option value="kg">kg</option>
                    <option value="unité">unité</option>
                    <option value="forfait">forfait</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Prix unitaire ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
              <button onClick={handleAddItem} className="btn btn-primary w-full">
                <Plus size={16} className="mr-2" /> Ajouter
              </button>
            </div>
          </div>

          {/* Liste items */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Items ({items.length})</h3>
              {items.length > 0 && (
                <button onClick={exportToCSV} className="text-teal-600 hover:text-teal-700" title="Exporter CSV">
                  <Download size={18} />
                </button>
              )}
            </div>

            {/* Filtre par catégorie */}
            <div className="mb-3">
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">Toutes les catégories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {filteredItems.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded border-l-4" style={{ borderColor: CATEGORIES.find(c => c.name === item.category)?.color || '#6B7280' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.item_name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-teal-700 text-sm">{item.quantity} {item.unit}</p>
                      {item.total_price && item.total_price > 0 && (
                        <p className="text-xs text-green-600">{item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucun item</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
