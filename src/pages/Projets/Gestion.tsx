/**
 * DAST Solutions - Gestion de Projets CORRIGÉ
 * Utilise les vrais projets de la base de données
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { supabase } from '@/lib/supabase'
import { 
  Search, Plus, FolderOpen, Calendar, DollarSign, Users, Clock, 
  CheckCircle, AlertCircle, Eye, Star, MapPin, Loader2, Building2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Project {
  id: string
  name: string
  client_name?: string
  status: string
  budget?: number
  start_date?: string
  end_date?: string
  city?: string
  address?: string
  building_type?: string
  description?: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'draft': { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100' },
  'planning': { label: 'Planification', color: 'text-blue-600', bg: 'bg-blue-100' },
  'active': { label: 'En cours', color: 'text-green-600', bg: 'bg-green-100' },
  'on_hold': { label: 'En pause', color: 'text-amber-600', bg: 'bg-amber-100' },
  'completed': { label: 'Terminé', color: 'text-teal-600', bg: 'bg-teal-100' },
  'cancelled': { label: 'Annulé', color: 'text-red-600', bg: 'bg-red-100' },
}

function ProjectCard({ project, onView }: { project: Project; onView: () => void }) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
  const daysLeft = project.end_date ? differenceInDays(new Date(project.end_date), new Date()) : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.client_name || 'Sans client'}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
          <Building2 className="text-teal-600" size={20} />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {project.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            {project.city}
          </div>
        )}
        {project.start_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} />
            {format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}
            {project.end_date && ` → ${format(new Date(project.end_date), 'dd MMM yyyy', { locale: fr })}`}
          </div>
        )}
      </div>

      {project.budget && (
        <div className="bg-teal-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-teal-700">Budget</span>
            <span className="font-bold text-teal-800">
              {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(project.budget)}
            </span>
          </div>
        </div>
      )}

      {daysLeft !== null && daysLeft > 0 && daysLeft < 30 && project.status === 'active' && (
        <div className="text-xs text-amber-600 mb-3 flex items-center gap-1">
          <Clock size={12} />
          {daysLeft} jours restants
        </div>
      )}

      <button 
        onClick={onView}
        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 group-hover:bg-teal-700 transition"
      >
        <Eye size={16} />
        Voir projet
      </button>
    </div>
  )
}

export default function GestionProjets() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'date'>('date')

  // Charger les vrais projets
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        console.error('Erreur chargement projets:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const filtered = useMemo(() => {
    let f = [...projects]
    
    if (search) {
      const s = search.toLowerCase()
      f = f.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.client_name?.toLowerCase().includes(s) ||
        p.city?.toLowerCase().includes(s)
      )
    }
    
    if (statusFilter !== 'all') {
      f = f.filter(p => p.status === statusFilter)
    }
    
    f.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'value') return (b.budget || 0) - (a.budget || 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    return f
  }, [projects, search, statusFilter, sortBy])

  const stats = useMemo(() => ({
    total: projects.length,
    enCours: projects.filter(p => p.status === 'active').length,
    valeurTotale: projects.filter(p => p.status === 'active').reduce((s, p) => s + (p.budget || 0), 0),
    planification: projects.filter(p => p.status === 'planning').length
  }), [projects])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Gestion des Projets" />
          <p className="text-gray-500 mt-1">Vue d'ensemble de tous vos projets</p>
        </div>
        <button 
          onClick={() => navigate('/project/new')} 
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus size={18} />
          Nouveau projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Projets</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.enCours}</div>
              <div className="text-sm text-gray-500">En cours</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign size={20} className="text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.valeurTotale > 1000000 
                  ? `${(stats.valeurTotale / 1000000).toFixed(1)}M$`
                  : `${(stats.valeurTotale / 1000).toFixed(0)}K$`
                }
              </div>
              <div className="text-sm text-gray-500">Valeur active</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.planification}</div>
              <div className="text-sm text-gray-500">En planification</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un projet..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tous statuts</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)} 
            className="px-4 py-2 border rounded-lg"
          >
            <option value="date">Plus récents</option>
            <option value="name">Nom A-Z</option>
            <option value="value">Budget ↓</option>
          </select>
        </div>
      </div>

      {/* Liste projets */}
      <p className="text-gray-600 mb-4">
        <span className="font-semibold">{filtered.length}</span> projet(s)
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <FolderOpen className="mx-auto text-gray-300" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun projet</h3>
          <p className="mt-1 text-gray-500">
            {search || statusFilter !== 'all' 
              ? 'Aucun projet ne correspond à vos critères'
              : 'Créez votre premier projet pour commencer'
            }
          </p>
          {!search && statusFilter === 'all' && (
            <button 
              onClick={() => navigate('/project/new')}
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={20} />
              Nouveau projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onView={() => navigate(`/project/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
