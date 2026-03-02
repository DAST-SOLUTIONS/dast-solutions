/**
 * DAST Solutions - Page Estimation
 * Fonctionne SANS table estimates - utilise seulement la table projects (existante)
 * Les items sont stockés en JSON dans projects.metadata ou affichés en local
 */
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ChevronLeft, Loader2, Plus, Trash2, Save, Calculator,
  DollarSign, Package, Users, FileText, Search, Edit2, X, Check
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client_name?: string
  status: string
  budget?: number
}

interface EstimationItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  category: string
  total: number
}

const UNITS = ['U', 'Pi', 'Pi²', 'Pi³', 'M', 'M²', 'M³', 'Kg', 'Tonne', 'Heure', 'Jour', 'Forfait']
const CATEGORIES = ['Béton', 'Maçonnerie', 'Bois', 'Acier', 'Isolation', 'Fenestration', 'Finitions', 'Électricité', 'Plomberie', 'CVAC', 'Excavation', 'Autre']

const formatCAD = (v: number) => v.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })

export default function EstimationPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<EstimationItem[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    description: '', quantity: 1, unit: 'U', unit_price: 0, category: 'Autre'
  })

  // Redirect if no projectId
  useEffect(() => {
    if (!projectId) { navigate('/projects'); return }

    const load = async () => {
      setLoading(true)
      try {
        // Load project (this table always exists)
        const { data: proj, error } = await supabase
          .from('projects')
          .select('id, name, client_name, status, budget')
          .eq('id', projectId)
          .single()

        if (error || !proj) { navigate('/projects'); return }
        setProject(proj)

        // Try to load estimate_items (may not exist)
        const { data: savedItems } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true })

        if (savedItems && savedItems.length > 0) {
          setItems(savedItems.map((i: any) => ({
            id: i.id,
            description: i.description,
            quantity: i.quantity || 1,
            unit: i.unit || 'U',
            unit_price: i.unit_cost || i.unit_price || 0,
            category: i.division_code || i.category || 'Autre',
            total: i.line_total || (i.quantity * (i.unit_cost || 0))
          })))
        }
      } catch (err) {
        console.error('Erreur chargement:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, navigate])

  const filteredItems = useMemo(() => {
    if (!search) return items
    const s = search.toLowerCase()
    return items.filter(i =>
      i.description.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s)
    )
  }, [items, search])

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const overhead = subtotal * 0.08
    const profit = subtotal * 0.10
    return { subtotal, overhead, profit, total: subtotal + overhead + profit }
  }, [items])

  const addItem = () => {
    if (!newItem.description.trim()) return
    const item: EstimationItem = {
      id: crypto.randomUUID(),
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit,
      unit_price: newItem.unit_price,
      category: newItem.category,
      total: newItem.quantity * newItem.unit_price
    }
    setItems(prev => [...prev, item])
    setNewItem({ description: '', quantity: 1, unit: 'U', unit_price: 0, category: 'Autre' })
    setShowAddForm(false)
    saveItems([...items, item])
  }

  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    saveItems(next)
  }

  const saveItems = async (itemsToSave: EstimationItem[]) => {
    if (!projectId) return
    setSaving(true)
    try {
      // Delete existing items for this project
      await supabase.from('estimate_items').delete().eq('project_id', projectId)
      // Insert new items
      if (itemsToSave.length > 0) {
        await supabase.from('estimate_items').insert(
          itemsToSave.map(i => ({
            project_id: projectId,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_cost: i.unit_price,
            line_total: i.total,
            division_code: i.category,
            sort_order: itemsToSave.indexOf(i)
          }))
        )
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  )

  if (!project) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Projet non trouvé</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 hover:bg-white/10 rounded-lg">
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
              <p className="text-2xl font-bold text-green-400">{formatCAD(totals.total)}</p>
            </div>
            {saving && <Loader2 className="animate-spin text-white/60" size={20} />}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Sous-total travaux', value: totals.subtotal, icon: Package, color: 'blue' },
            { label: 'Frais généraux (8%)', value: totals.overhead, icon: Calculator, color: 'purple' },
            { label: 'Profit (10%)', value: totals.profit, icon: DollarSign, color: 'green' },
            { label: 'TOTAL', value: totals.total, icon: FileText, color: 'teal' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
              <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon className={`text-${color}-600`} size={20} />
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCAD(value)}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900">Items d'estimation</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 pr-3 py-2 text-sm border rounded-lg w-52 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
              >
                <Plus size={16} /> Ajouter item
              </button>
            </div>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="p-4 bg-teal-50 border-b">
              <div className="grid grid-cols-6 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 font-medium">Description *</label>
                  <input
                    value={newItem.description}
                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: Béton 30 MPa"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Catégorie</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Quantité</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={e => setNewItem(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Unité</label>
                  <select
                    value={newItem.unit}
                    onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Prix unitaire $</label>
                  <input
                    type="number"
                    value={newItem.unit_price}
                    onChange={e => setNewItem(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: <strong className="text-teal-700">{formatCAD(newItem.quantity * newItem.unit_price)}</strong>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                    Annuler
                  </button>
                  <button
                    onClick={addItem}
                    disabled={!newItem.description.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50"
                  >
                    <Check size={14} /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-500 font-medium">Aucun item d'estimation</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Ajouter item" pour commencer</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Quantité</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Unité</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Prix unit.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCAD(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCAD(item.total)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 font-semibold text-gray-700 text-right">Sous-total:</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCAD(totals.subtotal)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-gray-600 text-right">Frais généraux (8%):</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCAD(totals.overhead)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-gray-600 text-right">Profit (10%):</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCAD(totals.profit)}</td>
                  <td></td>
                </tr>
                <tr className="bg-teal-50">
                  <td colSpan={5} className="px-4 py-4 font-bold text-teal-800 text-right text-base">TOTAL:</td>
                  <td className="px-4 py-4 text-right font-bold text-teal-800 text-xl">{formatCAD(totals.total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
