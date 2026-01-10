/**
 * DAST Solutions - Module Réunions de Chantier
 * Gestion des réunions, procès-verbaux et actions
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Calendar, Clock, Users, CheckSquare, FileText,
  X, Download, Edit2, Trash2, ChevronDown, MapPin, Video,
  Phone, AlertCircle, CheckCircle, User, Send, ArrowLeft
} from 'lucide-react'

interface Project {
  id: string
  name: string
}

interface Meeting {
  id: string
  project_id: string
  meeting_number: string
  title: string
  type: 'chantier' | 'coordination' | 'securite' | 'client' | 'interne' | 'autre'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  date: string
  start_time: string
  end_time?: string
  location: string
  meeting_type: 'in_person' | 'video' | 'phone'
  organizer: string
  attendees: Attendee[]
  agenda?: AgendaItem[]
  action_items?: ActionItem[]
  notes?: string
  attachments?: string[]
  created_at: string
}

interface Attendee {
  id: string
  name: string
  company: string
  role?: string
  email?: string
  present?: boolean
}

interface AgendaItem {
  id: string
  topic: string
  presenter?: string
  duration?: number
  notes?: string
}

interface ActionItem {
  id: string
  description: string
  assigned_to: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

const TYPE_CONFIG = {
  chantier: { label: 'Réunion de chantier', color: 'bg-blue-100 text-blue-700' },
  coordination: { label: 'Coordination', color: 'bg-purple-100 text-purple-700' },
  securite: { label: 'Sécurité', color: 'bg-red-100 text-red-700' },
  client: { label: 'Client', color: 'bg-green-100 text-green-700' },
  interne: { label: 'Interne', color: 'bg-gray-100 text-gray-700' },
  autre: { label: 'Autre', color: 'bg-amber-100 text-amber-700' }
}

const STATUS_CONFIG = {
  scheduled: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  in_progress: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Clock },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700', icon: X }
}

const MEETING_TYPE_ICONS = {
  in_person: MapPin,
  video: Video,
  phone: Phone
}

export default function GestionReunions() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showMinutesModal, setShowMinutesModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Formulaire
  const [form, setForm] = useState({
    title: '',
    type: 'chantier' as Meeting['type'],
    date: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    meeting_type: 'in_person' as Meeting['meeting_type'],
    attendees: [] as Attendee[],
    agenda: [] as AgendaItem[]
  })

  // Nouvel attendee
  const [newAttendee, setNewAttendee] = useState({ name: '', company: '', role: '', email: '' })
  
  // Nouvel item agenda
  const [newAgendaItem, setNewAgendaItem] = useState({ topic: '', presenter: '', duration: 15 })

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
    if (projectId) loadMeetings()
  }, [projectId])

  const loadMeetings = async () => {
    if (!projectId) return
    try {
      const { data } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      setMeetings(data || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateMeetingNumber = () => {
    const count = meetings.length + 1
    return `MTG-${String(count).padStart(4, '0')}`
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const meetingData = {
        project_id: projectId,
        meeting_number: selectedMeeting ? selectedMeeting.meeting_number : generateMeetingNumber(),
        title: form.title,
        type: form.type,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        meeting_type: form.meeting_type,
        attendees: form.attendees,
        agenda: form.agenda,
        status: 'scheduled' as const,
        organizer: user?.email || 'Utilisateur'
      }

      if (selectedMeeting) {
        await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', selectedMeeting.id)
      } else {
        await supabase
          .from('meetings')
          .insert(meetingData)
      }

      await loadMeetings()
      resetForm()
      setShowModal(false)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const updateStatus = async (id: string, status: Meeting['status']) => {
    try {
      await supabase
        .from('meetings')
        .update({ status })
        .eq('id', id)

      await loadMeetings()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette réunion?')) return

    try {
      await supabase.from('meetings').delete().eq('id', id)
      await loadMeetings()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const addAttendee = () => {
    if (!newAttendee.name) return
    setForm({
      ...form,
      attendees: [...form.attendees, { ...newAttendee, id: `att-${Date.now()}`, present: false }]
    })
    setNewAttendee({ name: '', company: '', role: '', email: '' })
  }

  const removeAttendee = (id: string) => {
    setForm({
      ...form,
      attendees: form.attendees.filter(a => a.id !== id)
    })
  }

  const addAgendaItem = () => {
    if (!newAgendaItem.topic) return
    setForm({
      ...form,
      agenda: [...form.agenda, { ...newAgendaItem, id: `agenda-${Date.now()}` }]
    })
    setNewAgendaItem({ topic: '', presenter: '', duration: 15 })
  }

  const removeAgendaItem = (id: string) => {
    setForm({
      ...form,
      agenda: form.agenda.filter(a => a.id !== id)
    })
  }

  const resetForm = () => {
    setForm({
      title: '',
      type: 'chantier',
      date: '',
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      meeting_type: 'in_person',
      attendees: [],
      agenda: []
    })
    setSelectedMeeting(null)
  }

  const openEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setForm({
      title: meeting.title,
      type: meeting.type,
      date: meeting.date,
      start_time: meeting.start_time,
      end_time: meeting.end_time || '',
      location: meeting.location,
      meeting_type: meeting.meeting_type,
      attendees: meeting.attendees || [],
      agenda: meeting.agenda || []
    })
    setShowModal(true)
  }

  const openMinutes = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setShowMinutesModal(true)
  }

  const filteredMeetings = meetings.filter(m => {
    if (filterType && m.type !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return m.title.toLowerCase().includes(q) ||
        m.meeting_number.toLowerCase().includes(q)
    }
    return true
  })

  // Grouper par mois
  const groupedByMonth = filteredMeetings.reduce((acc, meeting) => {
    const monthKey = meeting.date.substring(0, 7)
    const monthLabel = new Date(meeting.date).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
    if (!acc[monthKey]) acc[monthKey] = { label: monthLabel, meetings: [] }
    acc[monthKey].meetings.push(meeting)
    return acc
  }, {} as Record<string, { label: string; meetings: Meeting[] }>)

  // Stats
  const stats = {
    total: meetings.length,
    scheduled: meetings.filter(m => m.status === 'scheduled').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    thisWeek: meetings.filter(m => {
      const meetingDate = new Date(m.date)
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const weekEnd = new Date(now.setDate(now.getDate() + 6))
      return meetingDate >= weekStart && meetingDate <= weekEnd
    }).length
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
          <h1 className="text-2xl font-bold text-gray-900">Réunions de chantier</h1>
          <p className="text-gray-500">Planification et procès-verbaux</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouvelle réunion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total réunions</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          <p className="text-sm text-gray-500">Planifiées</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Terminées</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-2xl font-bold text-amber-600">{stats.thisWeek}</p>
          <p className="text-sm text-gray-500">Cette semaine</p>
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
        </div>
      </div>

      {/* Liste par mois */}
      <div className="space-y-6">
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <Calendar className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Aucune réunion planifiée</p>
          </div>
        ) : (
          Object.entries(groupedByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([monthKey, { label, meetings: monthMeetings }]) => (
            <div key={monthKey}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 capitalize">{label}</h3>
              <div className="space-y-3">
                {monthMeetings.map(meeting => {
                  const typeConfig = TYPE_CONFIG[meeting.type]
                  const statusConfig = STATUS_CONFIG[meeting.status]
                  const StatusIcon = statusConfig.icon
                  const MeetingTypeIcon = MEETING_TYPE_ICONS[meeting.meeting_type]
                  const isPast = new Date(meeting.date) < new Date() && meeting.status === 'scheduled'

                  return (
                    <div key={meeting.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {/* Date box */}
                          <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${isPast ? 'bg-red-50' : 'bg-teal-50'}`}>
                            <span className={`text-2xl font-bold ${isPast ? 'text-red-600' : 'text-teal-600'}`}>
                              {new Date(meeting.date).getDate()}
                            </span>
                            <span className={`text-xs ${isPast ? 'text-red-500' : 'text-teal-500'}`}>
                              {new Date(meeting.date).toLocaleDateString('fr-CA', { weekday: 'short' })}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-teal-600">{meeting.meeting_number}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {meeting.start_time} - {meeting.end_time || '?'}
                              </span>
                              <span className="flex items-center gap-1">
                                <MeetingTypeIcon size={14} />
                                {meeting.location || 'Lieu à définir'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {meeting.attendees?.length || 0} participants
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                          
                          <div className="flex gap-1">
                            {meeting.status === 'scheduled' && (
                              <button
                                onClick={() => updateStatus(meeting.id, 'completed')}
                                className="p-1.5 hover:bg-green-50 rounded text-green-600"
                                title="Marquer terminée"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => openMinutes(meeting)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Procès-verbal"
                            >
                              <FileText size={16} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => openEdit(meeting)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Modifier"
                            >
                              <Edit2 size={16} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(meeting.id)}
                              className="p-1.5 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Agenda preview */}
                      {meeting.agenda && meeting.agenda.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-2">Ordre du jour:</p>
                          <div className="flex flex-wrap gap-2">
                            {meeting.agenda.slice(0, 3).map((item, i) => (
                              <span key={item.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {i + 1}. {item.topic}
                              </span>
                            ))}
                            {meeting.agenda.length > 3 && (
                              <span className="text-xs text-gray-500">+{meeting.agenda.length - 3} autres</span>
                            )}
                          </div>
                        </div>
                      )}
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
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {selectedMeeting ? `Modifier ${selectedMeeting.meeting_number}` : 'Nouvelle réunion'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-6">
              {/* Infos de base */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Réunion de chantier #12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
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
                    <label className="block text-sm font-medium mb-1">Format</label>
                    <select
                      value={form.meeting_type}
                      onChange={(e) => setForm({ ...form, meeting_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="in_person">En personne</option>
                      <option value="video">Vidéoconférence</option>
                      <option value="phone">Téléphone</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure début</label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure fin</label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Lieu / Lien</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Roulotte de chantier ou lien Zoom"
                  />
                </div>
              </div>

              {/* Participants */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users size={18} className="text-teal-600" />
                  Participants
                </h3>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newAttendee.name}
                    onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                    className="px-2 py-1.5 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Entreprise"
                    value={newAttendee.company}
                    onChange={(e) => setNewAttendee({ ...newAttendee, company: e.target.value })}
                    className="px-2 py-1.5 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Rôle"
                    value={newAttendee.role}
                    onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
                    className="px-2 py-1.5 text-sm border rounded"
                  />
                  <button
                    onClick={addAttendee}
                    disabled={!newAttendee.name}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </div>

                {form.attendees.length > 0 && (
                  <div className="space-y-1">
                    {form.attendees.map(att => (
                      <div key={att.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <div>
                          <span className="font-medium">{att.name}</span>
                          {att.company && <span className="text-gray-500"> - {att.company}</span>}
                          {att.role && <span className="text-gray-400"> ({att.role})</span>}
                        </div>
                        <button onClick={() => removeAttendee(att.id)} className="text-red-500 hover:text-red-700">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ordre du jour */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-teal-600" />
                  Ordre du jour
                </h3>
                
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Sujet"
                    value={newAgendaItem.topic}
                    onChange={(e) => setNewAgendaItem({ ...newAgendaItem, topic: e.target.value })}
                    className="col-span-2 px-2 py-1.5 text-sm border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Présentateur"
                    value={newAgendaItem.presenter}
                    onChange={(e) => setNewAgendaItem({ ...newAgendaItem, presenter: e.target.value })}
                    className="px-2 py-1.5 text-sm border rounded"
                  />
                  <button
                    onClick={addAgendaItem}
                    disabled={!newAgendaItem.topic}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                </div>

                {form.agenda.length > 0 && (
                  <div className="space-y-1">
                    {form.agenda.map((item, i) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <div>
                          <span className="font-medium">{i + 1}. {item.topic}</span>
                          {item.presenter && <span className="text-gray-500"> - {item.presenter}</span>}
                        </div>
                        <button onClick={() => removeAgendaItem(item.id)} className="text-red-500 hover:text-red-700">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                disabled={!form.title || !form.date}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {selectedMeeting ? 'Enregistrer' : 'Créer la réunion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Procès-verbal */}
      {showMinutesModal && selectedMeeting && (
        <MeetingMinutesModal
          meeting={selectedMeeting}
          onClose={() => setShowMinutesModal(false)}
          onSave={async (notes, actionItems) => {
            await supabase
              .from('meetings')
              .update({ notes, action_items: actionItems })
              .eq('id', selectedMeeting.id)
            await loadMeetings()
            setShowMinutesModal(false)
          }}
        />
      )}
    </div>
  )
}

// Modal Procès-verbal
function MeetingMinutesModal({
  meeting,
  onClose,
  onSave
}: {
  meeting: Meeting
  onClose: () => void
  onSave: (notes: string, actionItems: ActionItem[]) => void
}) {
  const [notes, setNotes] = useState(meeting.notes || '')
  const [actionItems, setActionItems] = useState<ActionItem[]>(meeting.action_items || [])
  const [newAction, setNewAction] = useState({
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium' as ActionItem['priority']
  })

  const addActionItem = () => {
    if (!newAction.description) return
    setActionItems([
      ...actionItems,
      { ...newAction, id: `action-${Date.now()}`, status: 'pending' }
    ])
    setNewAction({ description: '', assigned_to: '', due_date: '', priority: 'medium' })
  }

  const updateActionStatus = (id: string, status: ActionItem['status']) => {
    setActionItems(actionItems.map(a => a.id === id ? { ...a, status } : a))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b bg-teal-600 text-white">
          <span className="font-mono text-sm opacity-80">{meeting.meeting_number}</span>
          <h2 className="text-lg font-bold">{meeting.title}</h2>
          <p className="text-sm opacity-80">
            {new Date(meeting.date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Participants */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map(att => (
                  <span key={att.id} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {att.name} ({att.company})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-2">Notes de réunion</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={8}
              placeholder="Points discutés, décisions prises..."
            />
          </div>

          {/* Actions */}
          <div>
            <h3 className="font-semibold mb-3">Actions à suivre</h3>
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              <input
                type="text"
                placeholder="Description de l'action"
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                className="col-span-2 px-2 py-1.5 text-sm border rounded"
              />
              <input
                type="text"
                placeholder="Responsable"
                value={newAction.assigned_to}
                onChange={(e) => setNewAction({ ...newAction, assigned_to: e.target.value })}
                className="px-2 py-1.5 text-sm border rounded"
              />
              <button
                onClick={addActionItem}
                disabled={!newAction.description}
                className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>

            {actionItems.length > 0 && (
              <div className="space-y-2">
                {actionItems.map(action => (
                  <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    action.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateActionStatus(action.id, action.status === 'completed' ? 'pending' : 'completed')}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          action.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                        }`}
                      >
                        {action.status === 'completed' && <CheckCircle size={12} />}
                      </button>
                      <div>
                        <p className={`font-medium ${action.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {action.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {action.assigned_to && `Resp: ${action.assigned_to}`}
                          {action.due_date && ` • Échéance: ${action.due_date}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-between">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={16} />
            Exporter PDF
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(notes, actionItems)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Enregistrer le procès-verbal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
