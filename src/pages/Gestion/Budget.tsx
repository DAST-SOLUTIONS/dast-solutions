/**
 * DAST Solutions - Budget (Cost Management)
 * Gestion du budget par division CSC
 */
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Upload, Download, Search, Filter, ChevronDown, ChevronRight,
  Edit2, Trash2, Save, X, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, MoreVertical, FileSpreadsheet
} from 'lucide-react'

interface Project {
  id: string
  name: string
  budget?: number
}

interface BudgetLine {
  id: string
  project_id: string
  division_code: string
  division_name: string
  description: string
  budget_original: number
  budget_approved: number
  budget_changes: number
  budget_current: number
  committed: number
  actual: number
  forecast: number
  variance: number
}

// Divisions CSC MasterFormat
const CSC_DIVISIONS = [
  { code: '01', name: 'Exigences générales' },
  { code: '02', name: 'Conditions existantes' },
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois, plastiques, composites' },
  { code: '07', name: 'Protection thermique et humidité' },
  { code: '08', name: 'Ouvertures' },
  { code: '09', name: 'Finitions' },
  { code: '10', name: 'Spécialités' },
  { code: '11', name: 'Équipements' },
  { code: '12', name: 'Ameublement' },
  { code: '13', name: 'Constructions spéciales' },
  { code: '14', name: 'Équipements de transport' },
  { code: '21', name: 'Protection incendie' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVCA' },
  { code: '26', name: 'Électricité' },
  { code: '27', name: 'Communications' },
  { code: '28', name: 'Sécurité électronique' },
  { code: '31', name: 'Terrassement' },
  { code: '32', name: 'Aménagement extérieur' },
  { code: '33', name: 'Services publics' },
]

export default function GestionBudget() {
  const { project } = useOutletContext<{ project: Project }>()
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set())

  // Charger les lignes de budget
  useEffect(() => {
    loadBudget()
  }, [project.id])

  const loadBudget = async () => {
    try {
      const { data } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('project_id', project.id)
        .order('division_code')

      setBudgetLines(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculer les totaux
  const totals = budgetLines.reduce((acc, line) => ({
    budgetOriginal: acc.budgetOriginal + (line.budget_original || 0),
    budgetApproved: acc.budgetApproved + (line.budget_approved || 0),
    budgetChanges: acc.budgetChanges + (line.budget_changes || 0),
    budgetCurrent: acc.budgetCurrent + (line.budget_current || 0),
    committed: acc.committed + (line.committed || 0),
    actual: acc.actual + (line.actual || 0),
    forecast: acc.forecast + (line.forecast || 0),
    variance: acc.variance + (line.variance || 0),
  }), {
    budgetOriginal: 0,
    budgetApproved: 0,
    budgetChanges: 0,
    budgetCurrent: 0,
    committed: 0,
    actual: 0,
    forecast: 0,
    variance: 0,
  })

  // Grouper par division
  const groupedByDivision = budgetLines.reduce((acc, line) => {
    const div = line.division_code.substring(0, 2)
    if (!acc[div]) acc[div] = []
    acc[div].push(line)
    return acc
  }, {} as Record<string, BudgetLine[]>)

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

  const toggleDivision = (code: string) => {
    const newExpanded = new Set(expandedDivisions)
    if (newExpanded.has(code)) {
      newExpanded.delete(code)
    } else {
      newExpanded.add(code)
    }
    setExpandedDivisions(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-gray-500">Gestion du budget par division CSC MasterFormat</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload size={16} />
            Importer
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={16} />
            Exporter
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter ligne
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Budget original</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(project.budget || totals.budgetOriginal)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Changements approuvés</p>
          <p className={`text-2xl font-bold ${totals.budgetChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.budgetChanges >= 0 ? '+' : ''}{formatCurrency(totals.budgetChanges)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Budget actuel</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency((project.budget || 0) + totals.budgetChanges)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Variance projetée</p>
          <p className={`text-2xl font-bold flex items-center gap-2 ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.variance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {formatCurrency(Math.abs(totals.variance))}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une division..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter size={16} />
            Filtrer
          </button>
        </div>
      </div>

      {/* Tableau du budget */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Division
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget original
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Changements
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget actuel
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagé
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Réel
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prévision
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {budgetLines.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <FileSpreadsheet className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">Aucune ligne de budget</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ajoutez des lignes de budget par division CSC pour commencer le suivi
                  </p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Ajouter une ligne
                  </button>
                </td>
              </tr>
            ) : (
              CSC_DIVISIONS.map(division => {
                const lines = groupedByDivision[division.code] || []
                const divisionTotal = lines.reduce((sum, l) => ({
                  budgetOriginal: sum.budgetOriginal + (l.budget_original || 0),
                  budgetChanges: sum.budgetChanges + (l.budget_changes || 0),
                  budgetCurrent: sum.budgetCurrent + (l.budget_current || 0),
                  committed: sum.committed + (l.committed || 0),
                  actual: sum.actual + (l.actual || 0),
                  forecast: sum.forecast + (l.forecast || 0),
                  variance: sum.variance + (l.variance || 0),
                }), { budgetOriginal: 0, budgetChanges: 0, budgetCurrent: 0, committed: 0, actual: 0, forecast: 0, variance: 0 })

                if (lines.length === 0 && !search) return null

                return (
                  <tr key={division.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => toggleDivision(division.code)}
                        className="flex items-center gap-2 font-medium text-gray-900"
                      >
                        {lines.length > 0 ? (
                          expandedDivisions.has(division.code) ? 
                            <ChevronDown size={16} /> : <ChevronRight size={16} />
                        ) : <span className="w-4" />}
                        <span className="text-teal-600">{division.code}</span>
                        {division.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(divisionTotal.budgetOriginal)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${divisionTotal.budgetChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {divisionTotal.budgetChanges !== 0 ? (divisionTotal.budgetChanges > 0 ? '+' : '') + formatCurrency(divisionTotal.budgetChanges) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                      {formatCurrency(divisionTotal.budgetCurrent)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(divisionTotal.committed)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(divisionTotal.actual)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(divisionTotal.forecast)}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-sm ${divisionTotal.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {divisionTotal.variance !== 0 ? formatCurrency(divisionTotal.variance) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}

            {/* Total */}
            {budgetLines.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.budgetOriginal)}</td>
                <td className={`px-4 py-3 text-right font-mono ${totals.budgetChanges >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.budgetChanges !== 0 ? (totals.budgetChanges > 0 ? '+' : '') + formatCurrency(totals.budgetChanges) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.budgetCurrent)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.committed)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.actual)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(totals.forecast)}</td>
                <td className={`px-4 py-3 text-right font-mono ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.variance)}
                </td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter ligne */}
      {showAddModal && (
        <AddBudgetLineModal 
          projectId={project.id}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            loadBudget()
          }}
        />
      )}
    </div>
  )
}

// Modal pour ajouter une ligne de budget
function AddBudgetLineModal({ projectId, onClose, onSave }: {
  projectId: string
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    division_code: '',
    description: '',
    budget_original: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.division_code || !form.budget_original) return

    setSaving(true)
    try {
      const division = CSC_DIVISIONS.find(d => d.code === form.division_code.substring(0, 2))
      const budget = parseFloat(form.budget_original)

      const { error } = await supabase
        .from('budget_lines')
        .insert({
          project_id: projectId,
          division_code: form.division_code,
          division_name: division?.name || '',
          description: form.description,
          budget_original: budget,
          budget_approved: budget,
          budget_current: budget,
          budget_changes: 0,
          committed: 0,
          actual: 0,
          forecast: budget,
          variance: 0
        })

      if (error) throw error
      onSave()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Ajouter une ligne de budget</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division CSC <span className="text-red-500">*</span>
            </label>
            <select
              value={form.division_code}
              onChange={(e) => setForm({ ...form, division_code: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Sélectionner une division</option>
              {CSC_DIVISIONS.map(div => (
                <option key={div.code} value={div.code}>
                  {div.code} - {div.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Description optionnelle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget original ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.budget_original}
              onChange={(e) => setForm({ ...form, budget_original: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="100000"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.division_code || !form.budget_original}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <span className="animate-spin">⏳</span> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
