/**
 * DAST Solutions - Base de données de coûts (Style ProEst)
 * Onglets: Items, Assemblies, Maintenance, Cost Sources
 */
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, ChevronRight, ChevronDown, Edit2, Trash2, X, Save,
  Loader2, FolderOpen, Package, Layers, Copy, Upload, Download,
  Database, Settings, DollarSign, Calculator, FileSpreadsheet
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface CostItem {
  id: string
  division_code: string
  subdivision_code: string | null
  item_code: string | null
  full_code: string
  description: string
  description_fr: string | null
  unit: string
  unit_cost: number
  material_cost: number
  labor_cost: number
  equipment_cost: number
  labor_hours: number
  source: string | null
  is_active: boolean
}

interface Assembly {
  id: string
  division_code: string
  assembly_code: string
  full_code: string
  name: string
  name_fr: string | null
  description: string | null
  unit: string
  variables: string[]
  default_values: Record<string, number>
  items?: AssemblyItem[]
}

interface AssemblyItem {
  id: string
  cost_item_id: string | null
  custom_code: string | null
  custom_description: string | null
  custom_unit: string | null
  custom_unit_cost: number | null
  quantity_formula: string
  sort_order: number
  cost_item?: CostItem
}

interface Division {
  code: string
  name_en: string
  name_fr: string
}

// ============================================================================
// CONSTANTES
// ============================================================================

const UNITS = [
  { value: 'U', label: 'Unité (U)' },
  { value: 'Pi', label: 'Pied linéaire (Pi)' },
  { value: 'Pi2', label: 'Pied carré (Pi²)' },
  { value: 'Pi3', label: 'Pied cube (Pi³)' },
  { value: 'M', label: 'Mètre (M)' },
  { value: 'M2', label: 'Mètre carré (M²)' },
  { value: 'M3', label: 'Mètre cube (M³)' },
  { value: 'V3', label: 'Verge cube (V³)' },
  { value: 'Kg', label: 'Kilogramme (Kg)' },
  { value: 'T', label: 'Tonne (T)' },
  { value: 'Hr', label: 'Heure (Hr)' },
  { value: 'Jr', label: 'Jour (Jr)' },
  { value: 'Sem', label: 'Semaine (Sem)' },
  { value: 'Forfait', label: 'Forfait' },
]

const TABS = [
  { id: 'items', label: 'Items', icon: Package },
  { id: 'assemblies', label: 'Assemblages', icon: Layers },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'sources', label: 'Sources de coûts', icon: Database },
]

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function CostDatabase() {
  const [activeTab, setActiveTab] = useState('items')
  const [divisions, setDivisions] = useState<Division[]>([])
  const [items, setItems] = useState<CostItem[]>([])
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set())
  const [expandedSubdivisions, setExpandedSubdivisions] = useState<Set<string>>(new Set())

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [showAssemblyModal, setShowAssemblyModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CostItem | null>(null)
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null)

  // Charger les données
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Divisions
      const { data: divData } = await supabase
        .from('cost_divisions')
        .select('*')
        .order('sort_order')
      setDivisions(divData || [])

      // Items
      const { data: itemData } = await supabase
        .from('cost_items')
        .select('*')
        .eq('is_active', true)
        .order('full_code')
      setItems(itemData || [])

      // Assemblages
      const { data: assData } = await supabase
        .from('assemblies')
        .select('*')
        .eq('is_active', true)
        .order('full_code')
      setAssemblies(assData || [])

    } catch (err) {
      console.error('Erreur chargement:', err)
    } finally {
      setLoading(false)
    }
  }

  // Grouper items par division
  const itemsByDivision = useMemo(() => {
    const filtered = items.filter(item => {
      if (!search) return true
      const s = search.toLowerCase()
      return item.full_code.toLowerCase().includes(s) ||
             item.description.toLowerCase().includes(s) ||
             item.description_fr?.toLowerCase().includes(s)
    })

    const grouped: Record<string, Record<string, CostItem[]>> = {}
    filtered.forEach(item => {
      if (!grouped[item.division_code]) grouped[item.division_code] = {}
      const subKey = item.subdivision_code || '0000'
      if (!grouped[item.division_code][subKey]) grouped[item.division_code][subKey] = []
      grouped[item.division_code][subKey].push(item)
    })
    return grouped
  }, [items, search])

  // Grouper assemblages par division
  const assembliesByDivision = useMemo(() => {
    const filtered = assemblies.filter(a => {
      if (!search) return true
      const s = search.toLowerCase()
      return a.full_code.toLowerCase().includes(s) ||
             a.name.toLowerCase().includes(s) ||
             a.name_fr?.toLowerCase().includes(s)
    })

    const grouped: Record<string, Assembly[]> = {}
    filtered.forEach(a => {
      if (!grouped[a.division_code]) grouped[a.division_code] = []
      grouped[a.division_code].push(a)
    })
    return grouped
  }, [assemblies, search])

  // Toggle division
  const toggleDivision = (code: string) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleSubdivision = (key: string) => {
    setExpandedSubdivisions(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Database size={24} />
              Base de données
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              {items.length} items • {assemblies.length} assemblages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm flex items-center gap-2">
              <Upload size={14} /> Importer
            </button>
            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm flex items-center gap-2">
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mt-4 border-b border-white/20">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Contenu */}
      <div className="flex-1 overflow-hidden flex">
        {/* Arbre de navigation */}
        <div className="w-80 bg-white border-r flex flex-col">
          {/* Recherche */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Arbre */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'items' && (
              <ItemsTree
                divisions={divisions}
                itemsByDivision={itemsByDivision}
                expandedDivisions={expandedDivisions}
                expandedSubdivisions={expandedSubdivisions}
                onToggleDivision={toggleDivision}
                onToggleSubdivision={toggleSubdivision}
                onEditItem={(item) => { setEditingItem(item); setShowItemModal(true) }}
              />
            )}

            {activeTab === 'assemblies' && (
              <AssembliesTree
                divisions={divisions}
                assembliesByDivision={assembliesByDivision}
                expandedDivisions={expandedDivisions}
                onToggleDivision={toggleDivision}
                onEditAssembly={(a) => { setEditingAssembly(a); setShowAssemblyModal(true) }}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenancePanel />
            )}

            {activeTab === 'sources' && (
              <CostSourcesPanel />
            )}
          </div>

          {/* Actions */}
          {(activeTab === 'items' || activeTab === 'assemblies') && (
            <div className="p-3 border-t">
              <button
                onClick={() => {
                  if (activeTab === 'items') {
                    setEditingItem(null)
                    setShowItemModal(true)
                  } else {
                    setEditingAssembly(null)
                    setShowAssemblyModal(true)
                  }
                }}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {activeTab === 'items' ? 'Nouvel item' : 'Nouvel assemblage'}
              </button>
            </div>
          )}
        </div>

        {/* Zone principale (détails/préview) */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'items' && (
            <ItemsHelp />
          )}
          {activeTab === 'assemblies' && (
            <AssembliesHelp />
          )}
        </div>
      </div>

      {/* Modal Item */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          divisions={divisions}
          onClose={() => { setShowItemModal(false); setEditingItem(null) }}
          onSave={() => { setShowItemModal(false); setEditingItem(null); loadData() }}
        />
      )}

      {/* Modal Assemblage */}
      {showAssemblyModal && (
        <AssemblyModal
          assembly={editingAssembly}
          divisions={divisions}
          items={items}
          onClose={() => { setShowAssemblyModal(false); setEditingAssembly(null) }}
          onSave={() => { setShowAssemblyModal(false); setEditingAssembly(null); loadData() }}
        />
      )}
    </div>
  )
}

// ============================================================================
// COMPOSANT: Arbre des Items
// ============================================================================

function ItemsTree({
  divisions,
  itemsByDivision,
  expandedDivisions,
  expandedSubdivisions,
  onToggleDivision,
  onToggleSubdivision,
  onEditItem
}: {
  divisions: Division[]
  itemsByDivision: Record<string, Record<string, CostItem[]>>
  expandedDivisions: Set<string>
  expandedSubdivisions: Set<string>
  onToggleDivision: (code: string) => void
  onToggleSubdivision: (key: string) => void
  onEditItem: (item: CostItem) => void
}) {
  return (
    <div className="space-y-0.5">
      {divisions.map(div => {
        const divItems = itemsByDivision[div.code]
        const hasItems = divItems && Object.keys(divItems).length > 0
        const isExpanded = expandedDivisions.has(div.code)

        return (
          <div key={div.code}>
            {/* Division */}
            <button
              onClick={() => onToggleDivision(div.code)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                hasItems ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {hasItems ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <span className="w-3.5" />
              )}
              <FolderOpen size={14} className="text-amber-500" />
              <span className="font-medium">{div.code}</span>
              <span className="truncate">{div.name_fr}</span>
            </button>

            {/* Subdivisions */}
            {isExpanded && divItems && (
              <div className="ml-4">
                {Object.entries(divItems).map(([subCode, subItems]) => {
                  const subKey = `${div.code}-${subCode}`
                  const isSubExpanded = expandedSubdivisions.has(subKey)

                  return (
                    <div key={subKey}>
                      <button
                        onClick={() => onToggleSubdivision(subKey)}
                        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
                      >
                        {isSubExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        <FolderOpen size={12} className="text-blue-400" />
                        <span>{subCode}</span>
                        <span className="text-xs text-gray-400">({subItems.length})</span>
                      </button>

                      {/* Items */}
                      {isSubExpanded && (
                        <div className="ml-5 border-l pl-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400">
                                <th className="text-left py-1 px-1">Code</th>
                                <th className="text-left py-1 px-1">Description</th>
                                <th className="text-right py-1 px-1">Unité</th>
                                <th className="text-right py-1 px-1">Coût</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subItems.map(item => (
                                <tr
                                  key={item.id}
                                  onClick={() => onEditItem(item)}
                                  className="hover:bg-blue-50 cursor-pointer"
                                >
                                  <td className="py-1 px-1 text-teal-600 font-mono">{item.full_code}</td>
                                  <td className="py-1 px-1 truncate max-w-[150px]">{item.description}</td>
                                  <td className="py-1 px-1 text-right text-gray-500">{item.unit}</td>
                                  <td className="py-1 px-1 text-right font-mono">
                                    {item.unit_cost.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPOSANT: Arbre des Assemblages
// ============================================================================

function AssembliesTree({
  divisions,
  assembliesByDivision,
  expandedDivisions,
  onToggleDivision,
  onEditAssembly
}: {
  divisions: Division[]
  assembliesByDivision: Record<string, Assembly[]>
  expandedDivisions: Set<string>
  onToggleDivision: (code: string) => void
  onEditAssembly: (assembly: Assembly) => void
}) {
  return (
    <div className="space-y-0.5">
      {divisions.map(div => {
        const divAssemblies = assembliesByDivision[div.code]
        const hasAssemblies = divAssemblies && divAssemblies.length > 0
        const isExpanded = expandedDivisions.has(div.code)

        return (
          <div key={div.code}>
            <button
              onClick={() => onToggleDivision(div.code)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                hasAssemblies ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {hasAssemblies ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <span className="w-3.5" />
              )}
              <FolderOpen size={14} className="text-amber-500" />
              <span className="font-medium">{div.code}</span>
              <span className="truncate">{div.name_fr}</span>
            </button>

            {isExpanded && divAssemblies && (
              <div className="ml-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1 px-1">Code</th>
                      <th className="text-left py-1 px-1">Description</th>
                      <th className="text-right py-1 px-1">Unité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divAssemblies.map(a => (
                      <tr
                        key={a.id}
                        onClick={() => onEditAssembly(a)}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <td className="py-1 px-1 text-teal-600 font-mono">{a.full_code}</td>
                        <td className="py-1 px-1 truncate max-w-[180px]">{a.name}</td>
                        <td className="py-1 px-1 text-right text-gray-500">{a.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="w-full py-2 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded mt-1">
                  + Ajouter un assemblage
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// COMPOSANT: Modal Item
// ============================================================================

function ItemModal({
  item,
  divisions,
  onClose,
  onSave
}: {
  item: CostItem | null
  divisions: Division[]
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    division_code: item?.division_code || '03',
    subdivision_code: item?.subdivision_code || '',
    item_code: item?.item_code || '',
    description: item?.description || '',
    description_fr: item?.description_fr || '',
    unit: item?.unit || 'U',
    material_cost: item?.material_cost?.toString() || '0',
    labor_cost: item?.labor_cost?.toString() || '0',
    equipment_cost: item?.equipment_cost?.toString() || '0',
    labor_hours: item?.labor_hours?.toString() || '0',
  })
  const [saving, setSaving] = useState(false)

  const unitCost = parseFloat(form.material_cost || '0') + parseFloat(form.labor_cost || '0') + parseFloat(form.equipment_cost || '0')

  const handleSubmit = async () => {
    if (!form.description) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        division_code: form.division_code,
        subdivision_code: form.subdivision_code || null,
        item_code: form.item_code || null,
        description: form.description,
        description_fr: form.description_fr || null,
        unit: form.unit,
        material_cost: parseFloat(form.material_cost) || 0,
        labor_cost: parseFloat(form.labor_cost) || 0,
        equipment_cost: parseFloat(form.equipment_cost) || 0,
        unit_cost: unitCost,
        labor_hours: parseFloat(form.labor_hours) || 0,
      }

      if (item) {
        await supabase.from('cost_items').update(payload).eq('id', item.id)
      } else {
        await supabase.from('cost_items').insert(payload)
      }
      onSave()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{item ? 'Modifier l\'item' : 'Nouvel item'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Codes */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
              <select value={form.division_code} onChange={(e) => setForm({ ...form, division_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {divisions.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name_fr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subdivision</label>
              <input type="text" value={form.subdivision_code} onChange={(e) => setForm({ ...form, subdivision_code: e.target.value })} placeholder="2000" maxLength={4} className="w-full px-3 py-2 border rounded-lg font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code item</label>
              <input type="text" value={form.item_code} onChange={(e) => setForm({ ...form, item_code: e.target.value })} placeholder="1000" maxLength={4} className="w-full px-3 py-2 border rounded-lg font-mono" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN) *</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (FR)</label>
            <input type="text" value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>

          {/* Unité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures M-O / unité</label>
              <input type="number" step="0.01" value={form.labor_hours} onChange={(e) => setForm({ ...form, labor_hours: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>

          {/* Coûts */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Coûts unitaires</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Matériaux ($)</label>
                <input type="number" step="0.01" value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Main-d'œuvre ($)</label>
                <input type="number" step="0.01" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Équipement ($)</label>
                <input type="number" step="0.01" value={form.equipment_cost} onChange={(e) => setForm({ ...form, equipment_cost: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Coût unitaire total</span>
              <span className="text-lg font-bold text-teal-600">${unitCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !form.description} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT: Modal Assemblage
// ============================================================================

function AssemblyModal({
  assembly,
  divisions,
  items,
  onClose,
  onSave
}: {
  assembly: Assembly | null
  divisions: Division[]
  items: CostItem[]
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    division_code: assembly?.division_code || '04',
    assembly_code: assembly?.assembly_code || '',
    name: assembly?.name || '',
    name_fr: assembly?.name_fr || '',
    description: assembly?.description || '',
    unit: assembly?.unit || 'Pi2',
    variables: assembly?.variables || ['Wall_Length', 'Wall_Height'],
  })
  const [assemblyItems, setAssemblyItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Variables disponibles
  const commonVariables = [
    'Wall_Length', 'Wall_Height', 'Wall_Area',
    'Floor_Area', 'Perimeter', 'Volume',
    'Opening_Count', 'Bond_Beam_Rows', 'Bond_Beam_Rebar',
    'Quantity', 'Length', 'Width', 'Height', 'Depth'
  ]

  const handleSubmit = async () => {
    if (!form.name || !form.assembly_code) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        division_code: form.division_code,
        assembly_code: form.assembly_code,
        name: form.name,
        name_fr: form.name_fr || null,
        description: form.description || null,
        unit: form.unit,
        variables: form.variables,
        default_values: form.variables.reduce((acc, v) => ({ ...acc, [v]: 1 }), {})
      }

      if (assembly) {
        await supabase.from('assemblies').update(payload).eq('id', assembly.id)
      } else {
        await supabase.from('assemblies').insert(payload)
      }
      onSave()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{assembly ? 'Modifier l\'assemblage' : 'Nouvel assemblage'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          {/* Code et nom */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <select value={form.division_code} onChange={(e) => setForm({ ...form, division_code: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {divisions.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name_fr}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input type="text" value={form.assembly_code} onChange={(e) => setForm({ ...form, assembly_code: e.target.value })} placeholder="0100" className="w-full px-3 py-2 border rounded-lg font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="4&quot; Concrete Block Wall" className="w-full px-3 py-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (FR)</label>
            <input type="text" value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} placeholder="Mur de blocs de béton 4&quot;" className="w-full px-3 py-2 border rounded-lg" />
          </div>

          {/* Variables */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Calculator size={16} />
              Variables pour formules
            </h3>
            <div className="flex flex-wrap gap-2">
              {commonVariables.map(v => (
                <button
                  key={v}
                  onClick={() => {
                    if (form.variables.includes(v)) {
                      setForm({ ...form, variables: form.variables.filter(x => x !== v) })
                    } else {
                      setForm({ ...form, variables: [...form.variables, v] })
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    form.variables.includes(v)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-blue-100'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Sélectionnez les variables utilisables dans les formules de quantité
            </p>
          </div>

          {/* Preview formule */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Exemple de formule</h3>
            <code className="text-sm text-teal-700 bg-white px-3 py-2 rounded border block">
              ({form.variables[0] || 'Length'} * {form.variables[1] || 'Height'} * 1.125) - ({form.variables[0] || 'Length'} / 1.333 * Bond_Beam_Rows)
            </code>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.assembly_code} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANTS: Panels et Help
// ============================================================================

function MaintenancePanel() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">Maintenance</h3>
      <div className="space-y-2">
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">
          🔄 Mettre à jour les coûts RSMeans
        </button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">
          📊 Appliquer inflation annuelle
        </button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">
          🗑️ Supprimer items inutilisés
        </button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">
          📋 Vérifier intégrité données
        </button>
      </div>
    </div>
  )
}

function CostSourcesPanel() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-700">Sources de coûts</h3>
      <div className="space-y-2 text-sm">
        <div className="p-3 bg-white rounded border">
          <div className="font-medium">RSMeans</div>
          <div className="text-gray-500 text-xs">Dernière mise à jour: Non connecté</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="font-medium">Données personnelles</div>
          <div className="text-gray-500 text-xs">Items créés manuellement</div>
        </div>
        <div className="p-3 bg-white rounded border">
          <div className="font-medium">Import CSV</div>
          <div className="text-gray-500 text-xs">Aucun import récent</div>
        </div>
      </div>
    </div>
  )
}

function ItemsHelp() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <Package className="text-teal-500 mb-4" size={40} />
        <h2 className="text-xl font-bold mb-2">Base de données d'items</h2>
        <p className="text-gray-600 mb-4">
          Les items sont les éléments unitaires de coût: matériaux, main-d'œuvre, équipements.
          Ils sont organisés selon la structure CSC MasterFormat.
        </p>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <span className="text-teal-600 font-mono">04.2000.1000</span>
            <div>
              <p className="font-medium">Format du code</p>
              <p className="text-gray-500">Division.Subdivision.Item</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <DollarSign className="text-green-500 mt-0.5" size={18} />
            <div>
              <p className="font-medium">Coût unitaire</p>
              <p className="text-gray-500">Matériaux + Main-d'œuvre + Équipement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssembliesHelp() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <Layers className="text-blue-500 mb-4" size={40} />
        <h2 className="text-xl font-bold mb-2">Assemblages</h2>
        <p className="text-gray-600 mb-4">
          Les assemblages regroupent plusieurs items avec des formules de calcul automatique.
          Ex: "Mur de blocs 4"" calcule automatiquement blocs, mortier, armature, main-d'œuvre.
        </p>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 rounded">
            <p className="font-medium text-blue-800 mb-1">Exemple de formule</p>
            <code className="text-xs text-blue-700 block">
              (Wall_Length * Wall_Height * 1.125) - (Wall_Length / 1.333 * Bond_Beam_Rows)
            </code>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
            <Calculator className="text-purple-500 mt-0.5" size={18} />
            <div>
              <p className="font-medium">Variables dynamiques</p>
              <p className="text-gray-500">Wall_Length, Wall_Height, Bond_Beam_Rows...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
