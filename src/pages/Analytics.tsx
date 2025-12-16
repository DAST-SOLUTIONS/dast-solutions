/**
 * DAST Solutions - Dashboard Analytics
 * Statistiques et graphiques de performance
 */
import { useState, useEffect } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp, TrendingDown, DollarSign, FileText, 
  Receipt, CheckCircle, Clock, AlertCircle, 
  BarChart3, PieChart, Calendar, Building,
  Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

// Types
interface ProjectStats {
  id: string
  name: string
  status: string
  soumissions_count: number
  soumissions_total: number
  factures_total: number
  montant_encaisse: number
  rapports_count: number
}

interface MonthlyRevenue {
  mois: string
  factures_count: number
  total_facture: number
  total_encaisse: number
  total_du: number
}

interface DashboardStats {
  // Projets
  totalProjets: number
  projetsActifs: number
  projetsTermines: number
  
  // Soumissions
  totalSoumissions: number
  soumissionsEnvoyees: number
  soumissionsAcceptees: number
  tauxConversion: number
  
  // Factures
  totalFacture: number
  totalEncaisse: number
  totalDu: number
  facturesEnRetard: number
  
  // Ce mois
  revenuMois: number
  revenuMoisPrecedent: number
  croissance: number
}

// Composant carte stat
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'teal',
  trend,
  trendValue
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: any
  color?: 'teal' | 'green' | 'amber' | 'red' | 'blue'
  trend?: 'up' | 'down'
  trendValue?: string
}) {
  const colors = {
    teal: 'bg-teal-100 text-teal-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600'
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

// Barre de progression
function ProgressBar({ 
  value, 
  max, 
  color = 'teal',
  label 
}: { 
  value: number
  max: number
  color?: string
  label?: string 
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0
  
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%`, backgroundColor: color === 'teal' ? '#14b8a6' : color === 'green' ? '#22c55e' : '#f59e0b' }}
        />
      </div>
    </div>
  )
}

// Graphique barres simple (CSS only)
function SimpleBarChart({ 
  data, 
  maxValue 
}: { 
  data: Array<{ label: string; value: number; color?: string }>
  maxValue: number 
}) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">
              {item.value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </span>
          </div>
          <div className="h-6 bg-gray-100 rounded overflow-hidden">
            <div 
              className="h-full rounded transition-all duration-500"
              style={{ 
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                backgroundColor: item.color || '#14b8a6'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les projets
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)

      // Charger les soumissions
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('*')
        .eq('user_id', user.id)

      // Charger les factures
      const { data: factures } = await supabase
        .from('factures')
        .select('*')
        .eq('user_id', user.id)

      // Calculer les stats
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

      const facturesMois = (factures || []).filter(f => 
        new Date(f.date_facture) >= startOfMonth
      )
      const facturesMoisPrecedent = (factures || []).filter(f => 
        new Date(f.date_facture) >= startOfLastMonth && 
        new Date(f.date_facture) <= endOfLastMonth
      )

      const totalFacture = (factures || []).reduce((sum, f) => sum + (f.total || 0), 0)
      const totalEncaisse = (factures || []).reduce((sum, f) => sum + (f.amount_paid || 0), 0)
      const totalDu = (factures || []).reduce((sum, f) => sum + (f.balance_due || 0), 0)

      const revenuMois = facturesMois.reduce((sum, f) => sum + (f.total || 0), 0)
      const revenuMoisPrecedent = facturesMoisPrecedent.reduce((sum, f) => sum + (f.total || 0), 0)
      const croissance = revenuMoisPrecedent > 0 
        ? ((revenuMois - revenuMoisPrecedent) / revenuMoisPrecedent) * 100 
        : 0

      const soumissionsAcceptees = (soumissions || []).filter(s => s.status === 'acceptee').length
      const soumissionsEnvoyees = (soumissions || []).filter(s => s.status === 'envoyee').length

      setStats({
        totalProjets: (projects || []).length,
        projetsActifs: (projects || []).filter(p => p.status === 'en_cours').length,
        projetsTermines: (projects || []).filter(p => p.status === 'termine').length,
        
        totalSoumissions: (soumissions || []).length,
        soumissionsEnvoyees,
        soumissionsAcceptees,
        tauxConversion: (soumissions || []).length > 0 
          ? (soumissionsAcceptees / (soumissions || []).length) * 100 
          : 0,
        
        totalFacture,
        totalEncaisse,
        totalDu,
        facturesEnRetard: (factures || []).filter(f => 
          f.status !== 'payee' && 
          f.date_echeance && 
          new Date(f.date_echeance) < now
        ).length,
        
        revenuMois,
        revenuMoisPrecedent,
        croissance
      })

      // Stats par projet
      const projectStatsData: ProjectStats[] = (projects || []).map(p => {
        const projectSoum = (soumissions || []).filter(s => s.project_id === p.id)
        const projectFact = (factures || []).filter(f => f.project_id === p.id)
        
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          soumissions_count: projectSoum.length,
          soumissions_total: projectSoum.reduce((sum, s) => sum + (s.total || 0), 0),
          factures_total: projectFact.reduce((sum, f) => sum + (f.total || 0), 0),
          montant_encaisse: projectFact.reduce((sum, f) => sum + (f.amount_paid || 0), 0),
          rapports_count: 0
        }
      }).sort((a, b) => b.factures_total - a.factures_total)

      setProjectStats(projectStatsData.slice(0, 5))

      // Revenus mensuels (6 derniers mois)
      const monthlyData: MonthlyRevenue[] = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        
        const monthFactures = (factures || []).filter(f => {
          const date = new Date(f.date_facture)
          return date >= monthStart && date <= monthEnd
        })

        monthlyData.push({
          mois: monthStart.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' }),
          factures_count: monthFactures.length,
          total_facture: monthFactures.reduce((sum, f) => sum + (f.total || 0), 0),
          total_encaisse: monthFactures.reduce((sum, f) => sum + (f.amount_paid || 0), 0),
          total_du: monthFactures.reduce((sum, f) => sum + (f.balance_due || 0), 0)
        })
      }
      setMonthlyRevenue(monthlyData)

    } catch (err) {
      console.error('Erreur chargement analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    )
  }

  if (!stats) {
    return <div>Erreur de chargement</div>
  }

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total_facture), 1)

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="Analytics" 
        subtitle="Tableau de bord de performance" 
      />

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Revenu ce mois"
          value={stats.revenuMois.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          icon={DollarSign}
          color="teal"
          trend={stats.croissance >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.croissance).toFixed(1)}% vs mois dernier`}
        />
        <StatCard
          title="Total encaissé"
          value={stats.totalEncaisse.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          subtitle={`Sur ${stats.totalFacture.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} facturé`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="À recevoir"
          value={stats.totalDu.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
          subtitle={`${stats.facturesEnRetard} facture(s) en retard`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Taux de conversion"
          value={`${stats.tauxConversion.toFixed(1)}%`}
          subtitle={`${stats.soumissionsAcceptees}/${stats.totalSoumissions} soumissions`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenus mensuels */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-teal-600" />
              Revenus mensuels
            </h3>
          </div>
          <SimpleBarChart 
            data={monthlyRevenue.map(m => ({
              label: m.mois,
              value: m.total_facture,
              color: '#14b8a6'
            }))}
            maxValue={maxRevenue}
          />
        </div>

        {/* Top projets */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Building size={20} className="text-teal-600" />
              Top 5 projets
            </h3>
          </div>
          {projectStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun projet</p>
          ) : (
            <div className="space-y-4">
              {projectStats.map((project, index) => (
                <div key={project.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{project.name}</p>
                    <p className="text-xs text-gray-500">
                      {project.soumissions_count} soumission(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {project.factures_total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </p>
                    <p className="text-xs text-green-600">
                      {project.montant_encaisse.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} reçu
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projets */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building size={20} className="text-teal-600" />
            Projets
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-2xl">{stats.totalProjets}</span>
            </div>
            <ProgressBar 
              value={stats.projetsActifs} 
              max={stats.totalProjets} 
              color="teal"
              label={`En cours (${stats.projetsActifs})`}
            />
            <ProgressBar 
              value={stats.projetsTermines} 
              max={stats.totalProjets} 
              color="green"
              label={`Terminés (${stats.projetsTermines})`}
            />
          </div>
        </div>

        {/* Soumissions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-teal-600" />
            Soumissions
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-bold text-2xl">{stats.totalSoumissions}</span>
            </div>
            <ProgressBar 
              value={stats.soumissionsAcceptees} 
              max={stats.totalSoumissions} 
              color="green"
              label={`Acceptées (${stats.soumissionsAcceptees})`}
            />
            <ProgressBar 
              value={stats.soumissionsEnvoyees} 
              max={stats.totalSoumissions} 
              color="amber"
              label={`En attente (${stats.soumissionsEnvoyees})`}
            />
          </div>
        </div>

        {/* Factures */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-teal-600" />
            Factures
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Encaissement</span>
              <span className="font-bold text-2xl text-green-600">
                {((stats.totalEncaisse / Math.max(stats.totalFacture, 1)) * 100).toFixed(0)}%
              </span>
            </div>
            <ProgressBar 
              value={stats.totalEncaisse} 
              max={stats.totalFacture} 
              color="green"
              label="Payé"
            />
            <div className="flex justify-between text-sm pt-2">
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {stats.facturesEnRetard} en retard
              </span>
              <span className="text-amber-600">
                {stats.totalDu.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} dû
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
