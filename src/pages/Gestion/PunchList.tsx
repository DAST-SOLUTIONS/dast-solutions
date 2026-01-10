/**
 * DAST Solutions - Module Punch List (Déficiences)
 * Gestion des déficiences et items de correction
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle,
  Camera, X, Filter, MapPin, User, Calendar, Eye, Edit2, Trash2,
  ChevronDown, Building2, Hammer, RotateCcw, ArrowLeft
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface PunchItem {
  id: string
  project_id: string
  punch_number: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'ready_for_review' | 'closed' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  location: string
  discipline: string
  assigned_to?: string
  contractor?: string
  due_date?: string
  completed_date?: string
  verified_by?: string
  verified_date?: string
  photos_before?: string[]
  photos_after?: string[]
  notes?: string
  created_by: string
  created_at: string
}

const STATUS_CONFIG = {
  open: { label: 'Ouvert', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Hammer },
  ready_for_review: { label: 'À vérifier', color: 'bg-amber-100 text-amber-700', icon: Eye },
  closed: { label: 'Fermé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-gray-100 text-gray-700', icon: RotateCcw }
}

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  high: { label: 'Haute', color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' }
}

const CATEGORIES = [
  'Finition murale', 'Finition plafond', 'Finition plancher', 'Peinture',
  'Menuiserie', 'Quincaillerie', 'Électricité', 'Plomberie', 'CVAC',
  'Vitrage', 'Imperméabilisation', 'Structure', 'Nettoyage', 'Sécurité', 'Autre'
]

const DISCIPLINES = [
  'Architecture', 'Structure', 'Mécanique', 'Électricité', 'Plomberie',
  'Civil', 'Paysagement', 'Finitions', 'Général'
]

export default function GestionPunchList() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [items, setItems] = useState<PunchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PunchItem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Formulaire
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    discipline: '',
    priority: 'medium' as PunchItem['priority'],
    assigned_to: '',
    contractor: '',
    due_date: ''
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
    if (projectId) loadItems()
  }, [projectId])

  const loadItems = async () => {
    if (!projectId) return
    try {
      const { data } = await supabase
        .from('punch_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      setItems(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePunchNumber = () => {
    const count = items.length + 1
    return `PL-${String(count).padStart(4, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.title) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const itemData = {
        project_id: projectId,
        punch_number: selectedItem ? selectedItem.punch_number : generatePunchNumber(),
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        discipline: form.discipline,
        priority: form.priority,
        assigned_to: form.assigned_to,
        contractor: form.contractor,
        due_date: form.due_date || null,
        status: 'open' as const,
        created_by: user?.email || 'Utilisateur'
      }

      if (selectedItem) {
        await supabase
          .from('punch_items')
          .update(itemData)
          .eq('id', selectedItem.id)
      } else {
        await supabase
          .from('punch_items')
          .insert(itemData)
      }

      await loadItems()
      resetForm()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const updateStatus = async (id: string, newStatus: PunchItem['status']) => {
    try {
      const updates: any = { status: newStatus }
      
      if (newStatus === 'closed') {
        const { data: { user } } = await supabase.auth.getUser()
        updates.completed_date = new Date().toISOString()
        updates.verified_by = user?.email
        updates.verified_date = new Date().toISOString()
      }

      await supabase
        .from('punch_items')
        .update(updates)
        .eq('id', id)

      await loadItems()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette déficience?')) return

    try {
      await supabase.from('punch_items').delete().eq('id', id)
      await loadItems()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: '',
      location: '',
      discipline: '',
      priority: 'medium',
      assigned_to: '',
      contractor: '',
      due_date: ''
    })
    setSelectedItem(null)
  }

  const openEdit = (item: PunchItem) => {
    setSelectedItem(item)
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      discipline: item.discipline,
      priority: item.priority,
      assigned_to: item.assigned_to || '',
      contractor: item.contractor || '',
      due_date: item.due_date || ''
    })
    setShowModal(true)
  }

  const filteredItems = items.filter(item => {
    if (filterStatus && item.status !== filterStatus) return false
    if (filterPriority && item.priority !== filterPriority) return false
    if (filterCategory && item.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return item.title.toLowerCase().includes(q) ||
        item.punch_number.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const stats = {
    total: items.length,
    open: items.filter(i => i.status === 'open').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
    review: items.filter(i => i.status === 'ready_for_review').length,
    closed: items.filter(i => i.status === 'closed').length,
    critical: items.filter(i => i.priority === 'critical' && i.status !== 'closed').length
  }

  // Grouper par localisation
  const groupedByLocation = filteredItems.reduce((acc, item) => {
    const loc = item.location || 'Non spécifié'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(item)
    return acc
  }, {} as Record<string, PunchItem[]>)

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
          <h1 className="text-2xl font-bold text-gray-900">Punch List (Déficiences)</h1>
          <p className="text-gray-500">Suivi des items à corriger avant livraison</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouvelle déficience
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-sm text-gray-500">Ouverts</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.review}</p>
          <p className="text-sm text-gray-500">À vérifier</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
          <p className="text-sm text-gray-500">Fermés</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-red-200 bg-red-50">
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          <p className="text-sm text-red-500">Critiques</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm text-gray-500">
            {stats.closed} / {stats.total} complétés ({stats.total > 0 ? Math.round(stats.closed / stats.total * 100) : 0}%)
          </span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="bg-green-500 h-full transition-all" 
            style={{ width: `${stats.total > 0 ? (stats.closed / stats.total) * 100 : 0}%` }}
          />
          <div 
            className="bg-amber-500 h-full transition-all" 
            style={{ width: `${stats.total > 0 ? (stats.review / stats.total) * 100 : 0}%` }}
          />
          <div 
            className="bg-blue-500 h-full transition-all" 
            style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
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
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Toutes priorités</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste par localisation */}
      <div className="space-y-4">
        {Object.keys(groupedByLocation).length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <AlertCircle className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Aucune déficience enregistrée</p>
          </div>
        ) : (
          Object.entries(groupedByLocation).map(([location, locationItems]) => (
            <div key={location} className="bg-white rounded-xl border overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="font-medium">{location}</span>
                  <span className="text-sm text-gray-500">({locationItems.length} items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">{locationItems.filter(i => i.status === 'closed').length} fermés</span>
                  <span className="text-xs text-red-600">{locationItems.filter(i => i.status === 'open').length} ouverts</span>
                </div>
              </div>
              <div className="divide-y">
                {locationItems.map(item => {
                  const statusConfig = STATUS_CONFIG[item.status]
                  const priorityConfig = PRIORITY_CONFIG[item.priority]
                  const StatusIcon = statusConfig.icon
                  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'closed'

                  return (
                    <div key={item.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                      {/* Priority dot */}
                      <div className={`w-3 h-3 rounded-full ${priorityConfig.dot}`} title={priorityConfig.label} />
                      
                      {/* Number */}
                      <span className="font-mono text-sm text-teal-600 w-20">{item.punch_number}</span>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {item.category && <span>{item.category}</span>}
                          {item.contractor && <span>• {item.contractor}</span>}
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>

                      {/* Due date */}
                      {item.due_date && (
                        <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {new Date(item.due_date).toLocaleDateString('fr-CA')}
                          {isOverdue && ' ⚠️'}
                        </span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {item.status === 'open' && (
                          <button
                            onClick={() => updateStatus(item.id, 'in_progress')}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            title="Marquer en cours"
                          >
                            <Hammer size={16} />
                          </button>
                        )}
                        {item.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(item.id, 'ready_for_review')}
                            className="p-1.5 hover:bg-amber-50 rounded text-amber-600"
                            title="Soumettre pour vérification"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        {item.status === 'ready_for_review' && (
                          <>
                            <button
                              onClick={() => updateStatus(item.id, 'closed')}
                              className="p-1.5 hover:bg-green-50 rounded text-green-600"
                              title="Approuver et fermer"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, 'rejected')}
                              className="p-1.5 hover:bg-red-50 rounded text-red-600"
                              title="Rejeter"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <button
                            onClick={() => updateStatus(item.id, 'in_progress')}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            title="Reprendre"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Création/Édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {selectedItem ? `Modifier ${selectedItem.punch_number}` : 'Nouvelle déficience'}
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
                  placeholder="Ex: Retouche peinture coin bureau 302"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Détails de la déficience..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
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
                    placeholder="Ex: Étage 3, Bureau 302"
                  />
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
                  <label className="block text-sm font-medium mb-1">Assigné à</label>
                  <input
                    type="text"
                    value={form.assigned_to}
                    onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Personne responsable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entrepreneur</label>
                  <input
                    type="text"
                    value={form.contractor}
                    onChange={(e) => setForm({ ...form, contractor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Sous-traitant responsable"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date limite</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Zone photos */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-500">Ajouter des photos (avant/après)</p>
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
                disabled={!form.title}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {selectedItem ? 'Enregistrer' : 'Créer la déficience'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
