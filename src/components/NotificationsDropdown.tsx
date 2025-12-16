/**
 * DAST Solutions - Composant Notifications
 * Dropdown avec liste des notifications
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, Check, CheckCheck, X, Settings,
  FileText, Receipt, AlertTriangle, Award, 
  User, MessageCircle, Info
} from 'lucide-react'
import { useNotifications, NOTIFICATION_ICONS, NOTIFICATION_COLORS } from '@/hooks/useNotifications'

const TYPE_ICONS: Record<string, any> = {
  soumission_expire: FileText,
  facture_echeance: Receipt,
  facture_retard: AlertTriangle,
  rbq_expire: Award,
  ccq_certification_expire: User,
  rappel_projet: FileText,
  nouveau_message: MessageCircle,
  systeme: Info
}

export function NotificationsDropdown() {
  const navigate = useNavigate()
  const { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead, 
    markAllAsRead, 
    dismiss,
    generateReminders 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Générer les rappels au chargement
  useEffect(() => {
    generateReminders()
  }, [])

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id)
    
    // Navigation selon le type
    if (notification.reference_type && notification.reference_id) {
      switch (notification.reference_type) {
        case 'soumission':
          navigate('/soumissions')
          break
        case 'facture':
          navigate('/factures')
          break
        case 'entrepreneur':
          navigate('/entrepreneurs/rbq')
          break
        case 'projet':
          navigate(`/projects/${notification.reference_id}`)
          break
      }
    }
    
    setIsOpen(false)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-CA')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Tout lire
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/settings')
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notification => {
                const Icon = TYPE_ICONS[notification.type] || Info
                const priorityColor = NOTIFICATION_COLORS[notification.priority]
                
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read_at ? 'bg-teal-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icône */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${priorityColor}20` }}
                      >
                        <Icon size={20} style={{ color: priorityColor }} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${!notification.read_at ? 'font-semibold' : ''} text-gray-900`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              dismiss(notification.id)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {notification.message && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Indicateur non lu */}
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t text-center">
              <button
                onClick={() => {
                  setIsOpen(false)
                  navigate('/notifications')
                }}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsDropdown
