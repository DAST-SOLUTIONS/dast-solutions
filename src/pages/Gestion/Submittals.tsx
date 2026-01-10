/**
 * DAST Solutions - Module Submittals (Documents à approuver)
 * Gestion des documents soumis par les sous-traitants pour approbation
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, FileCheck, Clock, CheckCircle, XCircle, AlertTriangle,
  Upload, User, Calendar, Paperclip, X, Filter, Download, Eye,
  Edit2, Trash2, Send, RotateCcw, FileText, Building2, ArrowLeft
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface Submittal {
  id: string
  project_id: string
  submittal_number: string
  title: string
  description?: string
  spec_section: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected'
  revision: number
  submitted_by: string
  submitted_date?: string
  due_date?: string
  reviewed_by?: string
  reviewed_date?: string
  review_comments?: string
  discipline: string
  contractor?: string
  attachments?: string[]
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-700', icon: Send },
  under_review: { label: 'En révision', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  approved_as_noted: { label: 'Approuvé avec notes', color: 'bg-lime-100 text-lime-700', icon: CheckCircle },
  revise_resubmit: { label: 'À réviser', color: 'bg-orange-100 text-orange-700', icon: RotateCcw },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle }
}

const DISCIPLINES = [
  'Architecture', 'Structure', 'Mécanique', 'Électricité', 'Plomberie',
  'Civil', 'Paysagement', 'Sécurité incendie', 'Enveloppe', 'Intérieur',
  'Équipements', 'Finitions', 'Autre'
]

const SPEC_SECTIONS = [
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois et plastiques' },
  { code: '07', name: 'Protection thermique et humidité' },
  { code: '08', name: 'Portes et fenêtres' },
  { code: '09', name: 'Finitions' },
  { code: '10', name: 'Spécialités' },
  { code: '11', name: 'Équipements' },
  { code: '12', name: 'Ameublement' },
  { code: '21', name: 'Protection incendie' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVAC' },
  { code: '26', name: 'Électricité' },
  { code: '27', name: 'Communications' },
  { code: '28', name: 'Sécurité électronique' },
  { code: '31', name: 'Terrassement' },
  { code: '32', name: 'Aménagement extérieur' },
  { code: '33', name: 'Utilités' }
]

export default function GestionSubmittals() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [submittals, setSubmittals] = useState<Submittal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDiscipline, setFilterDiscipline] = useState<string>('')
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
    title: '',
    description: '',
    spec_section: '',
    discipline: '',
    contractor: '',
    due_date: ''
  })

  // Review form
  const [reviewForm, setReviewForm] = useState({
    status: '' as Submittal['status'],
    comments: ''
  })

  useEffect(() => {
    if (projectId) loadSubmittals()
  }, [projectId])

  const loadSubmittals = async () => {
    if (!projectId) return
    try {
      const { data } = await supabase
        .from('submittals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setSubmittals(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSubmittalNumber = () => {
    const count = submittals.length + 1
    return `SUB-${String(count).padStart(4, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.title || !form.spec_section) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const submittalData = {
        project_id: projectId,
        submittal_number: selectedSubmittal ? selectedSubmittal.submittal_number : generateSubmittalNumber(),
        title: form.title,
        description: form.description,
        spec_section: form.spec_section,
        discipline: form.discipline,
        contractor: form.contractor,
        due_date: form.due_date || null,
        status: 'draft' as const,
        revision: selectedSubmittal ? selectedSubmittal.revision : 0,
        submitted_by: user?.email || 'Utilisateur'
      }

      if (selectedSubmittal) {
        await supabase
          .from('submittals')
          .update(submittalData)
          .eq('id', selectedSubmittal.id)
      } else {
        await supabase
          .from('submittals')
          .insert(submittalData)
      }

      await loadSubmittals()
      resetForm()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleSubmitForReview = async (id: string) => {
    try {
      await supabase
        .from('submittals')
        .update({
          status: 'submitted',
          submitted_date: new Date().toISOString()
        })
        .eq('id', id)

      await loadSubmittals()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleReview = async () => {
    if (!selectedSubmittal || !reviewForm.status) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('submittals')
        .update({
          status: reviewForm.status,
          review_comments: reviewForm.comments,
          reviewed_by: user?.email,
          reviewed_date: new Date().toISOString()
        })
        .eq('id', selectedSubmittal.id)

      await loadSubmittals()
      setShowReviewModal(false)
      setReviewForm({ status: '' as any, comments: '' })
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleResubmit = async (id: string) => {
    const submittal = submittals.find(s => s.id === id)
    if (!submittal) return

    try {
      await supabase
        .from('submittals')
        .update({
          status: 'submitted',
          revision: submittal.revision + 1,
          submitted_date: new Date().toISOString(),
          reviewed_by: null,
          reviewed_date: null,
          review_comments: null
        })
        .eq('id', id)

      await loadSubmittals()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce submittal?')) return

    try {
      await supabase.from('submittals').delete().eq('id', id)
      await loadSubmittals()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      spec_section: '',
      discipline: '',
      contractor: '',
      due_date: ''
    })
    setSelectedSubmittal(null)
  }

  const openEdit = (submittal: Submittal) => {
    setSelectedSubmittal(submittal)
    setForm({
      title: submittal.title,
      description: submittal.description || '',
      spec_section: submittal.spec_section,
      discipline: submittal.discipline,
      contractor: submittal.contractor || '',
      due_date: submittal.due_date || ''
    })
    setShowModal(true)
  }

  const openReview = (submittal: Submittal) => {
    setSelectedSubmittal(submittal)
    setReviewForm({
      status: '' as any,
      comments: ''
    })
    setShowReviewModal(true)
  }

  const filteredSubmittals = submittals.filter(s => {
    if (filterStatus && s.status !== filterStatus) return false
    if (filterDiscipline && s.discipline !== filterDiscipline) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.title.toLowerCase().includes(q) ||
        s.submittal_number.toLowerCase().includes(q) ||
        s.spec_section.toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const stats = {
    total: submittals.length,
    pending: submittals.filter(s => ['submitted', 'under_review'].includes(s.status)).length,
    approved: submittals.filter(s => ['approved', 'approved_as_noted'].includes(s.status)).length,
    revision: submittals.filter(s => s.status === 'revise_resubmit').length,
    rejected: submittals.filter(s => s.status === 'rejected').length
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
          <h1 className="text-2xl font-bold text-gray-900">Submittals</h1>
          <p className="text-gray-500">Documents soumis pour approbation</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouveau Submittal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          <p className="text-sm text-gray-500">En attente</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-500">Approuvés</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-orange-600">{stats.revision}</p>
          <p className="text-sm text-gray-500">À réviser</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-500">Rejetés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Toutes disciplines</option>
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">N°</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Titre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Section</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Discipline</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rév.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Échéance</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSubmittals.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <FileCheck className="mx-auto mb-4 text-gray-300" size={48} />
                  <p>Aucun submittal créé</p>
                </td>
              </tr>
            ) : (
              filteredSubmittals.map(submittal => {
                const statusConfig = STATUS_CONFIG[submittal.status]
                const StatusIcon = statusConfig.icon
                const isOverdue = submittal.due_date && new Date(submittal.due_date) < new Date() && !['approved', 'approved_as_noted', 'rejected'].includes(submittal.status)

                return (
                  <tr key={submittal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-teal-600">{submittal.submittal_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{submittal.title}</p>
                      {submittal.contractor && (
                        <p className="text-sm text-gray-500">{submittal.contractor}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{submittal.spec_section}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{submittal.discipline}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {submittal.revision > 0 ? `Rév. ${submittal.revision}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {submittal.due_date ? (
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(submittal.due_date).toLocaleDateString('fr-CA')}
                          {isOverdue && ' ⚠️'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {submittal.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForReview(submittal.id)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            title="Soumettre"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {['submitted', 'under_review'].includes(submittal.status) && (
                          <button
                            onClick={() => openReview(submittal)}
                            className="p-1.5 hover:bg-green-50 rounded text-green-600"
                            title="Réviser"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {submittal.status === 'revise_resubmit' && (
                          <button
                            onClick={() => handleResubmit(submittal.id)}
                            className="p-1.5 hover:bg-orange-50 rounded text-orange-600"
                            title="Resoumettre"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(submittal)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(submittal.id)}
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
                {selectedSubmittal ? `Modifier ${selectedSubmittal.submittal_number}` : 'Nouveau Submittal'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Fiches techniques portes coupe-feu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Détails sur le submittal..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Section devis *</label>
                  <select
                    value={form.spec_section}
                    onChange={(e) => setForm({ ...form, spec_section: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {SPEC_SECTIONS.map(s => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Entrepreneur / Fournisseur</label>
                  <input
                    type="text"
                    value={form.contractor}
                    onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nom du sous-traitant"
                  />
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
              </div>

              {/* Zone upload (placeholder) */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-500">Glissez vos fichiers ici ou cliquez pour uploader</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DWG, images (max 50MB)</p>
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
                disabled={!form.title || !form.spec_section}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {selectedSubmittal ? 'Enregistrer' : 'Créer le Submittal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Révision */}
      {showReviewModal && selectedSubmittal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold">Réviser le Submittal</h2>
              <p className="text-sm text-gray-500">{selectedSubmittal.submittal_number} - {selectedSubmittal.title}</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Décision *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'approved', label: 'Approuvé', icon: CheckCircle, color: 'border-green-500 bg-green-50 text-green-700' },
                    { value: 'approved_as_noted', label: 'Approuvé avec notes', icon: CheckCircle, color: 'border-lime-500 bg-lime-50 text-lime-700' },
                    { value: 'revise_resubmit', label: 'À réviser', icon: RotateCcw, color: 'border-orange-500 bg-orange-50 text-orange-700' },
                    { value: 'rejected', label: 'Rejeté', icon: XCircle, color: 'border-red-500 bg-red-50 text-red-700' }
                  ].map(option => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => setReviewForm({ ...reviewForm, status: option.value as any })}
                        className={`p-3 border-2 rounded-lg flex items-center gap-2 transition ${
                          reviewForm.status === option.value ? option.color : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Commentaires de révision</label>
                <textarea
                  value={reviewForm.comments}
                  onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Notes de révision, corrections demandées..."
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewForm.status}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Enregistrer la révision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
