/**
 * DAST Solutions - Pages de projets filtrés par phase
 * /projets/conception, /projets/estimation, /projets/gestion
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, FolderOpen, Pencil, Calculator, ClipboardList,
  MapPin, Calendar, DollarSign, ChevronRight, Loader2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  client_name?: string
  city?: string
  budget?: number
  start_date?: string
  end_date?: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  planning: { label: 'Planification', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'En cours', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'En pause', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Terminé', color: 'bg-teal-100 text-teal-700' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700' },
}

// Composant générique de liste de projets
function ProjectListPage({
  title,
  description,
  icon: Icon,
  statuses,
  emptyMessage,
  accentColor = 'teal'
}: {
  title: string
  description: string
  icon: React.ElementType
  statuses: string[]
  emptyMessage: string
  accentColor?: string
}) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .in('status', statuses)
        .order('updated_at', { ascending: false })

      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [statuses])

  const filtered = projects.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return p.name.toLowerCase().includes(s) || 
           p.client_name?.toLowerCase().includes(s) ||
           p.city?.toLowerCase().includes(s)
  })

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-${accentColor}-100 flex items-center justify-center`}>
            <Icon className={`text-${accentColor}-600`} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500">{description}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/project/new')}
          className={`px-4 py-2 bg-${accentColor}-600 text-white rounded-lg hover:bg-${accentColor}-700 flex items-center gap-2`}
        >
          <Plus size={16} />
          Nouveau projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Projets</p>
          <p className="text-2xl font-bold">{projects.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-teal-600">
            {totalBudget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Mis à jour récemment</p>
          <p className="text-2xl font-bold">{projects.filter(p => {
            const diff = Date.now() - new Date(p.updated_at).getTime()
            return diff < 7 * 24 * 60 * 60 * 1000 // 7 jours
          }).length}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FolderOpen className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet</h3>
          <p className="text-gray-500 mb-4">{emptyMessage}</p>
          <button
            onClick={() => navigate('/project/new')}
            className={`px-4 py-2 bg-${accentColor}-600 text-white rounded-lg hover:bg-${accentColor}-700`}
          >
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(project => {
            const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-xl border p-5 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-${accentColor}-100 flex items-center justify-center`}>
                      <Icon className={`text-${accentColor}-600`} size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {project.client_name && <span>{project.client_name}</span>}
                        {project.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />{project.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {project.budget && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">Budget</p>
                      </div>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="text-gray-300" size={20} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Pages spécifiques par phase

export function ProjetsConception() {
  return (
    <ProjectListPage
      title="Conception"
      description="Projets en phase de conception et design"
      icon={Pencil}
      statuses={['draft']}
      emptyMessage="Aucun projet en conception"
      accentColor="purple"
    />
  )
}

export function ProjetsEstimation() {
  return (
    <ProjectListPage
      title="Estimation"
      description="Projets en phase d'estimation et soumission"
      icon={Calculator}
      statuses={['draft', 'planning']}
      emptyMessage="Aucun projet en estimation"
      accentColor="blue"
    />
  )
}

export function ProjetsGestion() {
  return (
    <ProjectListPage
      title="Gestion"
      description="Projets actifs en phase d'exécution"
      icon={ClipboardList}
      statuses={['active', 'on_hold']}
      emptyMessage="Aucun projet en gestion active"
      accentColor="teal"
    />
  )
}
