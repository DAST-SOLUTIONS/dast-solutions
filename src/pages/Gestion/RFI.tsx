/**
 * DAST Solutions - Module RFI (Request for Information)
 * Gestion des demandes d'information entre parties prenantes
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, MessageSquare, Clock, CheckCircle, AlertTriangle,
  Send, User, Calendar, Paperclip, X, Filter, Download, Eye,
  Edit2, Trash2, ChevronDown, Building2, ArrowRight, FileText, ArrowLeft
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface RFI {
  id: string
  project_id: string
  rfi_number: string
  subject: string
  question: string
  response?: string
  status: 'draft' | 'open' | 'pending' | 'answered' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  discipline: string
  location?: string
  drawing_reference?: string
  spec_reference?: string
  cost_impact?: boolean
  schedule_impact?: boolean
  requested_by: string
  assigned_to?: string
  due_date?: string
  responded_at?: string
  closed_at?: string
  attachments?: string[]
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  answered: { label: 'Répondu', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle }
}

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'text-gray-500' },
  medium: { label: 'Moyenne', color: 'text-blue-500' },
  high: { label: 'Haute', color: 'text-amber-500' },
  critical: { label: 'Critique', color: 'text-red-500' }
}

const DISCIPLINES = [
  'Architecture', 'Structure', 'Mécanique', 'Électricité', 'Plomberie',
  'Civil', 'Paysagement', 'Sécurité incendie', 'Enveloppe', 'Intérieur', 'Autre'
]

export default function GestionRFI() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [rfis, setRfis] = useState<RFI[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Charger le projet
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (data) setProject(data)
    }
    loadProject()
  }, [projectId])

  // Formulaire
  const [form, setForm] = useState({
    subject: '',
    question: '',
    discipline: '',
    location: '',
    drawing_reference: '',
    spec_reference: '',
    priority: 'medium' as RFI['priority'],
    assigned_to: '',
    due_date: '',
    cost_impact: false,
    schedule_impact: false
  })

  useEffect(() => {
    if (projectId) loadRFIs()
  }, [projectId])

  const loadRFIs = async () => {
    if (!projectId) return
    try {
      const { data } = await supabase
        .from('rfis')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setRfis(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateRFINumber = () => {
    const count = rfis.length + 1
    return `RFI-${String(count).padStart(4, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.subject || !form.question) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const rfiData = {
        project_id: projectId,
        rfi_number: selectedRFI ? selectedRFI.rfi_number : generateRFINumber(),
        subject: form.subject,
        question: form.question,
        discipline: form.discipline,
        location: form.location,
        drawing_reference: form.drawing_reference,
        spec_reference: form.spec_reference,
        priority: form.priority,
        assigned_to: form.assigned_to,
        due_date: form.due_date || null,
        cost_impact: form.cost_impact,
        schedule_impact: form.schedule_impact,
        status: 'open' as const,
        requested_by: user?.email || 'Utilisateur'
      }

      if (selectedRFI) {
        await supabase
          .from('rfis')
          .update(rfiData)
          .eq('id', selectedRFI.id)
      } else {
        await supabase
          .from('rfis')
          .insert(rfiData)
      }

      await loadRFIs()
      resetForm()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleResponse = async (rfiId: string, response: string) => {
    try {
      await supabase
        .from('rfis')
        .update({
          response,
          status: 'answered',
          responded_at: new Date().toISOString()
        })
        .eq('id', rfiId)

      await loadRFIs()
      if (selectedRFI?.id === rfiId) {
        setSelectedRFI({ ...selectedRFI, response, status: 'answered' })
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleClose = async (rfiId: string) => {
    try {
      await supabase
        .from('rfis')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', rfiId)

      await loadRFIs()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (rfiId: string) => {
    if (!confirm('Supprimer ce RFI?')) return

    try {
      await supabase.from('rfis').delete().eq('id', rfiId)
      await loadRFIs()
      if (selectedRFI?.id === rfiId) {
        setSelectedRFI(null)
        setViewMode('list')
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const resetForm = () => {
    setForm({
      subject: '',
      question: '',
      discipline: '',
      location: '',
      drawing_reference: '',
      spec_reference: '',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      cost_impact: false,
      schedule_impact: false
    })
    setSelectedRFI(null)
  }

  const openEdit = (rfi: RFI) => {
    setSelectedRFI(rfi)
    setForm({
      subject: rfi.subject,
      question: rfi.question,
      discipline: rfi.discipline,
      location: rfi.location || '',
      drawing_reference: rfi.drawing_reference || '',
      spec_reference: rfi.spec_reference || '',
      priority: rfi.priority,
      assigned_to: rfi.assigned_to || '',
      due_date: rfi.due_date || '',
      cost_impact: rfi.cost_impact || false,
      schedule_impact: rfi.schedule_impact || false
    })
    setShowModal(true)
  }

  const filteredRFIs = rfis.filter(rfi => {
    if (filterStatus && rfi.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return rfi.subject.toLowerCase().includes(q) ||
        rfi.rfi_number.toLowerCase().includes(q) ||
        rfi.question.toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const stats = {
    total: rfis.length,
    open: rfis.filter(r => r.status === 'open').length,
    pending: rfis.filter(r => r.status === 'pending').length,
    answered: rfis.filter(r => r.status === 'answered').length,
    overdue: rfis.filter(r => r.due_date && new Date(r.due_date) < new Date() && r.status !== 'closed').length
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes d'information (RFI)</h1>
          <p className="text-gray-500">Gérez les questions et clarifications du projet</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouveau RFI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total RFIs</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
          <p className="text-sm text-gray-500">Ouverts</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">En attente</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
          <p className="text-sm text-gray-500">Répondus</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          <p className="text-sm text-gray-500">En retard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par numéro, sujet..."
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

      {/* Liste RFIs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">N°</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sujet</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Discipline</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Priorité</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Échéance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigné</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRFIs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <MessageSquare className="mx-auto mb-4 text-gray-300" size={48} />
                  <p>Aucun RFI créé</p>
                </td>
              </tr>
            ) : (
              filteredRFIs.map(rfi => {
                const statusConfig = STATUS_CONFIG[rfi.status]
                const priorityConfig = PRIORITY_CONFIG[rfi.priority]
                const isOverdue = rfi.due_date && new Date(rfi.due_date) < new Date() && rfi.status !== 'closed'
                const StatusIcon = statusConfig.icon

                return (
                  <tr key={rfi.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-teal-600">{rfi.rfi_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{rfi.subject}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{rfi.question}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{rfi.discipline || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {rfi.due_date ? (
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(rfi.due_date).toLocaleDateString('fr-CA')}
                          {isOverdue && ' ⚠️'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{rfi.assigned_to || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setSelectedRFI(rfi); setViewMode('detail') }}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Voir"
                        >
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => openEdit(rfi)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(rfi.id)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-500" />
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

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {selectedRFI ? `Modifier ${selectedRFI.rfi_number}` : 'Nouveau RFI'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sujet *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Clarification détail mur rideau"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Question / Demande *</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discipline</label>
                  <select
                    value={form.discipline}
                    onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {DISCIPLINES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Localisation</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Étage 3, Zone B"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assigné à</label>
                  <input
                    type="text"
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nom ou email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Réf. plan</label>
                  <input
                    type="text"
                    value={form.drawing_reference}
                    onChange={(e) => setForm({ ...form, drawing_reference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: A-301"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Réf. devis</label>
                  <input
                    type="text"
                    value={form.spec_reference}
                    onChange={(e) => setForm({ ...form, spec_reference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Section 08 44 13"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.cost_impact}
                    onChange={(e) => setForm({ ...form, cost_impact: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-sm">Impact sur les coûts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.schedule_impact}
                    onChange={(e) => setForm({ ...form, schedule_impact: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-sm">Impact sur l'échéancier</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.subject || !form.question}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {selectedRFI ? 'Enregistrer' : 'Créer le RFI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {viewMode === 'detail' && selectedRFI && (
        <RFIDetailModal
          rfi={selectedRFI}
          onClose={() => { setSelectedRFI(null); setViewMode('list') }}
          onResponse={handleResponse}
          onClose2={handleClose}
        />
      )}
    </div>
  )
}

// Composant Modal Détail RFI
function RFIDetailModal({
  rfi,
  onClose,
  onResponse,
  onClose2
}: {
  rfi: RFI
  onClose: () => void
  onResponse: (id: string, response: string) => void
  onClose2: (id: string) => void
}) {
  const [response, setResponse] = useState(rfi.response || '')
  const statusConfig = STATUS_CONFIG[rfi.status]
  const priorityConfig = PRIORITY_CONFIG[rfi.priority]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <span className="font-mono text-sm text-teal-600">{rfi.rfi_number}</span>
            <h2 className="text-lg font-bold">{rfi.subject}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Infos */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Priorité</p>
              <span className={`text-sm font-medium ${priorityConfig.color}`}>{priorityConfig.label}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Discipline</p>
              <p className="text-sm font-medium">{rfi.discipline || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Échéance</p>
              <p className="text-sm font-medium">{rfi.due_date ? new Date(rfi.due_date).toLocaleDateString('fr-CA') : '-'}</p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{rfi.requested_by}</span>
              <span className="text-xs text-blue-600">
                {new Date(rfi.created_at).toLocaleDateString('fr-CA')}
              </span>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{rfi.question}</p>
          </div>

          {/* Références */}
          {(rfi.location || rfi.drawing_reference || rfi.spec_reference) && (
            <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
              {rfi.location && (
                <div>
                  <p className="text-xs text-gray-500">Localisation</p>
                  <p className="text-sm font-medium">{rfi.location}</p>
                </div>
              )}
              {rfi.drawing_reference && (
                <div>
                  <p className="text-xs text-gray-500">Réf. plan</p>
                  <p className="text-sm font-medium">{rfi.drawing_reference}</p>
                </div>
              )}
              {rfi.spec_reference && (
                <div>
                  <p className="text-xs text-gray-500">Réf. devis</p>
                  <p className="text-sm font-medium">{rfi.spec_reference}</p>
                </div>
              )}
            </div>
          )}

          {/* Impacts */}
          {(rfi.cost_impact || rfi.schedule_impact) && (
            <div className="flex gap-4">
              {rfi.cost_impact && (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <AlertTriangle size={14} /> Impact coûts
                </span>
              )}
              {rfi.schedule_impact && (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Clock size={14} /> Impact échéancier
                </span>
              )}
            </div>
          )}

          {/* Réponse existante */}
          {rfi.response && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-800">Réponse</span>
                {rfi.responded_at && (
                  <span className="text-xs text-green-600">
                    {new Date(rfi.responded_at).toLocaleDateString('fr-CA')}
                  </span>
                )}
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{rfi.response}</p>
            </div>
          )}

          {/* Formulaire réponse */}
          {rfi.status !== 'closed' && (
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                {rfi.response ? 'Modifier la réponse' : 'Ajouter une réponse'}
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Votre réponse..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => onResponse(rfi.id, response)}
                  disabled={!response}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send size={16} />
                  Envoyer la réponse
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between">
          {rfi.status === 'answered' && (
            <button
              onClick={() => onClose2(rfi.id)}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              Fermer ce RFI
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 ml-auto"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
