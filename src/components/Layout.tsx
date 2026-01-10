/**
 * DAST Solutions - Layout Principal COMPLET
 * Sidebar avec tous les menus et sous-menus
 * CORRIGÉ: Positionnement du profil utilisateur en bas
 */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FolderKanban, Users, FileText, DollarSign,
  BarChart3, ClipboardList, LogOut, Menu, X, Building2, 
  ChevronDown, ChevronRight, Bell, User, Settings,
  Palette, Calculator, ClipboardCheck, Megaphone, Receipt,
  Contact, Link as LinkIcon, TrendingUp, Flame, ShoppingCart,
  BookOpen, BookMarked, Scale, FileCheck, Users2, Package,
  Wrench, Smartphone, MessageSquare, MapPin, Database,
  FileSpreadsheet, Cloud, Import, PlusCircle, Moon, Sun, Send,
  FileSignature, Globe
} from 'lucide-react'

interface NavItem {
  name: string
  href?: string
  icon: any
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  
  // PROJETS
  {
    name: 'Projets',
    icon: FolderKanban,
    children: [
      { name: 'Tous les projets', href: '/projects', icon: ClipboardList },
      { name: 'Conception', href: '/projets/conception', icon: Palette },
      { name: 'Estimation', href: '/projets/estimation', icon: Calculator },
      { name: 'Gestion', href: '/projets/gestion', icon: ClipboardCheck },
      { name: 'Appels d\'offres', href: '/projets/appels-offres', icon: Megaphone },
      { name: 'Factures', href: '/factures', icon: Receipt },
    ]
  },

  // ENTREPRENEURS
  {
    name: 'Entrepreneurs',
    icon: Users,
    children: [
      { name: 'Bottin RBQ', href: '/entrepreneurs/rbq', icon: Building2 },
      { name: 'Bottin personnels', href: '/entrepreneurs/personnel', icon: Contact },
      { name: 'Clients CRM', href: '/clients', icon: Users },
    ]
  },

  // APPELS D'OFFRE
  {
    name: 'Appels d\'offre',
    icon: Megaphone,
    children: [
      { name: 'SEAO', href: '/appels-offre/seao', icon: LinkIcon },
      { name: 'MERX', href: '/appels-offre/merx', icon: TrendingUp },
      { name: 'Buy GC', href: '/appels-offre/buy-gc', icon: ShoppingCart },
      { name: 'Bonfire', href: '/appels-offre/bonfire', icon: Flame },
    ]
  },

  // SOUMISSIONS
  {
    name: 'Soumissions',
    icon: FileText,
    children: [
      { name: 'Appels d\'offres', href: '/soumissions', icon: Send },
      { name: 'Toutes les soumissions', href: '/soumissions/list', icon: FileText },
      { name: 'Nouvelle soumission', href: '/soumission/new', icon: PlusCircle },
    ]
  },
  // ACHATS
  {
    name: 'Achats',
    icon: ShoppingCart,
    children: [
      { name: 'Bons de commande', href: '/achats', icon: FileText },
      { name: 'Réquisitions', href: '/achats?tab=requisitions', icon: ClipboardList },
      { name: 'Réceptions', href: '/achats?tab=receipts', icon: Package },
    ]
  },
  // CONTRATS
  {
    name: 'Contrats',
    icon: FileSignature,
    children: [
      { name: 'Tous les contrats', href: '/contrats', icon: FileText },
      { name: 'Contrats clients', href: '/contrats?type=client', icon: Building2 },
      { name: 'Sous-contrats', href: '/contrats?type=subcontract', icon: Users },
    ]
  },
  // SEAO
  {
    name: 'SEAO',
    icon: Globe,
    children: [
      { name: 'Appels d\'offres', href: '/seao', icon: FileText },
      { name: 'Mes favoris', href: '/seao?tab=bookmarks', icon: BookMarked },
      { name: 'Mes soumissions', href: '/seao?tab=submissions', icon: Send },
    ]
  },

  // RESSOURCES
  {
    name: 'Ressources',
    icon: BookOpen,
    children: [
      { name: 'Code Navigator', href: '/ressources/code-navigator', icon: BookMarked },
      { name: 'CCQ Navigator', href: '/ressources/ccq-navigator', icon: Scale },
      { name: 'Entreprises Québec', href: '/entreprises-quebec', icon: Building2 },
      { name: 'Contrats ACC/CCDC', href: '/ressources/documents-acc-ccdc', icon: FileCheck },
      { name: 'Associations', href: '/ressources/associations', icon: Users2 },
      { name: 'Matériaux & Prix', href: '/materials', icon: Package },
    ]
  },

  // PAIE (Phase 4)
  {
    name: 'Paie',
    icon: DollarSign,
    children: [
      { name: 'Paie Standard', href: '/paie/standard', icon: Users },
      { name: 'Paie CCQ', href: '/paie/ccq', icon: Building2 },
    ]
  },

  // OUTILS AVANCÉS
  {
    name: 'Outils avancés',
    icon: Wrench,
    children: [
      { name: 'App terrain mobile', href: '/outils-avances/application-mobile', icon: Smartphone },
      { name: 'Messagerie d\'équipe', href: '/outils-avances/messagerie', icon: MessageSquare },
      { name: 'Géolocalisation', href: '/outils-avances/geolocalisation', icon: MapPin },
      { name: 'Rapports terrain', href: '/rapports-terrain', icon: ClipboardCheck },
      { name: 'Stockage Cloud', href: '/cloud-storage', icon: Cloud },
      { name: 'Import données', href: '/import-data', icon: Import },
    ]
  },

  // ANALYTICS
  { name: 'Analytique', href: '/analytics', icon: BarChart3 },

  // PARAMÈTRES
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

// Notifications Component
function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('dismissed_at', null)
          .order('created_at', { ascending: false })
          .limit(10)
        if (data) {
          setNotifications(data)
          setCount(data.filter((n: any) => !n.read_at).length)
        }
      } catch (err) {
        console.error('Notifications error:', err)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b font-semibold text-gray-900">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto mb-2 text-gray-300" size={32} />
                Aucune notification
              </div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 ${!n.read_at ? 'bg-teal-50/50' : ''}`}>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.message && <p className="text-xs text-gray-600 mt-1">{n.message}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['Projets', 'Ressources']))
  const [userProfile, setUserProfile] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dast_dark_mode')
    return saved === 'true'
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserProfile({
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0]
        })
      }
    }
    getUser()
  }, [])

  // Dark mode toggle
  useEffect(() => {
    localStorage.setItem('dast_dark_mode', darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href)
    return item.children?.some(child => isActive(child.href)) || false
  }

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-gray-900 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xl font-bold text-white">DAST</span>
              <span className="text-xs text-gray-400 block">Solutions</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                // Menu with children
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isParentActive(item)
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {item.name}
                    </div>
                    {expandedMenus.has(item.name) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  
                  {expandedMenus.has(item.name) && (
                    <div className="mt-1 ml-4 pl-4 border-l border-gray-700 space-y-1">
                      {item.children.map(child => (
                        <Link
                          key={child.name}
                          to={child.href!}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                            ${isActive(child.href) 
                              ? 'bg-teal-600 text-white' 
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                          `}
                        >
                          <child.icon size={16} />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Simple link
                <Link
                  to={item.href!}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href) 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User info & Logout - FIXED at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900">
          {userProfile && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                <span className="text-teal-400 font-bold">
                  {userProfile.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userProfile.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="h-16 flex items-center justify-between px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>

            {/* Breadcrumb / Page title */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(n => isActive(n.href))?.name || 
                 navigation.flatMap(n => n.children || []).find(c => isActive(c.href))?.name ||
                 'DAST Solutions'}
              </h1>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="Rechercher projets, clients, documents..."
                className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Quick add */}
              <button 
                onClick={() => navigate('/project/new')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                <PlusCircle size={18} />
                Nouveau projet
              </button>

              {/* Notifications */}
              <NotificationsBell />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-teal-600" />
                  </div>
                  <ChevronDown size={16} className="hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings size={16} />
                        Paramètres
                      </Link>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        {darkMode ? 'Mode clair' : 'Mode sombre'}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
