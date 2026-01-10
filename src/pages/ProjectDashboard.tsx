/**
 * DAST Solutions - Dashboard Projet Amélioré
 * Inclut: Météo du site, Échéancier phase, KPIs, Documents récents
 * S'adapte à la phase du projet (Conception, Estimation, Gestion)
 */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer,
  Calendar, Clock, CheckCircle2, AlertTriangle, FileText, Users,
  DollarSign, TrendingUp, TrendingDown, FolderOpen, Settings,
  ChevronRight, MapPin, Building2, Phone, Mail, BarChart3,
  ClipboardList, Package, Truck, HardHat, Timer, Target,
  AlertCircle, Droplets, Eye
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client_name?: string
  address?: string
  city?: string
  phase: 'conception' | 'estimation' | 'gestion'
  status: string
  start_date?: string
  end_date?: string
  budget?: number
  created_at: string
}

interface WeatherData {
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  description: string
  icon: string
  forecast: {
    date: string
    temp_max: number
    temp_min: number
    icon: string
    description: string
    precipitation: number
  }[]
}

interface PhaseTask {
  id: string
  name: string
  start_date: string
  end_date: string
  progress: number
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  assignee?: string
}

// Icônes météo
function WeatherIcon({ icon, size = 24 }: { icon: string, size?: number }) {
  const iconMap: Record<string, React.ElementType> = {
    '01d': Sun, '01n': Sun,
    '02d': Cloud, '02n': Cloud,
    '03d': Cloud, '03n': Cloud,
    '04d': Cloud, '04n': Cloud,
    '09d': CloudRain, '09n': CloudRain,
    '10d': CloudRain, '10n': CloudRain,
    '11d': CloudRain, '11n': CloudRain,
    '13d': CloudSnow, '13n': CloudSnow,
    '50d': Wind, '50n': Wind,
  }
  const IconComponent = iconMap[icon] || Cloud
  return <IconComponent size={size} />
}

// Couleurs par phase
const PHASE_COLORS = {
  conception: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  estimation: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  gestion: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
}

const PHASE_LABELS = {
  conception: 'Conception',
  estimation: 'Estimation',
  gestion: 'Gestion',
}

// Données de démo météo
const DEMO_WEATHER: WeatherData = {
  temp: -5,
  feels_like: -10,
  humidity: 65,
  wind_speed: 15,
  description: 'Partiellement nuageux',
  icon: '02d',
  forecast: [
    { date: '2026-01-11', temp_max: -3, temp_min: -8, icon: '02d', description: 'Nuageux', precipitation: 10 },
    { date: '2026-01-12', temp_max: -1, temp_min: -6, icon: '01d', description: 'Ensoleillé', precipitation: 0 },
    { date: '2026-01-13', temp_max: 2, temp_min: -4, icon: '03d', description: 'Nuageux', precipitation: 20 },
    { date: '2026-01-14', temp_max: 0, temp_min: -5, icon: '13d', description: 'Neige', precipitation: 80 },
    { date: '2026-01-15', temp_max: -2, temp_min: -8, icon: '02d', description: 'Partiellement nuageux', precipitation: 5 },
    { date: '2026-01-16', temp_max: -4, temp_min: -10, icon: '01d', description: 'Ensoleillé', precipitation: 0 },
    { date: '2026-01-17', temp_max: -1, temp_min: -7, icon: '04d', description: 'Couvert', precipitation: 30 },
  ]
}

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(DEMO_WEATHER)
  const [tasks, setTasks] = useState<PhaseTask[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    documents: 0,
    soumissions: 0,
    factures: 0,
    changeOrders: 0,
    budget: 0,
    spent: 0,
    progress: 0
  })

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger le projet
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectData) {
        setProject(projectData)
        
        // Charger la météo du site (si adresse disponible)
        if (projectData.city || projectData.address) {
          loadWeather(projectData.city || 'Montreal')
        }
      }

      // Charger les stats selon la phase
      // Documents
      const { count: docsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Soumissions
      const { count: soumCount } = await supabase
        .from('soumissions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      setStats(prev => ({
        ...prev,
        documents: docsCount || 0,
        soumissions: soumCount || 0,
        budget: projectData?.budget || 0,
        progress: 35 // Placeholder
      }))

      // Tâches de la phase (demo)
      setTasks([
        { id: '1', name: 'Réception des plans', start_date: '2026-01-05', end_date: '2026-01-10', progress: 100, status: 'completed' },
        { id: '2', name: 'Analyse des documents', start_date: '2026-01-08', end_date: '2026-01-15', progress: 60, status: 'in_progress' },
        { id: '3', name: 'Relevé de quantités', start_date: '2026-01-12', end_date: '2026-01-20', progress: 20, status: 'in_progress' },
        { id: '4', name: 'Demandes de prix', start_date: '2026-01-15', end_date: '2026-01-25', progress: 0, status: 'pending' },
        { id: '5', name: 'Compilation soumission', start_date: '2026-01-22', end_date: '2026-01-30', progress: 0, status: 'pending' },
      ])

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadWeather = async (city: string) => {
    try {
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
      if (!apiKey) {
        setWeather(DEMO_WEATHER)
        return
      }

      // Current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},CA&units=metric&lang=fr&appid=${apiKey}`
      )
      const currentData = await currentRes.json()

      // Forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},CA&units=metric&lang=fr&appid=${apiKey}`
      )
      const forecastData = await forecastRes.json()

      if (currentData.cod === 200) {
        const dailyForecast = forecastData.list
          .filter((_: any, i: number) => i % 8 === 0)
          .slice(0, 7)
          .map((day: any) => ({
            date: day.dt_txt.split(' ')[0],
            temp_max: Math.round(day.main.temp_max),
            temp_min: Math.round(day.main.temp_min),
            icon: day.weather[0].icon,
            description: day.weather[0].description,
            precipitation: day.pop * 100
          }))

        setWeather({
          temp: Math.round(currentData.main.temp),
          feels_like: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          wind_speed: Math.round(currentData.wind.speed * 3.6),
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          forecast: dailyForecast
        })
      }
    } catch (err) {
      console.error('Erreur météo:', err)
      setWeather(DEMO_WEATHER)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'delayed': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-CA', { weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Projet non trouvé</p>
        <button onClick={() => navigate('/projects')} className="mt-2 text-teal-600 hover:underline">
          Retour aux projets
        </button>
      </div>
    )
  }

  const phaseColors = PHASE_COLORS[project.phase] || PHASE_COLORS.gestion

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseColors.bg} ${phaseColors.text}`}>
              {PHASE_LABELS[project.phase]}
            </span>
          </div>
          <p className="text-gray-500 flex items-center gap-2">
            <Building2 size={14} /> {project.client_name}
            {project.city && (
              <>
                <span className="text-gray-300">•</span>
                <MapPin size={14} /> {project.city}
              </>
            )}
          </p>
        </div>
        <Link
          to={`/project/${projectId}`}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Settings size={16} />
          Détails du projet
        </Link>
      </div>

      {/* Météo du site + Stats rapides */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Météo actuelle */}
        <div className="col-span-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-80">Météo du site</span>
            <MapPin size={14} className="opacity-60" />
          </div>
          {weather && (
            <>
              <div className="flex items-center gap-3">
                <WeatherIcon icon={weather.icon} size={40} />
                <div>
                  <p className="text-3xl font-bold">{weather.temp}°C</p>
                  <p className="text-sm opacity-80 capitalize">{weather.description}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <Thermometer size={14} /> Ressenti {weather.feels_like}°
                </span>
                <span className="flex items-center gap-1">
                  <Wind size={14} /> {weather.wind_speed} km/h
                </span>
              </div>
            </>
          )}
        </div>

        {/* Stats selon la phase */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.documents}</p>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.soumissions}</p>
              <p className="text-sm text-gray-500">Soumissions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Target className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.progress}%</p>
              <p className="text-sm text-gray-500">Progression</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prévisions 7 jours */}
      {weather && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Prévisions météo - 7 jours
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {weather.forecast.map((day, idx) => (
              <div 
                key={idx} 
                className={`text-center p-3 rounded-lg ${
                  day.precipitation > 50 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500 capitalize">{getDayName(day.date)}</p>
                <WeatherIcon icon={day.icon} size={24} />
                <p className="font-bold text-sm">{day.temp_max}°</p>
                <p className="text-xs text-gray-400">{day.temp_min}°</p>
                {day.precipitation > 0 && (
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-1">
                    <Droplets size={10} /> {day.precipitation}%
                  </p>
                )}
              </div>
            ))}
          </div>
          {weather.forecast.some(d => d.precipitation > 50) && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              Précipitations prévues cette semaine - planifier en conséquence
            </div>
          )}
        </div>
      )}

      {/* Échéancier de la phase */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Timer size={18} className={phaseColors.text} />
            Échéancier - Phase {PHASE_LABELS[project.phase]}
          </h3>
          <Link to={`/project/${projectId}/schedule`} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
            Voir complet <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {tasks.map(task => {
            const startDate = new Date(task.start_date)
            const endDate = new Date(task.end_date)
            const today = new Date()
            const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            const daysElapsed = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100)
            const isDelayed = task.status === 'in_progress' && task.progress < timeProgress - 10
            
            return (
              <div key={task.id} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(isDelayed ? 'delayed' : task.status)}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{task.name}</span>
                    <span className="text-xs text-gray-500">
                      {startDate.toLocaleDateString('fr-CA')} - {endDate.toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isDelayed ? 'bg-red-500' : 
                        task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{task.progress}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions rapides selon la phase */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl border-2 ${phaseColors.border} ${phaseColors.bg}`}>
          <h4 className={`font-semibold mb-3 ${phaseColors.text}`}>Actions {PHASE_LABELS[project.phase]}</h4>
          <div className="space-y-2">
            {project.phase === 'conception' && (
              <>
                <Link to={`/project/${projectId}/documents`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <FileText size={16} /> Gérer les plans
                </Link>
                <Link to={`/project/${projectId}/viewer`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <Eye size={16} /> Visualiseur 3D
                </Link>
              </>
            )}
            {project.phase === 'estimation' && (
              <>
                <Link to={`/project/${projectId}/takeoff`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <Package size={16} /> Relevé de quantités
                </Link>
                <Link to={`/project/${projectId}/soumissions`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <ClipboardList size={16} /> Demandes de prix
                </Link>
                <Link to={`/soumission/new?project=${projectId}`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <FileText size={16} /> Nouvelle soumission
                </Link>
              </>
            )}
            {project.phase === 'gestion' && (
              <>
                <Link to={`/project/${projectId}/budget`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <DollarSign size={16} /> Budget & Coûts
                </Link>
                <Link to={`/project/${projectId}/change-orders`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <FileText size={16} /> Ordres de changement
                </Link>
                <Link to={`/project/${projectId}/factures`} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:shadow-md transition text-sm">
                  <DollarSign size={16} /> Facturation
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white">
          <h4 className="font-semibold mb-3 text-gray-700">Documents récents</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="text-center text-gray-400 py-4">Aucun document récent</p>
          </div>
          <Link to={`/project/${projectId}/documents`} className="text-teal-600 text-sm hover:underline flex items-center gap-1 mt-2">
            Voir tous <ChevronRight size={14} />
          </Link>
        </div>

        <div className="p-4 rounded-xl border bg-white">
          <h4 className="font-semibold mb-3 text-gray-700">Équipe projet</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-700 font-medium text-xs">DP</span>
              </div>
              <div>
                <p className="font-medium">Danny Pineault</p>
                <p className="text-xs text-gray-400">Chargé de projet</p>
              </div>
            </div>
          </div>
          <Link to={`/project/${projectId}/team`} className="text-teal-600 text-sm hover:underline flex items-center gap-1 mt-4">
            Gérer l'équipe <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Navigation entre phases */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Navigation entre les phases</h4>
        <div className="flex gap-2">
          {(['conception', 'estimation', 'gestion'] as const).map(phase => {
            const colors = PHASE_COLORS[phase]
            const isCurrent = project.phase === phase
            const canAccess = true // Logique d'accès à implémenter
            
            return (
              <button
                key={phase}
                onClick={() => {
                  // Changer la phase du projet
                  if (!isCurrent) {
                    navigate(`/project/${projectId}/${phase}`)
                  }
                }}
                disabled={!canAccess}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  isCurrent 
                    ? `${colors.bg} ${colors.border} ${colors.text}` 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                } ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className="font-medium">{PHASE_LABELS[phase]}</p>
                <p className="text-xs opacity-70">
                  {phase === 'conception' && 'Plans & Documents'}
                  {phase === 'estimation' && 'Takeoff & Soumissions'}
                  {phase === 'gestion' && 'Budget & Facturation'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
