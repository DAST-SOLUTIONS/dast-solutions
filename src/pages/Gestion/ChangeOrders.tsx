/**
 * DAST Solutions - Ordres de Changement (Change Orders)
 * Gestion des CO avec workflow d'approbation
 */
import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Filter, FileCheck, Clock, CheckCircle, XCircle,
  AlertTriangle, DollarSign, Calendar, User, ChevronRight,
  MoreVertical, Eye, Edit2, Trash2, X, Save, Upload, FileText,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

interface Project {
  id: string
  name: string
  budget?: number
}

interface ChangeOrder {
  id: string
  project_id: string
  number: string
  title: string
  description?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'void'
  type: 'addition' | 'deduction' | 'no_cost'
  amount: number
  division_code?: string
  requested_by?: string
  approved_by?: string
  date_requested: string
  date_approved?: string
  date_required?: string
  reason?: string
  attachments?: string[]
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-700', icon: FileCheck },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-700', icon: XCircle },
  void: { label: 'Annulé', color: 'bg-gray-100 text-gray-500', icon: AlertTriangle },
}

const TYPE_CONFIG = {
  addition: { label: 'Ajout', color: 'text-red-600', icon: ArrowUpRight },
  deduction: { label: 'Déduction', color: 'text-green-600', icon: ArrowDownRight },
  no_cost: { label: 'Sans coût', color: 'text-gray-600', icon: Minus },
}

export default function GestionChangeOrders() {
  const { project } = useOutletContext<{ project: Project }>()
  const navigate = useNavigate()
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCO, setSelectedCO] = useState<ChangeOrder | null>(null)

  // Charger les ordres de changement
  useEffect(() => {
    loadChangeOrders()
  }, [project.id])

  const loadChangeOrders = async () => {
    try {
      const { data } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      setChangeOrders(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer
  const filtered = changeOrders.filter(co => {
    if (search) {
      const s = search.toLowerCase()
      if (!co.number.toLowerCase().includes(s) && 
          !co.title.toLowerCase().includes(s) &&
          !co.description?.toLowerCase().includes(s)) {
        return false
      }
    }
    if (statusFilter !== 'all' && co.status !== statusFilter) {
      return false
    }
    return true
  })

  // Totaux
  const totals = changeOrders.reduce((acc, co) => {
    if (co.status === 'approved') {
      if (co.type === 'addition') acc.additions += co.amount
      else if (co.type === 'deduction') acc.deductions += co.amount
    }
    if (co.status === 'submitted') acc.pending += co.amount
    return acc
  }, { additions: 0, deductions: 0, pending: 0 })

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordres de changement</h1>
          <p className="text-gray-500">Gérez les modifications au contrat original</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouvel ordre
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total ordres</p>
          <p className="text-2xl font-bold text-gray-900">{changeOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Ajouts approuvés</p>
          <p className="text-2xl font-bold text-red-600">+{formatCurrency(totals.additions)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Déductions approuvées</p>
          <p className="text-2xl font-bold text-green-600">-{formatCurrency(totals.deductions)}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      {/* Impact sur budget */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="text-blue-600" size={18} />
          Impact sur le budget
        </h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Budget original</p>
            <p className="text-xl font-bold">{formatCurrency(project.budget || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Changements nets</p>
            <p className={`text-xl font-bold ${totals.additions - totals.deductions >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totals.additions - totals.deductions >= 0 ? '+' : ''}{formatCurrency(totals.additions - totals.deductions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Budget révisé</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency((project.budget || 0) + totals.additions - totals.deductions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">% Variation</p>
            <p className={`text-xl font-bold ${totals.additions - totals.deductions >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {project.budget ? 
                ((totals.additions - totals.deductions) / project.budget * 100).toFixed(1) + '%'
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un ordre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des ordres */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Aucun ordre de changement</p>
            <p className="text-sm text-gray-400 mt-1">
              Les ordres de changement permettent de modifier le scope et le budget du projet
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(co => {
                const status = STATUS_CONFIG[co.status]
                const type = TYPE_CONFIG[co.type]
                const StatusIcon = status.icon
                const TypeIcon = type.icon

                return (
                  <tr key={co.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-teal-600">{co.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{co.title}</p>
                      {co.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{co.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-sm ${type.color}`}>
                        <TypeIcon size={14} />
                        {type.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${type.color}`}>
                      {co.type === 'addition' ? '+' : co.type === 'deduction' ? '-' : ''}{formatCurrency(co.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(co.date_requested).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedCO(co)}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                      >
                        <Eye size={16} className="text-gray-400" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajouter */}
      {showAddModal && (
        <AddChangeOrderModal 
          projectId={project.id}
          nextNumber={`CO-${String(changeOrders.length + 1).padStart(3, '0')}`}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false)
            loadChangeOrders()
          }}
        />
      )}

      {/* Modal Détails */}
      {selectedCO && (
        <ChangeOrderDetailsModal
          changeOrder={selectedCO}
          onClose={() => setSelectedCO(null)}
          onUpdate={() => {
            setSelectedCO(null)
            loadChangeOrders()
          }}
        />
      )}
    </div>
  )
}

// Modal Ajouter un ordre de changement
function AddChangeOrderModal({ projectId, nextNumber, onClose, onSave }: {
  projectId: string
  nextNumber: string
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    number: nextNumber,
    title: '',
    description: '',
    type: 'addition' as 'addition' | 'deduction' | 'no_cost',
    amount: '',
    reason: '',
    date_required: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('change_orders')
        .insert({
          project_id: projectId,
          number: form.number,
          title: form.title,
          description: form.description,
          type: form.type,
          amount: parseFloat(form.amount) || 0,
          status: 'draft',
          reason: form.reason,
          date_requested: new Date().toISOString(),
          date_required: form.date_required || null
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
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nouvel ordre de changement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="addition">Ajout (+)</option>
                <option value="deduction">Déduction (-)</option>
                <option value="no_cost">Sans coût</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Ex: Ajout d'un escalier supplémentaire"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Détails du changement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant ($)
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Demande du client / Condition de site / etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date requise</label>
            <input
              type="date"
              value={form.date_required}
              onChange={(e) => setForm({ ...form, date_required: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <span className="animate-spin">⏳</span> : <Save size={16} />}
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Détails d'un ordre
function ChangeOrderDetailsModal({ changeOrder, onClose, onUpdate }: {
  changeOrder: ChangeOrder
  onClose: () => void
  onUpdate: () => void
}) {
  const [status, setStatus] = useState(changeOrder.status)
  const [saving, setSaving] = useState(false)
  const statusConfig = STATUS_CONFIG[changeOrder.status]
  const typeConfig = TYPE_CONFIG[changeOrder.type]

  const updateStatus = async (newStatus: string) => {
    setSaving(true)
    try {
      const updates: any = { status: newStatus }
      if (newStatus === 'approved') {
        updates.date_approved = new Date().toISOString()
      }

      const { error } = await supabase
        .from('change_orders')
        .update(updates)
        .eq('id', changeOrder.id)

      if (error) throw error
      onUpdate()
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-lg font-bold text-teal-600">{changeOrder.number}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <h2 className="text-xl font-bold">{changeOrder.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className={`font-medium flex items-center gap-2 ${typeConfig.color}`}>
              <typeConfig.icon size={16} />
              {typeConfig.label}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Montant</p>
            <p className={`text-xl font-bold ${typeConfig.color}`}>
              {changeOrder.type === 'addition' ? '+' : changeOrder.type === 'deduction' ? '-' : ''}{formatCurrency(changeOrder.amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date demandée</p>
            <p className="font-medium">{new Date(changeOrder.date_requested).toLocaleDateString('fr-CA')}</p>
          </div>
          {changeOrder.date_approved && (
            <div>
              <p className="text-sm text-gray-500">Date approuvée</p>
              <p className="font-medium">{new Date(changeOrder.date_approved).toLocaleDateString('fr-CA')}</p>
            </div>
          )}
        </div>

        {changeOrder.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-700">{changeOrder.description}</p>
          </div>
        )}

        {changeOrder.reason && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Raison</p>
            <p className="text-gray-700">{changeOrder.reason}</p>
          </div>
        )}

        {/* Actions */}
        {changeOrder.status === 'draft' && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => updateStatus('submitted')}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Soumettre pour approbation
            </button>
          </div>
        )}

        {changeOrder.status === 'submitted' && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => updateStatus('approved')}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approuver
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
