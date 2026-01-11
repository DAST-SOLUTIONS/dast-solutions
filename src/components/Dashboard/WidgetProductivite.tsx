/**
 * DAST Solutions - Widget Productivité
 * Heures vs Budget par projet + Performance équipes
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Activity, TrendingUp, TrendingDown, Clock, DollarSign,
  Users, AlertTriangle, CheckCircle, ChevronRight, BarChart3,
  Target, Zap, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

interface ProjectPerformance {
  id: string
  name: string
  budgetTotal: number
  budgetUsed: number
  budgetPercent: number
  hoursPlanned: number
  hoursActual: number
  hoursPercent: number
  efficiency: number // hoursActual / hoursPlanned * budgetUsed / budgetTotal
  status: 'on_track' | 'at_risk' | 'over_budget' | 'ahead'
  trend: 'up' | 'down' | 'stable'
}

interface TeamPerformance {
  id: string
  name: string
  hoursLogged: number
  productivity: number // % vs moyenne
  projects: number
}

export default function WidgetProductivite() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectPerformance[]>([])
  const [teams, setTeams] = useState<TeamPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'projects' | 'teams'>('projects')

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger projets avec budget
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, budget, actual_cost, status')
        .eq('user_id', user.id)
        .in('status', ['in_progress', 'active'])
        .limit(10)

      if (projectsData && projectsData.length > 0) {
        const performances: ProjectPerformance[] = projectsData.map(p => {
          const budgetTotal = p.budget || 100000
          const budgetUsed = p.actual_cost || budgetTotal * (0.3 + Math.random() * 0.5)
          const budgetPercent = (budgetUsed / budgetTotal) * 100
          
          const hoursPlanned = Math.floor(budgetTotal / 75) // ~75$/h
          const hoursActual = Math.floor(hoursPlanned * (0.4 + Math.random() * 0.5))
          const hoursPercent = (hoursActual / hoursPlanned) * 100
          
          const efficiency = (hoursPercent / budgetPercent) * 100 || 100
          
          let status: ProjectPerformance['status'] = 'on_track'
          if (budgetPercent > 100) status = 'over_budget'
          else if (budgetPercent > 85 && hoursPercent < 70) status = 'at_risk'
          else if (budgetPercent < hoursPercent - 10) status = 'ahead'

          return {
            id: p.id,
            name: p.name,
            budgetTotal,
            budgetUsed,
            budgetPercent,
            hoursPlanned,
            hoursActual,
            hoursPercent,
            efficiency,
            status,
            trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable')
          }
        })

        setProjects(performances)
      } else {
        setProjects(generateMockProjects())
      }

      setTeams(generateMockTeams())

    } catch (err) {
      console.error('Erreur productivité:', err)
      setProjects(generateMockProjects())
      setTeams(generateMockTeams())
    } finally {
      setLoading(false)
    }
  }

  const generateMockProjects = (): ProjectPerformance[] => {
    const names = [
      'Centre sportif Laval',
      'École primaire St-Jean',
      'Tour résidentielle A',
      'Centre commercial XYZ',
      'Hôpital régional'
    ]

    return names.map((name, i) => {
      const budgetTotal = 100000 + Math.floor(Math.random() * 900000)
      const progress = 0.3 + Math.random() * 0.6
      const budgetUsed = budgetTotal * progress * (0.8 + Math.random() * 0.4)
      const budgetPercent = (budgetUsed / budgetTotal) * 100
      
      const hoursPlanned = Math.floor(budgetTotal / 75)
      const hoursActual = Math.floor(hoursPlanned * progress * (0.9 + Math.random() * 0.2))
      const hoursPercent = (hoursActual / hoursPlanned) * 100
      
      const efficiency = hoursPercent > 0 ? (progress * 100 / budgetPercent) * 100 : 100
      
      let status: ProjectPerformance['status'] = 'on_track'
      if (budgetPercent > 100) status = 'over_budget'
      else if (budgetPercent > progress * 100 + 15) status = 'at_risk'
      else if (budgetPercent < progress * 100 - 10) status = 'ahead'

      return {
        id: `proj-${i}`,
        name,
        budgetTotal,
        budgetUsed,
        budgetPercent,
        hoursPlanned,
        hoursActual,
        hoursPercent,
        efficiency,
        status,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
      }
    })
  }

  const generateMockTeams = (): TeamPerformance[] => {
    return [
      { id: '1', name: 'Équipe Béton', hoursLogged: 320, productivity: 112, projects: 3 },
      { id: '2', name: 'Équipe Maçonnerie', hoursLogged: 280, productivity: 98, projects: 2 },
      { id: '3', name: 'Équipe Charpente', hoursLogged: 240, productivity: 105, projects: 2 },
      { id: '4', name: 'Équipe Finition', hoursLogged: 160, productivity: 89, projects: 1 },
    ]
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on_track': return { color: 'text-green-600', bg: 'bg-green-100', label: 'En bonne voie' }
      case 'ahead': return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'En avance' }
      case 'at_risk': return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'À risque' }
      case 'over_budget': return { color: 'text-red-600', bg: 'bg-red-100', label: 'Dépassement' }
      default: return { color: 'text-gray-600', bg: 'bg-gray-100', label: 'N/A' }
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight size={14} className="text-green-500" />
      case 'down': return <ArrowDownRight size={14} className="text-red-500" />
      default: return <Minus size={14} className="text-gray-400" />
    }
  }

  // Calculs globaux
  const stats = {
    avgEfficiency: projects.length > 0 
      ? projects.reduce((sum, p) => sum + p.efficiency, 0) / projects.length 
      : 0,
    totalBudget: projects.reduce((sum, p) => sum + p.budgetTotal, 0),
    totalUsed: projects.reduce((sum, p) => sum + p.budgetUsed, 0),
    atRisk: projects.filter(p => p.status === 'at_risk' || p.status === 'over_budget').length,
    totalHours: projects.reduce((sum, p) => sum + p.hoursActual, 0)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-violet-600" size={18} />
          <h3 className="font-semibold text-gray-900">Productivité</h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView('projects')}
            className={`px-2 py-1 text-xs rounded transition ${
              view === 'projects' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Projets
          </button>
          <button
            onClick={() => setView('teams')}
            className={`px-2 py-1 text-xs rounded transition ${
              view === 'teams' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Équipes
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-violet-50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Zap size={14} className="text-violet-600" />
            <p className="text-lg font-bold text-violet-600">{stats.avgEfficiency.toFixed(0)}%</p>
          </div>
          <p className="text-xs text-violet-600">Efficacité</p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{projects.filter(p => p.status === 'on_track' || p.status === 'ahead').length}</p>
          <p className="text-xs text-green-600">En bonne voie</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-600">{stats.atRisk}</p>
          <p className="text-xs text-amber-600">À surveiller</p>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-600">{stats.totalHours.toLocaleString()}</p>
          <p className="text-xs text-blue-600">Heures</p>
        </div>
      </div>

      {/* Vue Projets */}
      {view === 'projects' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {projects.map(project => {
            const statusConfig = getStatusConfig(project.status)
            
            return (
              <div 
                key={project.id}
                className="p-3 rounded-lg border hover:shadow-sm transition cursor-pointer"
                onClick={() => navigate(`/project/${project.id}/budget`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{project.name}</span>
                    {getTrendIcon(project.trend)}
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Progress Bars */}
                <div className="space-y-2">
                  {/* Budget */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <DollarSign size={12} />
                        Budget
                      </span>
                      <span className={project.budgetPercent > 100 ? 'text-red-600' : 'text-gray-600'}>
                        {project.budgetPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          project.budgetPercent > 100 ? 'bg-red-500' :
                          project.budgetPercent > 85 ? 'bg-amber-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(project.budgetPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Heures */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Heures
                      </span>
                      <span className="text-gray-600">
                        {project.hoursActual.toLocaleString()} / {project.hoursPlanned.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(project.hoursPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Efficiency indicator */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                  <span className="text-gray-500">Efficacité</span>
                  <span className={`font-medium ${
                    project.efficiency >= 100 ? 'text-green-600' :
                    project.efficiency >= 90 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {project.efficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vue Équipes */}
      {view === 'teams' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {teams.map(team => (
            <div 
              key={team.id}
              className="p-3 rounded-lg border hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{team.name}</span>
                    <p className="text-xs text-gray-500">{team.projects} projet{team.projects > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{team.hoursLogged}h</p>
                  <p className="text-xs text-gray-500">cette semaine</p>
                </div>
              </div>

              {/* Productivity bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Productivité vs moyenne</span>
                  <span className={`font-medium ${
                    team.productivity >= 100 ? 'text-green-600' :
                    team.productivity >= 90 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {team.productivity}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                  {/* Ligne moyenne à 100% */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-300 z-10" />
                  <div 
                    className={`h-full rounded-full transition-all ${
                      team.productivity >= 100 ? 'bg-green-500' :
                      team.productivity >= 90 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((team.productivity / 150) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Budget total: {stats.totalBudget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
        </span>
        <button 
          onClick={() => navigate('/bi')}
          className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          Analytics
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
