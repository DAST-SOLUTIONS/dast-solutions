/**
 * DAST Solutions - Centre de Rapports
 * KPIs, Graphiques interactifs, Génération PDF/Excel
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  BarChart3, PieChart, TrendingUp, TrendingDown, LineChart,
  FileText, Download, Calendar, Filter, RefreshCw, Settings,
  DollarSign, Building2, Users, ClipboardList, Clock, Target,
  AlertTriangle, CheckCircle, XCircle, ArrowUp, ArrowDown,
  Printer, Share2, Eye, Plus, ChevronDown, ChevronRight,
  Layers, Activity, Zap, Award, Percent, Calculator
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  LineChart as RechartsLine, Line, Area, AreaChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

// Types
interface ReportConfig {
  id: string
  name: string
  description: string
  category: 'finance' | 'projects' | 'performance' | 'clients' | 'custom'
  icon: any
  color: string
}

interface KPIData {
  label: string
  value: number | string
  previousValue?: number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  format?: 'number' | 'currency' | 'percent' | 'text'
  icon: any
  color: string
}

interface ChartData {
  name?: string
  subject?: string
  [key: string]: any
}

// Configuration des rapports
const REPORT_CONFIGS: ReportConfig[] = [
  { id: 'financial-summary', name: 'Sommaire Financier', description: 'Vue d\'ensemble des revenus, dépenses et marges', category: 'finance', icon: DollarSign, color: 'emerald' },
  { id: 'project-status', name: 'État des Projets', description: 'Statuts, délais et budgets de tous les projets', category: 'projects', icon: Building2, color: 'blue' },
  { id: 'bid-analysis', name: 'Analyse des Soumissions', description: 'Taux de succès, marges et tendances', category: 'performance', icon: Target, color: 'purple' },
  { id: 'client-report', name: 'Rapport Clients', description: 'Revenus par client et historique', category: 'clients', icon: Users, color: 'amber' },
  { id: 'productivity', name: 'Productivité', description: 'Performance des équipes et délais', category: 'performance', icon: Activity, color: 'rose' },
  { id: 'cashflow', name: 'Flux de Trésorerie', description: 'Entrées, sorties et prévisions', category: 'finance', icon: TrendingUp, color: 'cyan' },
]

// Couleurs pour les graphiques
const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#6366F1']

export default function ReportCenter() {
  const navigate = useNavigate()
  
  // États
  const [selectedReport, setSelectedReport] = useState<string>('financial-summary')
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(true)
  const [kpis, setKPIs] = useState<KPIData[]>([])
  const [chartData, setChartData] = useState<Record<string, ChartData[]>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadReportData()
  }, [selectedReport, dateRange])

  const loadReportData = async () => {
    setLoading(true)
    
    // Simuler le chargement des données
    await new Promise(r => setTimeout(r, 800))
    
    // Charger les KPIs selon le rapport sélectionné
    const kpiData = generateKPIs(selectedReport)
    setKPIs(kpiData)
    
    // Charger les données des graphiques
    const charts = generateChartData(selectedReport)
    setChartData(charts)
    
    setLoading(false)
  }

  const generateKPIs = (reportId: string): KPIData[] => {
    switch (reportId) {
      case 'financial-summary':
        return [
          { label: 'Revenus totaux', value: 2845000, previousValue: 2650000, change: 7.4, changeType: 'increase', format: 'currency', icon: DollarSign, color: 'emerald' },
          { label: 'Dépenses', value: 1920000, previousValue: 1850000, change: 3.8, changeType: 'increase', format: 'currency', icon: TrendingDown, color: 'red' },
          { label: 'Marge brute', value: 32.5, previousValue: 30.2, change: 2.3, changeType: 'increase', format: 'percent', icon: Percent, color: 'blue' },
          { label: 'Projets facturés', value: 18, previousValue: 15, change: 20, changeType: 'increase', format: 'number', icon: CheckCircle, color: 'teal' },
        ]
      case 'project-status':
        return [
          { label: 'Projets actifs', value: 12, format: 'number', icon: Building2, color: 'blue' },
          { label: 'En retard', value: 3, previousValue: 5, change: -40, changeType: 'decrease', format: 'number', icon: AlertTriangle, color: 'amber' },
          { label: 'Budget utilisé', value: 68, format: 'percent', icon: Calculator, color: 'purple' },
          { label: 'Complétion moyenne', value: 72, format: 'percent', icon: Target, color: 'emerald' },
        ]
      case 'bid-analysis':
        return [
          { label: 'Soumissions envoyées', value: 45, previousValue: 38, change: 18.4, changeType: 'increase', format: 'number', icon: ClipboardList, color: 'blue' },
          { label: 'Taux de succès', value: 38, previousValue: 32, change: 6, changeType: 'increase', format: 'percent', icon: Award, color: 'emerald' },
          { label: 'Valeur moyenne', value: 425000, format: 'currency', icon: DollarSign, color: 'purple' },
          { label: 'En attente', value: 8, format: 'number', icon: Clock, color: 'amber' },
        ]
      case 'client-report':
        return [
          { label: 'Clients actifs', value: 24, previousValue: 21, change: 14.3, changeType: 'increase', format: 'number', icon: Users, color: 'blue' },
          { label: 'Nouveaux clients', value: 6, format: 'number', icon: Plus, color: 'emerald' },
          { label: 'Revenu moyen/client', value: 118500, format: 'currency', icon: DollarSign, color: 'purple' },
          { label: 'Taux de rétention', value: 92, format: 'percent', icon: Target, color: 'teal' },
        ]
      case 'productivity':
        return [
          { label: 'Heures facturées', value: 1840, previousValue: 1720, change: 7, changeType: 'increase', format: 'number', icon: Clock, color: 'blue' },
          { label: 'Taux d\'utilisation', value: 78, format: 'percent', icon: Activity, color: 'emerald' },
          { label: 'Projets/employé', value: 2.4, format: 'number', icon: Users, color: 'purple' },
          { label: 'Délai moyen', value: '12j', format: 'text', icon: Calendar, color: 'amber' },
        ]
      case 'cashflow':
        return [
          { label: 'Encaissements', value: 1250000, previousValue: 1100000, change: 13.6, changeType: 'increase', format: 'currency', icon: ArrowUp, color: 'emerald' },
          { label: 'Décaissements', value: 890000, format: 'currency', icon: ArrowDown, color: 'red' },
          { label: 'Solde net', value: 360000, format: 'currency', icon: DollarSign, color: 'blue' },
          { label: 'À recevoir', value: 485000, format: 'currency', icon: Clock, color: 'amber' },
        ]
      default:
        return []
    }
  }

  const generateChartData = (reportId: string): Record<string, ChartData[]> => {
    switch (reportId) {
      case 'financial-summary':
        return {
          monthly: [
            { name: 'Jan', revenus: 420000, depenses: 280000, marge: 33 },
            { name: 'Fév', revenus: 380000, depenses: 260000, marge: 32 },
            { name: 'Mar', revenus: 520000, depenses: 340000, marge: 35 },
            { name: 'Avr', revenus: 480000, depenses: 320000, marge: 33 },
            { name: 'Mai', revenus: 550000, depenses: 360000, marge: 35 },
            { name: 'Juin', revenus: 495000, depenses: 360000, marge: 27 },
          ],
          byCategory: [
            { name: 'Maçonnerie', value: 1200000 },
            { name: 'Béton', value: 850000 },
            { name: 'Structure', value: 520000 },
            { name: 'Rénovation', value: 275000 },
          ]
        }
      case 'project-status':
        return {
          byStatus: [
            { name: 'En cours', value: 8, color: '#3B82F6' },
            { name: 'Planification', value: 4, color: '#F59E0B' },
            { name: 'Terminé', value: 15, color: '#10B981' },
            { name: 'En pause', value: 2, color: '#6B7280' },
          ],
          budgetProgress: [
            { name: 'Projet A', budget: 500000, utilise: 340000, percent: 68 },
            { name: 'Projet B', budget: 1200000, utilise: 960000, percent: 80 },
            { name: 'Projet C', budget: 750000, utilise: 450000, percent: 60 },
            { name: 'Projet D', budget: 320000, utilise: 288000, percent: 90 },
            { name: 'Projet E', budget: 890000, utilise: 534000, percent: 60 },
          ],
          timeline: [
            { name: 'Jan', planifie: 3, complete: 2 },
            { name: 'Fév', planifie: 4, complete: 4 },
            { name: 'Mar', planifie: 2, complete: 3 },
            { name: 'Avr', planifie: 5, complete: 4 },
            { name: 'Mai', planifie: 3, complete: 2 },
            { name: 'Juin', planifie: 4, complete: 0 },
          ]
        }
      case 'bid-analysis':
        return {
          monthly: [
            { name: 'Jan', soumises: 6, gagnees: 2, perdues: 3, enCours: 1 },
            { name: 'Fév', soumises: 8, gagnees: 3, perdues: 4, enCours: 1 },
            { name: 'Mar', soumises: 7, gagnees: 4, perdues: 2, enCours: 1 },
            { name: 'Avr', soumises: 9, gagnees: 3, perdues: 4, enCours: 2 },
            { name: 'Mai', soumises: 8, gagnees: 4, perdues: 2, enCours: 2 },
            { name: 'Juin', soumises: 7, gagnees: 1, perdues: 2, enCours: 4 },
          ],
          byType: [
            { name: 'Appel d\'offres public', value: 18 },
            { name: 'Gré à gré', value: 15 },
            { name: 'Invitation', value: 12 },
          ],
          marginDistribution: [
            { name: '< 10%', count: 5 },
            { name: '10-15%', count: 12 },
            { name: '15-20%', count: 18 },
            { name: '20-25%', count: 8 },
            { name: '> 25%', count: 2 },
          ]
        }
      case 'client-report':
        return {
          topClients: [
            { name: 'Ville de Laval', revenus: 850000 },
            { name: 'Groupe Immobilier XYZ', revenus: 620000 },
            { name: 'CSSM', revenus: 480000 },
            { name: 'Desjardins Construction', revenus: 395000 },
            { name: 'Bâtiment Québec', revenus: 320000 },
          ],
          bySegment: [
            { name: 'Institutionnel', value: 45 },
            { name: 'Commercial', value: 30 },
            { name: 'Résidentiel', value: 15 },
            { name: 'Industriel', value: 10 },
          ],
          retention: [
            { name: '2021', nouveaux: 8, perdus: 2, total: 18 },
            { name: '2022', nouveaux: 6, perdus: 1, total: 23 },
            { name: '2023', nouveaux: 5, perdus: 2, total: 26 },
            { name: '2024', nouveaux: 4, perdus: 1, total: 29 },
            { name: '2025', nouveaux: 6, perdus: 2, total: 33 },
          ]
        }
      case 'productivity':
        return {
          hoursWeekly: [
            { name: 'Sem 1', heures: 420, facturables: 340 },
            { name: 'Sem 2', heures: 445, facturables: 380 },
            { name: 'Sem 3', heures: 410, facturables: 320 },
            { name: 'Sem 4', heures: 465, facturables: 400 },
          ],
          byTeam: [
            { name: 'Estimation', efficiency: 85 },
            { name: 'Gestion projet', efficiency: 78 },
            { name: 'Administration', efficiency: 72 },
            { name: 'Direction', efficiency: 65 },
          ],
          performance: [
            { subject: 'Délais', A: 85, fullMark: 100 },
            { subject: 'Qualité', A: 92, fullMark: 100 },
            { subject: 'Budget', A: 78, fullMark: 100 },
            { subject: 'Communication', A: 88, fullMark: 100 },
            { subject: 'Innovation', A: 70, fullMark: 100 },
          ]
        }
      case 'cashflow':
        return {
          monthly: [
            { name: 'Jan', entrees: 380000, sorties: 290000, solde: 90000 },
            { name: 'Fév', entrees: 420000, sorties: 350000, solde: 70000 },
            { name: 'Mar', entrees: 510000, sorties: 380000, solde: 130000 },
            { name: 'Avr', entrees: 390000, sorties: 420000, solde: -30000 },
            { name: 'Mai', entrees: 480000, sorties: 360000, solde: 120000 },
            { name: 'Juin', entrees: 450000, sorties: 390000, solde: 60000 },
          ],
          aging: [
            { name: '0-30 jours', montant: 185000 },
            { name: '31-60 jours', montant: 120000 },
            { name: '61-90 jours', montant: 95000 },
            { name: '> 90 jours', montant: 85000 },
          ]
        }
      default:
        return {}
    }
  }

  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
      case 'percent':
        return `${value}%`
      case 'number':
      default:
        return value.toLocaleString('fr-CA')
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    // Simulation d'export
    await new Promise(r => setTimeout(r, 1500))
    alert('Rapport PDF généré avec succès!')
    setIsExporting(false)
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 1000))
    alert('Rapport Excel généré avec succès!')
    setIsExporting(false)
  }

  const currentReport = REPORT_CONFIGS.find(r => r.id === selectedReport)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-teal-600" />
            Centre de Rapports
          </h1>
          <p className="text-gray-500">Analysez vos données avec des rapports détaillés</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm"
          >
            {isExporting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Report Selector & Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Report Type */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Type de rapport</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              {REPORT_CONFIGS.map(report => (
                <option key={report.id} value={report.id}>{report.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Période</label>
            <div className="flex gap-1">
              {(['month', 'quarter', 'year'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    dateRange === range
                      ? 'bg-teal-100 text-teal-700 border border-teal-300'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {range === 'month' ? 'Mois' : range === 'quarter' ? 'Trimestre' : 'Année'}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={loadReportData}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 mt-5"
            title="Actualiser"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {currentReport && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
            <currentReport.icon size={16} className={`text-${currentReport.color}-600`} />
            {currentReport.description}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-teal-600" />
        </div>
      ) : (
        <div ref={reportRef}>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{kpi.label}</span>
                  <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                    <kpi.icon size={18} className={`text-${kpi.color}-600`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(kpi.value, kpi.format)}
                </div>
                {kpi.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    kpi.changeType === 'increase' ? 'text-emerald-600' : 
                    kpi.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {kpi.changeType === 'increase' ? <ArrowUp size={14} /> : 
                     kpi.changeType === 'decrease' ? <ArrowDown size={14} /> : null}
                    {Math.abs(kpi.change)}%
                    <span className="text-gray-400 ml-1">vs période préc.</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charts - Financial Summary */}
          {selectedReport === 'financial-summary' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Revenue vs Expenses */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Revenus vs Dépenses</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v/1000)}k`} />
                    <Tooltip formatter={(v: number) => formatValue(v, 'currency')} />
                    <Legend />
                    <Bar dataKey="revenus" name="Revenus" fill="#10B981" />
                    <Bar dataKey="depenses" name="Dépenses" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Category */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Par catégorie</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData.byCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.byCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatValue(v, 'currency')} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts - Project Status */}
          {selectedReport === 'project-status' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Status Pie */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Par statut</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie
                      data={chartData.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.byStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Budget Progress */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Utilisation des budgets</h3>
                <div className="space-y-4">
                  {chartData.budgetProgress?.map((project, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-gray-500">
                          {formatValue(project.utilise, 'currency')} / {formatValue(project.budget, 'currency')}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            project.percent >= 90 ? 'bg-red-500' :
                            project.percent >= 75 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${project.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Charts - Bid Analysis */}
          {selectedReport === 'bid-analysis' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Bids */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Soumissions par mois</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="gagnees" name="Gagnées" stackId="a" fill="#10B981" />
                    <Bar dataKey="perdues" name="Perdues" stackId="a" fill="#EF4444" />
                    <Bar dataKey="enCours" name="En cours" stackId="a" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Type */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Par type d'appel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData.byType}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartData.byType?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Margin Distribution */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Distribution des marges</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.marginDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Soumissions" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts - Client Report */}
          {selectedReport === 'client-report' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Clients */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Top 5 Clients</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `${(v/1000)}k`} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(v: number) => formatValue(v, 'currency')} />
                    <Bar dataKey="revenus" name="Revenus" fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* By Segment */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Par segment de marché</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={chartData.bySegment}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {chartData.bySegment?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Retention */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Évolution de la clientèle</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData.retention}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="Total clients" stroke="#0D9488" fill="#0D948833" />
                    <Line type="monotone" dataKey="nouveaux" name="Nouveaux" stroke="#10B981" />
                    <Line type="monotone" dataKey="perdus" name="Perdus" stroke="#EF4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts - Productivity */}
          {selectedReport === 'productivity' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Hours */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Heures par semaine</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.hoursWeekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="heures" name="Total" fill="#CBD5E1" />
                    <Bar dataKey="facturables" name="Facturables" fill="#0D9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Performance globale</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={chartData.performance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Score" dataKey="A" stroke="#0D9488" fill="#0D9488" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* By Team */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Efficacité par équipe</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {chartData.byTeam?.map((team, i) => (
                    <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">{team.name}</div>
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                          <circle 
                            cx="48" cy="48" r="40" 
                            stroke="#0D9488" 
                            strokeWidth="8" 
                            fill="none"
                            strokeDasharray={`${team.efficiency * 2.51} 251`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                          {team.efficiency}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Charts - Cashflow */}
          {selectedReport === 'cashflow' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Monthly Flow */}
              <div className="lg:col-span-2 bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Flux mensuel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v/1000)}k`} />
                    <Tooltip formatter={(v: number) => formatValue(v, 'currency')} />
                    <Legend />
                    <Area type="monotone" dataKey="entrees" name="Entrées" stroke="#10B981" fill="#10B98133" />
                    <Area type="monotone" dataKey="sorties" name="Sorties" stroke="#EF4444" fill="#EF444433" />
                    <Line type="monotone" dataKey="solde" name="Solde net" stroke="#3B82F6" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Aging */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-4">Comptes à recevoir</h3>
                <div className="space-y-4">
                  {chartData.aging?.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-medium">{formatValue(item.montant, 'currency')}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-emerald-500' :
                            i === 1 ? 'bg-amber-500' :
                            i === 2 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(item.montant / 485000) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{formatValue(485000, 'currency')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
