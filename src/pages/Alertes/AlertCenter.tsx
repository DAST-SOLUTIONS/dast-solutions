/**
 * DAST Solutions - Centre d'Alertes
 * Notifications automatiques pour projets, budgets, échéances
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Bell, BellOff, AlertTriangle, AlertCircle, Info, CheckCircle,
  Clock, DollarSign, Calendar, FileText, Users, Shield,
  Settings, Filter, Trash2, Check, X, ChevronRight, RefreshCw,
  Eye, EyeOff, Volume2, VolumeX, Mail, Smartphone, MoreVertical,
  TrendingUp, TrendingDown, Zap, Target, Building2, ArrowRight
} from 'lucide-react'

// Types
interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  category: AlertCategory
  title: string
  message: string
  projectId?: string
  projectName?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  dismissed: boolean
  actionUrl?: string
  actionLabel?: string
  triggeredAt: string
  expiresAt?: string
  metadata?: Record<string, any>
}

type AlertCategory = 
  | 'budget' 
  | 'deadline' 
  | 'soumission' 
  | 'payment' 
  | 'project' 
  | 'safety' 
  | 'document' 
  | 'system'

interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  condition: string
  threshold: number
  thresholdUnit: string
  isActive: boolean
  priority: Alert['priority']
  notifyEmail: boolean
  notifyPush: boolean
  notifyInApp: boolean
  lastTriggered?: string
  triggerCount: number
}

// Constantes
const CATEGORY_CONFIG: Record<AlertCategory, { 
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}> = {
  budget: { label: 'Budget', icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  deadline: { label: 'Échéance', icon: Clock, color: 'text-red-600', bgColor: 'bg-red-100' },
  soumission: { label: 'Soumission', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  payment: { label: 'Paiement', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
  project: { label: 'Projet', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  safety: { label: 'SST', icon: Shield, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  document: { label: 'Document', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  system: { label: 'Système', icon: Settings, color: 'text-teal-600', bgColor: 'bg-teal-100' },
}

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Haute', color: 'bg-amber-100 text-amber-600' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-600' },
}

const DEFAULT_RULES: Omit<AlertRule, 'id'>[] = [
  {
    name: 'Dépassement budget 85%',
    category: 'budget',
    condition: 'budget_usage_percent',
    threshold: 85,
    thresholdUnit: '%',
    isActive: true,
    priority: 'high',
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Dépassement budget 100%',
    category: 'budget',
    condition: 'budget_usage_percent',
    threshold: 100,
    thresholdUnit: '%',
    isActive: true,
    priority: 'critical',
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Échéance soumission 3 jours',
    category: 'soumission',
    condition: 'days_until_deadline',
    threshold: 3,
    thresholdUnit: 'jours',
    isActive: true,
    priority: 'high',
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Échéance soumission 7 jours',
    category: 'soumission',
    condition: 'days_until_deadline',
    threshold: 7,
    thresholdUnit: 'jours',
    isActive: true,
    priority: 'medium',
    notifyEmail: false,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Paiement en retard',
    category: 'payment',
    condition: 'days_overdue',
    threshold: 1,
    thresholdUnit: 'jour',
    isActive: true,
    priority: 'high',
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Retard projet',
    category: 'project',
    condition: 'days_behind_schedule',
    threshold: 7,
    thresholdUnit: 'jours',
    isActive: true,
    priority: 'medium',
    notifyEmail: false,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Incident SST signalé',
    category: 'safety',
    condition: 'safety_incident',
    threshold: 1,
    thresholdUnit: 'incident',
    isActive: true,
    priority: 'critical',
    notifyEmail: true,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  },
  {
    name: 'Document expiré',
    category: 'document',
    condition: 'document_expired',
    threshold: 0,
    thresholdUnit: 'jours',
    isActive: true,
    priority: 'medium',
    notifyEmail: false,
    notifyPush: true,
    notifyInApp: true,
    triggerCount: 0
  }
]

export default function AlertCenter() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'settings'>('alerts')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showRead, setShowRead] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  useEffect(() => {
    loadAlerts()
    loadRules()
  }, [])

  const loadAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data && data.length > 0) {
        setAlerts(data.map(a => ({
          id: a.id,
          type: a.type,
          category: a.category,
          title: a.title,
          message: a.message,
          projectId: a.project_id,
          projectName: a.project_name,
          priority: a.priority || 'medium',
          read: a.read,
          dismissed: a.dismissed,
          actionUrl: a.action_url,
          actionLabel: a.action_label,
          triggeredAt: a.created_at,
          metadata: a.metadata
        })))
      } else {
        // Alertes de démo
        setAlerts(generateDemoAlerts())
      }
    } catch (err) {
      console.error('Erreur chargement alertes:', err)
      setAlerts(generateDemoAlerts())
    } finally {
      setLoading(false)
    }
  }

  const loadRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('category')

      if (data && data.length > 0) {
        setRules(data.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          condition: r.condition_type,
          threshold: r.threshold,
          thresholdUnit: r.threshold_unit,
          isActive: r.is_active,
          priority: r.priority,
          notifyEmail: r.notify_email,
          notifyPush: r.notify_push,
          notifyInApp: r.notify_in_app,
          lastTriggered: r.last_triggered,
          triggerCount: r.trigger_count || 0
        })))
      } else {
        setRules(DEFAULT_RULES.map((r, i) => ({
          ...r,
          id: `default-${i}`
        })))
      }
    } catch (err) {
      console.error('Erreur chargement règles:', err)
      setRules(DEFAULT_RULES.map((r, i) => ({ ...r, id: `default-${i}` })))
    }
  }

  const generateDemoAlerts = (): Alert[] => {
    const now = new Date()
    return [
      {
        id: '1',
        type: 'error',
        category: 'budget',
        title: 'Dépassement budget',
        message: 'Le projet Centre Sportif a dépassé 100% du budget prévu (+15,000$)',
        projectId: 'proj-1',
        projectName: 'Centre Sportif Laval',
        priority: 'critical',
        read: false,
        dismissed: false,
        actionUrl: '/project/proj-1/budget',
        actionLabel: 'Voir budget',
        triggeredAt: new Date(now.getTime() - 30 * 60000).toISOString()
      },
      {
        id: '2',
        type: 'warning',
        category: 'soumission',
        title: 'Échéance proche',
        message: 'Soumission S-2025-042 expire dans 2 jours',
        priority: 'high',
        read: false,
        dismissed: false,
        actionUrl: '/soumission/S-2025-042',
        actionLabel: 'Voir soumission',
        triggeredAt: new Date(now.getTime() - 2 * 3600000).toISOString()
      },
      {
        id: '3',
        type: 'warning',
        category: 'payment',
        title: 'Paiement en retard',
        message: 'Facture F-2025-018 de 45,000$ en retard de 5 jours',
        priority: 'high',
        read: false,
        dismissed: false,
        actionUrl: '/factures',
        actionLabel: 'Voir facture',
        triggeredAt: new Date(now.getTime() - 5 * 3600000).toISOString()
      },
      {
        id: '4',
        type: 'error',
        category: 'safety',
        title: 'Incident SST signalé',
        message: 'Incident mineur sur chantier Résidence Mont-Royal - Chute objet',
        projectName: 'Résidence Mont-Royal',
        priority: 'critical',
        read: false,
        dismissed: false,
        actionUrl: '/sst/incidents',
        actionLabel: 'Voir rapport',
        triggeredAt: new Date(now.getTime() - 1 * 3600000).toISOString()
      },
      {
        id: '5',
        type: 'info',
        category: 'project',
        title: 'Nouveau plan reçu',
        message: 'Plans architecturaux V3 reçus pour Complexe Montcalm',
        projectName: 'Complexe Montcalm',
        priority: 'medium',
        read: true,
        dismissed: false,
        actionUrl: '/project/proj-3/plans',
        actionLabel: 'Voir plans',
        triggeredAt: new Date(now.getTime() - 24 * 3600000).toISOString()
      },
      {
        id: '6',
        type: 'success',
        category: 'soumission',
        title: 'Soumission acceptée',
        message: 'Le client a accepté la soumission S-2025-038 (125,000$)',
        priority: 'low',
        read: true,
        dismissed: false,
        actionUrl: '/soumission/S-2025-038',
        actionLabel: 'Voir détails',
        triggeredAt: new Date(now.getTime() - 48 * 3600000).toISOString()
      },
      {
        id: '7',
        type: 'warning',
        category: 'budget',
        title: 'Budget à 85%',
        message: 'Le projet École Saint-Jean atteint 85% du budget',
        projectName: 'École Saint-Jean',
        priority: 'medium',
        read: false,
        dismissed: false,
        actionUrl: '/project/proj-4/budget',
        actionLabel: 'Voir budget',
        triggeredAt: new Date(now.getTime() - 6 * 3600000).toISOString()
      },
      {
        id: '8',
        type: 'info',
        category: 'document',
        title: 'Document bientôt expiré',
        message: 'Licence RBQ expire dans 30 jours',
        priority: 'medium',
        read: false,
        dismissed: false,
        actionUrl: '/entrepreneurs/rbq',
        actionLabel: 'Renouveler',
        triggeredAt: new Date(now.getTime() - 12 * 3600000).toISOString()
      }
    ]
  }

  const markAsRead = async (alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !alertId.startsWith('demo')) {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const markAllAsRead = async () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
  }

  const dismissAlert = async (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !alertId.startsWith('demo')) {
      await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const toggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    setRules(rules.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r))

    const { data: { user } } = await supabase.auth.getUser()
    if (user && !ruleId.startsWith('default')) {
      await supabase
        .from('alert_rules')
        .update({ is_active: !rule.isActive })
        .eq('id', ruleId)
        .eq('user_id', user.id)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-CA')
  }

  const filteredAlerts = alerts.filter(alert => {
    if (!showRead && alert.read) return false
    if (filterCategory !== 'all' && alert.category !== filterCategory) return false
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false
    return true
  })

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => !a.read && a.priority === 'critical').length

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-teal-600" />
            Centre d'Alertes
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-sm rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500">Notifications et alertes automatiques</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAlerts}
            className="p-2 border rounded-lg hover:bg-gray-50"
            title="Actualiser"
          >
            <RefreshCw size={18} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">
              {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''} requièr{criticalCount > 1 ? 'ent' : 't'} votre attention
            </p>
            <p className="text-sm text-red-600">Action immédiate recommandée</p>
          </div>
          <button
            onClick={() => {
              setFilterPriority('critical')
              setShowRead(false)
            }}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Voir
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'alerts' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Bell size={18} />
          Alertes
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'rules' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Zap size={18} />
          Règles ({rules.filter(r => r.isActive).length}/{rules.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'settings' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Settings size={18} />
          Paramètres
        </button>
      </div>

      {/* Tab: Alerts */}
      {activeTab === 'alerts' && (
        <>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="all">Toutes catégories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="all">Toutes priorités</option>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showRead}
                onChange={(e) => setShowRead(e.target.checked)}
                className="rounded"
              />
              Afficher les lues
            </label>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell className="mx-auto mb-2 text-gray-300" size={48} />
                <p>Aucune alerte à afficher</p>
              </div>
            ) : (
              filteredAlerts.map(alert => {
                const categoryConfig = CATEGORY_CONFIG[alert.category]
                const priorityConfig = PRIORITY_CONFIG[alert.priority]
                const Icon = categoryConfig?.icon || Info
                
                return (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-xl border transition ${
                      !alert.read ? 'bg-white shadow-sm' : 'bg-gray-50'
                    } ${
                      alert.priority === 'critical' ? 'border-red-200' :
                      alert.priority === 'high' ? 'border-amber-200' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${categoryConfig?.bgColor || 'bg-gray-100'}`}>
                        <Icon className={categoryConfig?.color || 'text-gray-600'} size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-medium ${!alert.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {alert.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded text-xs ${priorityConfig?.color}`}>
                              {priorityConfig?.label}
                            </span>
                            {!alert.read && (
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{formatTimeAgo(alert.triggeredAt)}</span>
                          {alert.projectName && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {alert.projectName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {categoryConfig?.label}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {alert.actionUrl && (
                            <button
                              onClick={() => {
                                markAsRead(alert.id)
                                navigate(alert.actionUrl!)
                              }}
                              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center gap-1"
                            >
                              {alert.actionLabel || 'Voir'}
                              <ArrowRight size={14} />
                            </button>
                          )}
                          {!alert.read && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-sm"
                            >
                              Marquer lu
                            </button>
                          )}
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="Supprimer"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {rules.filter(r => r.isActive).length} règle(s) active(s) sur {rules.length}
            </p>
            <button
              onClick={() => setEditingRule({
                id: '',
                name: '',
                category: 'budget',
                condition: '',
                threshold: 0,
                thresholdUnit: '%',
                isActive: true,
                priority: 'medium',
                notifyEmail: true,
                notifyPush: true,
                notifyInApp: true,
                triggerCount: 0
              })}
              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center gap-1"
            >
              <Zap size={14} />
              Nouvelle règle
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {rules.map(rule => {
              const categoryConfig = CATEGORY_CONFIG[rule.category]
              const Icon = categoryConfig?.icon || Zap
              
              return (
                <div 
                  key={rule.id}
                  className={`p-4 rounded-xl border ${
                    rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryConfig?.bgColor || 'bg-gray-100'}`}>
                        <Icon className={categoryConfig?.color || 'text-gray-600'} size={18} />
                      </div>
                      <div>
                        <h3 className="font-medium">{rule.name}</h3>
                        <p className="text-xs text-gray-500">{categoryConfig?.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative w-10 h-5 rounded-full transition ${
                        rule.isActive ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                        rule.isActive ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      Seuil: <strong>{rule.threshold} {rule.thresholdUnit}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${PRIORITY_CONFIG[rule.priority]?.color}`}>
                      {PRIORITY_CONFIG[rule.priority]?.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    {rule.notifyInApp && (
                      <span className="flex items-center gap-1">
                        <Bell size={12} /> App
                      </span>
                    )}
                    {rule.notifyEmail && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> Email
                      </span>
                    )}
                    {rule.notifyPush && (
                      <span className="flex items-center gap-1">
                        <Smartphone size={12} /> Push
                      </span>
                    )}
                    <span className="ml-auto">
                      Déclenchée {rule.triggerCount}x
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell size={18} />
              Préférences de notification
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Notifications dans l'application</p>
                    <p className="text-sm text-gray-500">Alertes visibles dans le centre</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-gray-500">Recevoir un courriel pour les alertes critiques</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-500">Notifications sur votre appareil mobile</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <VolumeX size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Mode silencieux</p>
                    <p className="text-sm text-gray-500">Désactiver tous les sons</p>
                  </div>
                </div>
                <input type="checkbox" className="rounded" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={18} />
              Fréquence des vérifications
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Vérification des budgets</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Chaque heure</option>
                  <option>Toutes les 4 heures</option>
                  <option>Une fois par jour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vérification des échéances</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Chaque heure</option>
                  <option>Toutes les 4 heures</option>
                  <option>Une fois par jour</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
              <Trash2 size={18} />
              Zone dangereuse
            </h3>
            
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
              Supprimer toutes les alertes lues
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
