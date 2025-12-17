/**
 * DAST Solutions - Dashboard Widgets
 * Composants widgets individuels pour le dashboard personnalisable
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  DollarSign, FolderOpen, FileText, Receipt, Calendar as CalendarIcon,
  Clock, AlertTriangle, CheckCircle, ArrowRight, Plus, TrendingUp,
  TrendingDown, ChevronLeft, ChevronRight, Cloud, Sun, CloudRain,
  Wind, Thermometer, Bell, X, Settings, Move, Maximize2, Minimize2
} from 'lucide-react'
import type { WidgetConfig } from '@/contexts/DashboardConfigContext'

// ============================================================================
// WIDGET WRAPPER
// ============================================================================
interface WidgetWrapperProps {
  config: WidgetConfig
  isEditMode: boolean
  onRemove: () => void
  onSettings?: () => void
  children: React.ReactNode
}

export function WidgetWrapper({ config, isEditMode, onRemove, onSettings, children }: WidgetWrapperProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden h-full flex flex-col ${isEditMode ? 'ring-2 ring-teal-500 ring-opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Move size={14} className="text-gray-400 cursor-move" />
          )}
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">{config.title}</h3>
        </div>
        {isEditMode && (
          <div className="flex items-center gap-1">
            {onSettings && (
              <button onClick={onSettings} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                <Settings size={14} className="text-gray-500" />
              </button>
            )}
            <button onClick={onRemove} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// KPI WIDGETS
// ============================================================================
interface KPIData {
  value: number | string
  label: string
  change?: number
  icon: React.ReactNode
  color: string
}

export function KPIWidget({ type }: { type: 'revenue' | 'projects' | 'soumissions' | 'factures' }) {
  const [data, setData] = useState<KPIData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadKPI()
  }, [type])

  const loadKPI = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    switch (type) {
      case 'revenue': {
        const now = new Date()
        const startOfThisMonth = startOfMonth(now)
        const startOfLastMonth = startOfMonth(subMonths(now, 1))
        const endOfLastMonth = endOfMonth(subMonths(now, 1))

        const { data: thisMonth } = await supabase
          .from('facture_payments')
          .select('amount')
          .eq('user_id', user.id)
          .gte('payment_date', startOfThisMonth.toISOString())

        const { data: lastMonth } = await supabase
          .from('facture_payments')
          .select('amount')
          .eq('user_id', user.id)
          .gte('payment_date', startOfLastMonth.toISOString())
          .lte('payment_date', endOfLastMonth.toISOString())

        const thisMonthTotal = thisMonth?.reduce((s, p) => s + p.amount, 0) || 0
        const lastMonthTotal = lastMonth?.reduce((s, p) => s + p.amount, 0) || 0
        const change = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

        setData({
          value: thisMonthTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }),
          label: 'Revenus ce mois',
          change,
          icon: <DollarSign size={24} />,
          color: 'teal'
        })
        break
      }
      case 'projects': {
        const { data: projects } = await supabase
          .from('projects')
          .select('status')
          .eq('user_id', user.id)

        const active = projects?.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length || 0
        setData({
          value: active,
          label: 'Projets actifs',
          icon: <FolderOpen size={24} />,
          color: 'blue'
        })
        break
      }
      case 'soumissions': {
        const { data: soumissions } = await supabase
          .from('soumissions')
          .select('status')
          .eq('user_id', user.id)

        const pending = soumissions?.filter(s => s.status === 'draft' || s.status === 'sent').length || 0
        setData({
          value: pending,
          label: 'En attente',
          icon: <FileText size={24} />,
          color: 'purple'
        })
        break
      }
      case 'factures': {
        const { data: factures } = await supabase
          .from('factures')
          .select('status, date_echeance')
          .eq('user_id', user.id)

        const overdue = factures?.filter(f => {
          if (f.status === 'paid') return false
          return new Date(f.date_echeance) < new Date()
        }).length || 0

        setData({
          value: overdue,
          label: 'En retard',
          icon: <Receipt size={24} />,
          color: overdue > 0 ? 'red' : 'green'
        })
        break
      }
    }
  }

  if (!data) return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded" />

  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  }

  return (
    <div className="flex items-center justify-between h-full">
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{data.label}</p>
        {data.change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}%
          </div>
        )}
      </div>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[data.color]}`}>
        {data.icon}
      </div>
    </div>
  )
}

// ============================================================================
// CALENDAR WIDGET
// ============================================================================
interface ProjectDeadline {
  id: string
  name: string
  deadline: Date
  type: 'estimation' | 'soumission' | 'project'
  status: string
}

export function CalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [deadlines, setDeadlines] = useState<ProjectDeadline[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadDeadlines()
  }, [currentMonth])

  const loadDeadlines = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    // Projets avec date limite
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, deadline, status')
      .eq('user_id', user.id)
      .gte('deadline', monthStart.toISOString())
      .lte('deadline', monthEnd.toISOString())

    const allDeadlines: ProjectDeadline[] = []

    projects?.forEach(p => {
      if (p.deadline) {
        allDeadlines.push({
          id: p.id,
          name: p.name,
          deadline: new Date(p.deadline),
          type: 'project',
          status: p.status
        })
      }
    })

    // Soumissions avec date limite
    const { data: soumissions } = await supabase
      .from('soumissions')
      .select('id, soumission_number, client_name, deadline, status')
      .eq('user_id', user.id)
      .gte('deadline', monthStart.toISOString())
      .lte('deadline', monthEnd.toISOString())

    soumissions?.forEach(s => {
      if (s.deadline) {
        allDeadlines.push({
          id: s.id,
          name: `${s.soumission_number} - ${s.client_name}`,
          deadline: new Date(s.deadline),
          type: 'soumission',
          status: s.status
        })
      }
    })

    setDeadlines(allDeadlines)
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const startDay = startOfMonth(currentMonth).getDay()

  const getDeadlinesForDay = (day: Date) => {
    return deadlines.filter(d => isSameDay(d.deadline, day))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Navigation mois */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronLeft size={18} />
        </button>
        <span className="font-medium text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {/* Espaces vides pour le début du mois */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {days.map(day => {
          const dayDeadlines = getDeadlinesForDay(day)
          const hasDeadlines = dayDeadlines.length > 0
          const isPast = day < new Date() && !isToday(day)
          
          return (
            <div
              key={day.toISOString()}
              className={`
                relative text-center text-sm p-1 rounded cursor-pointer transition
                ${isToday(day) ? 'bg-teal-500 text-white font-bold' : ''}
                ${hasDeadlines && !isToday(day) ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium' : ''}
                ${isPast && !hasDeadlines ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                hover:bg-gray-100 dark:hover:bg-gray-700
              `}
              title={dayDeadlines.map(d => d.name).join(', ')}
            >
              {format(day, 'd')}
              {hasDeadlines && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// DEADLINES WIDGET
// ============================================================================
export function DeadlinesWidget() {
  const [deadlines, setDeadlines] = useState<ProjectDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDeadlines()
  }, [])

  const loadDeadlines = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Projets
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, deadline, status')
      .eq('user_id', user.id)
      .gte('deadline', now.toISOString())
      .lte('deadline', in30Days.toISOString())
      .neq('status', 'completed')
      .order('deadline', { ascending: true })

    // Soumissions
    const { data: soumissions } = await supabase
      .from('soumissions')
      .select('id, soumission_number, client_name, deadline, status')
      .eq('user_id', user.id)
      .gte('deadline', now.toISOString())
      .lte('deadline', in30Days.toISOString())
      .neq('status', 'accepted')
      .neq('status', 'rejected')
      .order('deadline', { ascending: true })

    const all: ProjectDeadline[] = []

    projects?.forEach(p => {
      if (p.deadline) {
        all.push({
          id: p.id,
          name: p.name,
          deadline: new Date(p.deadline),
          type: 'project',
          status: p.status
        })
      }
    })

    soumissions?.forEach(s => {
      if (s.deadline) {
        all.push({
          id: s.id,
          name: `${s.soumission_number} - ${s.client_name}`,
          deadline: new Date(s.deadline),
          type: 'soumission',
          status: s.status
        })
      }
    })

    // Trier par date
    all.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    setDeadlines(all.slice(0, 10))
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
        <p>Aucune échéance dans les 30 prochains jours</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {deadlines.map(d => {
        const daysLeft = differenceInDays(d.deadline, new Date())
        const isUrgent = daysLeft <= 3
        const isWarning = daysLeft <= 7 && !isUrgent

        return (
          <div
            key={`${d.type}-${d.id}`}
            onClick={() => navigate(d.type === 'project' ? `/project/${d.id}` : `/projets/estimation`)}
            className={`
              p-3 rounded-lg border cursor-pointer transition
              ${isUrgent ? 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800' : ''}
              ${isWarning ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800' : ''}
              ${!isUrgent && !isWarning ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' : ''}
              hover:shadow-md
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${d.type === 'project' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'}`}>
                    {d.type === 'project' ? 'Projet' : 'Soumission'}
                  </span>
                  <span>{format(d.deadline, 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              </div>
              <div className={`text-right ${isUrgent ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-600'}`}>
                <p className="font-bold">{daysLeft}</p>
                <p className="text-xs">jours</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// RECENT PROJECTS WIDGET
// ============================================================================
export function RecentProjectsWidget() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('id, name, client_name, status, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    setProjects(data || [])
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>

  return (
    <div className="space-y-2">
      {projects.map(p => (
        <div
          key={p.id}
          onClick={() => navigate(`/project/${p.id}`)}
          className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{p.client_name || 'Sans client'}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              p.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {p.status || 'Nouveau'}
            </span>
          </div>
        </div>
      ))}
      <button
        onClick={() => navigate('/projects')}
        className="w-full py-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center justify-center gap-1"
      >
        Voir tous les projets <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ============================================================================
// REVENUE CHART WIDGET
// ============================================================================
export function RevenueChartWidget() {
  const [data, setData] = useState<{ month: string; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRevenue()
  }, [])

  const loadRevenue = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    const monthlyData: { month: string; revenue: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const { data: payments } = await supabase
        .from('facture_payments')
        .select('amount')
        .eq('user_id', user.id)
        .gte('payment_date', monthStart.toISOString())
        .lte('payment_date', monthEnd.toISOString())

      monthlyData.push({
        month: format(monthStart, 'MMM', { locale: fr }),
        revenue: payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      })
    }

    setData(monthlyData)
    setLoading(false)
  }

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" /></div>

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '120px' }}>
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t transition-all duration-500"
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
        Total: {data.reduce((s, d) => s + d.revenue, 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
      </div>
    </div>
  )
}

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================
export function QuickActionsWidget() {
  const navigate = useNavigate()

  const actions = [
    { icon: <Plus size={18} />, label: 'Nouveau projet', path: '/project/new', color: 'bg-teal-500' },
    { icon: <FileText size={18} />, label: 'Nouvelle soumission', path: '/projets/estimation', color: 'bg-blue-500' },
    { icon: <Receipt size={18} />, label: 'Nouvelle facture', path: '/factures', color: 'bg-purple-500' },
    { icon: <FolderOpen size={18} />, label: 'Voir projets', path: '/projects', color: 'bg-orange-500' },
  ]

  return (
    <div className="flex items-center justify-around h-full gap-2">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-1"
        >
          <div className={`w-10 h-10 ${action.color} text-white rounded-lg flex items-center justify-center`}>
            {action.icon}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 text-center">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// WEATHER WIDGET
// ============================================================================
export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeather()
  }, [])

  const loadWeather = async () => {
    try {
      // Montréal par défaut
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Montreal,CA&units=metric&lang=fr&appid=demo`
      )
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      }
    } catch (err) {
      console.error('Erreur météo:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-full rounded" />

  // Données de démo si pas d'API
  const temp = weather?.main?.temp || -5
  const description = weather?.weather?.[0]?.description || 'Partiellement nuageux'

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Sun size={32} className="text-yellow-500 mb-2" />
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(temp)}°C</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{description}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Montréal</p>
    </div>
  )
}

// ============================================================================
// NOTIFICATIONS WIDGET
// ============================================================================
export function NotificationsWidget() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(5)

    setNotifications(data || [])
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />)}</div>

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bell size={32} className="mx-auto mb-2 opacity-50" />
        <p>Aucune notification</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map(n => (
        <div key={n.id} className="p-2 rounded bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PROJECT STATUS WIDGET (Pie Chart simulation)
// ============================================================================
export function ProjectStatusWidget() {
  const [stats, setStats] = useState<{ status: string; count: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('projects')
      .select('status')
      .eq('user_id', user.id)

    const statusCounts: Record<string, number> = {}
    data?.forEach(p => {
      const s = p.status || 'nouveau'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    })

    const colors: Record<string, string> = {
      nouveau: '#3B82F6',
      active: '#10B981',
      soumission: '#F59E0B',
      en_cours: '#8B5CF6',
      completed: '#6B7280',
      cancelled: '#EF4444'
    }

    const result = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: colors[status] || '#9CA3AF'
    }))

    setStats(result)
    setLoading(false)
  }

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" /></div>

  const total = stats.reduce((s, st) => s + st.count, 0)

  return (
    <div className="h-full flex items-center gap-4">
      {/* Simple bar representation */}
      <div className="flex-1 space-y-2">
        {stats.map(s => (
          <div key={s.status} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 capitalize">{s.status.replace('_', ' ')}</span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{s.count}</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
      </div>
    </div>
  )
}
