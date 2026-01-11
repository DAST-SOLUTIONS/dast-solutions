/**
 * DAST Solutions - Composant Notification Bell
 * Badge + Popup pour la barre de navigation
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle,
  Clock, DollarSign, FileText, Shield, Building2, Settings,
  X, ChevronRight, Check
} from 'lucide-react'

interface NotificationAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  category: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  actionUrl?: string
  triggeredAt: string
  projectName?: string
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  budget: DollarSign,
  deadline: Clock,
  soumission: FileText,
  payment: DollarSign,
  project: Building2,
  safety: Shield,
  document: FileText,
  system: Settings,
}

const TYPE_COLORS = {
  error: 'text-red-600 bg-red-100',
  warning: 'text-amber-600 bg-amber-100',
  info: 'text-blue-600 bg-blue-100',
  success: 'text-green-600 bg-green-100',
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => !a.read && a.priority === 'critical').length

  useEffect(() => {
    loadAlerts()
    
    // Écouter les nouvelles alertes en temps réel
    const channel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'alerts' }, 
        (payload) => {
          const newAlert = payload.new as any
          setAlerts(prev => [{
            id: newAlert.id,
            type: newAlert.type,
            category: newAlert.category,
            title: newAlert.title,
            message: newAlert.message,
            priority: newAlert.priority || 'medium',
            read: newAlert.read,
            actionUrl: newAlert.action_url,
            triggeredAt: newAlert.created_at,
            projectName: newAlert.project_name
          }, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    // Fermer le dropdown si on clique ailleurs
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setAlerts(data.map(a => ({
          id: a.id,
          type: a.type,
          category: a.category,
          title: a.title,
          message: a.message,
          priority: a.priority || 'medium',
          read: a.read,
          actionUrl: a.action_url,
          triggeredAt: a.created_at,
          projectName: a.project_name
        })))
      } else {
        // Données de démo si pas d'alertes
        setAlerts(generateDemoAlerts())
      }
    } catch (err) {
      console.error('Erreur chargement alertes:', err)
      setAlerts(generateDemoAlerts())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoAlerts = (): NotificationAlert[] => {
    const now = new Date()
    return [
      {
        id: 'd1',
        type: 'error',
        category: 'budget',
        title: 'Dépassement budget',
        message: 'Centre Sportif: budget dépassé de 15,000$',
        priority: 'critical',
        read: false,
        actionUrl: '/project/1/budget',
        triggeredAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        projectName: 'Centre Sportif'
      },
      {
        id: 'd2',
        type: 'warning',
        category: 'soumission',
        title: 'Échéance dans 2 jours',
        message: 'Soumission S-2025-042',
        priority: 'high',
        read: false,
        actionUrl: '/soumission/42',
        triggeredAt: new Date(now.getTime() - 2 * 3600000).toISOString()
      },
      {
        id: 'd3',
        type: 'warning',
        category: 'payment',
        title: 'Paiement en retard',
        message: 'Facture F-2025-018: 45,000$',
        priority: 'high',
        read: false,
        actionUrl: '/factures',
        triggeredAt: new Date(now.getTime() - 5 * 3600000).toISOString()
      }
    ]
  }

  const markAsRead = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !alertId.startsWith('d')) {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const dismissAlert = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    setAlerts(alerts.filter(a => a.id !== alertId))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user && !alertId.startsWith('d')) {
      await supabase
        .from('alerts')
        .update({ dismissed: true })
        .eq('id', alertId)
        .eq('user_id', user.id)
    }
  }

  const handleAlertClick = (alert: NotificationAlert) => {
    if (alert.actionUrl) {
      setIsOpen(false)
      navigate(alert.actionUrl)
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
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days === 1) return 'Hier'
    return `${days}j`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={22} className={criticalCount > 0 ? 'text-red-600' : 'text-gray-600'} />
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold rounded-full ${
            criticalCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-500 text-white'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    setAlerts(alerts.map(a => ({ ...a, read: true })))
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                      await supabase
                        .from('alerts')
                        .update({ read: true })
                        .eq('user_id', user.id)
                        .eq('read', false)
                    }
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Critical Alert Banner */}
          {criticalCount > 0 && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-700 font-medium">
                {criticalCount} alerte{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Alerts List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              alerts.slice(0, 10).map(alert => {
                const Icon = CATEGORY_ICONS[alert.category] || Info
                const typeColor = TYPE_COLORS[alert.type] || TYPE_COLORS.info
                
                return (
                  <div 
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                      !alert.read ? 'bg-teal-50/30' : ''
                    } ${
                      alert.priority === 'critical' ? 'border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${typeColor}`}>
                        <Icon size={14} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!alert.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {alert.title}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTimeAgo(alert.triggeredAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {alert.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!alert.read && (
                          <button
                            onClick={(e) => markAsRead(alert.id, e)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400"
                            title="Marquer lu"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => dismissAlert(alert.id, e)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400"
                          title="Supprimer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/alertes')
              }}
              className="w-full py-2 text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center justify-center gap-1"
            >
              Voir toutes les notifications
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
