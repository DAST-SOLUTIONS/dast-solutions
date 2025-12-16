/**
 * DAST Solutions - Gestion de Projets
 * Vue d'ensemble et gestion complète des projets
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { useProjects } from '@/hooks/useProjects'
import { Search, Plus, FolderOpen, Calendar, DollarSign, Users, Clock, CheckCircle, AlertCircle, MoreVertical, Eye, Edit, Trash2, Filter, Download, BarChart3, MapPin, Building, Star } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'brouillon': { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100' },
  'en_attente': { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-100' },
  'en_cours': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100' },
  'termine': { label: 'Terminé', color: 'text-green-600', bg: 'bg-green-100' },
  'annule': { label: 'Annulé', color: 'text-red-600', bg: 'bg-red-100' },
}

const DEMO_PROJECTS = [
  { id: '1', name: 'Centre sportif multifonctionnel', client: 'Ville de Montréal', status: 'en_cours', value: 5500000, startDate: '2024-06-01', endDate: '2025-08-31', progress: 35, team: 12, location: 'Montréal', isStarred: true },
  { id: '2', name: 'Réfection toiture école', client: 'CSS Montréal', status: 'en_cours', value: 350000, startDate: '2024-11-15', endDate: '2025-02-28', progress: 60, team: 5, location: 'Laval', isStarred: false },
  { id: '3', name: 'Infrastructures électriques hôpital', client: 'CIUSSS Est', status: 'en_attente', value: 1800000, startDate: '2025-01-15', endDate: '2025-09-30', progress: 0, team: 8, location: 'Montréal', isStarred: true },
  { id: '4', name: 'Rénovation bibliothèque', client: 'Ville de Québec', status: 'termine', value: 420000, startDate: '2024-03-01', endDate: '2024-10-15', progress: 100, team: 6, location: 'Québec', isStarred: false },
  { id: '5', name: 'Construction entrepôt', client: 'Entreprise XYZ', status: 'brouillon', value: 2200000, startDate: '2025-04-01', endDate: '2026-02-28', progress: 0, team: 0, location: 'Terrebonne', isStarred: false },
]

function ProjectCard({ project, onView, onStar }: { project: typeof DEMO_PROJECTS[0]; onView: (id: string) => void; onStar: (id: string) => void }) {
  const status = STATUS_CONFIG[project.status]
  const daysLeft = differenceInDays(new Date(project.endDate), new Date())
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
            {project.isStarred && <Star size={14} className="text-amber-500 fill-amber-500" />}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.client}</p>
        </div>
        <button onClick={() => onStar(project.id)} className="p-1.5 hover:bg-gray-100 rounded">
          <Star size={16} className={project.isStarred ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} />
        </button>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin size={14} />{project.location}</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={14} />{format(new Date(project.startDate), 'dd MMM yyyy', { locale: fr })} → {format(new Date(project.endDate), 'dd MMM yyyy', { locale: fr })}</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><Users size={14} />{project.team} personnes</div>
      </div>
      <div className="bg-teal-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-2"><span className="text-sm text-teal-700">Valeur</span><span className="font-bold text-teal-800">${project.value.toLocaleString()}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-teal-700">Progression</span><span className="font-medium text-teal-800">{project.progress}%</span></div>
        <div className="mt-2 h-2 bg-teal-200 rounded-full"><div className="h-2 bg-teal-600 rounded-full transition-all" style={{ width: `${project.progress}%` }} /></div>
      </div>
      {daysLeft > 0 && daysLeft < 30 && project.status === 'en_cours' && <div className="text-xs text-amber-600 mb-3 flex items-center gap-1"><Clock size={12} />{daysLeft} jours restants</div>}
      <button onClick={() => onView(project.id)} className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"><Eye size={16} />Voir projet</button>
    </div>
  )
}

export default function GestionProjets() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(DEMO_PROJECTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'date'>('date')

  const filtered = useMemo(() => {
    let f = [...projects]
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') f = f.filter(p => p.status === statusFilter)
    f.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'value') return b.value - a.value
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
    return f
  }, [projects, search, statusFilter, sortBy])

  const stats = useMemo(() => ({
    total: projects.length,
    enCours: projects.filter(p => p.status === 'en_cours').length,
    valeurTotale: projects.filter(p => p.status === 'en_cours').reduce((s, p) => s + p.value, 0),
    starred: projects.filter(p => p.isStarred).length
  }), [projects])

  const toggleStar = (id: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, isStarred: !p.isStarred } : p))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div><PageTitle title="Gestion des Projets" /><p className="text-gray-500 mt-1">Vue d'ensemble de tous vos projets</p></div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Download size={18} />Exporter</button>
          <button onClick={() => navigate('/projets/nouveau')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Plus size={18} />Nouveau projet</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><FolderOpen size={20} className="text-blue-600" /></div><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Projets</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><Clock size={20} className="text-green-600" /></div><div><div className="text-2xl font-bold">{stats.enCours}</div><div className="text-sm text-gray-500">En cours</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-teal-100 rounded-lg"><DollarSign size={20} className="text-teal-600" /></div><div><div className="text-2xl font-bold">${(stats.valeurTotale / 1000000).toFixed(1)}M</div><div className="text-sm text-gray-500">Valeur active</div></div></div></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Star size={20} className="text-amber-600" /></div><div><div className="text-2xl font-bold">{stats.starred}</div><div className="text-sm text-gray-500">Favoris</div></div></div></div>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher un projet..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg"><option value="all">Tous statuts</option>{Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-4 py-2 border rounded-lg"><option value="date">Plus récents</option><option value="name">Nom A-Z</option><option value="value">Valeur ↓</option></select>
        </div>
      </div>
      <p className="text-gray-600 mb-4"><span className="font-semibold">{filtered.length}</span> projet(s)</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => <ProjectCard key={p.id} project={p} onView={(id) => navigate(`/projects/${id}`)} onStar={toggleStar} />)}
      </div>
    </div>
  )
}
