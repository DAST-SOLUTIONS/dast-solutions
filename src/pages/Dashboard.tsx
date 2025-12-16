/**
 * DAST Solutions - Dashboard KPI Complet
 * Module 3 - Tableaux de bord avec graphiques et statistiques
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { useProjects } from '@/hooks/useProjects'
import { useSoumissions } from '@/hooks/useSoumissions'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, FileText, FolderOpen,
  CheckCircle, Clock, Users, Calendar, ArrowRight, Building,
  Target, AlertTriangle, RefreshCw, Download, ChevronRight
} from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types
interface KPICard {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
}

const STATUS_COLORS: Record<string, string> = {
  'en_cours': '#3B82F6', 'termine': '#10B981', 'en_attente': '#F59E0B', 
  'annule': '#EF4444', 'brouillon': '#6B7280'
}

// Composant Carte KPI
function KPICardComponent({ kpi }: { kpi: KPICard }) {
  const Icon = kpi.icon
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</p>
          {kpi.change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {kpi.trend === 'up' && <TrendingUp size={14} />}
              {kpi.trend === 'down' && <TrendingDown size={14} />}
              <span>{kpi.change > 0 ? '+' : ''}{kpi.change}%</span>
              <span className="text-gray-400 ml-1">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${kpi.color}15` }}>
          <Icon size={24} style={{ color: kpi.color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { soumissions, loading: soumissionsLoading } = useSoumissions()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [refreshing, setRefreshing] = useState(false)
  const [chartData, setChartData] = useState({ revenue: [] as any[], projects: [] as any[], conversion: [] as any[] })

  useEffect(() => {
    const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'MMM', { locale: fr }))
    setChartData({
      revenue: months.map((month) => ({ month, soumissions: Math.floor(Math.random() * 500000) + 100000, acceptees: Math.floor(Math.random() * 300000) + 50000 })),
      projects: months.map((month) => ({ month, nouveaux: Math.floor(Math.random() * 10) + 2, termines: Math.floor(Math.random() * 8) + 1, en_cours: Math.floor(Math.random() * 15) + 5 })),
      conversion: [{ name: 'Acceptées', value: 45, color: '#10B981' }, { name: 'En attente', value: 30, color: '#F59E0B' }, { name: 'Refusées', value: 15, color: '#EF4444' }, { name: 'Expirées', value: 10, color: '#6B7280' }]
    })
  }, [])

  const kpis = useMemo((): KPICard[] => {
    const activeProjects = projects?.filter(p => p.status === 'en_cours').length || 0
    const totalSoumissions = soumissions?.length || 0
    const acceptedSoumissions = soumissions?.filter(s => s.status === 'acceptee').length || 0
    const totalValue = soumissions?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
    const conversionRate = totalSoumissions > 0 ? Math.round((acceptedSoumissions / totalSoumissions) * 100) : 0
    return [
      { title: 'Chiffre d\'affaires', value: `$${totalValue.toLocaleString()}`, change: 12.5, icon: DollarSign, color: '#10B981', trend: 'up' },
      { title: 'Projets actifs', value: activeProjects, change: 8, icon: FolderOpen, color: '#3B82F6', trend: 'up' },
      { title: 'Soumissions', value: totalSoumissions, change: -5, icon: FileText, color: '#8B5CF6', trend: 'down' },
      { title: 'Taux de conversion', value: `${conversionRate}%`, change: 3.2, icon: Target, color: '#F59E0B', trend: 'up' }
    ]
  }, [projects, soumissions])

  const handleRefresh = async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 1000)); setRefreshing(false) }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><PageTitle title="Tableau de bord" /><p className="text-gray-500 mt-1">Vue d'ensemble de vos activités</p></div>
        <div className="flex items-center gap-3">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="week">Cette semaine</option><option value="month">Ce mois</option><option value="quarter">Ce trimestre</option><option value="year">Cette année</option>
          </select>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} /></button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"><Download size={18} /> Exporter</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => <KPICardComponent key={i} kpi={kpi} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.revenue}>
              <defs>
                <linearGradient id="colorSoumissions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/><stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorAcceptees" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} /><YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
              <Area type="monotone" dataKey="soumissions" stroke="#14B8A6" fill="url(#colorSoumissions)" strokeWidth={2} /><Area type="monotone" dataKey="acceptees" stroke="#3B82F6" fill="url(#colorAcceptees)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité projets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.projects}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} /><YAxis stroke="#9CA3AF" fontSize={12} /><Tooltip /><Legend />
              <Bar dataKey="nouveaux" name="Nouveaux" fill="#3B82F6" radius={[4, 4, 0, 0]} /><Bar dataKey="termines" name="Terminés" fill="#10B981" radius={[4, 4, 0, 0]} /><Bar dataKey="en_cours" name="En cours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Taux de conversion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={chartData.conversion} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.conversion.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">{chartData.conversion.map((item, i) => (<div key={i} className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-gray-600">{item.name}</span><span className="font-medium ml-auto">{item.value}%</span></div>))}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-gray-900">Projets récents</h3><button onClick={() => navigate('/projets')} className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">Voir tout <ChevronRight size={16} /></button></div>
          <div className="space-y-3">
            {(projects || []).slice(0, 5).map(project => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <div className="flex items-center gap-3"><div className="w-2 h-10 rounded-full" style={{ backgroundColor: STATUS_COLORS[project.status] || '#6B7280' }} /><div><p className="font-medium text-gray-900">{project.name}</p><p className="text-sm text-gray-500">{project.client_name}</p></div></div>
                <div className="text-right"><p className="font-semibold text-gray-900">${(0 || 0).toLocaleString()}</p><p className="text-xs text-gray-400">{format(new Date(project.created_at), 'dd MMM yyyy', { locale: fr })}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4"><div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle size={24} className="text-amber-600" /></div>
          <div className="flex-1"><h3 className="font-semibold text-amber-900">Rappels importants</h3><div className="mt-3 space-y-2 text-sm text-amber-800"><div className="flex justify-between"><span>3 soumissions expirent cette semaine</span><button className="text-amber-600 font-medium">Voir →</button></div><div className="flex justify-between"><span>5 projets nécessitent une mise à jour</span><button className="text-amber-600 font-medium">Voir →</button></div></div></div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[{ label: 'Nouvelle soumission', icon: FileText, color: '#3B82F6', path: '/soumissions' }, { label: 'Nouveau projet', icon: FolderOpen, color: '#10B981', path: '/projets' }, { label: 'Takeoff', icon: Target, color: '#8B5CF6', path: '/takeoff' }, { label: 'Entrepreneurs', icon: Users, color: '#F59E0B', path: '/entrepreneurs' }].map((action, i) => (
          <button key={i} onClick={() => navigate(action.path)} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${action.color}15` }}><action.icon size={20} style={{ color: action.color }} /></div>
            <span className="font-medium text-gray-900">{action.label}</span><ArrowRight size={16} className="ml-auto text-gray-400 group-hover:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  )
}
