/**
 * DAST Solutions - AppHeader COMPLET
 * Pleine largeur, icônes Lucide (sans emojis), chevrons élégants
 * MISE À JOUR: Ajout AI Takeoff, Takeoff Avancé, Estimation Avancée
 */
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { 
  Home, LogOut, Settings as SettingsIcon, Moon, Sun, Bell, X, BarChart3,
  FolderOpen, Users, Megaphone, BookOpen, Wrench, ChevronDown,
  Palette, Calculator, ClipboardList, Receipt,
  Building2, Contact,
  Link, TrendingUp, Flame, ShoppingCart,
  BookMarked, Scale, FileCheck, Users2,
  Smartphone, MessageSquare, MapPin, ClipboardCheck,
  Package, DollarSign,
  // NOUVEAUX IMPORTS POUR AI TAKEOFF
  Brain, Ruler, Sparkles
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useTheme } from "@/contexts/ThemeContext"

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
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const dismiss = async (id: string) => {
    await supabase.from('notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `${minutes} min`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
    return `${Math.floor(minutes / 1440)}j`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-lg hover:bg-white/10 transition" title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => {}} className="text-xs text-teal-600">Tout lire</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${!n.read_at ? 'bg-teal-50/50' : ''}`} onClick={() => markAsRead(n.id)}>
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm ${!n.read_at ? 'font-semibold' : ''} text-gray-900`}>{n.title}</p>
                        <button onClick={(e) => { e.stopPropagation(); dismiss(n.id) }} className="p-1 text-gray-400 hover:text-gray-600">
                          <X size={14} />
                        </button>
                      </div>
                      {n.message && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.read_at && <div className="w-2 h-2 bg-teal-500 rounded-full mt-2" />}
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
// BADGE NEW COMPONENT
// =====================================================
function NewBadge() {
  return (
    <span className="ml-auto px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full animate-pulse">
      NEW
    </span>
  )
}

// =====================================================
// HEADER PRINCIPAL
// =====================================================
export default function AppHeader() {
  const navigate = useNavigate()
  const { userProfile, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const menuBtn = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition text-sm font-medium"
  const submenuLink = "flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700 text-sm rounded-md transition"

  return (
    <header className="bg-gradient-to-r from-teal-600 to-orange-400 text-white sticky top-0 z-50 shadow-lg">
      {/* PLEINE LARGEUR */}
      <div className="w-full px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/dashboard")} className="text-left leading-tight hover:opacity-80 transition flex-shrink-0">
            <div className="text-xl font-extrabold tracking-tight">DASTCC</div>
            <div className="text-xs opacity-80 -mt-0.5">Central Cloud</div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1 flex-1">
            <NavLink to="/dashboard" className={menuBtn}>
              <Home size={16} /> Dashboard
            </NavLink>

            {/* PROJETS */}
            <div className="relative group">
              <button className={menuBtn}>
                <FolderOpen size={16} /> Projets <ChevronDown size={14} className="opacity-60 ml-0.5" />
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2 z-50">
                <button onClick={() => navigate("/dashboard")} className={submenuLink}>
                  <ClipboardList size={16} className="text-teal-600" /> Tous les projets
                </button>
                <div className="border-t my-1.5"></div>
                <button onClick={() => navigate("/projets/conception")} className={submenuLink}>
                  <Palette size={16} className="text-purple-500" /> Conception
                </button>
                <button onClick={() => navigate("/projets/estimation")} className={submenuLink}>
                  <Calculator size={16} className="text-blue-500" /> Estimation
                </button>
                <button onClick={() => navigate("/projets/gestion")} className={submenuLink}>
                  <ClipboardCheck size={16} className="text-green-500" /> Gestion
                </button>
                <button onClick={() => navigate("/projets/appels-offres")} className={submenuLink}>
                  <Megaphone size={16} className="text-orange-500" /> Appels d'offres
                </button>
                
                {/* ============================================ */}
                {/* NOUVEAUX LIENS - AI TAKEOFF & ESTIMATION */}
                {/* ============================================ */}
                <div className="border-t my-1.5"></div>
                <div className="px-2 py-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> Outils AI
                  </span>
                </div>
                <button onClick={() => navigate("/ai-takeoff")} className={submenuLink}>
                  <Brain size={16} className="text-purple-600" /> AI Takeoff
                  <NewBadge />
                </button>
                <button onClick={() => navigate("/takeoff-advanced")} className={submenuLink}>
                  <Ruler size={16} className="text-indigo-600" /> Takeoff Avancé
                  <NewBadge />
                </button>
                <button onClick={() => navigate("/estimation-advanced")} className={submenuLink}>
                  <DollarSign size={16} className="text-emerald-600" /> Estimation Avancée
                  <NewBadge />
                </button>
                
                <div className="border-t my-1.5"></div>
                <button onClick={() => navigate("/factures")} className={submenuLink}>
                  <Receipt size={16} className="text-emerald-600" /> Factures
                </button>
              </div>
            </div>

            {/* ENTREPRENEURS */}
            <div className="relative group">
              <button className={menuBtn}>
                <Users size={16} /> Entrepreneurs <ChevronDown size={14} className="opacity-60 ml-0.5" />
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-52 rounded-lg bg-white text-gray-800 shadow-xl p-2 z-50">
                <button onClick={() => navigate("/entrepreneurs/rbq")} className={submenuLink}>
                  <Building2 size={16} className="text-blue-600" /> Bottin RBQ
                </button>
                <button onClick={() => navigate("/entrepreneurs/personnel")} className={submenuLink}>
                  <Contact size={16} className="text-teal-600" /> Bottin personnels
                </button>
                <div className="border-t my-1.5"></div>
                <button onClick={() => navigate("/clients")} className={submenuLink}>
                  <Users size={16} className="text-purple-600" /> Clients CRM
                </button>
              </div>
            </div>

            {/* APPELS D'OFFRE */}
            <div className="relative group">
              <button className={menuBtn}>
                <Megaphone size={16} /> Appels d'offre <ChevronDown size={14} className="opacity-60 ml-0.5" />
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-52 rounded-lg bg-white text-gray-800 shadow-xl p-2 z-50">
                <button onClick={() => navigate("/appels-offre/seao")} className={submenuLink}>
                  <Link size={16} className="text-blue-600" /> SEAO
                </button>
                <button onClick={() => navigate("/appels-offre/merx")} className={submenuLink}>
                  <TrendingUp size={16} className="text-green-600" /> MERX
                </button>
                <button onClick={() => navigate("/appels-offre/buy-gc")} className={submenuLink}>
                  <ShoppingCart size={16} className="text-purple-600" /> Buy GC
                </button>
                <button onClick={() => navigate("/appels-offre/bonfire")} className={submenuLink}>
                  <Flame size={16} className="text-orange-500" /> Bonfire
                </button>
              </div>
            </div>

            {/* RESSOURCES */}
            <div className="relative group">
              <button className={menuBtn}>
                <BookOpen size={16} /> Ressources <ChevronDown size={14} className="opacity-60 ml-0.5" />
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2 z-50">
                <button onClick={() => navigate("/ressources/code-navigator")} className={submenuLink}>
                  <BookMarked size={16} className="text-indigo-600" /> Code Navigator
                </button>
                <button onClick={() => navigate("/ressources/ccq-navigator")} className={submenuLink}>
                  <Scale size={16} className="text-amber-600" /> CCQ Navigator
                </button>
                <button onClick={() => navigate("/ressources/documents-acc-ccdc")} className={submenuLink}>
                  <FileCheck size={16} className="text-teal-600" /> Contrats ACC/CCDC
                </button>
                <button onClick={() => navigate("/ressources/associations")} className={submenuLink}>
                  <Users2 size={16} className="text-rose-500" /> Associations
                </button>
                <div className="border-t my-1.5"></div>
                <button onClick={() => navigate("/materiaux")} className={submenuLink}>
                  <Package size={16} className="text-gray-600" /> Prix matériaux
                </button>
              </div>
            </div>

            {/* OUTILS AVANCÉS */}
            <div className="relative group">
              <button className={menuBtn}>
                <Wrench size={16} /> Outils avancés <ChevronDown size={14} className="opacity-60 ml-0.5" />
              </button>
              <div className="hidden group-hover:block absolute left-0 mt-0 w-56 rounded-lg bg-white text-gray-800 shadow-xl p-2 z-50">
                <button onClick={() => navigate("/outils-avances/application-mobile")} className={submenuLink}>
                  <Smartphone size={16} className="text-blue-500" /> App terrain mobile
                </button>
                <button onClick={() => navigate("/outils-avances/messagerie")} className={submenuLink}>
                  <MessageSquare size={16} className="text-green-500" /> Messagerie d'équipe
                </button>
                <button onClick={() => navigate("/outils-avances/geolocalisation")} className={submenuLink}>
                  <MapPin size={16} className="text-red-500" /> Géolocalisation
                </button>
                <div className="border-t my-1.5"></div>
                <button onClick={() => navigate("/terrain")} className={submenuLink}>
                  <ClipboardCheck size={16} className="text-amber-600" /> Rapports terrain
                </button>
                <button onClick={() => navigate("/analytics")} className={submenuLink}>
                  <BarChart3 size={16} className="text-purple-600" /> Analytics
                </button>
              </div>
            </div>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Analytics quick link */}
            <button onClick={() => navigate("/analytics")} className="p-2 rounded-lg hover:bg-white/10 transition" title="Analytics">
              <BarChart3 size={18} />
            </button>

            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* Dark Mode */}
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 transition" title="Mode sombre">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Menu */}
            {userProfile && (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition">
                  <div className="w-8 h-8 rounded-full bg-white/20 grid place-items-center font-bold text-sm">
                    {userProfile.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-semibold leading-tight">{userProfile.fullName}</div>
                    <div className="text-xs opacity-80">{userProfile.email}</div>
                  </div>
                  <ChevronDown size={14} className="opacity-60 hidden lg:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white text-gray-800 shadow-xl p-1.5 z-50">
                    <button onClick={() => { navigate("/settings"); setShowUserMenu(false) }} className={submenuLink}>
                      <SettingsIcon size={16} /> Paramètres
                    </button>
                    <div className="border-t my-1"></div>
                    <button onClick={() => { handleSignOut(); setShowUserMenu(false) }} className={`${submenuLink} text-red-600 hover:bg-red-50`}>
                      <LogOut size={16} /> Déconnexion
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
