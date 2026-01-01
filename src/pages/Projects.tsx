/**
 * DAST Solutions - Liste des Projets CORRIGÉ
 * Items cliquables avec navigation
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle } from '@/components/PageTitle'
import {
  Plus, Search, FolderKanban, Calendar, DollarSign,
  MapPin, MoreVertical, Eye, Edit, Trash2, Loader2, Building2,
  CheckCircle, Clock, PauseCircle, XCircle, ChevronRight
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client_name?: string
  address?: string
  city?: string
  province?: string
  status: 'draft' | 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  budget?: number
  start_date?: string
  end_date?: string
  building_type?: string
  project_type?: string
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  planning: { label: 'Planification', color: 'bg-blue-100 text-blue-700', icon: Clock },
  active: { label: 'Actif', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  on_hold: { label: 'En pause', color: 'bg-yellow-100 text-yellow-700', icon: PauseCircle },
  completed: { label: 'Terminé', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
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

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce projet ?')) return
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      setProjects(projects.filter(p => p.id !== id))
      setMenuOpen(null)
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-CA')
  }

  return (
    <div className="space-y-6">
      <PageTitle 
        title="Projets" 
        subtitle={`${projects.length} projet(s) au total`}
      />

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* New project button */}
        <Link
          to="/project/new"
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} />
          Nouveau projet
        </Link>
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-teal-600" size={32} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <FolderKanban className="mx-auto text-gray-300" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun projet</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Aucun projet ne correspond à vos critères'
              : 'Créez votre premier projet pour commencer'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              to="/project/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={20} />
              Nouveau projet
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {filteredProjects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="text-teal-600" size={20} />
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {project.client_name && (
                          <span className="truncate">{project.client_name}</span>
                        )}
                        {project.city && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={14} />
                            {project.city}
                          </span>
                        )}
                        {project.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={14} />
                            {formatCurrency(project.budget)}
                          </span>
                        )}
                        {project.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(project.start_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <ChevronRight className="text-gray-400 group-hover:text-teal-600 transition-colors" size={20} />
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === project.id ? null : project.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>

                      {menuOpen === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/project/${project.id}`)
                              setMenuOpen(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye size={16} />
                            Voir le projet
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/takeoff/${project.id}`)
                              setMenuOpen(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FolderKanban size={16} />
                            Takeoff
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={(e) => deleteProject(project.id, e)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}
