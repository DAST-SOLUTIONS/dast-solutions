import { PageTitle } from '@/components/PageTitle'
import { useParams, useNavigate } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useProjects } from '@/hooks/useProjects'
import { useState, useRef } from 'react'
import { Upload, FileText, Plus, Download, DollarSign, Layers, Save, FolderOpen, X, MapPin, Calendar, Building } from 'lucide-react'

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

// Types de projets
const PROJECT_TYPES = [
  'Résidentiel',
  'Commercial',
  'Institutionnel',
  'Industriel',
  'Multi-résidentiel',
  'Rénovation',
  'Agrandissement',
  'Génie civil',
  'Infrastructure',
  'Autre'
]

// Provinces canadiennes
const PROVINCES = [
  { code: 'QC', name: 'Québec' },
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'Colombie-Britannique' },
  { code: 'AB', name: 'Alberta' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nouvelle-Écosse' },
  { code: 'NB', name: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
  { code: 'PE', name: 'Île-du-Prince-Édouard' },
  { code: 'NT', name: 'Territoires du Nord-Ouest' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NU', name: 'Nunavut' }
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

// Composant pour sélectionner un projet
function ProjectSelector() {
  const { projects, loading, createProject } = useProjects()
  const navigate = useNavigate()
  const [showNewProject, setShowNewProject] = useState(false)
  const [creating, setCreating] = useState(false)
  const [geolocating, setGeolocating] = useState(false)
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client: '',
    projectType: 'Résidentiel',
    projectNumber: '',
    street: '',
    city: '',
    province: 'QC',
    postalCode: '',
    country: 'Canada',
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: '',
    projectValue: ''
  })

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewProject(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }))
        setGeolocating(false)
      },
      (error) => {
        alert('Erreur de géolocalisation: ' + error.message)
        setGeolocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('Veuillez entrer un nom de projet')
      return
    }

    try {
      setCreating(true)
      
      const fullAddress = [
        newProject.street,
        newProject.city,
        newProject.province,
        newProject.postalCode,
        newProject.country
      ].filter(Boolean).join(', ')

      const addressWithGeo = newProject.latitude && newProject.longitude
        ? `${fullAddress} [${newProject.latitude}, ${newProject.longitude}]`
        : fullAddress

      const project = await createProject(
        newProject.name,
        newProject.description || undefined,
        newProject.projectType,
        newProject.client || undefined,
        newProject.projectNumber || undefined,
        addressWithGeo || undefined,
        newProject.startDate || undefined,
        newProject.endDate || undefined,
        newProject.projectValue ? parseFloat(newProject.projectValue) : undefined
      )
      
      if (project?.id) {
        navigate(`/projets/${project.id}/estimation`)
      }
    } catch (err) {
      alert('Erreur lors de la création du projet')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setNewProject({
      name: '',
      description: '',
      client: '',
      projectType: 'Résidentiel',
      projectNumber: '',
      street: '',
      city: '',
      province: 'QC',
      postalCode: '',
      country: 'Canada',
      latitude: '',
      longitude: '',
      startDate: '',
      endDate: '',
      projectValue: ''
    })
    setShowNewProject(false)
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
      <PageTitle title="Estimation - Takeoff" subtitle="Sélectionnez un projet pour commencer" />

      <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FolderOpen size={64} className="mx-auto mb-4 text-teal-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisir un projet</h2>
          <p className="text-gray-600 mb-4">Sélectionnez le projet pour lequel vous souhaitez faire un relevé de quantités</p>
          
          <button
            onClick={() => setShowNewProject(true)}
            className="btn btn-primary"
          >
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

      {/* Modal Nouveau Projet - FORMULAIRE COMPLET */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nouveau projet</h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              
              {/* Section: Informations générales */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building size={16} />
                  Informations générales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Ex: Résidence Tremblay"
                      className="input-field"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de projet</label>
                    <input
                      type="text"
                      value={newProject.projectNumber}
                      onChange={(e) => setNewProject({...newProject, projectNumber: e.target.value})}
                      placeholder="Ex: PRJ-2024-001"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
                    <select
                      value={newProject.projectType}
                      onChange={(e) => setNewProject({...newProject, projectType: e.target.value})}
                      className="input-field"
                    >
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input
                      type="text"
                      value={newProject.client}
                      onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                      placeholder="Ex: Jean Tremblay"
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Ex: Construction maison unifamiliale 2 étages, 3 chambres, garage double"
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Adresse */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Adresse du projet
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (rue et numéro)</label>
                    <input
                      type="text"
                      value={newProject.street}
                      onChange={(e) => setNewProject({...newProject, street: e.target.value})}
                      placeholder="Ex: 123 Rue Principale"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                    <input
                      type="text"
                      value={newProject.city}
                      onChange={(e) => setNewProject({...newProject, city: e.target.value})}
                      placeholder="Ex: Montréal"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <select
                      value={newProject.province}
                      onChange={(e) => setNewProject({...newProject, province: e.target.value})}
                      className="input-field"
                    >
                      {PROVINCES.map(prov => (
                        <option key={prov.code} value={prov.code}>{prov.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                    <input
                      type="text"
                      value={newProject.postalCode}
                      onChange={(e) => setNewProject({...newProject, postalCode: e.target.value.toUpperCase()})}
                      placeholder="Ex: H2X 1Y4"
                      className="input-field"
                      maxLength={7}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                    <input
                      type="text"
                      value={newProject.country}
                      onChange={(e) => setNewProject({...newProject, country: e.target.value})}
                      placeholder="Canada"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Géolocalisation */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Géolocalisation</span>
                    <button
                      type="button"
                      onClick={getGeolocation}
                      disabled={geolocating}
                      className="btn btn-secondary text-sm py-1 px-3"
                    >
                      <MapPin size={14} className="mr-1" />
                      {geolocating ? 'Localisation...' : 'Obtenir ma position'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={newProject.latitude}
                        onChange={(e) => setNewProject({...newProject, latitude: e.target.value})}
                        placeholder="Ex: 45.508888"
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={newProject.longitude}
                        onChange={(e) => setNewProject({...newProject, longitude: e.target.value})}
                        placeholder="Ex: -73.561668"
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dates et Budget */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Dates et Budget
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
                    <input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur estimée ($)</label>
                    <input
                      type="number"
                      value={newProject.projectValue}
                      onChange={(e) => setNewProject({...newProject, projectValue: e.target.value})}
                      placeholder="Ex: 500000"
                      className="input-field"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-6 mt-6 border-t">
              <button
                onClick={resetForm}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating}
                className="btn btn-primary flex-1"
              >
                {creating ? 'Création...' : 'Créer et commencer le takeoff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant principal du Takeoff
function TakeoffModule({ projectId }: { projectId: string }) {
  const { documents, items, loading, uploadDocument, createMeasurement, createItem } = useTakeoff(projectId)
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

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Items ({items.length})</h3>
              {items.length > 0 && (
                <button onClick={exportToCSV} className="text-teal-600 hover:text-teal-700" title="Exporter CSV">
                  <Download size={18} />
                </button>
              )}
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

// Composant principal avec logique de routage
export function ProjetsEstimation() {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return <ProjectSelector />
  }

  return <TakeoffModule projectId={projectId} />
}