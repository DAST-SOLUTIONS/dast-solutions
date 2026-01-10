/**
 * DAST Solutions - Phase F: Dashboard Business Intelligence
 * KPIs, Graphiques avancés, Analyses de performance
 * Tableaux de bord exécutifs et opérationnels
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, DollarSign,
  FileText, FolderKanban, Users, Clock, Target, Calendar,
  Download, Filter, RefreshCw, ChevronDown, ChevronUp,
  PieChart, Activity, Layers, Award, AlertTriangle, CheckCircle2,
  Building2, Briefcase, ArrowUpRight, ArrowDownRight, Percent,
  Timer, Package, Truck, HardHat, Receipt, CreditCard
} from 'lucide-react'

// Types
interface KPI {
  id: string
  name: string
  value: number | string
  unit?: string
  trend?: number
  trendDirection?: 'up' | 'down' | 'stable'
  target?: number
  icon: React.ElementType
  color: string
}

interface ChartData {
  label: string
  value: number
  color?: string
}

interface ProjectMetric {
  project_name: string
  budget: number
  spent: number
  progress: number
  status: string
  days_remaining: number
}

// Mini composant de graphique en barres
function MiniBarChart({ data, height = 60 }: { data: ChartData[], height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full rounded-t transition-all"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color || '#14b8a6',
              minHeight: item.value > 0 ? 4 : 0
            }}
          />
          <span className="text-[10px] text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// Composant de progression circulaire
function CircularProgress({ value, size = 80, strokeWidth = 8, color = '#14b8a6' }: { 
  value: number, size?: number, strokeWidth?: number, color?: string 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{value}%</span>
      </div>
    </div>
  )
}

// Carte KPI
function KPICard({ kpi }: { kpi: KPI }) {
  const TrendIcon = kpi.trendDirection === 'up' ? TrendingUp : 
                    kpi.trendDirection === 'down' ? TrendingDown : Activity
  const trendColor = kpi.trendDirection === 'up' ? 'text-green-600' : 
                     kpi.trendDirection === 'down' ? 'text-red-600' : 'text-gray-500'
  
  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
          <kpi.icon className={`text-${kpi.color}-600`} size={20} />
        </div>
        {kpi.trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{kpi.trend > 0 ? '+' : ''}{kpi.trend}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {typeof kpi.value === 'number' 
          ? kpi.value.toLocaleString('fr-CA') 
          : kpi.value}
        {kpi.unit && <span className="text-sm font-normal text-gray-500 ml-1">{kpi.unit}</span>}
      </p>
      <p className="text-sm text-gray-500 mt-1">{kpi.name}</p>
      {kpi.target && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Objectif: {kpi.target.toLocaleString('fr-CA')}</span>
            <span>{Math.round((Number(kpi.value) / kpi.target) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full bg-${kpi.color}-500 rounded-full`}
              style={{ width: `${Math.min((Number(kpi.value) / kpi.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardBI() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'financial' | 'operations'>('overview')
  
  // Données
  const [kpis, setKpis] = useState<KPI[]>([])
  const [revenueData, setRevenueData] = useState<ChartData[]>([])
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetric[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    avgProjectMargin: 0,
    bidWinRate: 0,
    onTimeDelivery: 0
  })

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les projets
      const { data: projects, count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
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
      const activeProjects = (projects || []).filter(p => p.status === 'active' || p.status === 'in_progress').length
      const completedProjects = (projects || []).filter(p => p.status === 'completed').length
      const totalRevenue = (factures || []).filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.total || 0), 0)
      const pendingInvoices = (factures || []).filter(f => f.status === 'sent' || f.status === 'overdue').reduce((sum, f) => sum + (f.total || 0), 0)
      
      const acceptedSoumissions = (soumissions || []).filter(s => s.status === 'accepted').length
      const totalSoumissions = (soumissions || []).filter(s => s.status !== 'draft').length
      const bidWinRate = totalSoumissions > 0 ? Math.round((acceptedSoumissions / totalSoumissions) * 100) : 0

      setStats({
        totalProjects: projectCount || 0,
        activeProjects,
        completedProjects,
        totalRevenue,
        pendingInvoices,
        avgProjectMargin: 18.5, // Placeholder
        bidWinRate,
        onTimeDelivery: 85 // Placeholder
      })

      // KPIs
      setKpis([
        { id: '1', name: 'Revenus totaux', value: totalRevenue, unit: '$', trend: 12, trendDirection: 'up', target: 5000000, icon: DollarSign, color: 'green' },
        { id: '2', name: 'Projets actifs', value: activeProjects, trend: 5, trendDirection: 'up', icon: FolderKanban, color: 'blue' },
        { id: '3', name: 'Taux de succès soumissions', value: bidWinRate, unit: '%', trend: 3, trendDirection: 'up', target: 40, icon: Target, color: 'purple' },
        { id: '4', name: 'Factures en attente', value: pendingInvoices, unit: '$', trend: -8, trendDirection: 'down', icon: Receipt, color: 'amber' },
        { id: '5', name: 'Marge moyenne', value: '18.5', unit: '%', trend: 2, trendDirection: 'up', target: 20, icon: Percent, color: 'teal' },
        { id: '6', name: 'Livraison à temps', value: 85, unit: '%', target: 95, icon: Clock, color: 'indigo' },
      ])

      // Données de revenus par mois
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      const currentMonth = new Date().getMonth()
      const revenueByMonth = months.slice(0, currentMonth + 1).map((month, idx) => ({
        label: month,
        value: Math.floor(Math.random() * 500000) + 200000,
        color: idx === currentMonth ? '#14b8a6' : '#99f6e4'
      }))
      setRevenueData(revenueByMonth)

      // Métriques projets
      setProjectMetrics((projects || []).slice(0, 5).map(p => ({
        project_name: p.name,
        budget: p.budget || 0,
        spent: (p.budget || 0) * 0.6,
        progress: Math.floor(Math.random() * 80) + 20,
        status: p.status,
        days_remaining: Math.floor(Math.random() * 60) + 10
      })))

    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'in_progress': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'on_hold': return 'text-amber-600 bg-amber-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-teal-600" />
              Tableau de bord BI
            </h1>
            <p className="text-gray-500">Business Intelligence & KPIs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button 
            onClick={() => loadData()}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
          </button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
            <Download size={16} />
            Exporter
          </button>
        </div>
      </div>

      {/* Navigation sections */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: Layers },
          { id: 'projects', label: 'Projets', icon: FolderKanban },
          { id: 'financial', label: 'Finances', icon: DollarSign },
          { id: 'operations', label: 'Opérations', icon: Activity },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeSection === section.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <section.icon size={18} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Vue d'ensemble */}
      {activeSection === 'overview' && (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {kpis.map(kpi => (
              <KPICard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Revenus mensuels */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Revenus mensuels</h3>
                <span className="text-sm text-gray-500">2026</span>
              </div>
              <MiniBarChart data={revenueData} height={120} />
              <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">Total YTD</p>
                  <p className="text-xl font-bold">{revenueData.reduce((sum, d) => sum + d.value, 0).toLocaleString('fr-CA')} $</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Moyenne mensuelle</p>
                  <p className="text-xl font-bold">
                    {Math.round(revenueData.reduce((sum, d) => sum + d.value, 0) / revenueData.length).toLocaleString('fr-CA')} $
                  </p>
                </div>
              </div>
            </div>

            {/* Répartition projets */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Répartition des projets</h3>
              <div className="flex items-center justify-center gap-8">
                <CircularProgress 
                  value={Math.round((stats.activeProjects / Math.max(stats.totalProjects, 1)) * 100)} 
                  color="#14b8a6"
                  size={100}
                />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                    <span className="text-sm">Actifs: {stats.activeProjects}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Complétés: {stats.completedProjects}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-sm">Autres: {stats.totalProjects - stats.activeProjects - stats.completedProjects}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projets en cours */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Performance des projets</h3>
              <button className="text-sm text-teal-600 hover:underline">Voir tous</button>
            </div>
            <div className="space-y-4">
              {projectMetrics.map((project, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{project.project_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                        {project.status === 'active' ? 'Actif' : project.status === 'completed' ? 'Complété' : project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Budget: {project.budget.toLocaleString('fr-CA')} $</span>
                      <span>Dépensé: {project.spent.toLocaleString('fr-CA')} $</span>
                      <span className="flex items-center gap-1">
                        <Timer size={14} />
                        {project.days_remaining} jours restants
                      </span>
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <p className={`text-sm font-medium ${project.spent / project.budget > 0.9 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round((project.spent / project.budget) * 100)}% budget
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Section Projets */}
      {activeSection === 'projects' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Pipeline des projets</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-gray-400">{stats.totalProjects - stats.activeProjects - stats.completedProjects}</p>
                  <p className="text-sm text-gray-500">En attente</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.activeProjects}</p>
                  <p className="text-sm text-gray-500">En cours</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-amber-600">3</p>
                  <p className="text-sm text-gray-500">En révision</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.completedProjects}</p>
                  <p className="text-sm text-gray-500">Complétés</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Taux de réussite</h3>
            <div className="flex flex-col items-center">
              <CircularProgress value={stats.bidWinRate} size={120} color="#8b5cf6" />
              <p className="mt-4 text-sm text-gray-500">Soumissions acceptées</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Finances */}
      {activeSection === 'financial' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Flux de trésorerie</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="text-green-600" size={24} />
                  <div>
                    <p className="font-medium">Entrées</p>
                    <p className="text-sm text-gray-500">Ce mois</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.totalRevenue.toLocaleString('fr-CA')} $</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="text-red-600" size={24} />
                  <div>
                    <p className="font-medium">Sorties</p>
                    <p className="text-sm text-gray-500">Ce mois</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">{Math.round(stats.totalRevenue * 0.75).toLocaleString('fr-CA')} $</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <Activity className="text-blue-600" size={24} />
                  <div>
                    <p className="font-medium">Flux net</p>
                    <p className="text-sm text-gray-500">Ce mois</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{Math.round(stats.totalRevenue * 0.25).toLocaleString('fr-CA')} $</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Comptes à recevoir</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">0-30 jours</span>
                <span className="font-medium">{Math.round(stats.pendingInvoices * 0.4).toLocaleString('fr-CA')} $</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">31-60 jours</span>
                <span className="font-medium text-amber-600">{Math.round(stats.pendingInvoices * 0.35).toLocaleString('fr-CA')} $</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">61-90 jours</span>
                <span className="font-medium text-orange-600">{Math.round(stats.pendingInvoices * 0.15).toLocaleString('fr-CA')} $</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">90+ jours</span>
                <span className="font-medium text-red-600">{Math.round(stats.pendingInvoices * 0.1).toLocaleString('fr-CA')} $</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-medium">Total à recevoir</span>
                <span className="text-xl font-bold">{stats.pendingInvoices.toLocaleString('fr-CA')} $</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Opérations */}
      {activeSection === 'operations' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="text-blue-600" size={18} />
              Équipe
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Employés actifs</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sur chantier</span>
                <span className="font-medium text-green-600">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taux d'utilisation</span>
                <span className="font-medium">85%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="text-amber-600" size={18} />
              Achats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Bons de commande</span>
                <span className="font-medium">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">En attente livraison</span>
                <span className="font-medium text-amber-600">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Valeur en cours</span>
                <span className="font-medium">125,000 $</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <HardHat className="text-orange-600" size={18} />
              Sécurité
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Jours sans incident</span>
                <span className="font-medium text-green-600">42</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Inspections ce mois</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Conformité</span>
                <span className="font-medium">95%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
