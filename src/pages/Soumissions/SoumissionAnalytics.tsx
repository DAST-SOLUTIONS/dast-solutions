/**
 * DAST Solutions - Analyse de Rentabilité des Soumissions
 * Historique gagnées/perdues + Statistiques + Recommandations
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp, TrendingDown, DollarSign, Percent, FileText,
  CheckCircle, XCircle, Clock, BarChart3, PieChart, Calendar,
  ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw,
  Building2, Home, Building, Factory, Info, AlertTriangle,
  ChevronRight, Target, Award, Zap
} from 'lucide-react'

interface SoumissionRecord {
  id: string
  number: string
  projectName: string
  projectType: string
  clientName: string
  total: number
  cost: number
  margin: number
  status: 'accepted' | 'rejected' | 'pending' | 'expired'
  submittedAt: string
  decidedAt?: string
  feedbackReason?: string
}

interface AnalyticsData {
  totalSoumissions: number
  totalValue: number
  wonValue: number
  lostValue: number
  pendingValue: number
  avgMargin: number
  winRate: number
  avgResponseTime: number
  byProjectType: Record<string, {
    total: number
    won: number
    lost: number
    avgMargin: number
    winRate: number
    avgValue: number
  }>
  byMonth: Array<{
    month: string
    submitted: number
    won: number
    lost: number
    value: number
  }>
  marginDistribution: Array<{
    range: string
    count: number
    winRate: number
  }>
  lossReasons: Array<{
    reason: string
    count: number
    percent: number
  }>
}

const PROJECT_TYPES = [
  { id: 'residential', name: 'Résidentiel', icon: Home, color: 'bg-green-100 text-green-700' },
  { id: 'commercial', name: 'Commercial', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'institutional', name: 'Institutionnel', icon: Building, color: 'bg-purple-100 text-purple-700' },
  { id: 'industrial', name: 'Industriel', icon: Factory, color: 'bg-amber-100 text-amber-700' },
]

export default function SoumissionAnalytics() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [soumissions, setSoumissions] = useState<SoumissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'3m' | '6m' | '1y' | 'all'>('1y')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculer la date de début selon le filtre
      const startDate = new Date()
      switch (dateRange) {
        case '3m': startDate.setMonth(startDate.getMonth() - 3); break
        case '6m': startDate.setMonth(startDate.getMonth() - 6); break
        case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break
        case 'all': startDate.setFullYear(2000); break
      }

      const { data: soumissionsData } = await supabase
        .from('soumissions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (soumissionsData && soumissionsData.length > 0) {
        // Transformer les données
        const records: SoumissionRecord[] = soumissionsData.map(s => ({
          id: s.id,
          number: s.soumission_number,
          projectName: s.project_name || 'Sans nom',
          projectType: s.project_type || 'commercial',
          clientName: s.client_name || 'Client inconnu',
          total: s.total || 0,
          cost: s.subtotal ? s.subtotal / (1 + (s.margin || 12) / 100) : 0,
          margin: s.margin || 12,
          status: mapStatus(s.status),
          submittedAt: s.sent_at || s.created_at,
          decidedAt: s.decided_at,
          feedbackReason: s.feedback_reason
        }))

        setSoumissions(records)
        setAnalytics(calculateAnalytics(records))
      } else {
        // Données de démo
        const demoRecords = generateDemoData()
        setSoumissions(demoRecords)
        setAnalytics(calculateAnalytics(demoRecords))
      }
    } catch (err) {
      console.error('Erreur chargement analytics:', err)
      const demoRecords = generateDemoData()
      setSoumissions(demoRecords)
      setAnalytics(calculateAnalytics(demoRecords))
    } finally {
      setLoading(false)
    }
  }

  const mapStatus = (status: string): SoumissionRecord['status'] => {
    switch (status) {
      case 'acceptee': return 'accepted'
      case 'refusee': return 'rejected'
      case 'expiree': return 'expired'
      default: return 'pending'
    }
  }

  const generateDemoData = (): SoumissionRecord[] => {
    const records: SoumissionRecord[] = []
    const types = ['residential', 'commercial', 'institutional', 'industrial']
    const statuses: SoumissionRecord['status'][] = ['accepted', 'rejected', 'pending', 'expired']
    const reasons = ['Prix trop élevé', 'Délai trop long', 'Concurrent moins cher', 'Projet annulé', 'Autre entrepreneur choisi']

    for (let i = 0; i < 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const baseAmount = type === 'residential' ? 50000 : type === 'commercial' ? 150000 : type === 'institutional' ? 300000 : 200000
      const total = baseAmount * (0.5 + Math.random())
      const margin = type === 'residential' ? 15 : type === 'commercial' ? 12 : type === 'institutional' ? 10 : 8
      const actualMargin = margin + (Math.random() - 0.5) * 6

      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 365))

      // Status biaisé vers accepted/rejected
      const statusRand = Math.random()
      let status: SoumissionRecord['status']
      if (statusRand < 0.35) status = 'accepted'
      else if (statusRand < 0.75) status = 'rejected'
      else if (statusRand < 0.9) status = 'pending'
      else status = 'expired'

      records.push({
        id: `demo-${i}`,
        number: `S-2024-${(100 + i).toString().padStart(3, '0')}`,
        projectName: `Projet ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'][i % 5]} ${i + 1}`,
        projectType: type,
        clientName: `Client ${i + 1}`,
        total,
        cost: total / (1 + actualMargin / 100),
        margin: actualMargin,
        status,
        submittedAt: date.toISOString(),
        decidedAt: status !== 'pending' ? new Date(date.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        feedbackReason: status === 'rejected' ? reasons[Math.floor(Math.random() * reasons.length)] : undefined
      })
    }

    return records.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  }

  const calculateAnalytics = (records: SoumissionRecord[]): AnalyticsData => {
    const won = records.filter(r => r.status === 'accepted')
    const lost = records.filter(r => r.status === 'rejected')
    const pending = records.filter(r => r.status === 'pending')

    // Par type de projet
    const byProjectType: AnalyticsData['byProjectType'] = {}
    PROJECT_TYPES.forEach(type => {
      const typeRecords = records.filter(r => r.projectType === type.id)
      const typeWon = typeRecords.filter(r => r.status === 'accepted')
      const typeLost = typeRecords.filter(r => r.status === 'rejected')
      
      byProjectType[type.id] = {
        total: typeRecords.length,
        won: typeWon.length,
        lost: typeLost.length,
        avgMargin: typeRecords.length > 0 
          ? typeRecords.reduce((a, b) => a + b.margin, 0) / typeRecords.length 
          : 0,
        winRate: typeRecords.length > 0 
          ? (typeWon.length / (typeWon.length + typeLost.length)) * 100 
          : 0,
        avgValue: typeRecords.length > 0 
          ? typeRecords.reduce((a, b) => a + b.total, 0) / typeRecords.length 
          : 0
      }
    })

    // Par mois (6 derniers mois)
    const byMonth: AnalyticsData['byMonth'] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' })
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthRecords = records.filter(r => {
        const d = new Date(r.submittedAt)
        return d >= monthStart && d <= monthEnd
      })

      byMonth.push({
        month: monthStr,
        submitted: monthRecords.length,
        won: monthRecords.filter(r => r.status === 'accepted').length,
        lost: monthRecords.filter(r => r.status === 'rejected').length,
        value: monthRecords.reduce((a, b) => a + b.total, 0)
      })
    }

    // Distribution des marges
    const marginRanges = [
      { min: 0, max: 5, label: '0-5%' },
      { min: 5, max: 10, label: '5-10%' },
      { min: 10, max: 15, label: '10-15%' },
      { min: 15, max: 20, label: '15-20%' },
      { min: 20, max: 100, label: '20%+' }
    ]
    const marginDistribution = marginRanges.map(range => {
      const inRange = records.filter(r => r.margin >= range.min && r.margin < range.max)
      const wonInRange = inRange.filter(r => r.status === 'accepted')
      return {
        range: range.label,
        count: inRange.length,
        winRate: inRange.length > 0 ? (wonInRange.length / inRange.length) * 100 : 0
      }
    })

    // Raisons de perte
    const reasonCounts: Record<string, number> = {}
    lost.forEach(r => {
      const reason = r.feedbackReason || 'Non spécifié'
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
    const lossReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percent: lost.length > 0 ? (count / lost.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    // Temps de réponse moyen
    const decidedRecords = records.filter(r => r.decidedAt)
    const avgResponseTime = decidedRecords.length > 0
      ? decidedRecords.reduce((sum, r) => {
          const submitted = new Date(r.submittedAt).getTime()
          const decided = new Date(r.decidedAt!).getTime()
          return sum + (decided - submitted) / (1000 * 60 * 60 * 24)
        }, 0) / decidedRecords.length
      : 0

    return {
      totalSoumissions: records.length,
      totalValue: records.reduce((a, b) => a + b.total, 0),
      wonValue: won.reduce((a, b) => a + b.total, 0),
      lostValue: lost.reduce((a, b) => a + b.total, 0),
      pendingValue: pending.reduce((a, b) => a + b.total, 0),
      avgMargin: records.length > 0 
        ? records.reduce((a, b) => a + b.margin, 0) / records.length 
        : 0,
      winRate: (won.length + lost.length) > 0 
        ? (won.length / (won.length + lost.length)) * 100 
        : 0,
      avgResponseTime,
      byProjectType,
      byMonth,
      marginDistribution,
      lossReasons
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M$`
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k$`
    return amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
  }

  const filteredSoumissions = selectedType === 'all' 
    ? soumissions 
    : soumissions.filter(s => s.projectType === selectedType)

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-teal-600" />
            Analyse de Rentabilité
          </h1>
          <p className="text-gray-500">Performance des soumissions et recommandations</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="3m">3 derniers mois</option>
            <option value="6m">6 derniers mois</option>
            <option value="1y">12 derniers mois</option>
            <option value="all">Tout</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
          </button>
          <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={16} />
            Exporter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalSoumissions}</p>
              <p className="text-sm text-gray-500">Soumissions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics.winRate.toFixed(0)}%</p>
              <p className="text-sm text-gray-500">Taux de succès</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Percent className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.avgMargin.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Marge moyenne</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarSign className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(analytics.wonValue)}</p>
              <p className="text-sm text-gray-500">Contrats gagnés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.avgResponseTime.toFixed(0)}j</p>
              <p className="text-sm text-gray-500">Délai moyen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance par type */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Performance par type de projet</h2>
          
          <div className="space-y-4">
            {PROJECT_TYPES.map(type => {
              const data = analytics.byProjectType[type.id]
              if (!data || data.total === 0) return null

              return (
                <div key={type.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        <type.icon size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">{type.name}</h3>
                        <p className="text-sm text-gray-500">
                          {data.total} soumissions • {data.won} gagnées
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{data.winRate.toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">Taux succès</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-semibold">{data.avgMargin.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Marge moy.</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-semibold">{formatCurrency(data.avgValue)}</p>
                      <p className="text-xs text-gray-500">Valeur moy.</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-semibold">{data.won}</p>
                      <p className="text-xs text-gray-500">Gagnées</p>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          data.winRate >= 40 ? 'bg-green-500' :
                          data.winRate >= 25 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${data.winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Distribution des marges */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Distribution des marges</h3>
            <div className="space-y-3">
              {analytics.marginDistribution.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.range}</span>
                    <span className="text-gray-500">{item.count} soum.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${(item.count / analytics.totalSoumissions) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      item.winRate >= 40 ? 'text-green-600' :
                      item.winRate >= 25 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {item.winRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raisons de perte */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-4">Raisons de refus</h3>
            <div className="space-y-3">
              {analytics.lossReasons.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate flex-1">{item.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.count}</span>
                    <span className="text-xs text-gray-400">({item.percent.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandations */}
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="text-teal-600" size={18} />
              Recommandations
            </h3>
            <div className="space-y-3 text-sm">
              {analytics.winRate < 30 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>Taux de succès faible. Envisagez de réduire vos marges de 2-3% sur les projets compétitifs.</p>
                </div>
              )}
              {analytics.avgMargin > 15 && analytics.winRate < 35 && (
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Vos marges ({analytics.avgMargin.toFixed(1)}%) sont au-dessus de la moyenne. Testez des prix plus agressifs.</p>
                </div>
              )}
              {analytics.winRate >= 50 && (
                <div className="flex items-start gap-2">
                  <Award size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Excellent taux de succès! Vous pourriez augmenter vos marges progressivement.</p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Target size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                <p>Ciblez les projets {Object.entries(analytics.byProjectType)
                  .filter(([_, d]) => d.winRate > analytics.winRate)
                  .map(([type, _]) => PROJECT_TYPES.find(t => t.id === type)?.name)
                  .filter(Boolean)
                  .join(', ') || 'à fort potentiel'} pour maximiser vos chances.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="mt-6 bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Évolution mensuelle</h2>
        <div className="h-48 flex items-end gap-4">
          {analytics.byMonth.map((month, idx) => {
            const maxValue = Math.max(...analytics.byMonth.map(m => m.submitted))
            const height = maxValue > 0 ? (month.submitted / maxValue) * 100 : 0
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center" style={{ height: '160px' }}>
                  <div className="flex-1 w-full flex items-end gap-1">
                    <div 
                      className="flex-1 bg-green-400 rounded-t"
                      style={{ height: `${maxValue > 0 ? (month.won / maxValue) * 100 : 0}%` }}
                      title={`Gagnées: ${month.won}`}
                    />
                    <div 
                      className="flex-1 bg-red-400 rounded-t"
                      style={{ height: `${maxValue > 0 ? (month.lost / maxValue) * 100 : 0}%` }}
                      title={`Perdues: ${month.lost}`}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                <span className="text-xs font-medium">{month.submitted}</span>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-sm text-gray-500">Gagnées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded" />
            <span className="text-sm text-gray-500">Perdues</span>
          </div>
        </div>
      </div>

      {/* Recent Soumissions */}
      <div className="mt-6 bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Soumissions récentes</h2>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="all">Tous les types</option>
            {PROJECT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="text-left p-3">Numéro</th>
                <th className="text-left p-3">Projet</th>
                <th className="text-left p-3">Client</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-right p-3">Marge</th>
                <th className="text-center p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredSoumissions.slice(0, 10).map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.number}</td>
                  <td className="p-3">{s.projectName}</td>
                  <td className="p-3 text-gray-500">{s.clientName}</td>
                  <td className="p-3 text-right">{formatCurrency(s.total)}</td>
                  <td className="p-3 text-right">{s.margin.toFixed(1)}%</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      s.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      s.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {s.status === 'accepted' ? 'Acceptée' :
                       s.status === 'rejected' ? 'Refusée' :
                       s.status === 'pending' ? 'En attente' : 'Expirée'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
