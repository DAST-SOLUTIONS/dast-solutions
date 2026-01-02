/**
 * DAST Solutions - Estimation de Projet (Style ProEst)
 * Onglets: Documents, Estimate, Takeoff, Sort Types, Tasks, Bid Leveling, Summary
 */
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Filter, ChevronDown, ChevronRight, Edit2, Trash2,
  X, Save, Loader2, FileText, Calculator, Ruler, ListChecks, Scale,
  BarChart3, DollarSign, Percent, MoreVertical, Copy, Package,
  Download, Upload, ChevronLeft, Settings, Layers, Eye, GripVertical
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Project {
  id: string
  name: string
  status: string
  budget?: number
}

interface Estimate {
  id: string
  project_id: string
  name: string
  version: number
  status: string
  project_type: string | null
  total_material: number
  total_labor: number
  total_equipment: number
  total_subcontractor: number
  total_other: number
  subtotal: number
  overhead_percent: number
  overhead_amount: number
  profit_percent: number
  profit_amount: number
  contingency_percent: number
  contingency_amount: number
  grand_total: number
}

interface EstimateItem {
  id: string
  estimate_id: string
  code: string | null
  description: string
  quantity: number
  unit: string
  material_unit_cost: number
  labor_unit_cost: number
  equipment_unit_cost: number
  subcontractor_unit_cost: number
  other_unit_cost: number
  material_total: number
  labor_total: number
  equipment_total: number
  subcontractor_total: number
  other_total: number
  line_total: number
  division_code: string | null
  sort_order: number
  notes: string | null
}

interface CostItem {
  id: string
  full_code: string
  description: string
  unit: string
  unit_cost: number
  material_cost: number
  labor_cost: number
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TABS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'estimate', label: 'Estimation', icon: Calculator },
  { id: 'takeoff', label: 'Takeoff', icon: Ruler },
  { id: 'sort', label: 'Tri', icon: ListChecks },
  { id: 'tasks', label: 'Tâches', icon: ListChecks },
  { id: 'bid', label: 'Bid Leveling', icon: Scale },
  { id: 'summary', label: 'Sommaire', icon: BarChart3 },
]

const UNITS = ['U', 'Pi', 'Pi2', 'Pi3', 'M', 'M2', 'M3', 'V3', 'Kg', 'T', 'Hr', 'Jr', 'Forfait']

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function EstimationPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const [project, setProject] = useState<Project | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [items, setItems] = useState<EstimateItem[]>([])
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('estimate')
  
  // Filtres
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<'none' | 'division'>('none')
  const [filterBy, setFilterBy] = useState<string>('all')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null)
  const [showMarginsModal, setShowMarginsModal] = useState(false)

  // Charger les données
  useEffect(() => {
    if (!projectId) return
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Projet
      const { data: projData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      setProject(projData)

      // Estimation (créer si n'existe pas)
      let { data: estData } = await supabase
        .from('estimates')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (!estData) {
        const { data: newEst } = await supabase
          .from('estimates')
          .insert({ project_id: projectId, name: 'Estimation principale' })
          .select()
          .single()
        estData = newEst
      }
      setEstimate(estData)

      // Items de l'estimation
      if (estData) {
        const { data: itemsData } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', estData.id)
          .order('sort_order')
        setItems(itemsData || [])
      }

      // Base de données de coûts (pour picker)
      const { data: costData } = await supabase
        .from('cost_items')
        .select('id, full_code, description, unit, unit_cost, material_cost, labor_cost')
        .eq('is_active', true)
        .order('full_code')
        .limit(500)
      setCostItems(costData || [])

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les items
  const filteredItems = useMemo(() => {
    let result = items
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(item =>
        item.code?.toLowerCase().includes(s) ||
        item.description.toLowerCase().includes(s)
      )
    }
    if (filterBy !== 'all') {
      result = result.filter(item => item.division_code === filterBy)
    }
    return result
  }, [items, search, filterBy])

  // Grouper par division
  const groupedItems = useMemo(() => {
    if (groupBy !== 'division') return { '': filteredItems }
    const groups: Record<string, EstimateItem[]> = {}
    filteredItems.forEach(item => {
      const key = item.division_code || 'Autres'
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  }, [filteredItems, groupBy])

  // Ajouter un item
  const addItem = async (costItem: CostItem) => {
    if (!estimate) return
    try {
      await supabase.from('estimate_items').insert({
        estimate_id: estimate.id,
        cost_item_id: costItem.id,
        code: costItem.full_code,
        description: costItem.description,
        quantity: 1,
        unit: costItem.unit,
        material_unit_cost: costItem.material_cost,
        labor_unit_cost: costItem.labor_cost,
        division_code: costItem.full_code.split('.')[0],
        sort_order: items.length
      })
      await loadData()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  // Supprimer un item
  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cette ligne?')) return
    try {
      await supabase.from('estimate_items').delete().eq('id', id)
      await loadData()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  // Mettre à jour un item
  const updateItem = async (id: string, updates: Partial<EstimateItem>) => {
    try {
      await supabase.from('estimate_items').update(updates).eq('id', id)
      await loadData()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  // Formatter monnaie
  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  if (!project || !estimate) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Projet non trouvé</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header avec fond image */}
      <div 
        className="bg-gradient-to-r from-slate-700 to-slate-800 text-white relative"
        style={{
          backgroundImage: 'url(/construction-bg.jpg)',
          backgroundSize: 'cover',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/project/${projectId}`)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-white/60">{project.name}</p>
                <h1 className="text-xl font-bold">Estimation</h1>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-sm text-white/60">Total estimé</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(estimate.grand_total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Statut</p>
                <span className="px-2 py-1 bg-green-500 text-white text-sm rounded">
                  {estimate.status === 'active' ? 'Actif' : estimate.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-white/60">Type</p>
                <p className="text-sm">{estimate.project_type || project.name}</p>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 mt-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'takeoff') {
                    navigate(`/takeoff/${projectId}`)
                  } else {
                    setActiveTab(tab.id)
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-800'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'estimate' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barre d'outils */}
          <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Recherche */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg w-64"
                />
              </div>

              {/* Filtre */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filtrer:</span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-2 py-1.5 text-sm border rounded-lg"
                >
                  <option value="all">Tous</option>
                  <option value="03">03 - Béton</option>
                  <option value="04">04 - Maçonnerie</option>
                  <option value="05">05 - Métaux</option>
                  <option value="09">09 - Finitions</option>
                  <option value="26">26 - Électricité</option>
                </select>
              </div>

              {/* Grouper */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Grouper:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="px-2 py-1.5 text-sm border rounded-lg"
                >
                  <option value="none">Aucun</option>
                  <option value="division">Par division</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMarginsModal(true)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Percent size={14} /> Marges
              </button>
              <button className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download size={14} /> Exporter
              </button>
            </div>
          </div>

          {/* Tableau */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-2 py-3 w-8"></th>
                  <th className="px-3 py-3 w-32">Code</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3 w-24 text-right">Quantité</th>
                  <th className="px-3 py-3 w-20">Unité</th>
                  <th className="px-3 py-3 w-28 text-right">Coût Mat.</th>
                  <th className="px-3 py-3 w-28 text-right">Coût M-O</th>
                  <th className="px-3 py-3 w-28 text-right">Coût S-T</th>
                  <th className="px-3 py-3 w-32 text-right bg-gray-100">Total</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {/* Ligne "Add New Item" */}
                <tr className="hover:bg-gray-50">
                  <td className="px-2 py-2"></td>
                  <td colSpan={9} className="px-3 py-2">
                    <button
                      onClick={() => setShowItemPicker(true)}
                      className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Ajouter un item
                      <ChevronDown size={14} className="ml-2" />
                    </button>
                  </td>
                </tr>

                {/* Items */}
                {Object.entries(groupedItems).map(([group, groupItems]) => (
                  <>
                    {groupBy === 'division' && group && (
                      <tr className="bg-slate-100">
                        <td colSpan={10} className="px-3 py-2 font-semibold text-slate-700">
                          {group} - {getDivisionName(group)}
                        </td>
                      </tr>
                    )}
                    {groupItems.map((item, idx) => (
                      <EstimateItemRow
                        key={item.id}
                        item={item}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                        onDelete={() => deleteItem(item.id)}
                        onEdit={() => setEditingItem(item)}
                      />
                    ))}
                  </>
                ))}
              </tbody>
            </table>

            {items.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Calculator className="mx-auto mb-4 text-gray-300" size={48} />
                <p className="font-medium">Aucun item dans cette estimation</p>
                <p className="text-sm">Cliquez sur "Ajouter un item" pour commencer</p>
              </div>
            )}
          </div>

          {/* Footer totaux */}
          <div className="bg-white border-t px-4 py-3">
            <div className="flex justify-end gap-8 text-sm">
              <div>
                <span className="text-gray-500">Matériaux:</span>
                <span className="font-medium ml-2">{formatCurrency(estimate.total_material)}</span>
              </div>
              <div>
                <span className="text-gray-500">Main-d'œuvre:</span>
                <span className="font-medium ml-2">{formatCurrency(estimate.total_labor)}</span>
              </div>
              <div>
                <span className="text-gray-500">Sous-traitants:</span>
                <span className="font-medium ml-2">{formatCurrency(estimate.total_subcontractor)}</span>
              </div>
              <div className="border-l pl-4">
                <span className="text-gray-500">Sous-total:</span>
                <span className="font-bold ml-2">{formatCurrency(estimate.subtotal)}</span>
              </div>
              <div className="border-l pl-4">
                <span className="text-gray-500">Grand total:</span>
                <span className="font-bold text-lg text-green-600 ml-2">{formatCurrency(estimate.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autres onglets */}
      {activeTab === 'documents' && <DocumentsTab projectId={projectId!} />}
      {activeTab === 'sort' && <SortTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'bid' && <BidLevelingTab />}
      {activeTab === 'summary' && <SummaryTab estimate={estimate} />}

      {/* Modal Item Picker */}
      {showItemPicker && (
        <ItemPickerModal
          costItems={costItems}
          onSelect={(item) => { addItem(item); setShowItemPicker(false) }}
          onClose={() => setShowItemPicker(false)}
        />
      )}

      {/* Modal Marges */}
      {showMarginsModal && estimate && (
        <MarginsModal
          estimate={estimate}
          onClose={() => setShowMarginsModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  )
}

// ============================================================================
// COMPOSANT: Ligne d'item
// ============================================================================

function EstimateItemRow({
  item,
  onUpdate,
  onDelete,
  onEdit
}: {
  item: EstimateItem
  onUpdate: (updates: Partial<EstimateItem>) => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [editing, setEditing] = useState(false)

  const handleQuantityBlur = () => {
    const newQty = parseFloat(quantity) || 0
    if (newQty !== item.quantity) {
      onUpdate({ quantity: newQty })
    }
    setEditing(false)
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <tr className="hover:bg-blue-50/50 group">
      <td className="px-2 py-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <GripVertical size={14} className="text-gray-400 cursor-move" />
        </div>
      </td>
      <td className="px-3 py-2">
        <span className="font-mono text-sm text-teal-600">{item.code || '-'}</span>
      </td>
      <td className="px-3 py-2">
        <span className="text-sm">{item.description}</span>
      </td>
      <td className="px-3 py-2 text-right">
        {editing ? (
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={handleQuantityBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleQuantityBlur()}
            autoFocus
            className="w-20 px-2 py-1 text-sm text-right border rounded"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
          >
            {item.quantity.toLocaleString('fr-CA')}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-gray-500">{item.unit}</td>
      <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(item.material_total)}</td>
      <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(item.labor_total)}</td>
      <td className="px-3 py-2 text-right font-mono text-sm">{formatCurrency(item.subcontractor_total)}</td>
      <td className="px-3 py-2 text-right font-mono text-sm font-semibold bg-gray-50">
        {formatCurrency(item.line_total)}
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================================
// COMPOSANT: Modal Item Picker
// ============================================================================

function ItemPickerModal({
  costItems,
  onSelect,
  onClose
}: {
  costItems: CostItem[]
  onSelect: (item: CostItem) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = costItems.filter(item => {
    if (!search) return true
    const s = search.toLowerCase()
    return item.full_code.toLowerCase().includes(s) ||
           item.description.toLowerCase().includes(s)
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Sélectionner un item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par code ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="mx-auto mb-2 text-gray-300" size={40} />
              <p>Aucun item trouvé</p>
              <p className="text-sm mt-1">
                <Link to="/database" className="text-teal-600 hover:underline">
                  Ajouter des items à la base de données
                </Link>
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Unité</th>
                  <th className="px-4 py-2 text-right">Coût</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 100).map(item => (
                  <tr
                    key={item.id}
                    className="hover:bg-teal-50 cursor-pointer"
                    onClick={() => onSelect(item)}
                  >
                    <td className="px-4 py-2 font-mono text-sm text-teal-600">{item.full_code}</td>
                    <td className="px-4 py-2 text-sm">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                    <td className="px-4 py-2 text-sm text-right font-mono">${item.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT: Modal Marges
// ============================================================================

function MarginsModal({
  estimate,
  onClose,
  onSave
}: {
  estimate: Estimate
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    overhead_percent: estimate.overhead_percent.toString(),
    profit_percent: estimate.profit_percent.toString(),
    contingency_percent: estimate.contingency_percent.toString()
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('estimates').update({
        overhead_percent: parseFloat(form.overhead_percent) || 0,
        profit_percent: parseFloat(form.profit_percent) || 0,
        contingency_percent: parseFloat(form.contingency_percent) || 0
      }).eq('id', estimate.id)
      onSave()
      onClose()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const subtotal = estimate.subtotal
  const overhead = subtotal * (parseFloat(form.overhead_percent) || 0) / 100
  const profit = subtotal * (parseFloat(form.profit_percent) || 0) / 100
  const contingency = subtotal * (parseFloat(form.contingency_percent) || 0) / 100
  const total = subtotal + overhead + profit + contingency

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Marges et ajustements</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Sous-total</span>
            <span className="font-semibold">${subtotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 text-sm text-gray-600">Frais généraux</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                value={form.overhead_percent}
                onChange={(e) => setForm({ ...form, overhead_percent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg pr-8"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <span className="w-28 text-right text-sm">${overhead.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 text-sm text-gray-600">Profit</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                value={form.profit_percent}
                onChange={(e) => setForm({ ...form, profit_percent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg pr-8"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <span className="w-28 text-right text-sm">${profit.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 text-sm text-gray-600">Contingence</label>
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                value={form.contingency_percent}
                onChange={(e) => setForm({ ...form, contingency_percent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg pr-8"
              />
              <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <span className="w-28 text-right text-sm">${contingency.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t bg-green-50 -mx-6 px-6 mt-4">
            <span className="font-semibold text-green-800">Grand Total</span>
            <span className="text-xl font-bold text-green-600">${total.toLocaleString('fr-CA', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANTS: Autres onglets (placeholders)
// ============================================================================

function DocumentsTab({ projectId }: { projectId: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <FileText className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Documents du projet</h2>
        <p className="text-gray-500">Plans, spécifications et documents liés</p>
        <Link
          to={`/project/${projectId}/documents`}
          className="mt-4 inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Gérer les documents
        </Link>
      </div>
    </div>
  )
}

function SortTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <ListChecks className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Types de tri</h2>
        <p className="text-gray-500 mb-2">Organisez votre estimation par catégories personnalisées</p>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">En développement</span>
      </div>
    </div>
  )
}

function TasksTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <ListChecks className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Tâches</h2>
        <p className="text-gray-500 mb-2">Suivez les tâches liées à cette estimation</p>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">En développement</span>
      </div>
    </div>
  )
}

function BidLevelingTab() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Scale className="mx-auto mb-4 text-gray-300" size={48} />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Bid Leveling</h2>
        <p className="text-gray-500 mb-2">Comparez les soumissions des sous-traitants</p>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">En développement</span>
      </div>
    </div>
  )
}

function SummaryTab({ estimate }: { estimate: Estimate }) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })

  const data = [
    { label: 'Matériaux', value: estimate.total_material, color: 'bg-blue-500' },
    { label: 'Main-d\'œuvre', value: estimate.total_labor, color: 'bg-green-500' },
    { label: 'Équipement', value: estimate.total_equipment, color: 'bg-purple-500' },
    { label: 'Sous-traitants', value: estimate.total_subcontractor, color: 'bg-amber-500' },
    { label: 'Autres', value: estimate.total_other, color: 'bg-gray-500' },
  ]

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Sommaire de l'estimation</h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Répartition des coûts */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Répartition des coûts</h3>
            <div className="space-y-3">
              {data.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Totaux</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Sous-total direct</span>
                <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Frais généraux ({estimate.overhead_percent}%)</span>
                <span>{formatCurrency(estimate.overhead_amount)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Profit ({estimate.profit_percent}%)</span>
                <span>{formatCurrency(estimate.profit_amount)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Contingence ({estimate.contingency_percent}%)</span>
                <span>{formatCurrency(estimate.contingency_amount)}</span>
              </div>
              <div className="flex justify-between py-3 bg-green-50 -mx-6 px-6 mt-4 rounded">
                <span className="font-bold text-green-800">GRAND TOTAL</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(estimate.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function getDivisionName(code: string): string {
  const names: Record<string, string> = {
    '01': 'Exigences générales',
    '02': 'Conditions existantes',
    '03': 'Béton',
    '04': 'Maçonnerie',
    '05': 'Métaux',
    '06': 'Bois, plastiques',
    '07': 'Protection thermique',
    '08': 'Ouvertures',
    '09': 'Finitions',
    '10': 'Spécialités',
    '21': 'Protection incendie',
    '22': 'Plomberie',
    '23': 'CVCA',
    '26': 'Électricité',
    '31': 'Terrassement',
    '32': 'Aménagement ext.',
    '33': 'Services publics',
  }
  return names[code] || ''
}
