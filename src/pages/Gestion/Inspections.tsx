/**
 * DAST Solutions - Module Inspections & Qualité
 * Gestion des inspections et contrôle qualité
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, ClipboardCheck, Clock, CheckCircle, XCircle, AlertTriangle,
  Calendar, Camera, X, Filter, Download, Eye, Edit2, Trash2, MapPin,
  User, FileText, ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface Inspection {
  id: string
  project_id: string
  inspection_number: string
  title: string
  type: 'quality' | 'safety' | 'progress' | 'final' | 'regulatory' | 'pre_pour' | 'structural'
  status: 'scheduled' | 'in_progress' | 'passed' | 'failed' | 'conditional'
  scheduled_date: string
  completed_date?: string
  location: string
  discipline: string
  inspector: string
  contractor?: string
  checklist_items?: ChecklistItem[]
  findings?: string
  corrective_actions?: string
  photos?: string[]
  signature?: string
  created_at: string
}

interface ChecklistItem {
  id: string
  description: string
  status: 'pending' | 'pass' | 'fail' | 'na'
  notes?: string
}

const TYPE_CONFIG = {
  quality: { label: 'Qualité', color: 'bg-blue-100 text-blue-700' },
  safety: { label: 'Sécurité', color: 'bg-red-100 text-red-700' },
  progress: { label: 'Avancement', color: 'bg-purple-100 text-purple-700' },
  final: { label: 'Finale', color: 'bg-green-100 text-green-700' },
  regulatory: { label: 'Réglementaire', color: 'bg-amber-100 text-amber-700' },
  pre_pour: { label: 'Pré-coulée', color: 'bg-gray-100 text-gray-700' },
  structural: { label: 'Structure', color: 'bg-indigo-100 text-indigo-700' }
}

const STATUS_CONFIG = {
  scheduled: { label: 'Planifiée', color: 'bg-gray-100 text-gray-700', icon: Calendar },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Clock },
  passed: { label: 'Réussie', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Échouée', color: 'bg-red-100 text-red-700', icon: XCircle },
  conditional: { label: 'Conditionnelle', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle }
}

const DISCIPLINES = [
  'Structure', 'Fondation', 'Charpente', 'Enveloppe', 'Toiture',
  'Mécanique', 'Électricité', 'Plomberie', 'Sécurité incendie',
  'Finitions intérieures', 'Aménagement extérieur', 'Général'
]

// Templates de checklists par type
const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  quality: [
    'Matériaux conformes aux spécifications',
    'Travaux exécutés selon les plans',
    'Tolérances respectées',
    'Finition acceptable',
    'Propreté du chantier'
  ],
  safety: [
    'Équipements de protection individuelle (EPI)',
    'Signalisation de sécurité en place',
    'Garde-corps et protections',
    'Issues de secours dégagées',
    'Extincteurs accessibles',
    'Trousse de premiers soins disponible'
  ],
  pre_pour: [
    'Coffrage aligné et nivelé',
    'Armature conforme aux plans',
    'Espacements des barres corrects',
    'Enrobage respecté',
    'Joints de contrôle en place',
    'Préparation des reprises de bétonnage',
    'Ancrages installés'
  ],
  structural: [
    'Dimensions conformes',
    'Alignement vérifié',
    'Assemblages boulonnés/soudés vérifiés',
    'Contreventement en place',
    'Nivellement OK'
  ],
  final: [
    'Tous les systèmes testés et fonctionnels',
    'Finitions complètes et acceptables',
    'Nettoyage final effectué',
    'Documentation as-built disponible',
    'Déficiences corrigées',
    'Certificats de conformité obtenus'
  ]
}

export default function GestionInspections() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showConductModal, setShowConductModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Formulaire création
  const [form, setForm] = useState({
    title: '',
    type: 'quality' as Inspection['type'],
    scheduled_date: '',
    location: '',
    discipline: '',
    inspector: '',
    contractor: ''
  })

  // Formulaire conduite inspection
  const [conductForm, setConductForm] = useState({
    checklist: [] as ChecklistItem[],
    findings: '',
    corrective_actions: '',
    status: 'passed' as Inspection['status']
  })

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

  useEffect(() => {
    if (projectId) loadInspections()
  }, [projectId])

  const loadInspections = async () => {
    if (!projectId) return
    try {
      const { data } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('scheduled_date', { ascending: false })

      setInspections(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateInspectionNumber = () => {
    const count = inspections.length + 1
    return `INS-${String(count).padStart(4, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.title || !form.scheduled_date) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Générer la checklist basée sur le type
      const templateItems = CHECKLIST_TEMPLATES[form.type] || CHECKLIST_TEMPLATES.quality
      const checklist: ChecklistItem[] = templateItems.map((desc, i) => ({
        id: `item-${i}`,
        description: desc,
        status: 'pending' as const,
        notes: ''
      }))

      const inspectionData = {
        project_id: projectId,
        inspection_number: selectedInspection ? selectedInspection.inspection_number : generateInspectionNumber(),
        title: form.title,
        type: form.type,
        scheduled_date: form.scheduled_date,
        location: form.location,
        discipline: form.discipline,
        inspector: form.inspector || user?.email || 'Utilisateur',
        contractor: form.contractor,
        status: 'scheduled' as const,
        checklist_items: checklist
      }

      if (selectedInspection) {
        await supabase
          .from('inspections')
          .update(inspectionData)
          .eq('id', selectedInspection.id)
      } else {
        await supabase
          .from('inspections')
          .insert(inspectionData)
      }

      await loadInspections()
      resetForm()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleConduct = async () => {
    if (!selectedInspection) return

    try {
      // Déterminer le statut basé sur les items de checklist
      const failedItems = conductForm.checklist.filter(i => i.status === 'fail')
      let finalStatus: Inspection['status'] = 'passed'
      
      if (failedItems.length > 0) {
        if (failedItems.length > conductForm.checklist.length / 2) {
          finalStatus = 'failed'
        } else {
          finalStatus = 'conditional'
        }
      }

      await supabase
        .from('inspections')
        .update({
          status: finalStatus,
          completed_date: new Date().toISOString(),
          checklist_items: conductForm.checklist,
          findings: conductForm.findings,
          corrective_actions: conductForm.corrective_actions
        })
        .eq('id', selectedInspection.id)

      await loadInspections()
      setShowConductModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette inspection?')) return

    try {
      await supabase.from('inspections').delete().eq('id', id)
      await loadInspections()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      type: 'quality',
      scheduled_date: '',
      location: '',
      discipline: '',
      inspector: '',
      contractor: ''
    })
    setSelectedInspection(null)
  }

  const openConduct = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setConductForm({
      checklist: inspection.checklist_items || [],
      findings: inspection.findings || '',
      corrective_actions: inspection.corrective_actions || '',
      status: inspection.status
    })
    setShowConductModal(true)
  }

  const updateChecklistItem = (itemId: string, status: ChecklistItem['status'], notes?: string) => {
    setConductForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === itemId ? { ...item, status, notes: notes ?? item.notes } : item
      )
    }))
  }

  const filteredInspections = inspections.filter(i => {
    if (filterType && i.type !== filterType) return false
    if (filterStatus && i.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return i.title.toLowerCase().includes(q) ||
        i.inspection_number.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const stats = {
    total: inspections.length,
    scheduled: inspections.filter(i => i.status === 'scheduled').length,
    passed: inspections.filter(i => i.status === 'passed').length,
    failed: inspections.filter(i => i.status === 'failed').length,
    conditional: inspections.filter(i => i.status === 'conditional').length
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
          <h1 className="text-2xl font-bold text-gray-900">Inspections & Qualité</h1>
          <p className="text-gray-500">Contrôle qualité et inspections du projet</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouvelle Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          <p className="text-sm text-gray-500">Planifiées</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
          <p className="text-sm text-gray-500">Réussies</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.conditional}</p>
          <p className="text-sm text-gray-500">Conditionnelles</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-sm text-gray-500">Échouées</p>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">N°</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Inspection</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Localisation</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Inspecteur</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredInspections.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <ClipboardCheck className="mx-auto mb-4 text-gray-300" size={48} />
                  <p>Aucune inspection créée</p>
                </td>
              </tr>
            ) : (
              filteredInspections.map(inspection => {
                const typeConfig = TYPE_CONFIG[inspection.type]
                const statusConfig = STATUS_CONFIG[inspection.status]
                const StatusIcon = statusConfig.icon
                const isPast = new Date(inspection.scheduled_date) < new Date() && inspection.status === 'scheduled'

                return (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-teal-600">{inspection.inspection_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{inspection.title}</p>
                      <p className="text-sm text-gray-500">{inspection.discipline}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={isPast ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {new Date(inspection.scheduled_date).toLocaleDateString('fr-CA')}
                        {isPast && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {inspection.location || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{inspection.inspector}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {inspection.status === 'scheduled' && (
                          <button
                            onClick={() => openConduct(inspection)}
                            className="p-1.5 hover:bg-green-50 rounded text-green-600"
                            title="Conduire l'inspection"
                          >
                            <ClipboardCheck size={16} />
                          </button>
                        )}
                        {['passed', 'failed', 'conditional'].includes(inspection.status) && (
                          <button
                            onClick={() => openConduct(inspection)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Voir les résultats"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(inspection.id)}
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

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Nouvelle Inspection</h2>
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
                  placeholder="Ex: Inspection dalle niveau 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type d'inspection</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date planifiée *</label>
                  <input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-1">Localisation</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Étage 2, Zone A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Inspecteur</label>
                  <input
                    type="text"
                    value={form.inspector}
                    onChange={(e) => setForm({ ...form, inspector: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nom de l'inspecteur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entrepreneur</label>
                  <input
                    type="text"
                    value={form.contractor}
                    onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Sous-traitant concerné"
                  />
                </div>
              </div>

              {/* Preview checklist */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Checklist générée ({form.type})</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {(CHECKLIST_TEMPLATES[form.type] || CHECKLIST_TEMPLATES.quality).map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 border rounded" />
                      {item}
                    </li>
                  ))}
                </ul>
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
                disabled={!form.title || !form.scheduled_date}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer l'inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conduite Inspection */}
      {showConductModal && selectedInspection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-teal-600 text-white">
              <div>
                <span className="font-mono text-sm opacity-80">{selectedInspection.inspection_number}</span>
                <h2 className="text-lg font-bold">{selectedInspection.title}</h2>
              </div>
              <button onClick={() => setShowConductModal(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Info */}
              <div className="grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_CONFIG[selectedInspection.type].color}`}>
                    {TYPE_CONFIG[selectedInspection.type].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium">{new Date(selectedInspection.scheduled_date).toLocaleDateString('fr-CA')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Localisation</p>
                  <p className="text-sm font-medium">{selectedInspection.location || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Inspecteur</p>
                  <p className="text-sm font-medium">{selectedInspection.inspector}</p>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h3 className="font-semibold mb-3">Checklist</h3>
                <div className="space-y-2">
                  {conductForm.checklist.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border ${
                      item.status === 'pass' ? 'bg-green-50 border-green-200' :
                      item.status === 'fail' ? 'bg-red-50 border-red-200' :
                      item.status === 'na' ? 'bg-gray-50 border-gray-200' :
                      'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.description}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateChecklistItem(item.id, 'pass')}
                            className={`p-1.5 rounded ${item.status === 'pass' ? 'bg-green-500 text-white' : 'hover:bg-green-100 text-green-600'}`}
                            title="Conforme"
                          >
                            <ThumbsUp size={16} />
                          </button>
                          <button
                            onClick={() => updateChecklistItem(item.id, 'fail')}
                            className={`p-1.5 rounded ${item.status === 'fail' ? 'bg-red-500 text-white' : 'hover:bg-red-100 text-red-600'}`}
                            title="Non conforme"
                          >
                            <ThumbsDown size={16} />
                          </button>
                          <button
                            onClick={() => updateChecklistItem(item.id, 'na')}
                            className={`p-1.5 rounded ${item.status === 'na' ? 'bg-gray-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                            title="N/A"
                          >
                            <span className="text-xs font-bold">N/A</span>
                          </button>
                        </div>
                      </div>
                      {item.status === 'fail' && (
                        <input
                          type="text"
                          placeholder="Notes sur la non-conformité..."
                          value={item.notes || ''}
                          onChange={(e) => updateChecklistItem(item.id, 'fail', e.target.value)}
                          className="mt-2 w-full px-2 py-1 text-sm border rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-medium mb-1">Observations / Constatations</label>
                <textarea
                  value={conductForm.findings}
                  onChange={(e) => setConductForm({ ...conductForm, findings: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Notes générales sur l'inspection..."
                />
              </div>

              {/* Actions correctives */}
              <div>
                <label className="block text-sm font-medium mb-1">Actions correctives requises</label>
                <textarea
                  value={conductForm.corrective_actions}
                  onChange={(e) => setConductForm({ ...conductForm, corrective_actions: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Liste des corrections à apporter..."
                />
              </div>

              {/* Zone photos */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-500">Ajouter des photos</p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  ✅ {conductForm.checklist.filter(i => i.status === 'pass').length} conforme |
                  ❌ {conductForm.checklist.filter(i => i.status === 'fail').length} non conforme |
                  ⬜ {conductForm.checklist.filter(i => i.status === 'pending').length} en attente
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConductModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConduct}
                  disabled={conductForm.checklist.some(i => i.status === 'pending')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  Terminer l'inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
