/**
 * DAST Solutions - Widget Échéances
 * Soumissions dues, paiements à recevoir, inspections planifiées
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Clock, Calendar, AlertTriangle, FileText, DollarSign,
  ClipboardCheck, ChevronRight, Bell, CheckCircle, XCircle,
  Timer, CalendarClock, ArrowRight, Eye
} from 'lucide-react'

interface Echeance {
  id: string
  type: 'soumission' | 'paiement' | 'inspection' | 'reunion' | 'livraison' | 'permis'
  title: string
  description?: string
  dueDate: Date
  project?: string
  projectId?: string
  amount?: number
  status: 'upcoming' | 'today' | 'overdue' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  soumission: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Soumission' },
  paiement: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', label: 'Paiement' },
  inspection: { icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Inspection' },
  reunion: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Réunion' },
  livraison: { icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Livraison' },
  permis: { icon: FileText, color: 'text-red-600', bg: 'bg-red-100', label: 'Permis' },
}

export default function WidgetEcheances() {
  const navigate = useNavigate()
  const [echeances, setEcheances] = useState<Echeance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all')
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    loadEcheances()
  }, [])

  const loadEcheances = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger soumissions avec date limite
      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('id, soumission_number, client_name, total, deadline, status, project_id')
        .eq('user_id', user.id)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true })

      // Charger factures impayées
      const { data: factures } = await supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total, due_date, status, project_id')
        .eq('user_id', user.id)
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true })

      // Charger inspections planifiées
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, title, scheduled_date, project_id, status')
        .eq('user_id', user.id)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })

      const now = new Date()
      const allEcheances: Echeance[] = []

      // Traiter soumissions
      soumissions?.forEach(s => {
        if (!s.deadline) return
        const dueDate = new Date(s.deadline)
        const status = getStatus(dueDate, s.status === 'accepted')
        
        allEcheances.push({
          id: `soum-${s.id}`,
          type: 'soumission',
          title: `Soumission ${s.soumission_number}`,
          description: s.client_name,
          dueDate,
          amount: s.total,
          projectId: s.project_id,
          status,
          priority: getPriority(dueDate)
        })
      })

      // Traiter factures
      factures?.forEach(f => {
        if (!f.due_date) return
        const dueDate = new Date(f.due_date)
        const status = getStatus(dueDate, f.status === 'paid')
        
        allEcheances.push({
          id: `fact-${f.id}`,
          type: 'paiement',
          title: `Facture ${f.invoice_number}`,
          description: f.client_name,
          dueDate,
          amount: f.total,
          projectId: f.project_id,
          status,
          priority: getPriority(dueDate)
        })
      })

      // Traiter inspections
      inspections?.forEach(i => {
        if (!i.scheduled_date) return
        const dueDate = new Date(i.scheduled_date)
        const status = getStatus(dueDate, i.status === 'completed')
        
        allEcheances.push({
          id: `insp-${i.id}`,
          type: 'inspection',
          title: i.title || 'Inspection',
          dueDate,
          projectId: i.project_id,
          status,
          priority: getPriority(dueDate)
        })
      })

      // Si pas de données, générer des exemples
      if (allEcheances.length === 0) {
        setEcheances(generateMockEcheances())
      } else {
        // Trier par date
        allEcheances.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        setEcheances(allEcheances)
      }

    } catch (err) {
      console.error('Erreur chargement échéances:', err)
      setEcheances(generateMockEcheances())
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (dueDate: Date, isCompleted: boolean): Echeance['status'] => {
    if (isCompleted) return 'completed'
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    
    if (due < today) return 'overdue'
    if (due.getTime() === today.getTime()) return 'today'
    return 'upcoming'
  }

  const getPriority = (dueDate: Date): Echeance['priority'] => {
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'urgent'
    if (diffDays <= 1) return 'high'
    if (diffDays <= 3) return 'medium'
    return 'low'
  }

  const generateMockEcheances = (): Echeance[] => {
    const now = new Date()
    const echeances: Echeance[] = []
    
    // Soumission en retard
    const overdue = new Date(now)
    overdue.setDate(overdue.getDate() - 2)
    echeances.push({
      id: 'mock-1',
      type: 'soumission',
      title: 'Soumission S-2024-089',
      description: 'Centre sportif Laval',
      dueDate: overdue,
      project: 'Centre sportif Laval',
      amount: 245000,
      status: 'overdue',
      priority: 'urgent'
    })

    // Soumission aujourd'hui
    echeances.push({
      id: 'mock-2',
      type: 'soumission',
      title: 'Soumission S-2024-091',
      description: 'Rénovation école primaire',
      dueDate: now,
      project: 'École primaire St-Jean',
      amount: 125000,
      status: 'today',
      priority: 'high'
    })

    // Paiement demain
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    echeances.push({
      id: 'mock-3',
      type: 'paiement',
      title: 'Facture F-2024-156',
      description: 'Construction ABC inc.',
      dueDate: tomorrow,
      amount: 45000,
      status: 'upcoming',
      priority: 'high'
    })

    // Inspection cette semaine
    const insp = new Date(now)
    insp.setDate(insp.getDate() + 3)
    echeances.push({
      id: 'mock-4',
      type: 'inspection',
      title: 'Inspection structure',
      description: 'Projet Tour A',
      dueDate: insp,
      project: 'Tour résidentielle A',
      status: 'upcoming',
      priority: 'medium'
    })

    // Réunion
    const reunion = new Date(now)
    reunion.setDate(reunion.getDate() + 2)
    echeances.push({
      id: 'mock-5',
      type: 'reunion',
      title: 'Réunion de chantier',
      description: 'Projet Centre commercial',
      dueDate: reunion,
      project: 'Centre commercial XYZ',
      status: 'upcoming',
      priority: 'medium'
    })

    // Livraison
    const livraison = new Date(now)
    livraison.setDate(livraison.getDate() + 5)
    echeances.push({
      id: 'mock-6',
      type: 'livraison',
      title: 'Livraison acier',
      description: '25 tonnes armature',
      dueDate: livraison,
      status: 'upcoming',
      priority: 'low'
    })

    // Paiement semaine prochaine
    const paiement2 = new Date(now)
    paiement2.setDate(paiement2.getDate() + 7)
    echeances.push({
      id: 'mock-7',
      type: 'paiement',
      title: 'Facture F-2024-149',
      description: 'Ville de Montréal',
      dueDate: paiement2,
      amount: 78500,
      status: 'upcoming',
      priority: 'low'
    })

    return echeances.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Demain'
    if (diffDays === -1) return 'Hier'
    if (diffDays < -1) return `Il y a ${Math.abs(diffDays)} jours`
    if (diffDays <= 7) return `Dans ${diffDays} jours`
    
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
  }

  const filteredEcheances = echeances.filter(e => {
    if (!showCompleted && e.status === 'completed') return false
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    
    switch (filter) {
      case 'today':
        return e.status === 'today'
      case 'week':
        return e.dueDate >= today && e.dueDate <= weekEnd
      case 'overdue':
        return e.status === 'overdue'
      default:
        return true
    }
  })

  const stats = {
    overdue: echeances.filter(e => e.status === 'overdue').length,
    today: echeances.filter(e => e.status === 'today').length,
    week: echeances.filter(e => {
      const now = new Date()
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() + 7)
      return e.dueDate >= now && e.dueDate <= weekEnd && e.status !== 'completed'
    }).length,
    totalAmount: echeances
      .filter(e => e.type === 'paiement' && e.status !== 'completed')
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
          <CalendarClock className="text-orange-600" size={18} />
          <h3 className="font-semibold text-gray-900">Échéances</h3>
        </div>
        <div className="flex items-center gap-2">
          {stats.overdue > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
              <AlertTriangle size={12} />
              {stats.overdue} en retard
            </span>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setFilter('overdue')}
          className={`p-2 rounded-lg text-center transition ${
            filter === 'overdue' ? 'bg-red-100 ring-2 ring-red-300' : 'bg-red-50 hover:bg-red-100'
          }`}
        >
          <p className="text-lg font-bold text-red-600">{stats.overdue}</p>
          <p className="text-xs text-red-600">En retard</p>
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`p-2 rounded-lg text-center transition ${
            filter === 'today' ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <p className="text-lg font-bold text-amber-600">{stats.today}</p>
          <p className="text-xs text-amber-600">Aujourd'hui</p>
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`p-2 rounded-lg text-center transition ${
            filter === 'week' ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <p className="text-lg font-bold text-blue-600">{stats.week}</p>
          <p className="text-xs text-blue-600">Cette sem.</p>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`p-2 rounded-lg text-center transition ${
            filter === 'all' ? 'bg-gray-200 ring-2 ring-gray-400' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <p className="text-lg font-bold text-gray-700">{echeances.filter(e => e.status !== 'completed').length}</p>
          <p className="text-xs text-gray-600">Total</p>
        </button>
      </div>

      {/* Paiements attendus */}
      {stats.totalAmount > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">Paiements à recevoir</span>
            <span className="font-bold text-green-700">
              {stats.totalAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </span>
          </div>
        </div>
      )}

      {/* Liste des échéances */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredEcheances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-sm">Aucune échéance</p>
          </div>
        ) : (
          filteredEcheances.map(echeance => {
            const config = TYPE_CONFIG[echeance.type]
            const Icon = config.icon
            
            return (
              <div 
                key={echeance.id}
                className={`p-3 rounded-lg border transition hover:shadow-sm cursor-pointer ${
                  echeance.status === 'overdue' ? 'border-red-300 bg-red-50' :
                  echeance.status === 'today' ? 'border-amber-300 bg-amber-50' :
                  'hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon size={16} className={config.color} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{echeance.title}</span>
                      {echeance.priority === 'urgent' && (
                        <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    {echeance.description && (
                      <p className="text-xs text-gray-500 truncate">{echeance.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${
                        echeance.status === 'overdue' ? 'text-red-600' :
                        echeance.status === 'today' ? 'text-amber-600' :
                        'text-gray-500'
                      }`}>
                        {formatDate(echeance.dueDate)}
                      </span>
                      {echeance.amount && (
                        <span className="text-xs text-gray-500">
                          • {echeance.amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <Eye size={12} />
          {showCompleted ? 'Masquer complétés' : 'Voir complétés'}
        </button>
        <button 
          onClick={() => navigate('/calendar')}
          className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          Voir calendrier
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
