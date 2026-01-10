/**
 * DAST Solutions - Phase 3: Budget Avancé
 * Budget vs Réel, Courbe S, Variances, Prévisions
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  PieChart, BarChart3, Calendar, Plus, Filter, Download, Eye,
  Edit2, CheckCircle, XCircle, Clock, Target, Layers, RefreshCw
} from 'lucide-react'

interface Project {
  id: string
  name: string
  budget?: number
  start_date?: string
  end_date?: string
}

interface BudgetCategory {
  id: string
  project_id: string
  code: string
  name: string
  budget_amount: number
  committed_amount: number
  actual_amount: number
  forecasted_amount: number
  parent_id?: string
  sort_order: number
}

interface CostEntry {
  id: string
  category_id: string
  date: string
  description: string
  vendor: string
  amount: number
  type: 'committed' | 'actual'
  invoice_number?: string
  status: 'pending' | 'approved' | 'paid'
}

// Structure de budget standard construction
const DEFAULT_BUDGET_STRUCTURE = [
  { code: '01', name: 'Conditions générales', percentage: 8 },
  { code: '02', name: 'Travaux de site', percentage: 5 },
  { code: '03', name: 'Béton', percentage: 12 },
  { code: '04', name: 'Maçonnerie', percentage: 8 },
  { code: '05', name: 'Métaux', percentage: 10 },
  { code: '06', name: 'Bois et plastiques', percentage: 6 },
  { code: '07', name: 'Protection thermique', percentage: 5 },
  { code: '08', name: 'Portes et fenêtres', percentage: 7 },
  { code: '09', name: 'Finitions', percentage: 10 },
  { code: '21', name: 'Protection incendie', percentage: 3 },
  { code: '22', name: 'Plomberie', percentage: 6 },
  { code: '23', name: 'CVAC', percentage: 10 },
  { code: '26', name: 'Électricité', percentage: 8 },
  { code: '99', name: 'Contingences', percentage: 2 },
]

export default function BudgetAdvanced() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [costEntries, setCostEntries] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'curve' | 'forecast'>('overview')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null)

  // Charger les données
  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return
    
    try {
      // Charger le projet
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (projectData) setProject(projectData)

      // Charger les catégories de budget
      const { data: categoriesData } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order')

      setCategories(categoriesData || [])

      // Charger les entrées de coûts
      const { data: costsData } = await supabase
        .from('cost_entries')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      setCostEntries(costsData || [])
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initialiser la structure de budget par défaut
  const initializeDefaultBudget = async () => {
    if (!projectId || !project?.budget) return

    const newCategories = DEFAULT_BUDGET_STRUCTURE.map((cat, idx) => ({
      project_id: projectId,
      code: cat.code,
      name: cat.name,
      budget_amount: Math.round(project.budget! * cat.percentage / 100),
      committed_amount: 0,
      actual_amount: 0,
      forecasted_amount: Math.round(project.budget! * cat.percentage / 100),
      sort_order: idx
    }))

    const { data, error } = await supabase
      .from('budget_categories')
      .insert(newCategories)
      .select()

    if (!error && data) {
      setCategories(data)
    }
  }

  // Calculs globaux
  const totals = categories.reduce((acc, cat) => ({
    budget: acc.budget + (cat.budget_amount || 0),
    committed: acc.committed + (cat.committed_amount || 0),
    actual: acc.actual + (cat.actual_amount || 0),
    forecast: acc.forecast + (cat.forecasted_amount || 0)
  }), { budget: 0, committed: 0, actual: 0, forecast: 0 })

  const variance = totals.budget - totals.forecast
  const variancePercent = totals.budget > 0 ? (variance / totals.budget) * 100 : 0
  const completionPercent = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0

  // Données pour la courbe S
  const generateSCurveData = () => {
    if (!project?.start_date || !project?.end_date) return []
    
    const start = new Date(project.start_date)
    const end = new Date(project.end_date)
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    const data = []
    
    for (let i = 0; i <= 12; i++) {
      const progress = i / 12
      const date = new Date(start.getTime() + progress * (end.getTime() - start.getTime()))
      
      // Courbe S typique (sigmoïde)
      const sCurveProgress = 1 / (1 + Math.exp(-10 * (progress - 0.5)))
      const plannedAmount = totals.budget * sCurveProgress
      
      // Simuler les coûts réels (à remplacer par vraies données)
      const actualProgress = Math.min(progress, completionPercent / 100)
      const actualAmount = totals.actual * (actualProgress / (completionPercent / 100 || 1))
      
      data.push({
        month: date.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' }),
        planned: Math.round(plannedAmount),
        actual: Math.round(actualAmount),
        forecast: Math.round(totals.forecast * sCurveProgress)
      })
    }
    
    return data
  }

  const sCurveData = generateSCurveData()

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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/project/${projectId}?tab=finances`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Budget & Contrôle des coûts</h1>
          <p className="text-gray-500">{project?.name}</p>
        </div>
        <button
          onClick={() => {/* Export */}}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download size={16} />
          Exporter
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Budget</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totals.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Engagé</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {totals.committed.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totals.budget > 0 ? ((totals.committed / totals.budget) * 100).toFixed(1) : 0}% du budget
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Réel</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {totals.actual.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {completionPercent.toFixed(1)}% complété
          </p>
        </div>

        <div className={`bg-white rounded-xl border p-5 ${variance < 0 ? 'ring-2 ring-red-200' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg ${variance >= 0 ? 'bg-teal-100' : 'bg-red-100'} flex items-center justify-center`}>
              {variance >= 0 ? (
                <TrendingDown className="text-teal-600" size={20} />
              ) : (
                <TrendingUp className="text-red-600" size={20} />
              )}
            </div>
            <span className="text-sm text-gray-500">Variance</span>
          </div>
          <p className={`text-2xl font-bold ${variance >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
            {variance >= 0 ? '+' : ''}{variance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs ${variance >= 0 ? 'text-teal-600' : 'text-red-600'} mt-1`}>
            {variance >= 0 ? 'Sous budget' : 'Dépassement'} ({Math.abs(variancePercent).toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Navigation des vues */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
          { id: 'details', label: 'Détails par division', icon: Layers },
          { id: 'curve', label: 'Courbe S', icon: TrendingUp },
          { id: 'forecast', label: 'Prévisions', icon: Target },
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeView === view.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <view.icon size={18} />
            {view.label}
          </button>
        ))}
      </div>

      {/* Contenu selon la vue */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Barre de progression globale */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Progression budgétaire</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Engagé</span>
                  <span className="font-medium">{totals.budget > 0 ? ((totals.committed / totals.budget) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min((totals.committed / totals.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Dépensé (Réel)</span>
                  <span className="font-medium">{completionPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(completionPercent, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Prévision finale</span>
                  <span className={`font-medium ${totals.forecast > totals.budget ? 'text-red-600' : 'text-teal-600'}`}>
                    {totals.budget > 0 ? ((totals.forecast / totals.budget) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full ${totals.forecast > totals.budget ? 'bg-red-500' : 'bg-teal-500'} rounded-full`}
                    style={{ width: `${Math.min((totals.forecast / totals.budget) * 100, 100)}%` }}
                  />
                  {/* Ligne du budget */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-blue-600" style={{ left: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par catégorie (top 5) */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Top 5 - Catégories par dépenses</h3>
              <button
                onClick={() => setActiveView('details')}
                className="text-sm text-teal-600 hover:underline"
              >
                Voir tout →
              </button>
            </div>
            <div className="space-y-3">
              {categories
                .sort((a, b) => b.actual_amount - a.actual_amount)
                .slice(0, 5)
                .map(cat => {
                  const catVariance = cat.budget_amount - cat.forecasted_amount
                  return (
                    <div key={cat.id} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-mono text-gray-500">{cat.code}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat.name}</span>
                          <span className={catVariance < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {cat.actual_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                            {' / '}
                            {cat.budget_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              cat.actual_amount > cat.budget_amount ? 'bg-red-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${Math.min((cat.actual_amount / cat.budget_amount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Alertes */}
          {categories.filter(c => c.forecasted_amount > c.budget_amount).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={20} />
                Alertes de dépassement
              </h3>
              <div className="space-y-2">
                {categories
                  .filter(c => c.forecasted_amount > c.budget_amount)
                  .map(cat => (
                    <div key={cat.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <span className="font-medium">{cat.code} - {cat.name}</span>
                      <span className="text-red-600 font-medium">
                        +{(cat.forecasted_amount - cat.budget_amount).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Bouton initialiser si vide */}
          {categories.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Layers className="mx-auto mb-4 text-gray-300" size={64} />
              <h3 className="text-lg font-semibold mb-2">Aucune structure de budget</h3>
              <p className="text-gray-500 mb-6">
                Initialisez la structure de budget avec les divisions standard CSI
              </p>
              <button
                onClick={initializeDefaultBudget}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Initialiser le budget ({project?.budget?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }) || '0 $'})
              </button>
            </div>
          )}
        </div>
      )}

      {activeView === 'details' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Détails par division</h3>
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter division
            </button>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Division</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Budget</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Engagé</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Réel</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Prévision</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Variance</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">%</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map(cat => {
                  const catVariance = cat.budget_amount - cat.forecasted_amount
                  const catPercent = cat.budget_amount > 0 ? (cat.actual_amount / cat.budget_amount) * 100 : 0
                  return (
                    <tr 
                      key={cat.id} 
                      className={`hover:bg-gray-50 ${catVariance < 0 ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-sm">{cat.code}</td>
                      <td className="py-3 px-4 font-medium">{cat.name}</td>
                      <td className="py-3 px-4 text-right">
                        {cat.budget_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600">
                        {cat.committed_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        {cat.actual_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {cat.forecasted_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${catVariance >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {catVariance >= 0 ? '+' : ''}{catVariance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${catPercent > 100 ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min(catPercent, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2">
                <tr className="font-bold">
                  <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                  <td className="py-3 px-4 text-right">
                    {totals.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-600">
                    {totals.committed.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                    {totals.actual.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {totals.forecast.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </td>
                  <td className={`py-3 px-4 text-right ${variance >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                    {variance >= 0 ? '+' : ''}{variance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {completionPercent.toFixed(0)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeView === 'curve' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-6">Courbe S - Flux de trésorerie</h3>
            
            {/* Graphique simplifié */}
            <div className="h-80 relative">
              {/* Axe Y */}
              <div className="absolute left-0 top-0 bottom-8 w-20 flex flex-col justify-between text-xs text-gray-500">
                <span>{totals.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', notation: 'compact' })}</span>
                <span>{(totals.budget * 0.75).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', notation: 'compact' })}</span>
                <span>{(totals.budget * 0.5).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', notation: 'compact' })}</span>
                <span>{(totals.budget * 0.25).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', notation: 'compact' })}</span>
                <span>0 $</span>
              </div>
              
              {/* Zone du graphique */}
              <div className="ml-20 h-full border-l border-b relative">
                {/* Grille horizontale */}
                {[0.25, 0.5, 0.75, 1].map((y, i) => (
                  <div 
                    key={i}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ bottom: `${y * 100}%` }}
                  />
                ))}
                
                {/* Barres */}
                <div className="absolute inset-0 flex items-end justify-around px-2">
                  {sCurveData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-full flex gap-0.5 items-end" style={{ height: '90%' }}>
                        {/* Planifié */}
                        <div 
                          className="flex-1 bg-blue-200 rounded-t"
                          style={{ height: `${(d.planned / totals.budget) * 100}%` }}
                          title={`Planifié: ${d.planned.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`}
                        />
                        {/* Réel */}
                        <div 
                          className="flex-1 bg-green-500 rounded-t"
                          style={{ height: `${(d.actual / totals.budget) * 100}%` }}
                          title={`Réel: ${d.actual.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 -rotate-45 origin-top-left">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Légende */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 rounded" />
                <span className="text-sm text-gray-600">Planifié</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-sm text-gray-600">Réel</span>
              </div>
            </div>
          </div>

          {/* Indicateurs clés */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <h4 className="text-sm text-gray-500 mb-2">Avancement financier</h4>
              <p className="text-2xl font-bold">{completionPercent.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                du budget dépensé
              </p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h4 className="text-sm text-gray-500 mb-2">Taux d'engagement</h4>
              <p className="text-2xl font-bold text-amber-600">
                {totals.budget > 0 ? ((totals.committed / totals.budget) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                sous contrat
              </p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <h4 className="text-sm text-gray-500 mb-2">Burn rate mensuel</h4>
              <p className="text-2xl font-bold">
                {(totals.actual / 6).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                moyenne estimée
              </p>
            </div>
          </div>
        </div>
      )}

      {activeView === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Prévision à l'achèvement (EAC)</h3>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Prévision actuelle */}
              <div>
                <h4 className="text-sm text-gray-500 mb-3">Coût final prévu</h4>
                <p className={`text-4xl font-bold ${totals.forecast > totals.budget ? 'text-red-600' : 'text-teal-600'}`}>
                  {totals.forecast.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  vs Budget: {totals.budget.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>

              {/* Variance */}
              <div>
                <h4 className="text-sm text-gray-500 mb-3">Variance à l'achèvement (VAC)</h4>
                <p className={`text-4xl font-bold ${variance >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                  {variance >= 0 ? '+' : ''}{variance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <p className={`text-sm ${variance >= 0 ? 'text-teal-600' : 'text-red-600'} mt-2`}>
                  {variance >= 0 ? 'Économie prévue' : 'Dépassement prévu'} de {Math.abs(variancePercent).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Scénarios */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Analyse de scénarios</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Optimiste (-5%)</h4>
                <p className="text-2xl font-bold text-green-600">
                  {(totals.forecast * 0.95).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Économie: {((totals.budget - totals.forecast * 0.95)).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h4 className="font-medium text-blue-800 mb-2">Probable (actuel)</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {totals.forecast.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Variance: {variance.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Pessimiste (+10%)</h4>
                <p className="text-2xl font-bold text-red-600">
                  {(totals.forecast * 1.1).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Dépassement: {((totals.forecast * 1.1 - totals.budget)).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Indicateurs EVM */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Indicateurs de performance (EVM)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-xs text-gray-500 mb-1">CPI (Cost Performance Index)</h4>
                <p className={`text-2xl font-bold ${totals.actual > 0 ? (totals.budget * completionPercent / 100 / totals.actual >= 1 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                  {totals.actual > 0 ? (totals.budget * completionPercent / 100 / totals.actual).toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">≥1 = sous budget</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-xs text-gray-500 mb-1">SPI (Schedule Perf. Index)</h4>
                <p className="text-2xl font-bold text-gray-400">N/A</p>
                <p className="text-xs text-gray-500 mt-1">≥1 = en avance</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-xs text-gray-500 mb-1">ETC (Estimate to Complete)</h4>
                <p className="text-2xl font-bold">
                  {(totals.forecast - totals.actual).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', notation: 'compact' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">reste à dépenser</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-xs text-gray-500 mb-1">TCPI (To Complete Perf. Index)</h4>
                <p className={`text-2xl font-bold ${(totals.budget - totals.actual) > 0 ? ((totals.budget - totals.actual) / (totals.forecast - totals.actual) >= 1 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                  {(totals.forecast - totals.actual) > 0 ? ((totals.budget - totals.actual) / (totals.forecast - totals.actual)).toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">objectif efficacité</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
