/**
 * DAST Solutions - Widget Alertes
 * Notifications importantes centralisées
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X,
  Clock, DollarSign, FileText, Calendar, Shield, Package,
  ChevronRight, Eye, EyeOff, Settings, Trash2
} from 'lucide-react'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  category: 'budget' | 'deadline' | 'safety' | 'payment' | 'document' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  projectId?: string
  projectName?: string
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string }> = {
  budget: { icon: DollarSign, color: 'text-amber-600' },
  deadline: { icon: Clock, color: 'text-red-600' },
  safety: { icon: Shield, color: 'text-red-600' },
  payment: { icon: DollarSign, color: 'text-green-600' },
  document: { icon: FileText, color: 'text-blue-600' },
  system: { icon: Settings, color: 'text-gray-600' },
}

const TYPE_CONFIG: Record<string, { icon: any; bg: string; border: string }> = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200' },
  error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200' },
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200' },
}

export default function WidgetAlertes() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadAlerts()
    // Polling pour nouvelles alertes toutes les minutes
    const interval = setInterval(loadAlerts, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger alertes depuis la base de données
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        setAlerts(data.map(a => ({
          ...a,
          timestamp: new Date(a.created_at)
        })))
      } else {
        // Générer des alertes de démo
        setAlerts(generateMockAlerts())
      }

    } catch (err) {
      console.error('Erreur alertes:', err)
      setAlerts(generateMockAlerts())
    } finally {
      setLoading(false)
    }
  }

  const generateMockAlerts = (): Alert[] => {
    const now = new Date()
    const alerts: Alert[] = []

    // Alerte budget dépassé
    alerts.push({
      id: '1',
      type: 'error',
      category: 'budget',
      title: 'Dépassement budget',
      message: 'Le projet "Centre sportif" a dépassé son budget de 15%',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      read: false,
      actionUrl: '/project/1/budget',
      actionLabel: 'Voir budget',
      projectName: 'Centre sportif Laval'
    })

    // Alerte deadline
    alerts.push({
      id: '2',
      type: 'warning',
      category: 'deadline',
      title: 'Soumission urgente',
      message: 'La soumission S-2024-089 expire dans 2 heures',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000),
      read: false,
      actionUrl: '/soumissions',
      actionLabel: 'Voir soumission'
    })

    // Alerte paiement reçu
    alerts.push({
      id: '3',
      type: 'success',
      category: 'payment',
      title: 'Paiement reçu',
      message: 'Paiement de 45 000$ reçu pour la facture F-2024-156',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
      actionUrl: '/factures',
      actionLabel: 'Voir facture'
    })

    // Alerte SST
    alerts.push({
      id: '4',
      type: 'error',
      category: 'safety',
      title: 'Incident SST signalé',
      message: 'Un incident mineur a été signalé sur le chantier Tour A',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/sst?tab=incidents',
      actionLabel: 'Voir incident',
      projectName: 'Tour résidentielle A'
    })

    // Alerte document
    alerts.push({
      id: '5',
      type: 'info',
      category: 'document',
      title: 'Nouveau plan reçu',
      message: 'Révision 3 des plans architecturaux disponible',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      read: true,
      actionUrl: '/conception',
      actionLabel: 'Voir plans',
      projectName: 'École primaire St-Jean'
    })

    // Alerte budget approchant limite
    alerts.push({
      id: '6',
      type: 'warning',
      category: 'budget',
      title: 'Budget à 85%',
      message: 'Le projet approche de sa limite budgétaire',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      read: true,
      actionUrl: '/project/2/budget',
      actionLabel: 'Voir budget',
      projectName: 'Centre commercial XYZ'
    })

    // Alerte système
    alerts.push({
      id: '7',
      type: 'info',
      category: 'system',
      title: 'Mise à jour disponible',
      message: 'Une nouvelle version de DAST est disponible',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      read: true
    })

    return alerts
  }

  const markAsRead = async (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ))

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const markAllAsRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', user.id)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
  }

  const filteredAlerts = alerts.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false
    if (!showAll && a.read) return false
    return true
  })

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => !a.read && (a.type === 'error' || a.type === 'warning')).length

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
          <div className="relative">
            <Bell className="text-rose-600" size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">Alertes</h3>
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {['all', 'error', 'warning', 'info', 'success'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-1 text-xs rounded-lg whitespace-nowrap transition ${
              filterType === type
                ? 'bg-rose-100 text-rose-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'Toutes' : 
             type === 'error' ? 'Critiques' :
             type === 'warning' ? 'Avertissements' :
             type === 'info' ? 'Info' : 'Succès'}
          </button>
        ))}
      </div>

      {/* Liste des alertes */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="mx-auto mb-2 text-green-400" size={32} />
            <p className="text-sm">Aucune alerte</p>
            <p className="text-xs">Tout est en ordre!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const typeConfig = TYPE_CONFIG[alert.type]
            const catConfig = CATEGORY_CONFIG[alert.category]
            const TypeIcon = typeConfig.icon
            const CatIcon = catConfig.icon

            return (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border transition ${typeConfig.bg} ${typeConfig.border} ${
                  !alert.read ? 'ring-2 ring-offset-1 ring-opacity-50' : ''
                } ${alert.type === 'error' ? 'ring-red-300' : 
                    alert.type === 'warning' ? 'ring-amber-300' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <TypeIcon size={18} className={
                      alert.type === 'error' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-amber-500' :
                      alert.type === 'success' ? 'text-green-500' :
                      'text-blue-500'
                    } />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">{alert.title}</span>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CatIcon size={12} className={catConfig.color} />
                        <span>{formatTime(alert.timestamp)}</span>
                        {alert.projectName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{alert.projectName}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {alert.actionUrl && (
                          <button
                            onClick={() => {
                              markAsRead(alert.id)
                              navigate(alert.actionUrl!)
                            }}
                            className="px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50"
                          >
                            {alert.actionLabel || 'Voir'}
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1 hover:bg-white/50 rounded"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {showAll ? <EyeOff size={12} /> : <Eye size={12} />}
          {showAll ? 'Non lues seulement' : 'Voir toutes'}
        </button>
        <button 
          onClick={() => navigate('/parametres/notifications')}
          className="text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1"
        >
          Paramètres
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
