import { PageTitle } from '@/components/PageTitle'
import { useParams, useNavigate } from 'react-router-dom'
import { useTakeoff } from '@/hooks/takeoff/useTakeoff'
import { useProjects } from '@/hooks/useProjects'
import { useCCQRates } from '@/hooks/ccq/useCCQRates'
import { useState, useRef, useCallback } from 'react'
import { 
  Upload, FileText, Plus, Download, DollarSign, Layers, Save, FolderOpen, 
  Trash2, Edit2, Copy, X, Check, Users, Wrench, HardHat, Calculator,
  FileCheck, Percent, Building, Truck, ClipboardList, Eye, Printer
} from 'lucide-react'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import { CCQ_CONSTANTS } from '@/types/ccq-types'
// ✅ NOUVEAU: Import du module Takeoff avec OCR
import { TakeoffViewer } from '@/components/Takeoff'
import type { Measurement } from '@/types/takeoff-measure-types'

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

// ============================================================================
// ONGLET 1: TAKEOFF (Relevé de quantités) - NOUVEAU avec OCR et mesures visuelles
// ============================================================================

function TakeoffTab({ projectId }: { projectId: string }) {
  const { items, createItem, loading } = useTakeoff(projectId)
  const { trades, sectors, getRate, loading: ccqLoading } = useCCQRates()
  
  // État pour les mesures du TakeoffViewer
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [showCCQPanel, setShowCCQPanel] = useState(false)
  
  // État pour ajout main-d'œuvre CCQ
  const [laborItem, setLaborItem] = useState({
    tradeCode: '',
    sectorCode: 'RES_LEGER',
    hours: '',
    workers: '1',
    description: ''
  })

  // Callback quand les mesures changent dans TakeoffViewer
  const handleMeasurementsChange = useCallback((newMeasurements: Measurement[]) => {
    setMeasurements(newMeasurements)
  }, [])

  // Exporter les mesures vers les items d'estimation
  const handleExportToEstimation = useCallback(async () => {
    if (measurements.length === 0) {
      alert('Aucune mesure à exporter')
      return
    }

    try {
      for (const m of measurements) {
        await createItem({
          category: m.category || 'Autre',
          item_name: m.label || `Mesure ${m.type}`,
          quantity: m.value,
          unit: m.unit,
          unit_price: 0,
          total_price: 0
        })
      }
      alert(`${measurements.length} mesures exportées vers l'estimation!`)
    } catch (err) {
      console.error('Erreur export:', err)
      alert('Erreur lors de l\'export')
    }
  }, [measurements, createItem])

  // Ajouter main-d'œuvre CCQ
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
      alert('Main-d\'œuvre ajoutée!')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'ajout de la main-d\'œuvre')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-gray-900">
            📐 Takeoff - Relevé de quantités
          </h3>
          <span className="text-sm text-gray-500">
            {measurements.length} mesure(s) | {items.length} item(s)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCCQPanel(!showCCQPanel)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showCCQPanel ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <HardHat size={16} />
            {showCCQPanel ? 'Masquer CCQ' : 'Main-d\'œuvre CCQ'}
          </button>
          {measurements.length > 0 && (
            <button
              onClick={handleExportToEstimation}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Download size={16} />
              Exporter vers Estimation ({measurements.length})
            </button>
          )}
        </div>
      </div>

      {/* Panneau CCQ (optionnel) */}
      {showCCQPanel && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HardHat size={18} className="text-red-600" />
            Ajouter Main-d'œuvre CCQ
          </h3>
          
          {ccqLoading ? (
            <p className="text-sm text-gray-500">Chargement des taux CCQ...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Métier *</label>
                <select
                  value={laborItem.tradeCode}
                  onChange={(e) => setLaborItem({...laborItem, tradeCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {trades.map(trade => (
                    <option key={trade.code} value={trade.code}>{trade.name_fr}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 block mb-1">Secteur</label>
                <select
                  value={laborItem.sectorCode}
                  onChange={(e) => setLaborItem({...laborItem, sectorCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  {sectors.map(sector => (
                    <option key={sector.code} value={sector.code}>{sector.name_fr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Heures *</label>
                <input
                  type="number"
                  step="0.5"
                  value={laborItem.hours}
                  onChange={(e) => setLaborItem({...laborItem, hours: e.target.value})}
                  placeholder="40"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Travailleurs</label>
                <input
                  type="number"
                  min="1"
                  value={laborItem.workers}
                  onChange={(e) => setLaborItem({...laborItem, workers: e.target.value})}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-end">
                <button 
                  onClick={handleAddLaborItem} 
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TakeoffViewer - Le nouveau composant avec OCR et mesures visuelles */}
      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '600px' }}>
        <TakeoffViewer
          initialMeasurements={measurements}
          onMeasurementsChange={handleMeasurementsChange}
        />
      </div>

      {/* Liste des items existants */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-900 mb-4">📋 Items d'estimation ({items.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Catégorie</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Quantité</th>
                  <th className="text-left p-3">Unité</th>
                  <th className="text-right p-3">Prix unit.</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item: any) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.category}</span>
                    </td>
                    <td className="p-3 font-medium">{item.item_name}</td>
                    <td className="p-3 text-right">{item.quantity?.toFixed(2)}</td>
                    <td className="p-3">{item.unit}</td>
                    <td className="p-3 text-right">{item.unit_price?.toFixed(2)} $</td>
                    <td className="p-3 text-right font-bold">{item.total_price?.toFixed(2)} $</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 10 && (
              <p className="text-center text-sm text-gray-500 py-2">
                ... et {items.length - 10} autres items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
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