/**
 * DAST Solutions - Dashboard avec Widgets Personnalisables
 * KPIs, Graphiques, Widgets modulaires
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  FolderOpen, FileText, DollarSign, TrendingUp, Clock, CheckCircle,
  AlertTriangle, Plus, ArrowRight, Calendar, Users, Receipt,
  BarChart3, PieChart, Activity, Settings, X, GripVertical,
  Cloud, Thermometer, Package, Bell, Eye, EyeOff
} from 'lucide-react'

// Import des widgets
import {
  WidgetWeatherAdvanced,
  WidgetMaterialPricesAdvanced,
  WidgetEcheances,
  WidgetSEAO,
  WidgetProductivite,
  WidgetAlertes,
  WidgetCalendar
} from '@/components/Dashboard'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalSoumissions: number
  pendingSoumissions: number
  acceptedSoumissions: number
  totalFactures: number
  unpaidFactures: number
  overdueFactures: number
  revenueThisMonth: number
  revenueLastMonth: number
  totalClients: number
}

interface RecentProject {
  id: string
  name: string
  client_name?: string
  status: string
  updated_at: string
}

interface RecentSoumission {
  id: string
  soumission_number: string
  client_name: string
  total: number
  status: string
  created_at: string
}

interface WidgetConfig {
  id: string
  name: string
  icon: any
  visible: boolean
  size: 'small' | 'medium' | 'large'
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'weather', name: 'Météo Chantier', icon: Cloud, visible: true, size: 'medium' },
  { id: 'echeances', name: 'Échéances', icon: Clock, visible: true, size: 'medium' },
  { id: 'alerts', name: 'Alertes', icon: Bell, visible: true, size: 'medium' },
  { id: 'seao', name: 'SEAO Québec', icon: Receipt, visible: true, size: 'medium' },
  { id: 'materials', name: 'Prix Matériaux', icon: Package, visible: true, size: 'large' },
  { id: 'productivity', name: 'Productivité', icon: Activity, visible: true, size: 'medium' },
  { id: 'kpis', name: 'KPIs', icon: BarChart3, visible: true, size: 'large' },
  { id: 'calendar', name: 'Calendrier', icon: Calendar, visible: true, size: 'medium' },
  { id: 'projects', name: 'Projets récents', icon: FolderOpen, visible: true, size: 'medium' },
  { id: 'soumissions', name: 'Soumissions récentes', icon: FileText, visible: true, size: 'medium' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentSoumissions, setRecentSoumissions] = useState<RecentSoumission[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([])
  
  // Widgets personnalisables
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('dast_dashboard_widgets')
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
  })
  const [showWidgetSettings, setShowWidgetSettings] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Sauvegarder config widgets
  useEffect(() => {
    localStorage.setItem('dast_dashboard_widgets', JSON.stringify(widgets))
  }, [widgets])

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Projets
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, client_name, status, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      const activeProjects = projects?.filter(p => p.status !== 'completed' && p.status !== 'cancelled') || []

      // Soumissions
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('id, soumission_number, client_name, total, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const pending = soumissions?.filter(s => s.status === 'draft' || s.status === 'sent') || []
      const accepted = soumissions?.filter(s => s.status === 'accepted') || []

      // Factures
      const { data: factures } = await supabase
        .from('factures')
        .select('id, total, balance_due, status, date_echeance')
        .eq('user_id', user.id)

      const unpaid = factures?.filter(f => f.status !== 'paid') || []
      const overdue = factures?.filter(f => {
        if (f.status === 'paid') return false
        return new Date(f.date_echeance) < new Date()
      }) || []

      // Revenus ce mois
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const { data: paymentsThisMonth } = await supabase
        .from('facture_payments')
        .select('amount')
        .eq('user_id', user.id)
        .gte('payment_date', startOfMonth.toISOString())

      const { data: paymentsLastMonth } = await supabase
        .from('facture_payments')
        .select('amount')
        .eq('user_id', user.id)
        .gte('payment_date', startOfLastMonth.toISOString())
        .lt('payment_date', endOfLastMonth.toISOString())

      // Clients
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Revenus mensuels (6 derniers mois)
      const monthlyData: { month: string; revenue: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        
        const { data: monthPayments } = await supabase
          .from('facture_payments')
          .select('amount')
          .eq('user_id', user.id)
          .gte('payment_date', monthStart.toISOString())
          .lte('payment_date', monthEnd.toISOString())

        monthlyData.push({
          month: monthStart.toLocaleDateString('fr-CA', { month: 'short' }),
          revenue: monthPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
        })
      }
      setMonthlyRevenue(monthlyData)

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects: activeProjects.length,
        totalSoumissions: soumissions?.length || 0,
        pendingSoumissions: pending.length,
        acceptedSoumissions: accepted.length,
        totalFactures: factures?.length || 0,
        unpaidFactures: unpaid.length,
        overdueFactures: overdue.length,
        revenueThisMonth: paymentsThisMonth?.reduce((sum, p) => sum + p.amount, 0) || 0,
        revenueLastMonth: paymentsLastMonth?.reduce((sum, p) => sum + p.amount, 0) || 0,
        totalClients: clientsCount || 0
      })

      setRecentProjects(projects?.slice(0, 5) || [])
      setRecentSoumissions(soumissions?.slice(0, 5) || [])

    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    ))
  }

  const resetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS)
    localStorage.removeItem('dast_dashboard_widgets')
  }

  const revenueChange = stats ? (
    stats.revenueLastMonth > 0 
      ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth * 100).toFixed(1)
      : stats.revenueThisMonth > 0 ? '+100' : '0'
  ) : '0'

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1)

  const isWidgetVisible = (id: string) => widgets.find(w => w.id === id)?.visible ?? true

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue dans DAST Solutions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWidgetSettings(!showWidgetSettings)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Settings size={18} />
            Personnaliser
          </button>
          <button onClick={() => navigate('/project/new')} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau projet
          </button>
        </div>
      </div>

      {/* Widget Settings Panel */}
      {showWidgetSettings && (
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Personnaliser le tableau de bord</h3>
            <div className="flex gap-2">
              <button onClick={resetWidgets} className="text-sm text-gray-500 hover:text-gray-700">
                Réinitialiser
              </button>
              <button onClick={() => setShowWidgetSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {widgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => toggleWidgetVisibility(widget.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                  widget.visible 
                    ? 'bg-teal-50 border-teal-200 text-teal-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                {widget.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                <widget.icon size={16} />
                <span className="text-sm">{widget.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs principaux */}
      {isWidgetVisible('kpis') && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <DollarSign className="text-teal-600" size={24} />
              </div>
              <span className={`text-sm font-medium ${parseFloat(revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.revenueThisMonth.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500">Revenus ce mois</p>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <FolderOpen className="text-blue-600" size={24} />
              </div>
              <span className="text-sm font-medium text-blue-600">
                {stats?.activeProjects} actifs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalProjects}</p>
            <p className="text-sm text-gray-500">Projets totaux</p>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="text-purple-600" size={24} />
              </div>
              <span className="text-sm font-medium text-orange-600">
                {stats?.pendingSoumissions} en attente
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalSoumissions}</p>
            <p className="text-sm text-gray-500">Soumissions</p>
          </div>

          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Receipt className="text-orange-600" size={24} />
              </div>
              {stats?.overdueFactures ? (
                <span className="text-sm font-medium text-red-600">
                  {stats.overdueFactures} en retard
                </span>
              ) : (
                <span className="text-sm font-medium text-green-600">À jour</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.unpaidFactures}</p>
            <p className="text-sm text-gray-500">Factures impayées</p>
          </div>
        </div>
      )}

      {/* Widgets Row 1: Alertes + Échéances + Météo + SEAO */}
      <div className="grid grid-cols-4 gap-4">
        {isWidgetVisible('alerts') && (
          <WidgetAlertes />
        )}
        {isWidgetVisible('echeances') && (
          <WidgetEcheances />
        )}
        {isWidgetVisible('weather') && (
          <WidgetWeatherAdvanced />
        )}
        {isWidgetVisible('seao') && (
          <WidgetSEAO />
        )}
      </div>

      {/* Widgets Row 2: Productivité + Prix Matériaux */}
      <div className="grid grid-cols-3 gap-4">
        {isWidgetVisible('productivity') && (
          <WidgetProductivite />
        )}
        {isWidgetVisible('materials') && (
          <div className="col-span-2">
            <WidgetMaterialPricesAdvanced />
          </div>
        )}
      </div>

      {/* Widget Calendrier */}
      {isWidgetVisible('calendar') && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <WidgetCalendar />
        </div>
      )}

      {/* Graphique revenus + Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenus (6 derniers mois)</h3>
          <div className="flex items-end gap-2 h-40">
            {monthlyRevenue.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t transition-all hover:from-teal-700 hover:to-teal-500"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: m.revenue > 0 ? '8px' : '2px' }}
                />
                <span className="text-xs text-gray-500 mt-2">{m.month}</span>
                <span className="text-xs font-medium text-gray-700">
                  {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(0)}k` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Taux acceptation</span>
                <span className="font-medium">
                  {stats && stats.totalSoumissions > 0 
                    ? ((stats.acceptedSoumissions / stats.totalSoumissions) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${stats && stats.totalSoumissions > 0 ? (stats.acceptedSoumissions / stats.totalSoumissions) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Factures payées</span>
                <span className="font-medium">
                  {stats && stats.totalFactures > 0 
                    ? (((stats.totalFactures - stats.unpaidFactures) / stats.totalFactures) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all"
                  style={{ width: `${stats && stats.totalFactures > 0 ? ((stats.totalFactures - stats.unpaidFactures) / stats.totalFactures) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Users className="text-gray-400" size={18} />
                <span className="text-gray-600">Clients actifs</span>
                <span className="ml-auto font-bold">{stats?.totalClients || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projets et soumissions récents */}
      <div className="grid grid-cols-2 gap-6">
        {/* Projets récents */}
        {isWidgetVisible('projects') && (
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Projets récents</h3>
              <button onClick={() => navigate('/projects')} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y">
              {recentProjects.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FolderOpen className="mx-auto mb-2" size={32} />
                  <p>Aucun projet</p>
                  <button 
                    onClick={() => navigate('/project/new')}
                    className="mt-2 text-teal-600 hover:underline text-sm"
                  >
                    Créer un projet
                  </button>
                </div>
              ) : (
                recentProjects.map(project => (
                  <div 
                    key={project.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.client_name || 'Sans client'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-700' :
                        project.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status === 'active' ? 'Actif' :
                         project.status === 'draft' ? 'Brouillon' :
                         project.status === 'completed' ? 'Terminé' : project.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(project.updated_at).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Soumissions récentes */}
        {isWidgetVisible('soumissions') && (
          <div className="bg-white rounded-xl border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Soumissions récentes</h3>
              <button onClick={() => navigate('/soumissions')} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y">
              {recentSoumissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="mx-auto mb-2" size={32} />
                  <p>Aucune soumission</p>
                  <button 
                    onClick={() => navigate('/soumission/new')}
                    className="mt-2 text-teal-600 hover:underline text-sm"
                  >
                    Créer une soumission
                  </button>
                </div>
              ) : (
                recentSoumissions.map(soumission => (
                  <div key={soumission.id} className="p-4 hover:bg-gray-50 cursor-pointer transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{soumission.soumission_number}</p>
                        <p className="text-sm text-gray-500">{soumission.client_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          soumission.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          soumission.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          soumission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {soumission.status === 'accepted' ? 'Acceptée' :
                           soumission.status === 'sent' ? 'Envoyée' :
                           soumission.status === 'rejected' ? 'Refusée' :
                           soumission.status === 'draft' ? 'Brouillon' : soumission.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/project/new')}
          className="bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Plus className="text-blue-600" size={20} />
          </div>
          <span className="font-medium text-gray-700">Nouveau projet</span>
        </button>
        <button 
          onClick={() => navigate('/soumission/new')}
          className="bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <FileText className="text-purple-600" size={20} />
          </div>
          <span className="font-medium text-gray-700">Nouvelle soumission</span>
        </button>
        <button 
          onClick={() => navigate('/factures')}
          className="bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <Receipt className="text-teal-600" size={20} />
          </div>
          <span className="font-medium text-gray-700">Facturation</span>
        </button>
        <button 
          onClick={() => navigate('/analytics')}
          className="bg-white rounded-xl border p-4 hover:shadow-md transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <BarChart3 className="text-orange-600" size={20} />
          </div>
          <span className="font-medium text-gray-700">Analytics</span>
        </button>
      </div>
    </div>
  )
}
