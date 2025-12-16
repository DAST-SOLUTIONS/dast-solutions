import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Home, LogOut, Settings as SettingsIcon, Moon, Sun, Bell, X, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

// =====================================================
// COMPOSANT NOTIFICATIONS INTÉGRÉ
// =====================================================
interface Notification {
  id: string
  type: string
  title: string
  message?: string
  priority: string
  read_at?: string
  created_at: string
}

function NotificationsDropdown() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read_at).length)
      }
    } catch (err) {
      console.error('Erreur notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

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

  // Marquer comme lu
  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read_at: new Date().toISOString() } : n
    ))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Rejeter notification
  const dismiss = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)
    
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)

    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  // Format temps relatif
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

  // Icône selon le type
  const getIcon = (type: string) => {
    switch (type) {
      case 'soumission_expire': return '📋'
      case 'facture_echeance': return '💰'
      case 'facture_retard': return '⚠️'
      case 'rbq_expire': return '🏗️'
      case 'ccq_certification_expire': return '👷'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-teal-600 hover:text-teal-700"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read_at ? 'bg-teal-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{getIcon(notification.type)}</span>
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
                          className="p-1 text-gray-400 hover:text-gray-600"
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
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
// =====================================================

export default function AppHeader() {
  const navigate = useNavigate()
  const { userProfile, signOut } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const link = "px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition text-sm"
  const submenuLink = "block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm"

  return (
    <header className="bg-gradient-to-r from-teal-600 to-orange-400 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        
        {/* TOP ROW - Logo + Navigation */}
        <div className="flex items-center gap-6 mb-2">
          {/* Logo */}
          <button onClick={() => navigate("/dashboard")} className="text-left leading-tight hover:opacity-80 transition">
            <div className="text-xl font-extrabold">DASTCC</div>
            <div className="text-xs opacity-80 -mt-0.5">Central Cloud</div>
          </button>

          {/* MAIN NAVIGATION */}
          <nav className="flex items-center gap-1 flex-wrap">
            
            {/* DASHBOARD */}
            <NavLink to="/dashboard" className={link}>
              <Home className="inline -mt-1 mr-2" size={16} /> Dashboard
            </NavLink>

            {/* PROJETS - DROPDOWN */}
            <div className="relative group">
              <button className={link}>
                📁 Projets ▼
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2">
                <button onClick={() => navigate("/dashboard")} className={submenuLink}>
                  📋 Tous les projets
                </button>
                <div className="border-t my-2"></div>
                <div className="px-4 py-1 text-xs font-bold text-gray-600 uppercase tracking-wide">Gestion</div>
                <button onClick={() => navigate("/projets/conception")} className={submenuLink}>
                  🎨 Conception
                </button>
                <button onClick={() => navigate("/projets/estimation")} className={submenuLink}>
                  💰 Estimation
                </button>
                <button onClick={() => navigate("/projets/gestion")} className={submenuLink}>
                  📊 Gestion
                </button>
                <button onClick={() => navigate("/projets/appels-offres")} className={submenuLink}>
                  📢 Appels d'offres
                </button>
                {/* ============================================== */}
                {/* NOUVEAU LIEN - FACTURES                       */}
                {/* ============================================== */}
                <div className="border-t my-2"></div>
                <button onClick={() => navigate("/factures")} className={submenuLink}>
                  💵 Factures
                </button>
                {/* ============================================== */}
              </div>
            </div>

            {/* ENTREPRENEURS - DROPDOWN */}
            <div className="relative group">
              <button className={link}>
                👷 Entrepreneurs ▼
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2">
                <button onClick={() => navigate("/entrepreneurs/rbq")} className={submenuLink}>
                  🏛️ Bottin RBQ
                </button>
                <button onClick={() => navigate("/entrepreneurs/personnel")} className={submenuLink}>
                  📇 Bottin personnels
                </button>
              </div>
            </div>

            {/* APPELS D'OFFRE - DROPDOWN */}
            <div className="relative group">
              <button className={link}>
                📢 Appels d'offre ▼
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2">
                <button onClick={() => navigate("/appels-offre/seao")} className={submenuLink}>
                  🔗 SEAO
                </button>
                <button onClick={() => navigate("/appels-offre/merx")} className={submenuLink}>
                  📈 MERX
                </button>
                <button onClick={() => navigate("/appels-offre/buy-gc")} className={submenuLink}>
                  🏗️ Buy GC
                </button>
                <button onClick={() => navigate("/appels-offre/bonfire")} className={submenuLink}>
                  🔥 Bonfire
                </button>
              </div>
            </div>

            {/* RESSOURCES - DROPDOWN */}
            <div className="relative group">
              <button className={link}>
                📚 Ressources ▼
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2">
                <button onClick={() => navigate("/ressources/code-navigator")} className={submenuLink}>
                  📖 Code Navigator
                </button>
                <button onClick={() => navigate("/ressources/ccq-navigator")} className={submenuLink}>
                  ⚖️ CCQ Navigator
                </button>
                <button onClick={() => navigate("/ressources/documents-acc-ccdc")} className={submenuLink}>
                  📄 Contrats ACC/CCDC
                </button>
                <button onClick={() => navigate("/ressources/associations")} className={submenuLink}>
                  🤝 Associations
                </button>
              </div>
            </div>

            {/* OUTILS AVANCÉS - DROPDOWN */}
            <div className="relative group">
              <button className={link}>
                ⚙️ Outils avancés ▼
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2">
                <button onClick={() => navigate("/outils-avances/application-mobile")} className={submenuLink}>
                  📱 App terrain mobile
                </button>
                <button onClick={() => navigate("/outils-avances/messagerie")} className={submenuLink}>
                  💬 Messagerie d'équipe
                </button>
                <button onClick={() => navigate("/outils-avances/geolocalisation")} className={submenuLink}>
                  🗺️ Géolocalisation
                </button>
                {/* ============================================== */}
                {/* NOUVEAU LIEN - RAPPORTS TERRAIN               */}
                {/* ============================================== */}
                <div className="border-t my-2"></div>
                <button onClick={() => navigate("/terrain")} className={submenuLink}>
                  📋 Rapports terrain
                </button>
                {/* ============================================== */}
              </div>
            </div>
          </nav>

          {/* RIGHT SIDE - Notifications + Dark Mode + User Menu */}
          <div className="ml-auto flex items-center gap-3">
            
            {/* ============================================== */}
            {/* NOUVEAU - BOUTON NOTIFICATIONS                */}
            {/* ============================================== */}
            <NotificationsDropdown />
            {/* ============================================== */}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title="Mode sombre"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Menu */}
            {userProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center font-bold text-xs">
                    {userProfile.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold leading-none">{userProfile.fullName}</div>
                    <div className="text-xs opacity-90">{userProfile.email}</div>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white text-gray-800 shadow-xl p-1 z-50">
                    <button
                      onClick={() => {
                        navigate("/settings")
                        setShowUserMenu(false)
                      }}
                      className={submenuLink}
                    >
                      <SettingsIcon size={16} className="inline mr-2" /> Paramètres
                    </button>
                    <div className="border-t my-2"></div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setShowUserMenu(false)
                      }}
                      className={`${submenuLink} text-red-600 hover:bg-red-50`}
                    >
                      <LogOut size={16} className="inline mr-2" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
