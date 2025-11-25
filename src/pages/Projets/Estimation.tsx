import { PageTitle } from '@/components/PageTitle'
import { useParams, useNavigate } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useProjects } from '@/hooks/useProjects'
import { useCCQRates } from '@/hooks/ccq/useCCQRates'
import { useState, useRef } from 'react'
import { 
  Upload, FileText, Plus, Download, DollarSign, Layers, Save, FolderOpen, 
  Trash2, Edit2, Copy, X, Check, Users, Wrench, HardHat, Calculator,
  FileCheck, Percent, Building, Truck, ClipboardList, Eye, Printer
} from 'lucide-react'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { CCQ_CONSTANTS } from '@/types/ccq-types'

// ============================================================================
// CONSTANTES
// ============================================================================

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
  { id: 'main-oeuvre', name: 'Main-d\'œuvre CCQ', color: '#DC2626' },
  { id: 'equipement', name: 'Équipements', color: '#7C3AED' },
  { id: 'sous-traitant', name: 'Sous-traitants', color: '#0891B2' },
  { id: 'autre', name: 'Autre', color: '#374151' }
]

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

// Taxes Québec
const TAX_RATES = {
  TPS: 0.05,
  TVQ: 0.09975
}

// ============================================================================
// COMPOSANT: Sélecteur de projet
// ============================================================================

function ProjectSelector() {
  const { projects, loading } = useProjects()
  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageTitle title="Estimation" subtitle="Sélectionnez un projet pour commencer" />

      <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FolderOpen size={64} className="mx-auto mb-4 text-teal-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisir un projet</h2>
          <p className="text-gray-600 mb-4">Sélectionnez le projet pour lequel vous souhaitez créer une estimation</p>
          
          <button onClick={() => setShowNewProject(true)} className="btn btn-primary">
            <Plus size={16} className="mr-2" />
            Nouveau projet
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun projet trouvé. Créez votre premier projet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/projets/${project.id}/estimation`)}
                className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <h3 className="font-bold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 truncate">{project.description || 'Pas de description'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">{project.status || 'En cours'}</span>
                  <span className="text-teal-600 text-sm font-medium">Ouvrir →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        redirectToEstimation={true}
      />
    </div>
  )
}

// ============================================================================
// ONGLET 1: TAKEOFF (Relevé de quantités)
// ============================================================================

function TakeoffTab({ projectId }: { projectId: string }) {
  const { documents, items, loading, uploadDocument, createMeasurement, createItem, updateItem, deleteItem, duplicateItem } = useTakeoff(projectId)
  const { trades, sectors, rates, loading: ccqLoading, getRate } = useCCQRates()
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ quantity: '', unit_price: '' })
  const [itemType, setItemType] = useState<'material' | 'labor'>('material')
  
  const [newItem, setNewItem] = useState({
    category: 'structure',
    name: '',
    quantity: '',
    unit: 'm',
    unitPrice: ''
  })

  const [laborItem, setLaborItem] = useState({
    tradeCode: '',
    sectorCode: 'RES_LEGER',
    hours: '',
    workers: '1',
    description: ''
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

  const handleAddLaborItem = async () => {
    if (!laborItem.tradeCode || !laborItem.hours) {
      alert('Veuillez sélectionner un métier et entrer les heures')
      return
    }

    try {
      const rate = await getRate(laborItem.tradeCode, laborItem.sectorCode)
      
      if (!rate) {
        alert('Taux CCQ non trouvé pour ce métier/secteur')
        return
      }

      const trade = trades.find(t => t.code === laborItem.tradeCode)
      const sector = sectors.find(s => s.code === laborItem.sectorCode)
      const hours = parseFloat(laborItem.hours)
      const workers = parseInt(laborItem.workers) || 1
      const totalHours = hours * workers

      const baseSalary = rate.base_rate * totalHours
      const vacationPay = baseSalary * CCQ_CONSTANTS.VACATION_RATE
      const holidayPay = baseSalary * CCQ_CONSTANTS.STATUTORY_HOLIDAYS_RATE
      const totalWithBenefits = baseSalary + vacationPay + holidayPay

      const itemName = laborItem.description 
        ? `${trade?.name_fr} - ${laborItem.description}`
        : `${trade?.name_fr} (${sector?.name_fr})`

      await createItem({
        category: 'Main-d\'œuvre CCQ',
        item_name: itemName,
        quantity: totalHours,
        unit: 'heures',
        unit_price: rate.base_rate,
        total_price: totalWithBenefits
      })

      setLaborItem({ tradeCode: '', sectorCode: 'RES_LEGER', hours: '', workers: '1', description: '' })
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'ajout de la main-d\'œuvre')
    }
  }

  const startEditing = (item: any) => {
    setEditingItem(item.id)
    setEditForm({
      quantity: item.quantity?.toString() || '',
      unit_price: item.unit_price?.toString() || ''
    })
  }

  const saveEditing = async (item: any) => {
    try {
      const quantity = parseFloat(editForm.quantity) || 0
      const unitPrice = parseFloat(editForm.unit_price) || 0
      
      let totalPrice = quantity * unitPrice
      if (item.category === 'Main-d\'œuvre CCQ') {
        const baseSalary = quantity * unitPrice
        const vacationPay = baseSalary * CCQ_CONSTANTS.VACATION_RATE
        const holidayPay = baseSalary * CCQ_CONSTANTS.STATUTORY_HOLIDAYS_RATE
        totalPrice = baseSalary + vacationPay + holidayPay
      }
      
      await updateItem(item.id, {
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      })
      
      setEditingItem(null)
    } catch (err) {
      alert('Erreur lors de la mise à jour')
    }
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditForm({ quantity: '', unit_price: '' })
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}"?`)) return
    try {
      await deleteItem(id)
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  const handleDuplicateItem = async (item: any) => {
    try {
      await duplicateItem(item)
    } catch (err) {
      alert('Erreur lors de la duplication')
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

  const filteredItems = activeCategory === 'all' 
    ? items 
    : activeCategory === 'main-oeuvre'
      ? items.filter(i => i.category === 'Main-d\'œuvre CCQ')
      : items.filter(i => i.category === CATEGORIES.find(c => c.id === activeCategory)?.name)

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Colonne 1: Documents + Templates */}
      <div className="lg:col-span-1 space-y-4">
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

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-900 mb-4">Templates</h3>
          <div className="space-y-2">
            <button onClick={() => applyTemplate('maison')} className="btn btn-secondary w-full text-left">
              <Save size={16} className="mr-2" /> Maison résidentielle
            </button>
            <button onClick={() => applyTemplate('commercial')} className="btn btn-secondary w-full text-left">
              <Save size={16} className="mr-2" /> Commercial
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

      {/* Colonne 4: Formulaires + Items */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setItemType('material')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                itemType === 'material' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Wrench size={14} className="inline mr-1" /> Matériaux
            </button>
            <button
              onClick={() => setItemType('labor')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                itemType === 'labor' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <HardHat size={14} className="inline mr-1" /> CCQ
            </button>
          </div>

          {itemType === 'material' ? (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Ajouter un matériau</h3>
              <div>
                <label className="text-sm text-gray-600">Catégorie</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="input-field"
                >
                  {CATEGORIES.filter(c => !['main-oeuvre', 'equipement', 'sous-traitant'].includes(c.id)).map(cat => (
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
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <HardHat size={18} className="text-red-600" />
                Main-d'œuvre CCQ
              </h3>
              
              {ccqLoading ? (
                <p className="text-sm text-gray-500">Chargement des taux CCQ...</p>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Métier *</label>
                    <select
                      value={laborItem.tradeCode}
                      onChange={(e) => setLaborItem({...laborItem, tradeCode: e.target.value})}
                      className="input-field"
                    >
                      <option value="">-- Sélectionner un métier --</option>
                      {trades.map(trade => (
                        <option key={trade.code} value={trade.code}>{trade.name_fr}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Secteur</label>
                    <select
                      value={laborItem.sectorCode}
                      onChange={(e) => setLaborItem({...laborItem, sectorCode: e.target.value})}
                      className="input-field"
                    >
                      {sectors.map(sector => (
                        <option key={sector.code} value={sector.code}>{sector.name_fr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-gray-600">Heures *</label>
                      <input
                        type="number"
                        step="0.5"
                        value={laborItem.hours}
                        onChange={(e) => setLaborItem({...laborItem, hours: e.target.value})}
                        placeholder="Ex: 40"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Travailleurs</label>
                      <input
                        type="number"
                        min="1"
                        value={laborItem.workers}
                        onChange={(e) => setLaborItem({...laborItem, workers: e.target.value})}
                        placeholder="1"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <input
                      type="text"
                      value={laborItem.description}
                      onChange={(e) => setLaborItem({...laborItem, description: e.target.value})}
                      placeholder="Ex: Installation plomberie"
                      className="input-field"
                    />
                  </div>

                  <button onClick={handleAddLaborItem} className="btn w-full bg-red-600 hover:bg-red-700 text-white">
                    <Plus size={16} className="mr-2" /> Ajouter main-d'œuvre
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Liste des items */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Items ({items.length})</h3>
          </div>

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

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className="p-3 bg-gray-50 rounded border-l-4 group" 
                style={{ borderColor: item.category === 'Main-d\'œuvre CCQ' ? '#DC2626' : (CATEGORIES.find(c => c.name === item.category)?.color || '#6B7280') }}
              >
                {editingItem === item.id ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Quantité</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                          className="input-field text-sm py-1"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Prix unit.</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.unit_price}
                          onChange={(e) => setEditForm({...editForm, unit_price: e.target.value})}
                          className="input-field text-sm py-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEditing(item)} className="flex-1 py-1 bg-green-500 text-white rounded text-sm">
                        <Check size={14} className="inline mr-1" /> OK
                      </button>
                      <button onClick={cancelEditing} className="flex-1 py-1 bg-gray-300 text-gray-700 rounded text-sm">
                        <X size={14} className="inline mr-1" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.item_name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-teal-700 text-sm">{item.quantity} {item.unit}</p>
                        {item.total_price > 0 && (
                          <p className="text-xs text-green-600">{item.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(item)} className="flex-1 py-1 px-2 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                        <Edit2 size={12} className="inline" /> Modifier
                      </button>
                      <button onClick={() => handleDuplicateItem(item)} className="py-1 px-2 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                        <Copy size={12} />
                      </button>
                      <button onClick={() => handleDeleteItem(item.id, item.item_name)} className="py-1 px-2 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Aucun item</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ONGLET 2: SOUMISSION (Finalisation des prix)
// ============================================================================

function SoumissionTab({ projectId, items }: { projectId: string; items: any[] }) {
  // Calculs par catégorie
  const materialItems = items.filter(i => !['Main-d\'œuvre CCQ', 'Équipements', 'Sous-traitants'].includes(i.category))
  const laborItems = items.filter(i => i.category === 'Main-d\'œuvre CCQ')
  const equipmentItems = items.filter(i => i.category === 'Équipements')
  const subcontractorItems = items.filter(i => i.category === 'Sous-traitants')

  const totalMaterials = materialItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalLabor = laborItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalEquipment = equipmentItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalSubcontractors = subcontractorItems.reduce((sum, item) => sum + (item.total_price || 0), 0)

  // Coûts directs
  const directCosts = totalMaterials + totalLabor + totalEquipment + totalSubcontractors

  // Pourcentages ajustables
  const [percentages, setPercentages] = useState({
    fraisGeneraux: 10,
    contingence: 5,
    administration: 5,
    profit: 15
  })

  // Calculs avec pourcentages
  const fraisGeneraux = directCosts * (percentages.fraisGeneraux / 100)
  const contingence = directCosts * (percentages.contingence / 100)
  const subtotalAvantAdmin = directCosts + fraisGeneraux + contingence
  const administration = subtotalAvantAdmin * (percentages.administration / 100)
  const subtotalAvantProfit = subtotalAvantAdmin + administration
  const profit = subtotalAvantProfit * (percentages.profit / 100)
  const totalAvantTaxes = subtotalAvantProfit + profit
  const tps = totalAvantTaxes * TAX_RATES.TPS
  const tvq = totalAvantTaxes * TAX_RATES.TVQ
  const grandTotal = totalAvantTaxes + tps + tvq

  const formatCurrency = (value: number) => value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne 1: Résumé des coûts directs */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={20} />
            Résumé des coûts directs
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                <span className="font-medium">Matériaux</span>
                <span className="text-sm text-gray-500">({materialItems.length} items)</span>
              </div>
              <span className="font-bold text-blue-700">{formatCurrency(totalMaterials)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <HardHat size={18} className="text-red-600" />
                <span className="font-medium">Main-d'œuvre CCQ</span>
                <span className="text-sm text-gray-500">({laborItems.length} items)</span>
              </div>
              <span className="font-bold text-red-700">{formatCurrency(totalLabor)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-purple-600" />
                <span className="font-medium">Équipements</span>
                <span className="text-sm text-gray-500">({equipmentItems.length} items)</span>
              </div>
              <span className="font-bold text-purple-700">{formatCurrency(totalEquipment)}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-cyan-600" />
                <span className="font-medium">Sous-traitants</span>
                <span className="text-sm text-gray-500">({subcontractorItems.length} items)</span>
              </div>
              <span className="font-bold text-cyan-700">{formatCurrency(totalSubcontractors)}</span>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Total coûts directs</span>
                <span className="font-bold text-gray-900">{formatCurrency(directCosts)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aide mémoire */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-bold text-amber-800 mb-2">💡 Aide-mémoire</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li><strong>Frais généraux:</strong> Supervision, bureau de chantier, assurances, permis</li>
            <li><strong>Contingence:</strong> Imprévus, variations de prix, ajustements</li>
            <li><strong>Administration:</strong> Gestion, comptabilité, ressources humaines</li>
            <li><strong>Profit:</strong> Marge bénéficiaire de l'entreprise</li>
          </ul>
        </div>
      </div>

      {/* Colonne 2: Calcul final */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator size={20} />
            Majorations
          </h3>

          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Frais généraux</span>
                <span className="text-gray-500">{formatCurrency(fraisGeneraux)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={percentages.fraisGeneraux}
                  onChange={(e) => setPercentages({...percentages, fraisGeneraux: parseFloat(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{percentages.fraisGeneraux}%</span>
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Contingence</span>
                <span className="text-gray-500">{formatCurrency(contingence)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={percentages.contingence}
                  onChange={(e) => setPercentages({...percentages, contingence: parseFloat(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{percentages.contingence}%</span>
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Administration</span>
                <span className="text-gray-500">{formatCurrency(administration)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={percentages.administration}
                  onChange={(e) => setPercentages({...percentages, administration: parseFloat(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{percentages.administration}%</span>
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>Profit</span>
                <span className="text-gray-500">{formatCurrency(profit)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={percentages.profit}
                  onChange={(e) => setPercentages({...percentages, profit: parseFloat(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-16 text-right font-medium">{percentages.profit}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total final */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Prix de soumission
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-80">Coûts directs</span>
              <span>{formatCurrency(directCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">+ Frais généraux ({percentages.fraisGeneraux}%)</span>
              <span>{formatCurrency(fraisGeneraux)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">+ Contingence ({percentages.contingence}%)</span>
              <span>{formatCurrency(contingence)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">+ Administration ({percentages.administration}%)</span>
              <span>{formatCurrency(administration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">+ Profit ({percentages.profit}%)</span>
              <span>{formatCurrency(profit)}</span>
            </div>
            <div className="border-t border-white/30 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="opacity-80">Sous-total</span>
                <span>{formatCurrency(totalAvantTaxes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">TPS (5%)</span>
                <span>{formatCurrency(tps)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">TVQ (9.975%)</span>
                <span>{formatCurrency(tvq)}</span>
              </div>
            </div>
            <div className="border-t border-white/30 pt-3 mt-3">
              <div className="flex justify-between text-xl font-bold">
                <span>TOTAL</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ONGLET 3: APERÇU PDF
// ============================================================================

function AperçuTab({ projectId, items, project }: { projectId: string; items: any[]; project: any }) {
  const materialItems = items.filter(i => !['Main-d\'œuvre CCQ', 'Équipements', 'Sous-traitants'].includes(i.category))
  const laborItems = items.filter(i => i.category === 'Main-d\'œuvre CCQ')
  
  const totalMaterials = materialItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalLabor = laborItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const directCosts = totalMaterials + totalLabor

  // Pourcentages par défaut
  const fraisGeneraux = directCosts * 0.10
  const contingence = directCosts * 0.05
  const administration = (directCosts + fraisGeneraux + contingence) * 0.05
  const profit = (directCosts + fraisGeneraux + contingence + administration) * 0.15
  const totalAvantTaxes = directCosts + fraisGeneraux + contingence + administration + profit
  const tps = totalAvantTaxes * TAX_RATES.TPS
  const tvq = totalAvantTaxes * TAX_RATES.TVQ
  const grandTotal = totalAvantTaxes + tps + tvq

  const formatCurrency = (value: number) => value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['Catégorie', 'Description', 'Quantité', 'Unité', 'Prix unitaire', 'Total'],
      ...items.map(item => [
        item.category,
        item.item_name,
        item.quantity,
        item.unit,
        item.unit_price || '',
        item.total_price || ''
      ]),
      [],
      ['', '', '', '', 'Coûts directs', directCosts],
      ['', '', '', '', 'Frais généraux (10%)', fraisGeneraux],
      ['', '', '', '', 'Contingence (5%)', contingence],
      ['', '', '', '', 'Administration (5%)', administration],
      ['', '', '', '', 'Profit (15%)', profit],
      ['', '', '', '', 'TPS (5%)', tps],
      ['', '', '', '', 'TVQ (9.975%)', tvq],
      ['', '', '', '', 'GRAND TOTAL', grandTotal]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estimation-${project?.name || projectId}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={handleExportCSV} className="btn btn-secondary">
          <Download size={16} className="mr-2" /> Exporter CSV
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} className="mr-2" /> Imprimer / PDF
        </button>
      </div>

      {/* Aperçu du document */}
      <div className="bg-white rounded-lg shadow p-8 print:shadow-none" id="estimation-preview">
        {/* En-tête */}
        <div className="border-b-2 border-teal-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-teal-700">DAST Solutions</h1>
              <p className="text-gray-600">Estimation de construction</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">ESTIMATION</p>
              <p className="text-gray-600">Date: {new Date().toLocaleDateString('fr-CA')}</p>
            </div>
          </div>
        </div>

        {/* Projet */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Projet</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-lg">{project?.name || 'Sans nom'}</p>
            {project?.address && <p className="text-gray-600">{project.address}</p>}
            {project?.description && <p className="text-gray-600 mt-2">{project.description}</p>}
          </div>
        </div>

        {/* Tableau des items */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Détail des travaux</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-right w-24">Quantité</th>
                <th className="border p-2 text-right w-32">Prix unit.</th>
                <th className="border p-2 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border p-2">
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </td>
                  <td className="border p-2 text-right">{item.quantity} {item.unit}</td>
                  <td className="border p-2 text-right">{item.unit_price ? formatCurrency(item.unit_price) : '-'}</td>
                  <td className="border p-2 text-right font-medium">{item.total_price ? formatCurrency(item.total_price) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Récapitulatif */}
        <div className="flex justify-end">
          <div className="w-80">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="p-2 text-right">Coûts directs:</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(directCosts)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">Frais généraux (10%):</td>
                  <td className="p-2 text-right">{formatCurrency(fraisGeneraux)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">Contingence (5%):</td>
                  <td className="p-2 text-right">{formatCurrency(contingence)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">Administration (5%):</td>
                  <td className="p-2 text-right">{formatCurrency(administration)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">Profit (15%):</td>
                  <td className="p-2 text-right">{formatCurrency(profit)}</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 text-right">Sous-total:</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(totalAvantTaxes)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">TPS (5%):</td>
                  <td className="p-2 text-right">{formatCurrency(tps)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-right">TVQ (9.975%):</td>
                  <td className="p-2 text-right">{formatCurrency(tvq)}</td>
                </tr>
                <tr className="bg-teal-50 font-bold text-lg">
                  <td className="p-3 text-right">TOTAL:</td>
                  <td className="p-3 text-right text-teal-700">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>Cette estimation est valide pour 30 jours.</p>
          <p>DAST Solutions - Construction Management Platform</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL: EstimationModule avec onglets
// ============================================================================

function EstimationModule({ projectId }: { projectId: string }) {
  const { items, loading } = useTakeoff(projectId)
  const { projects } = useProjects()
  const project = projects.find(p => p.id === projectId)
  
  const [activeTab, setActiveTab] = useState<'takeoff' | 'soumission' | 'apercu'>('takeoff')

  // Calculs pour le résumé
  const materialItems = items.filter(i => !['Main-d\'œuvre CCQ', 'Équipements', 'Sous-traitants'].includes(i.category))
  const laborItems = items.filter(i => i.category === 'Main-d\'œuvre CCQ')
  const totalMaterials = materialItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalLabor = laborItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const totalCost = totalMaterials + totalLabor

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
  }

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title={project?.name || 'Estimation'} 
        subtitle="Takeoff, Soumission et Export" 
      />

      {/* Résumé rapide */}
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
            <Wrench className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Matériaux</p>
            <p className="text-lg font-bold text-blue-600">{totalMaterials.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <HardHat className="text-red-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Main-d'œuvre</p>
            <p className="text-lg font-bold text-red-600">{totalLabor.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <DollarSign className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total direct</p>
            <p className="text-xl font-bold text-orange-600">{totalCost.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('takeoff')}
            className={`flex-1 py-4 px-6 text-center font-medium transition ${
              activeTab === 'takeoff'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ClipboardList size={20} className="inline mr-2" />
            1. Takeoff
          </button>
          <button
            onClick={() => setActiveTab('soumission')}
            className={`flex-1 py-4 px-6 text-center font-medium transition ${
              activeTab === 'soumission'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calculator size={20} className="inline mr-2" />
            2. Soumission
          </button>
          <button
            onClick={() => setActiveTab('apercu')}
            className={`flex-1 py-4 px-6 text-center font-medium transition ${
              activeTab === 'apercu'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Eye size={20} className="inline mr-2" />
            3. Aperçu PDF
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'takeoff' && <TakeoffTab projectId={projectId} />}
      {activeTab === 'soumission' && <SoumissionTab projectId={projectId} items={items} />}
      {activeTab === 'apercu' && <AperçuTab projectId={projectId} items={items} project={project} />}
    </div>
  )
}

// ============================================================================
// EXPORT PRINCIPAL
// ============================================================================

export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return <ProjectSelector />
  }

  return <EstimationModule projectId={projectId} />
}