/**
 * DAST Solutions - Gestion Projet Home (Style ACC)
 * Page d'accueil de gestion d'un projet actif
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Home, Layers, FileSearch, AlertCircle, Camera,
  MessageSquare, Send, Calendar, Wrench, BarChart3, Users2,
  PiggyBank, DollarSign, TrendingUp, FileCheck, FormInput,
  Cloud, Sun, CloudRain, Thermometer, MapPin, Clock,
  ChevronRight, Plus, ExternalLink, Building2, Loader2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  client_name?: string
  address?: string
  city?: string
  province?: string
  budget?: number
  start_date?: string
  end_date?: string
}

interface WeatherData {
  temp: number
  description: string
  icon: string
}

// Navigation latérale du module gestion
const GESTION_NAV = [
  { section: 'Général', items: [
    { path: '', label: 'Accueil', icon: Home },
  ]},
  { section: 'Finances', items: [
    { path: '/budget', label: 'Budget', icon: PiggyBank },
    { path: '/couts', label: 'Coûts', icon: DollarSign },
    { path: '/change-orders', label: 'Ordres de changement', icon: FileCheck },
    { path: '/previsions', label: 'Prévisions', icon: TrendingUp },
  ]},
  { section: 'Suivi', items: [
    { path: '/plans', label: 'Plans', icon: Layers },
    { path: '/documents', label: 'Documents', icon: FileSearch },
    { path: '/echeancier', label: 'Échéancier', icon: Calendar },
    { path: '/photos', label: 'Photos', icon: Camera },
  ]},
  { section: 'Communication', items: [
    { path: '/problemes', label: 'Problèmes', icon: AlertCircle },
    { path: '/rfi', label: 'RFIs', icon: MessageSquare },
    { path: '/soumissions-fournisseurs', label: 'Soum. fournisseurs', icon: Send },
    { path: '/journal', label: 'Journal chantier', icon: FormInput },
  ]},
  { section: 'Rapports', items: [
    { path: '/rapports', label: 'Rapports', icon: BarChart3 },
    { path: '/equipe', label: 'Équipe', icon: Users2 },
  ]},
]

export default function GestionProjetLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<WeatherData | null>(null)

  // Charger le projet
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          navigate('/projects')
          return
        }

        setProject(data)

        // Charger la météo si adresse disponible
        if (data.city) {
          fetchWeather(data.city)
        }
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId, navigate])

  // Charger la météo
  const fetchWeather = async (city: string) => {
    try {
      // Utiliser OpenWeatherMap si API key disponible
      // Pour l'instant, données simulées
      setWeather({
        temp: -5,
        description: 'Nuageux',
        icon: 'cloud'
      })
    } catch (err) {
      console.error('Erreur météo:', err)
    }
  }

  // Vérifier si on est sur la page d'accueil
  const isHomePage = location.pathname === `/gestion/${projectId}` || 
                     location.pathname === `/gestion/${projectId}/`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de navigation du module */}
      <aside className="w-56 bg-white border-r flex flex-col">
        {/* Header projet */}
        <div className="p-4 border-b">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft size={16} />
            Retour aux projets
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{project.name}</h2>
              <p className="text-xs text-gray-500 truncate">{project.client_name || 'Sans client'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {GESTION_NAV.map(section => (
            <div key={section.section} className="mb-4">
              <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={`/gestion/${projectId}${item.path}`}
                    end={item.path === ''}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                        isActive 
                          ? 'bg-teal-50 text-teal-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto">
        {isHomePage ? (
          <GestionHome project={project} weather={weather} navigate={navigate} />
        ) : (
          <div className="p-6">
            <Outlet context={{ project }} />
          </div>
        )}
      </main>
    </div>
  )
}

// Page d'accueil du module Gestion
function GestionHome({ project, weather, navigate }: { 
  project: Project
  weather: WeatherData | null
  navigate: (path: string) => void 
}) {
  const [stats, setStats] = useState({
    changeOrders: 0,
    rfis: 0,
    problems: 0,
    photos: 0
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur {project.name}</h1>
        <p className="text-gray-500">Voici ce qui se passe sur votre projet aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="col-span-2 space-y-6">
          {/* Progression du projet */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Progression du projet</h3>
            {project.start_date && project.end_date ? (
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{new Date(project.start_date).toLocaleDateString('fr-CA')}</span>
                  <span>{new Date(project.end_date).toLocaleDateString('fr-CA')}</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
                    style={{ 
                      width: `${Math.max(0, Math.min(
                        ((Date.now() - new Date(project.start_date).getTime()) / 
                        (new Date(project.end_date).getTime() - new Date(project.start_date).getTime())) * 100, 
                        100
                      ))}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between mt-3">
                  <div>
                    <p className="text-sm text-gray-500">Temps écoulé</p>
                    <p className="font-semibold">
                      {Math.max(0, Math.round(
                        (Date.now() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)
                      ))} jours
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Temps restant</p>
                    <p className="font-semibold">
                      {Math.max(0, Math.round(
                        (new Date(project.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      ))} jours
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">Échéancier non configuré</p>
                <p className="text-sm text-gray-400">Ajoutez les dates du projet pour voir la progression</p>
                <button 
                  onClick={() => navigate(`/project/${project.id}?tab=edit`)}
                  className="mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  Ajouter les dates →
                </button>
              </div>
            )}
          </div>

          {/* Liens rapides */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Liens rapides</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate(`/gestion/${project.id}/plans`)}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Layers className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Plans</p>
                  <p className="text-sm text-gray-500">0 documents</p>
                </div>
              </button>

              <button 
                onClick={() => navigate(`/gestion/${project.id}/equipe`)}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users2 className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Équipe</p>
                  <p className="text-sm text-gray-500">0 membres</p>
                </div>
              </button>

              <button 
                onClick={() => navigate(`/takeoff/${project.id}`)}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <FileSearch className="text-teal-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Takeoff</p>
                  <p className="text-sm text-gray-500">Relevé de quantités</p>
                </div>
              </button>

              <button 
                onClick={() => navigate(`/gestion/${project.id}/change-orders`)}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileCheck className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="font-medium">Ordres de changement</p>
                  <p className="text-sm text-gray-500">{stats.changeOrders} ordres</p>
                </div>
              </button>
            </div>
          </div>

          {/* Statut des travaux */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Statut des travaux</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.problems}</p>
                <p className="text-sm text-gray-600">Problèmes</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats.rfis}</p>
                <p className="text-sm text-gray-600">RFIs ouverts</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.changeOrders}</p>
                <p className="text-sm text-gray-600">Ordres chg.</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.photos}</p>
                <p className="text-sm text-gray-600">Photos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Météo du site */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Météo du site</h3>
            {project.city ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-3">
                  <MapPin size={16} />
                  <span>{project.city}, {project.province || 'QC'}</span>
                </div>
                {weather ? (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {weather.icon === 'cloud' ? (
                        <Cloud className="text-gray-400" size={40} />
                      ) : weather.icon === 'rain' ? (
                        <CloudRain className="text-blue-400" size={40} />
                      ) : (
                        <Sun className="text-amber-400" size={40} />
                      )}
                      <span className="text-3xl font-bold">{weather.temp}°C</span>
                    </div>
                    <p className="text-gray-500">{weather.description}</p>
                  </>
                ) : (
                  <p className="text-gray-400">Chargement...</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Cloud className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500">Aucune adresse de projet</p>
                <button 
                  onClick={() => navigate(`/project/${project.id}?tab=edit`)}
                  className="mt-2 text-teal-600 hover:text-teal-700 text-sm"
                >
                  Ajouter l'adresse →
                </button>
              </div>
            )}
          </div>

          {/* Budget rapide */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Budget</h3>
              <button 
                onClick={() => navigate(`/gestion/${project.id}/budget`)}
                className="text-teal-600 hover:text-teal-700 text-sm"
              >
                Voir tout →
              </button>
            </div>
            {project.budget ? (
              <div>
                <p className="text-sm text-gray-500">Budget initial</p>
                <p className="text-2xl font-bold text-gray-900">
                  {project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Engagé</span>
                    <span className="font-medium">0 $</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Restant</span>
                    <span className="font-medium text-green-600">
                      {project.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <PiggyBank className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500">Budget non défini</p>
                <button 
                  onClick={() => navigate(`/gestion/${project.id}/budget`)}
                  className="mt-2 text-teal-600 hover:text-teal-700 text-sm"
                >
                  Configurer le budget →
                </button>
              </div>
            )}
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Activité récente</h3>
            <div className="text-center py-8 text-gray-400">
              <Clock className="mx-auto mb-2" size={32} />
              <p className="text-sm">Aucune activité récente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
