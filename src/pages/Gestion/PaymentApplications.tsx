/**
 * DAST Solutions - Phase 3: Demandes de Paiement
 * Facturation progressive avec retenues et approbations
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, Receipt, Clock, CheckCircle, XCircle,
  DollarSign, Calendar, User, Eye, Edit2, Trash2, Download,
  Send, FileText, Building2, Percent, Calculator, AlertTriangle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  budget?: number
  client_name?: string
}

interface PaymentApplication {
  id: string
  project_id: string
  pa_number: string
  period_from: string
  period_to: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'paid' | 'rejected'
  
  // Montants
  original_contract: number
  approved_changes: number
  current_contract: number
  work_completed_previous: number
  work_completed_current: number
  work_completed_total: number
  materials_stored: number
  gross_amount: number
  holdback_percent: number
  holdback_amount: number
  less_previous_payments: number
  net_amount_due: number
  
  // Détails par division
  line_items?: PaymentLineItem[]
  
  // Workflow
  submitted_date?: string
  submitted_by?: string
  reviewed_date?: string
  reviewed_by?: string
  approved_date?: string
  approved_by?: string
  paid_date?: string
  
  notes?: string
  created_at: string
}

interface PaymentLineItem {
  id: string
  division_code: string
  description: string
  scheduled_value: number
  work_completed_previous: number
  work_completed_current: number
  materials_stored: number
  total_completed: number
  percent_complete: number
  balance_to_finish: number
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-700', icon: Send },
  under_review: { label: 'En révision', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  paid: { label: 'Payé', color: 'bg-teal-100 text-teal-700', icon: DollarSign },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle }
}

const DEFAULT_LINE_ITEMS = [
  { code: '01', description: 'Conditions générales' },
  { code: '02', description: 'Travaux de site' },
  { code: '03', description: 'Béton' },
  { code: '04', description: 'Maçonnerie' },
  { code: '05', description: 'Métaux' },
  { code: '06', description: 'Bois et plastiques' },
  { code: '07', description: 'Protection thermique' },
  { code: '08', description: 'Portes et fenêtres' },
  { code: '09', description: 'Finitions' },
  { code: '21', description: 'Protection incendie' },
  { code: '22', description: 'Plomberie' },
  { code: '23', description: 'CVAC' },
  { code: '26', description: 'Électricité' },
]

export default function PaymentApplications() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<PaymentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPA, setSelectedPA] = useState<PaymentApplication | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary')

  // Formulaire nouvelle demande
  const [form, setForm] = useState({
    period_from: '',
    period_to: '',
    holdback_percent: 10,
    line_items: DEFAULT_LINE_ITEMS.map(item => ({
      division_code: item.code,
      description: item.description,
      scheduled_value: 0,
      work_completed_previous: 0,
      work_completed_current: 0,
      materials_stored: 0
    })),
    notes: ''
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

      const { data: paData } = await supabase
        .from('payment_applications')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setApplications(paData || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Générer numéro
  const getNextPANumber = () => {
    const existingNumbers = applications.map(pa => {
      const match = pa.pa_number.match(/PA-(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const maxNumber = Math.max(0, ...existingNumbers)
    return `PA-${String(maxNumber + 1).padStart(3, '0')}`
  }

  // Calculer les totaux du formulaire
  const calculateFormTotals = () => {
    const previousPA = applications.find(pa => pa.status === 'paid' || pa.status === 'approved')
    const previousPayments = previousPA?.net_amount_due || 0

    const totals = form.line_items.reduce((acc, item) => ({
      scheduled: acc.scheduled + item.scheduled_value,
      workPrevious: acc.workPrevious + item.work_completed_previous,
      workCurrent: acc.workCurrent + item.work_completed_current,
      materials: acc.materials + item.materials_stored
    }), { scheduled: 0, workPrevious: 0, workCurrent: 0, materials: 0 })

    const workCompletedTotal = totals.workPrevious + totals.workCurrent
    const grossAmount = workCompletedTotal + totals.materials
    const holdbackAmount = grossAmount * (form.holdback_percent / 100)
    const netAmountDue = grossAmount - holdbackAmount - previousPayments

    return {
      originalContract: project?.budget || 0,
      approvedChanges: 0, // À relier aux ordres de changement
      currentContract: project?.budget || 0,
      workCompletedPrevious: totals.workPrevious,
      workCompletedCurrent: totals.workCurrent,
      workCompletedTotal,
      materialsStored: totals.materials,
      grossAmount,
      holdbackPercent: form.holdback_percent,
      holdbackAmount,
      lessPreviousPayments: previousPayments,
      netAmountDue
    }
  }

  // Sauvegarder
  const handleSave = async () => {
    if (!projectId) return

    const totals = calculateFormTotals()

    const newPA = {
      project_id: projectId,
      pa_number: getNextPANumber(),
      period_from: form.period_from,
      period_to: form.period_to,
      status: 'draft' as const,
      original_contract: totals.originalContract,
      approved_changes: totals.approvedChanges,
      current_contract: totals.currentContract,
      work_completed_previous: totals.workCompletedPrevious,
      work_completed_current: totals.workCompletedCurrent,
      work_completed_total: totals.workCompletedTotal,
      materials_stored: totals.materialsStored,
      gross_amount: totals.grossAmount,
      holdback_percent: totals.holdbackPercent,
      holdback_amount: totals.holdbackAmount,
      less_previous_payments: totals.lessPreviousPayments,
      net_amount_due: totals.netAmountDue,
      line_items: form.line_items.map(item => ({
        ...item,
        total_completed: item.work_completed_previous + item.work_completed_current + item.materials_stored,
        percent_complete: item.scheduled_value > 0 
          ? ((item.work_completed_previous + item.work_completed_current + item.materials_stored) / item.scheduled_value) * 100 
          : 0,
        balance_to_finish: item.scheduled_value - (item.work_completed_previous + item.work_completed_current)
      })),
      notes: form.notes
    }

    const { data, error } = await supabase
      .from('payment_applications')
      .insert(newPA)
      .select()
      .single()

    if (!error && data) {
      setApplications([data, ...applications])
      setShowModal(false)
      resetForm()
    }
  }

  // Soumettre
  const submitPA = async (pa: PaymentApplication) => {
    const { error } = await supabase
      .from('payment_applications')
      .update({ 
        status: 'submitted',
        submitted_date: new Date().toISOString()
      })
      .eq('id', pa.id)

    if (!error) loadData()
  }

  // Approuver
  const approvePA = async (pa: PaymentApplication) => {
    const { error } = await supabase
      .from('payment_applications')
      .update({ 
        status: 'approved',
        approved_date: new Date().toISOString()
      })
      .eq('id', pa.id)

    if (!error) {
      loadData()
      setShowDetailModal(false)
    }
  }

  // Marquer comme payé
  const markAsPaid = async (pa: PaymentApplication) => {
    const { error } = await supabase
      .from('payment_applications')
      .update({ 
        status: 'paid',
        paid_date: new Date().toISOString()
      })
      .eq('id', pa.id)

    if (!error) {
      loadData()
      setShowDetailModal(false)
    }
  }

  const resetForm = () => {
    setForm({
      period_from: '',
      period_to: '',
      holdback_percent: 10,
      line_items: DEFAULT_LINE_ITEMS.map(item => ({
        division_code: item.code,
        description: item.description,
        scheduled_value: 0,
        work_completed_previous: 0,
        work_completed_current: 0,
        materials_stored: 0
      })),
      notes: ''
    })
  }

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(pa => ['submitted', 'under_review'].includes(pa.status)).length,
    approved: applications.filter(pa => pa.status === 'approved').length,
    paid: applications.filter(pa => pa.status === 'paid').length,
    totalPaid: applications
      .filter(pa => pa.status === 'paid')
      .reduce((sum, pa) => sum + pa.net_amount_due, 0),
    totalPending: applications
      .filter(pa => ['submitted', 'under_review', 'approved'].includes(pa.status))
      .reduce((sum, pa) => sum + pa.net_amount_due, 0)
  }

  const percentPaid = project?.budget ? (stats.totalPaid / project.budget) * 100 : 0

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
          <h1 className="text-2xl font-bold text-gray-900">Demandes de paiement</h1>
          <p className="text-gray-500">{project?.name} • Client: {project?.client_name || 'N/A'}</p>
        </div>
        <button
          onClick={() => {/* Export PDF */}}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download size={16} />
          Export PDF
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Demandes</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Payées</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total payé</p>
          <p className="text-xl font-bold text-green-600">
            {stats.totalPaid.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">% Facturé</p>
          <p className="text-xl font-bold">{percentPaid.toFixed(1)}%</p>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${Math.min(percentPaid, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">N°</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Période</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Travaux complétés</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Retenue</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Montant net</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <Receipt className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>Aucune demande de paiement</p>
                </td>
              </tr>
            ) : (
              applications.map(pa => {
                const status = STATUS_CONFIG[pa.status]
                const StatusIcon = status.icon
                return (
                  <tr key={pa.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium">{pa.pa_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">
                        {new Date(pa.period_from).toLocaleDateString('fr-CA')} - {new Date(pa.period_to).toLocaleDateString('fr-CA')}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pa.work_completed_total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-500">
                      -{pa.holdback_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      <span className="text-xs ml-1">({pa.holdback_percent}%)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-600">
                      {pa.net_amount_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPA(pa)
                            setShowDetailModal(true)
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Voir détails"
                        >
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        {pa.status === 'draft' && (
                          <button
                            onClick={() => submitPA(pa)}
                            className="p-1.5 hover:bg-blue-100 rounded"
                            title="Soumettre"
                          >
                            <Send size={16} className="text-blue-500" />
                          </button>
                        )}
                        <button
                          onClick={() => {/* Download PDF */}}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Télécharger PDF"
                        >
                          <Download size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Résumé retenues */}
      {applications.some(pa => pa.status === 'paid') && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Percent className="text-amber-600" size={20} />
            Retenues accumulées
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total des retenues</p>
              <p className="text-xl font-bold text-amber-600">
                {applications
                  .filter(pa => pa.status === 'paid')
                  .reduce((sum, pa) => sum + pa.holdback_amount, 0)
                  .toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Libération prévue</p>
              <p className="text-lg font-medium">À la fin des travaux</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux de retenue</p>
              <p className="text-lg font-medium">10% (standard Québec)</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Nouvelle demande de paiement</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Période */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Période du</label>
                  <input
                    type="date"
                    value={form.period_from}
                    onChange={(e) => setForm({...form, period_from: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Au</label>
                  <input
                    type="date"
                    value={form.period_to}
                    onChange={(e) => setForm({...form, period_to: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Retenue (%)</label>
                  <input
                    type="number"
                    value={form.holdback_percent}
                    onChange={(e) => setForm({...form, holdback_percent: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Tableau des items */}
              <div>
                <h3 className="font-semibold mb-3">Détail par division</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium">Division</th>
                        <th className="text-right py-2 px-3 font-medium">Valeur planifiée</th>
                        <th className="text-right py-2 px-3 font-medium">Travaux précédents</th>
                        <th className="text-right py-2 px-3 font-medium">Travaux période</th>
                        <th className="text-right py-2 px-3 font-medium">Matériaux stockés</th>
                        <th className="text-right py-2 px-3 font-medium">Total</th>
                        <th className="text-right py-2 px-3 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-x border-b">
                      {form.line_items.map((item, idx) => {
                        const total = item.work_completed_previous + item.work_completed_current + item.materials_stored
                        const percent = item.scheduled_value > 0 ? (total / item.scheduled_value) * 100 : 0
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3">
                              <span className="font-mono text-xs text-gray-500">{item.division_code}</span>
                              <span className="ml-2">{item.description}</span>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={item.scheduled_value || ''}
                                onChange={(e) => {
                                  const newItems = [...form.line_items]
                                  newItems[idx].scheduled_value = parseFloat(e.target.value) || 0
                                  setForm({...form, line_items: newItems})
                                }}
                                className="w-24 px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={item.work_completed_previous || ''}
                                onChange={(e) => {
                                  const newItems = [...form.line_items]
                                  newItems[idx].work_completed_previous = parseFloat(e.target.value) || 0
                                  setForm({...form, line_items: newItems})
                                }}
                                className="w-24 px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={item.work_completed_current || ''}
                                onChange={(e) => {
                                  const newItems = [...form.line_items]
                                  newItems[idx].work_completed_current = parseFloat(e.target.value) || 0
                                  setForm({...form, line_items: newItems})
                                }}
                                className="w-24 px-2 py-1 border rounded text-right bg-blue-50"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={item.materials_stored || ''}
                                onChange={(e) => {
                                  const newItems = [...form.line_items]
                                  newItems[idx].materials_stored = parseFloat(e.target.value) || 0
                                  setForm({...form, line_items: newItems})
                                }}
                                className="w-24 px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-medium">
                              {total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={percent > 100 ? 'text-red-600' : ''}>{percent.toFixed(0)}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Résumé des calculs */}
              {(() => {
                const totals = calculateFormTotals()
                return (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Résumé de la demande</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contrat original:</span>
                          <span className="font-medium">{totals.originalContract.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ordres de changement:</span>
                          <span className="font-medium">{totals.approvedChanges.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-medium">Contrat actuel:</span>
                          <span className="font-bold">{totals.currentContract.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Travaux complétés (période):</span>
                          <span className="font-medium">{totals.workCompletedCurrent.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Matériaux stockés:</span>
                          <span className="font-medium">{totals.materialsStored.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Montant brut:</span>
                          <span className="font-medium">{totals.grossAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Retenue ({totals.holdbackPercent}%):</span>
                          <span>-{totals.holdbackAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>Moins paiements précédents:</span>
                          <span>-{totals.lessPreviousPayments.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-bold text-lg">MONTANT NET DÛ:</span>
                          <span className="font-bold text-lg text-teal-600">
                            {totals.netAmountDue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Notes additionnelles..."
                />
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
                disabled={!form.period_from || !form.period_to}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailModal && selectedPA && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div>
                <span className="text-sm text-gray-500 font-mono">{selectedPA.pa_number}</span>
                <h2 className="text-xl font-bold">
                  Période: {new Date(selectedPA.period_from).toLocaleDateString('fr-CA')} - {new Date(selectedPA.period_to).toLocaleDateString('fr-CA')}
                </h2>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut */}
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[selectedPA.status].color}`}>
                  {React.createElement(STATUS_CONFIG[selectedPA.status].icon, { size: 14 })}
                  {STATUS_CONFIG[selectedPA.status].label}
                </span>
              </div>

              {/* Résumé financier */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contrat actuel:</span>
                  <span className="font-medium">{selectedPA.current_contract.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travaux complétés (total):</span>
                  <span className="font-medium">{selectedPA.work_completed_total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travaux cette période:</span>
                  <span className="font-medium text-blue-600">{selectedPA.work_completed_current.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matériaux stockés:</span>
                  <span className="font-medium">{selectedPA.materials_stored.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Retenue ({selectedPA.holdback_percent}%):</span>
                  <span>-{selectedPA.holdback_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-bold text-lg">Montant net dû:</span>
                  <span className="font-bold text-lg text-teal-600">
                    {selectedPA.net_amount_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedPA.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-gray-600">{selectedPA.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              {selectedPA.status === 'submitted' && (
                <button
                  onClick={() => approvePA(selectedPA)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approuver
                </button>
              )}
              {selectedPA.status === 'approved' && (
                <button
                  onClick={() => markAsPaid(selectedPA)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  Marquer comme payé
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
