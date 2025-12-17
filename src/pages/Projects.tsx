/**
 * DAST Solutions - Page Liste des Projets
 * Vue d'ensemble de tous les projets
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { useProjects, Project } from '@/hooks/useProjects'
import { CreateProjectModal } from '@/components/CreateProjectModal'
import {
  Search, Plus, FolderOpen, Calendar, DollarSign, Users,
  Clock, CheckCircle, AlertCircle, Eye, Edit, Star, MapPin,
  Filter, Building, Loader2, Briefcase
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

// Configuration des statuts
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'brouillon': { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100' },
  'en_attente': { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-100' },
  'en_soumission': { label: 'Soumission', color: 'text-purple-600', bg: 'bg-purple-100' },
  'en_cours': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100' },
  'termine': { label: 'Terminé', color: 'text-green-600', bg: 'bg-green-100' },
  'annule': { label: 'Annulé', color: 'text-red-600', bg: 'bg-red-100' },
}

// Composant carte projet
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const status = STATUS_CONFIG[project.status || 'brouillon'] || STATUS_CONFIG['brouillon']
  const daysLeft = project.end_date ? differenceInDays(new Date(project.end_date), new Date()) : null

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition">
            {project.name}
          </h3>
          {project.client_name && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Building size={12} />
              {project.client_name}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition">
          <Briefcase size={20} />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {project.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            {project.address}
          </div>
        )}
        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={14} />
            {project.start_date && format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}
            {project.end_date && ` → ${format(new Date(project.end_date), 'dd MMM yyyy', { locale: fr })}`}
          </div>
        )}
      </div>

      {project.project_value !== undefined && project.project_value !== null && project.project_value > 0 && (
        <div className="bg-teal-50 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-teal-700">Valeur estimée</span>
            <span className="font-bold text-teal-800">${project.project_value.toLocaleString()}</span>
          </div>
        </div>
      )}

      {daysLeft !== null && daysLeft > 0 && daysLeft < 30 && project.status === 'en_cours' && (
        <div className="text-xs text-amber-600 mb-3 flex items-center gap-1">
          <Clock size={12} />
          {daysLeft} jours restants
        </div>
      )}

      <button 
        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 transition"
      >
        <Eye size={16} />
        Voir projet
      </button>
    </div>
  )
}

// Page principale
export default function Projects() {
  const navigate = useNavigate()
  const { projects, loading, refetch } = useProjects()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Projets filtrés et triés
  const filteredProjects = useMemo(() => {
    let filtered = [...(projects || [])]
    
    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.client_name?.toLowerCase().includes(searchLower) ||
        p.address?.toLowerCase().includes(searchLower)
      )
    }
    
    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }
    
    // Tri par date de création décroissante
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
    
    return filtered
  }, [projects, search, statusFilter])

  // Statistiques
  const stats = useMemo(() => {
    const all = projects || []
    return {
      total: all.length,
      enCours: all.filter(p => p.status === 'en_cours').length,
      enSoumission: all.filter(p => p.status === 'en_soumission').length,
      termines: all.filter(p => p.status === 'termine').length,
    }
  }, [projects])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageTitle title="Projets" />
          <p className="text-gray-500 mt-1">Gérez tous vos projets de construction</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          <Plus size={18} />
          Nouveau projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total projets</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.enCours}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.enSoumission}</p>
              <p className="text-sm text-gray-500">En soumission</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <CheckCircle size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.termines}</p>
              <p className="text-sm text-gray-500">Terminés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="en_attente">En attente</option>
          <option value="en_soumission">En soumission</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>
      </div>

      {/* Liste des projets */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search || statusFilter !== 'all' ? 'Aucun projet trouvé' : 'Aucun projet pour le moment'}
          </h3>
          <p className="text-gray-500 mb-6">
            {search || statusFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Créez votre premier projet pour commencer'
            }
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={18} />
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/project/${project.id}`)}
            />
          ))}
        </div>
      )}

      {/* Modal création */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
