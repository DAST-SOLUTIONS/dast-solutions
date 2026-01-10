/**
 * DAST Solutions - Phase 3: Ordres de Changement Avancés
 * Gestion complète des Change Orders avec workflow et impacts
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, FileText, Clock, CheckCircle, XCircle,
  AlertTriangle, DollarSign, Calendar, User, Edit2, Trash2, Eye,
  Filter, Download, TrendingUp, TrendingDown, RotateCcw, Send,
  MessageSquare, Paperclip, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface Project {
  id: string
  name: string
  budget?: number
}

interface ChangeOrder {
  id: string
  project_id: string
  co_number: string
  title: string
  description: string
  reason: 'owner_request' | 'design_change' | 'unforeseen' | 'error_omission' | 'value_engineering' | 'regulatory'
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'void'
  priority: 'low' | 'medium' | 'high' | 'critical'
  requested_by: string
  requested_date: string
  amount: number
  original_amount?: number
  cost_breakdown?: {
    labor: number
    materials: number
    equipment: number
    subcontractor: number
    overhead: number
    profit: number
  }
  schedule_impact_days: number
  affected_divisions: string[]
  attachments?: string[]
  approval_history?: {
    date: string
    user: string
    action: string
    comment: string
  }[]
  approved_by?: string
  approved_date?: string
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  pending: { label: 'En révision', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
  void: { label: 'Annulé', color: 'bg-gray-100 text-gray-500', icon: RotateCcw }
}

const REASON_CONFIG = {
  owner_request: { label: 'Demande du propriétaire', color: 'text-blue-600' },
  design_change: { label: 'Changement de design', color: 'text-purple-600' },
  unforeseen: { label: 'Condition imprévue', color: 'text-amber-600' },
  error_omission: { label: 'Erreur / Omission', color: 'text-red-600' },
  value_engineering: { label: 'Ingénierie de valeur', color: 'text-green-600' },
  regulatory: { label: 'Exigence réglementaire', color: 'text-gray-600' }
}

const DIVISIONS = [
  { code: '01', name: 'Conditions générales' },
  { code: '02', name: 'Travaux de site' },
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois et plastiques' },
  { code: '07', name: 'Protection thermique' },
  { code: '08', name: 'Portes et fenêtres' },
  { code: '09', name: 'Finitions' },
  { code: '21', name: 'Protection incendie' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVAC' },
  { code: '26', name: 'Électricité' },
]

export default function ChangeOrdersAdvanced() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCO, setSelectedCO] = useState<ChangeOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Formulaire
  const [form, setForm] = useState({
    title: '',
    description: '',
    reason: 'owner_request' as ChangeOrder['reason'],
    priority: 'medium' as ChangeOrder['priority'],
    requested_by: '',
    requested_date: new Date().toISOString().split('T')[0],
    amount: 0,
    schedule_impact_days: 0,
    affected_divisions: [] as string[],
    cost_breakdown: {
      labor: 0,
      materials: 0,
      equipment: 0,
      subcontractor: 0,
      overhead: 0,
      profit: 0
    }
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (projectData) setProject(projectData)

      const { data: coData } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setChangeOrders(coData || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Générer le prochain numéro CO
  const getNextCONumber = () => {
    const existingNumbers = changeOrders.map(co => {
      const match = co.co_number.match(/CO-(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const maxNumber = Math.max(0, ...existingNumbers)
    return `CO-${String(maxNumber + 1).padStart(4, '0')}`
  }

  // Calculer le total du breakdown
  const calculateBreakdownTotal = () => {
    return Object.values(form.cost_breakdown).reduce((sum, val) => sum + val, 0)
  }

  // Sauvegarder
  const handleSave = async () => {
    if (!projectId) return

    const newCO = {
      project_id: projectId,
      co_number: getNextCONumber(),
      title: form.title,
      description: form.description,
      reason: form.reason,
      status: 'draft' as const,
      priority: form.priority,
      requested_by: form.requested_by,
      requested_date: form.requested_date,
      amount: form.amount || calculateBreakdownTotal(),
      original_amount: form.amount || calculateBreakdownTotal(),
      cost_breakdown: form.cost_breakdown,
      schedule_impact_days: form.schedule_impact_days,
      affected_divisions: form.affected_divisions
    }

    const { data, error } = await supabase
      .from('change_orders')
      .insert(newCO)
      .select()
      .single()

    if (!error && data) {
      setChangeOrders([data, ...changeOrders])
      setShowModal(false)
      resetForm()
    }
  }

  // Soumettre pour approbation
  const submitForApproval = async (co: ChangeOrder) => {
    const { error } = await supabase
      .from('change_orders')
      .update({ status: 'pending' })
      .eq('id', co.id)

    if (!error) {
      loadData()
    }
  }

  // Approuver
  const approveCO = async (co: ChangeOrder) => {
    const { error } = await supabase
      .from('change_orders')
      .update({ 
        status: 'approved',
        approved_date: new Date().toISOString()
      })
      .eq('id', co.id)

    if (!error) {
      loadData()
      setShowDetailModal(false)
    }
  }

  // Rejeter
  const rejectCO = async (co: ChangeOrder) => {
    const { error } = await supabase
      .from('change_orders')
      .update({ status: 'rejected' })
      .eq('id', co.id)

    if (!error) {
      loadData()
      setShowDetailModal(false)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      reason: 'owner_request',
      priority: 'medium',
      requested_by: '',
      requested_date: new Date().toISOString().split('T')[0],
      amount: 0,
      schedule_impact_days: 0,
      affected_divisions: [],
      cost_breakdown: {
        labor: 0,
        materials: 0,
        equipment: 0,
        subcontractor: 0,
        overhead: 0,
        profit: 0
      }
    })
  }

  // Stats
  const stats = {
    total: changeOrders.length,
    pending: changeOrders.filter(co => co.status === 'pending').length,
    approved: changeOrders.filter(co => co.status === 'approved').length,
    totalApprovedAmount: changeOrders
      .filter(co => co.status === 'approved')
      .reduce((sum, co) => sum + co.amount, 0),
    totalPendingAmount: changeOrders
      .filter(co => co.status === 'pending')
      .reduce((sum, co) => sum + co.amount, 0),
    totalScheduleImpact: changeOrders
      .filter(co => co.status === 'approved')
      .reduce((sum, co) => sum + co.schedule_impact_days, 0)
  }

  // Filtrer
  const filtered = changeOrders.filter(co => {
    if (filterStatus && co.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return co.co_number.toLowerCase().includes(q) ||
             co.title.toLowerCase().includes(q) ||
             co.description?.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/project/${projectId}?tab=finances`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Ordres de changement</h1>
          <p className="text-gray-500">{project?.name}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouvel ordre
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En révision</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Approuvés</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Montant approuvé</p>
          <p className={`text-xl font-bold ${stats.totalApprovedAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalApprovedAmount >= 0 ? '+' : ''}{stats.totalApprovedAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Impact échéancier</p>
          <p className={`text-xl font-bold ${stats.totalScheduleImpact > 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {stats.totalScheduleImpact > 0 ? '+' : ''}{stats.totalScheduleImpact} jours
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">N°</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Titre</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Raison</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Montant</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Délai</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Date</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>Aucun ordre de changement</p>
                </td>
              </tr>
            ) : (
              filtered.map(co => {
                const status = STATUS_CONFIG[co.status]
                const reason = REASON_CONFIG[co.reason]
                const StatusIcon = status.icon
                return (
                  <tr key={co.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium">{co.co_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{co.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{co.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${reason.color}`}>{reason.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${co.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {co.amount >= 0 ? '+' : ''}{co.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                    </td>
                    <td className={`py-3 px-4 text-center ${co.schedule_impact_days > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {co.schedule_impact_days > 0 ? '+' : ''}{co.schedule_impact_days}j
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {new Date(co.requested_date).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedCO(co)
                            setShowDetailModal(true)
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        {co.status === 'draft' && (
                          <button
                            onClick={() => submitForApproval(co)}
                            className="p-1.5 hover:bg-blue-100 rounded"
                            title="Soumettre"
                          >
                            <Send size={16} className="text-blue-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Impact sur budget */}
      {stats.totalApprovedAmount !== 0 && (
        <div className={`mt-6 rounded-xl border p-6 ${stats.totalApprovedAmount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            {stats.totalApprovedAmount > 0 ? (
              <ArrowUpRight className="text-amber-600" size={20} />
            ) : (
              <ArrowDownRight className="text-green-600" size={20} />
            )}
            Impact sur le budget
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Budget initial</p>
              <p className="text-xl font-bold">
                {(project?.budget || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ordres de changement</p>
              <p className={`text-xl font-bold ${stats.totalApprovedAmount >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {stats.totalApprovedAmount >= 0 ? '+' : ''}{stats.totalApprovedAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget révisé</p>
              <p className="text-xl font-bold">
                {((project?.budget || 0) + stats.totalApprovedAmount).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Nouvel ordre de changement</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Modification des fondations - Section B"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Détails du changement..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Raison</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({...form, reason: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(REASON_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({...form, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Demandé par</label>
                  <input
                    type="text"
                    value={form.requested_by}
                    onChange={(e) => setForm({...form, requested_by: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nom du demandeur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de demande</label>
                  <input
                    type="date"
                    value={form.requested_date}
                    onChange={(e) => setForm({...form, requested_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Ventilation des coûts */}
              <div>
                <h3 className="font-semibold mb-3">Ventilation des coûts</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'labor', label: 'Main d\'œuvre' },
                    { key: 'materials', label: 'Matériaux' },
                    { key: 'equipment', label: 'Équipement' },
                    { key: 'subcontractor', label: 'Sous-traitants' },
                    { key: 'overhead', label: 'Frais généraux' },
                    { key: 'profit', label: 'Profit' },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="block text-sm text-gray-600 mb-1">{item.label}</label>
                      <input
                        type="number"
                        value={form.cost_breakdown[item.key as keyof typeof form.cost_breakdown]}
                        onChange={(e) => setForm({
                          ...form,
                          cost_breakdown: {
                            ...form.cost_breakdown,
                            [item.key]: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                  <span className="font-medium">Total ventilation:</span>
                  <span className="text-xl font-bold">
                    {calculateBreakdownTotal().toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
              </div>

              {/* Montant et impact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Montant total (ou laisser vide pour utiliser ventilation)
                  </label>
                  <input
                    type="number"
                    value={form.amount || ''}
                    onChange={(e) => setForm({...form, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder={calculateBreakdownTotal().toString()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Impact sur échéancier (jours)</label>
                  <input
                    type="number"
                    value={form.schedule_impact_days}
                    onChange={(e) => setForm({...form, schedule_impact_days: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Divisions affectées */}
              <div>
                <label className="block text-sm font-medium mb-2">Divisions affectées</label>
                <div className="flex flex-wrap gap-2">
                  {DIVISIONS.map(div => (
                    <label
                      key={div.code}
                      className={`px-3 py-1.5 rounded-full border cursor-pointer text-sm ${
                        form.affected_divisions.includes(div.code)
                          ? 'bg-teal-100 border-teal-300 text-teal-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={form.affected_divisions.includes(div.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({...form, affected_divisions: [...form.affected_divisions, div.code]})
                          } else {
                            setForm({...form, affected_divisions: form.affected_divisions.filter(d => d !== div.code)})
                          }
                        }}
                      />
                      {div.code} - {div.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer l'ordre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailModal && selectedCO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div>
                <span className="text-sm text-gray-500 font-mono">{selectedCO.co_number}</span>
                <h2 className="text-xl font-bold">{selectedCO.title}</h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut et raison */}
              <div className="flex gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedCO.status].color}`}>
                  {React.createElement(STATUS_CONFIG[selectedCO.status].icon, { size: 14 })}
                  {STATUS_CONFIG[selectedCO.status].label}
                </span>
                <span className={`text-sm ${REASON_CONFIG[selectedCO.reason].color}`}>
                  {REASON_CONFIG[selectedCO.reason].label}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-600">{selectedCO.description || 'Aucune description'}</p>
              </div>

              {/* Montants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className={`text-2xl font-bold ${selectedCO.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedCO.amount >= 0 ? '+' : ''}{selectedCO.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Impact échéancier</p>
                  <p className={`text-2xl font-bold ${selectedCO.schedule_impact_days > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {selectedCO.schedule_impact_days > 0 ? '+' : ''}{selectedCO.schedule_impact_days} jours
                  </p>
                </div>
              </div>

              {/* Ventilation si disponible */}
              {selectedCO.cost_breakdown && (
                <div>
                  <h4 className="font-medium mb-2">Ventilation des coûts</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedCO.cost_breakdown).map(([key, value]) => (
                      <div key={key} className="p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-500 capitalize">{key}:</span>
                        <span className="font-medium ml-2">
                          {(value as number).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Demandé par:</span>
                  <span className="ml-2 font-medium">{selectedCO.requested_by || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date de demande:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedCO.requested_date).toLocaleDateString('fr-CA')}
                  </span>
                </div>
                {selectedCO.approved_date && (
                  <div>
                    <span className="text-gray-500">Date d'approbation:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedCO.approved_date).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedCO.status === 'pending' && (
              <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => rejectCO(selectedCO)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Rejeter
                </button>
                <button
                  onClick={() => approveCO(selectedCO)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approuver
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
