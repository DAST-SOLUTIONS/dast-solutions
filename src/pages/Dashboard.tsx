/**
 * DAST Solutions - Dashboard KPI avec VRAIES DONNÉES
 * Connecté à Supabase - Projets, Soumissions, Entrepreneurs, Personnel
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '@/components/PageTitle'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, FileText, FolderOpen,
  CheckCircle, Clock, Users, Calendar, ArrowRight, Building,
  Target, AlertTriangle, RefreshCw, Download, ChevronRight,
  UserCheck, Award, Loader2, HardHat, Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_COLORS: Record<string, string> = {
  'en_cours': '#3B82F6',
  'active': '#3B82F6',
  'termine': '#10B981',
  'completed': '#10B981',
  'en_attente': '#F59E0B',
  'envoyee': '#F59E0B',
  'acceptee': '#10B981',
  'refusee': '#EF4444',
  'annule': '#EF4444',
  'brouillon': '#6B7280'
}

const URGENCY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800'
}

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

function KPICard({ title, value, change, icon: Icon, color, trend, loading }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          {loading ? (
            <div className="h-9 flex items-center mt-2">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
              {change !== undefined && change !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trend === 'up' && <TrendingUp size={14} />}
                  {trend === 'down' && <TrendingDown size={14} />}
                  <span>{change > 0 ? '+' : ''}{change}%</span>
                  <span className="text-gray-400 ml-1">vs mois dernier</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, chartData, recentActivity, reminders, loading, error, refresh } = useDashboardStats()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M$`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k$`
    return `${value.toLocaleString()}$`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <PageTitle title="Tableau de bord" />
          <p className="text-gray-500 mt-1">Vue d'ensemble de vos activités</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing || loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* KPIs Row 1 - Finances & Projets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title="Chiffre d'affaires"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.revenueTrend}
          icon={DollarSign}
          color="#10B981"
          trend={stats?.revenueTrend && stats.revenueTrend > 0 ? 'up' : stats?.revenueTrend && stats.revenueTrend < 0 ? 'down' : 'neutral'}
          loading={loading}
        />
        <KPICard
          title="Projets actifs"
          value={stats?.activeProjects || 0}
          change={stats?.projectsTrend}
          icon={FolderOpen}
          color="#3B82F6"
          trend={stats?.projectsTrend && stats.projectsTrend > 0 ? 'up' : stats?.projectsTrend && stats.projectsTrend < 0 ? 'down' : 'neutral'}
          loading={loading}
        />
        <KPICard
          title="Soumissions"
          value={stats?.totalSoumissions || 0}
          change={stats?.soumissionsTrend}
          icon={FileText}
          color="#8B5CF6"
          trend={stats?.soumissionsTrend && stats.soumissionsTrend > 0 ? 'up' : stats?.soumissionsTrend && stats.soumissionsTrend < 0 ? 'down' : 'neutral'}
          loading={loading}
        />
        <KPICard
          title="Taux de conversion"
          value={`${stats?.conversionRate || 0}%`}
          icon={Target}
          color="#F59E0B"
          loading={loading}
        />
      </div>

      {/* KPIs Row 2 - Entrepreneurs & Personnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Entrepreneurs"
          value={stats?.totalEntrepreneurs || 0}
          icon={Building}
          color="#6366F1"
          loading={loading}
        />
        <KPICard
          title="Favoris"
          value={stats?.favoriteEntrepreneurs || 0}
          icon={UserCheck}
          color="#EC4899"
          loading={loading}
        />
        <KPICard
          title="Personnel CCQ"
          value={stats?.activePersonnel || 0}
          icon={HardHat}
          color="#14B8A6"
          loading={loading}
        />
        <KPICard
          title="Certifications à renouveler"
          value={stats?.expiringCertifications || 0}
          icon={Award}
          color={stats?.expiringCertifications && stats.expiringCertifications > 0 ? '#EF4444' : '#6B7280'}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenus (6 derniers mois)</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : chartData?.revenue && chartData.revenue.some(r => r.soumissions > 0 || r.acceptees > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.revenue}>
                <defs>
                  <linearGradient id="colorSoumissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAcceptees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k$`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()}$`, '']} />
                <Legend />
                <Area type="monotone" dataKey="soumissions" name="Total soumis" stroke="#14B8A6" fill="url(#colorSoumissions)" strokeWidth={2} />
                <Area type="monotone" dataKey="acceptees" name="Acceptées" stroke="#3B82F6" fill="url(#colorAcceptees)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
              <FileText size={48} className="mb-4" />
              <p>Aucune donnée de soumission</p>
              <button
                onClick={() => navigate('/soumissions')}
                className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
              >
                Créer une soumission →
              </button>
            </div>
          )}
        </div>

        {/* Projects Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité projets</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : chartData?.projects && chartData.projects.some(p => p.nouveaux > 0 || p.en_cours > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.projects}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="nouveaux" name="Nouveaux" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="termines" name="Terminés" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="en_cours" name="En cours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
              <FolderOpen size={48} className="mb-4" />
              <p>Aucun projet créé</p>
              <button
                onClick={() => navigate('/projets')}
                className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
              >
                Créer un projet →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Taux de conversion</h3>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : chartData?.conversion && chartData.conversion.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.conversion}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.conversion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {chartData.conversion.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-gray-400">
              <Target size={48} className="mb-4" />
              <p>Aucune soumission</p>
            </div>
          )}
        </div>

        {/* Recent Activity & Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
            <button
              onClick={() => navigate('/projets')}
              className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1"
            >
              Voir tout <ChevronRight size={16} />
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-10 bg-gray-200 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => navigate(activity.type === 'project' ? `/projects/${activity.id}` : '/soumissions')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-10 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[activity.status || ''] || '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.value && (
                      <p className="font-semibold text-gray-900">{formatCurrency(activity.value)}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(activity.date), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Clock size={48} className="mx-auto mb-4" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Rappels importants</h3>
              <div className="mt-3 space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[reminder.urgency]}`}>
                        {reminder.urgency === 'high' ? 'Urgent' : reminder.urgency === 'medium' ? 'Bientôt' : 'Info'}
                      </span>
                      <span className="text-amber-800">{reminder.title}</span>
                    </div>
                    <button
                      onClick={() => navigate(reminder.link)}
                      className="text-amber-600 font-medium hover:text-amber-700"
                    >
                      Voir →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nouvelle soumission', icon: FileText, color: '#3B82F6', path: '/soumissions' },
          { label: 'Nouveau projet', icon: FolderOpen, color: '#10B981', path: '/projets' },
          { label: 'Takeoff', icon: Target, color: '#8B5CF6', path: '/takeoff' },
          { label: 'Import données', icon: Download, color: '#F59E0B', path: '/import' }
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${action.color}15` }}>
              <action.icon size={20} style={{ color: action.color }} />
            </div>
            <span className="font-medium text-gray-900">{action.label}</span>
            <ArrowRight size={16} className="ml-auto text-gray-400 group-hover:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  )
}
