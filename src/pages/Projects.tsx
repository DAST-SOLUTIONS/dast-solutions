/**
 * DAST Solutions - Liste des Projets
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PageTitle } from '@/components/PageTitle'
import {
  Plus, Search, FolderKanban, Calendar, DollarSign,
  MapPin, MoreVertical, Eye, Edit, Trash2, Loader2, Building2,
  CheckCircle, Clock, PauseCircle, XCircle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client_name?: string
  address?: string
  city?: string
  status: 'draft' | 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  budget_estimate?: number
  start_date?: string
  end_date?: string
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Erreur chargement projets:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      setProjects(projects.filter(p => p.id !== id))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase())
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
              : 'Commencez par créer votre premier projet'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              to="/project/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus size={20} />
              Créer un projet
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
            const StatusIcon = statusConfig.icon
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/project/${project.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-teal-600"
                      >
                        {project.name}
                      </Link>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>

                    {project.client_name && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Building2 size={14} />
                        {project.client_name}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {project.address && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {project.address}{project.city && `, ${project.city}`}
                        </div>
                      )}
                      {project.budget_estimate && (
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {formatCurrency(project.budget_estimate)}
                        </div>
                      )}
                      {project.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(project.start_date)}
                          {project.end_date && ` → ${formatDate(project.end_date)}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {menuOpen === project.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                          <Link
                            to={`/project/${project.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpen(null)}
                          >
                            <Eye size={16} />
                            Voir détails
                          </Link>
                          <Link
                            to={`/takeoff/${project.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpen(null)}
                          >
                            <Edit size={16} />
                            Takeoff
                          </Link>
                          <button
                            onClick={() => {
                              setMenuOpen(null)
                              deleteProject(project.id)
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
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
