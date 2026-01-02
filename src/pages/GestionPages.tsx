/**
 * DAST Solutions - Pages de Gestion de Projet (TOUTES)
 * Chaque page est accessible via /project/:projectId/:module
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Filter, FileCheck, Clock, CheckCircle, XCircle,
  AlertTriangle, DollarSign, Calendar, User, ChevronRight, ChevronLeft,
  MoreVertical, Eye, Edit2, Trash2, X, Save, Upload, FileText,
  ArrowUpRight, ArrowDownRight, Minus, Cloud, Sun, CloudRain, CloudSnow,
  Users, Loader2, Download, Camera, MessageSquare, Send, Video,
  Mail, HardHat, Truck, Box, BarChart3, Settings, Layers,
  FileSpreadsheet, FormInput, PiggyBank, TrendingUp, FileSearch
} from 'lucide-react'

// ============================================================================
// TYPES COMMUNS
// ============================================================================

interface Project {
  id: string
  name: string
  status: string
  budget?: number
  start_date?: string
  end_date?: string
  city?: string
  province?: string
}

// Hook pour charger le projet
function useProject() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!projectId) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          navigate('/projects')
          return
        }
        setProject(data)
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId, navigate])

  return { project, loading, projectId }
}

// Composant de page placeholder
function PagePlaceholder({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string
  description: string
  icon: React.ElementType 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="text-gray-400" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 max-w-md mb-4">{description}</p>
      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
        🚧 En développement
      </span>
    </div>
  )
}

// Wrapper de page avec header
function PageWrapper({ 
  title, 
  children, 
  actions 
}: { 
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  )
}

const formatCurrency = (value: number) => 
  value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

// ============================================================================
// PAGE: BUDGET
// ============================================================================

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
  { code: '21', name: 'Protection incendie' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVCA' },
  { code: '26', name: 'Électricité' },
  { code: '27', name: 'Communications' },
  { code: '31', name: 'Terrassement' },
  { code: '32', name: 'Aménagement extérieur' },
  { code: '33', name: 'Services publics' },
]

export function ProjectBudget() {
  const { project, loading, projectId } = useProject()
  const [budgetLines, setBudgetLines] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('budget_lines')
      .select('*')
      .eq('project_id', projectId)
      .order('division_code')
      .then(({ data }) => setBudgetLines(data || []))
  }, [projectId])

  const totals = budgetLines.reduce((acc, line) => ({
    original: acc.original + (line.budget_original || 0),
    changes: acc.changes + (line.budget_changes || 0),
    current: acc.current + (line.budget_current || 0),
    committed: acc.committed + (line.committed || 0),
    actual: acc.actual + (line.actual || 0),
  }), { original: 0, changes: 0, current: 0, committed: 0, actual: 0 })

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
  if (!project) return null

  return (
    <PageWrapper 
      title="Budget"
      actions={
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={16} /> Exporter
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter ligne
          </button>
        </div>
      }
    >
      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Budget original</p>
          <p className="text-2xl font-bold">{formatCurrency(project.budget || totals.original)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Changements</p>
          <p className={`text-2xl font-bold ${totals.changes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.changes >= 0 ? '+' : ''}{formatCurrency(totals.changes)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Budget actuel</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency((project.budget || 0) + totals.changes)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Engagé</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.committed)}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Division</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Changements</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actuel</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Engagé</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Réel</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {budgetLines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <FileSpreadsheet className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">Aucune ligne de budget</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Ajouter une ligne
                  </button>
                </td>
              </tr>
            ) : (
              budgetLines.map(line => (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <span className="text-teal-600">{line.division_code}</span> {line.division_name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(line.budget_original)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${line.budget_changes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {line.budget_changes ? (line.budget_changes > 0 ? '+' : '') + formatCurrency(line.budget_changes) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(line.budget_current)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(line.committed)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(line.actual)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter */}
      {showAddModal && (
        <AddBudgetLineModal 
          projectId={projectId!}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            supabase
              .from('budget_lines')
              .select('*')
              .eq('project_id', projectId)
              .order('division_code')
              .then(({ data }) => setBudgetLines(data || []))
          }}
        />
      )}
    </PageWrapper>
  )
}

function AddBudgetLineModal({ projectId, onClose, onSave }: { projectId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ division_code: '', description: '', budget_original: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.division_code || !form.budget_original) return
    setSaving(true)
    try {
      const division = CSC_DIVISIONS.find(d => d.code === form.division_code)
      const budget = parseFloat(form.budget_original)
      await supabase.from('budget_lines').insert({
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Division CSC *</label>
            <select value={form.division_code} onChange={(e) => setForm({ ...form, division_code: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Sélectionner</option>
              {CSC_DIVISIONS.map(div => <option key={div.code} value={div.code}>{div.code} - {div.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget original ($) *</label>
            <input type="number" value={form.budget_original} onChange={(e) => setForm({ ...form, budget_original: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !form.division_code || !form.budget_original} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE: ORDRES DE CHANGEMENT
// ============================================================================

const CO_STATUS = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700' },
}

export function ProjectChangeOrders() {
  const { project, loading, projectId } = useProject()
  const [changeOrders, setChangeOrders] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('change_orders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setChangeOrders(data || []))
  }, [projectId])

  const totals = changeOrders.reduce((acc, co) => {
    if (co.status === 'approved') {
      if (co.type === 'addition') acc.additions += co.amount
      else if (co.type === 'deduction') acc.deductions += co.amount
    }
    if (co.status === 'submitted') acc.pending += co.amount
    return acc
  }, { additions: 0, deductions: 0, pending: 0 })

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
  if (!project) return null

  return (
    <PageWrapper 
      title="Ordres de changement"
      actions={
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <Plus size={16} /> Nouvel ordre
        </button>
      }
    >
      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total ordres</p>
          <p className="text-2xl font-bold">{changeOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Ajouts approuvés</p>
          <p className="text-2xl font-bold text-red-600">+{formatCurrency(totals.additions)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Déductions</p>
          <p className="text-2xl font-bold text-green-600">-{formatCurrency(totals.deductions)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {changeOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Aucun ordre de changement</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Créer un ordre
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">N°</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {changeOrders.map(co => (
                <tr key={co.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-teal-600">{co.number}</td>
                  <td className="px-4 py-3 font-medium">{co.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${CO_STATUS[co.status as keyof typeof CO_STATUS]?.color || ''}`}>
                      {CO_STATUS[co.status as keyof typeof CO_STATUS]?.label || co.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {co.type === 'addition' ? '➕ Ajout' : co.type === 'deduction' ? '➖ Déduction' : '↔️ Sans coût'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${co.type === 'addition' ? 'text-red-600' : co.type === 'deduction' ? 'text-green-600' : ''}`}>
                    {co.type === 'addition' ? '+' : co.type === 'deduction' ? '-' : ''}{formatCurrency(co.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(co.date_requested).toLocaleDateString('fr-CA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddChangeOrderModal 
          projectId={projectId!}
          nextNumber={`CO-${String(changeOrders.length + 1).padStart(3, '0')}`}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            supabase.from('change_orders').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).then(({ data }) => setChangeOrders(data || []))
          }}
        />
      )}
    </PageWrapper>
  )
}

function AddChangeOrderModal({ projectId, nextNumber, onClose, onSave }: { projectId: string; nextNumber: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ number: nextNumber, title: '', description: '', type: 'addition', amount: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      await supabase.from('change_orders').insert({
        project_id: projectId,
        number: form.number,
        title: form.title,
        description: form.description,
        type: form.type,
        amount: parseFloat(form.amount) || 0,
        status: 'draft',
        reason: form.reason,
        date_requested: new Date().toISOString()
      })
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
          <h2 className="text-xl font-bold">Nouvel ordre de changement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
              <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                <option value="addition">Ajout (+)</option>
                <option value="deduction">Déduction (-)</option>
                <option value="no_cost">Sans coût</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
            <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !form.title} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE: JOURNAL DE CHANTIER
// ============================================================================

const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Ensoleillé', icon: Sun },
  { value: 'cloudy', label: 'Nuageux', icon: Cloud },
  { value: 'rain', label: 'Pluie', icon: CloudRain },
  { value: 'snow', label: 'Neige', icon: CloudSnow },
]

export function ProjectJournal() {
  const { project, loading, projectId } = useProject()
  const [reports, setReports] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('daily_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .then(({ data }) => setReports(data || []))
  }, [projectId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>
  if (!project) return null

  return (
    <PageWrapper 
      title="Journal de chantier"
      actions={
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <Plus size={16} /> Nouveau rapport
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Rapports ce mois</p>
          <p className="text-2xl font-bold">{reports.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Jours travaillés</p>
          <p className="text-2xl font-bold text-teal-600">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Moy. travailleurs</p>
          <p className="text-2xl font-bold text-blue-600">{reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.workers_on_site, 0) / reports.length) : 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Incidents</p>
          <p className="text-2xl font-bold text-amber-600">{reports.filter(r => r.safety_incidents).length}</p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border">
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FormInput className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Aucun rapport de chantier</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Créer un rapport
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {reports.map(report => {
              const WeatherIcon = WEATHER_OPTIONS.find(w => w.value === report.weather_condition)?.icon || Cloud
              return (
                <div key={report.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold">{new Date(report.date).getDate()}</p>
                      <p className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString('fr-CA', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <WeatherIcon size={16} className="text-gray-400" />
                        {report.temperature_high && <span className="text-sm text-gray-500">{report.temperature_low}°/{report.temperature_high}°C</span>}
                        <span className="text-sm text-gray-500">👷 {report.workers_on_site}</span>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{report.work_performed}</p>
                      {report.delays_issues && <p className="text-sm text-amber-600 mt-1">⚠️ {report.delays_issues}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddDailyReportModal 
          projectId={projectId!}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            supabase.from('daily_reports').select('*').eq('project_id', projectId).order('date', { ascending: false }).then(({ data }) => setReports(data || []))
          }}
        />
      )}
    </PageWrapper>
  )
}

function AddDailyReportModal({ projectId, onClose, onSave }: { projectId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weather_condition: 'cloudy',
    temperature_high: '',
    temperature_low: '',
    workers_on_site: '',
    work_performed: '',
    delays_issues: '',
    safety_incidents: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.work_performed || !form.workers_on_site) return
    setSaving(true)
    try {
      await supabase.from('daily_reports').insert({
        project_id: projectId,
        date: form.date,
        weather_condition: form.weather_condition,
        temperature_high: form.temperature_high ? parseInt(form.temperature_high) : null,
        temperature_low: form.temperature_low ? parseInt(form.temperature_low) : null,
        workers_on_site: parseInt(form.workers_on_site) || 0,
        work_performed: form.work_performed,
        delays_issues: form.delays_issues || null,
        safety_incidents: form.safety_incidents || null
      })
      onSave()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nouveau rapport</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Météo</label>
              <select value={form.weather_condition} onChange={(e) => setForm({ ...form, weather_condition: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                {WEATHER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp. min</label>
              <input type="number" value={form.temperature_low} onChange={(e) => setForm({ ...form, temperature_low: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="-5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp. max</label>
              <input type="number" value={form.temperature_high} onChange={(e) => setForm({ ...form, temperature_high: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travailleurs *</label>
              <input type="number" value={form.workers_on_site} onChange={(e) => setForm({ ...form, workers_on_site: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travaux effectués *</label>
            <textarea value={form.work_performed} onChange={(e) => setForm({ ...form, work_performed: e.target.value })} rows={4} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retards / Problèmes</label>
            <textarea value={form.delays_issues} onChange={(e) => setForm({ ...form, delays_issues: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incidents sécurité</label>
            <textarea value={form.safety_incidents} onChange={(e) => setForm({ ...form, safety_incidents: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg border-amber-200 bg-amber-50" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} disabled={saving || !form.work_performed || !form.workers_on_site} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGES PLACEHOLDER (tous les autres modules)
// ============================================================================

export function ProjectCouts() {
  return <PagePlaceholder title="Suivi des Coûts" description="Suivez les coûts réels vs budget, factures fournisseurs et paiements." icon={DollarSign} />
}

export function ProjectPrevisions() {
  return <PagePlaceholder title="Prévisions" description="Analysez les tendances et prévoyez le coût final du projet." icon={TrendingUp} />
}

export function ProjectPlans() {
  return <PagePlaceholder title="Plans" description="Gérez les plans et dessins avec versionnage et annotations." icon={Layers} />
}

export function ProjectSpecifications() {
  return <PagePlaceholder title="Devis techniques" description="Spécifications techniques et devis descriptifs du projet." icon={FileSpreadsheet} />
}

export function ProjectDocuments() {
  return <PagePlaceholder title="Documents" description="Centralisez contrats, spécifications, rapports et autres documents." icon={FileSearch} />
}

export function ProjectPhotos() {
  return <PagePlaceholder title="Photos" description="Galerie photo avec géolocalisation et organisation par date/zone." icon={Camera} />
}

export function ProjectEcheancier() {
  return <PagePlaceholder title="Échéancier" description="Diagramme de Gantt interactif pour la planification." icon={Calendar} />
}

export function ProjectProblemes() {
  return <PagePlaceholder title="Problèmes" description="Suivez et résolvez les problèmes identifiés sur le chantier." icon={AlertCircle} />
}

export function ProjectRFI() {
  return <PagePlaceholder title="Demandes d'information (RFI)" description="Gérez les demandes d'information entre parties prenantes." icon={MessageSquare} />
}

export function ProjectSoumissionsST() {
  return <PagePlaceholder title="Soumissions sous-traitants" description="Recevez et comparez les soumissions des sous-traitants." icon={Send} />
}

export function ProjectCorrespondance() {
  return <PagePlaceholder title="Correspondance" description="Gérez les lettres et communications officielles du projet." icon={Mail} />
}

export function ProjectReunions() {
  return <PagePlaceholder title="Réunions" description="Planifiez les réunions et conservez les procès-verbaux." icon={Video} />
}

export function ProjectFormulaires() {
  return <PagePlaceholder title="Formulaires" description="Formulaires personnalisés pour inspections et rapports." icon={FileText} />
}

export function ProjectEquipe() {
  return <PagePlaceholder title="Équipe" description="Gérez les membres de l'équipe et leurs rôles." icon={HardHat} />
}

export function ProjectEquipements() {
  return <PagePlaceholder title="Équipements" description="Suivi des équipements et machinerie sur le chantier." icon={Truck} />
}

export function ProjectMateriaux() {
  return <PagePlaceholder title="Matériaux" description="Suivi des livraisons et inventaire des matériaux." icon={Box} />
}

export function ProjectRapports() {
  return <PagePlaceholder title="Rapports" description="Générez des rapports d'avancement, coûts et performance." icon={BarChart3} />
}

export function ProjectParametres() {
  return <PagePlaceholder title="Paramètres" description="Configuration et paramètres du projet." icon={Settings} />
}
