/**
 * DAST Solutions - Layout Principal
 * Navigation restructurée selon flux de travail construction
 * 
 * Structure:
 * - Logo entreprise + nom (du profil)
 * - Projets (Conception, Estimation, Gestion, etc.)
 * - Appels d'offre (SEAO, MERX, etc.)
 * - Répertoires (Entrepreneurs, Clients, Équipes)
 * - RH & Paie
 * - Ressources
 * - Stockage Business
 * - Analytics
 * - Paramètres (admin)
 */
import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'
import {
  LayoutDashboard, FolderKanban, Users, FileText, DollarSign,
  BarChart3, ClipboardList, LogOut, Menu, X, Building2, 
  ChevronDown, ChevronRight, Bell, User, Settings,
  Calculator, ClipboardCheck, Megaphone, Receipt,
  Contact, Link as LinkIcon, TrendingUp, Flame, ShoppingCart,
  BookOpen, BookMarked, Scale, FileCheck, Users2, Package,
  Wrench, Smartphone, MessageSquare, MapPin, Database,
  FileSpreadsheet, Cloud, PlusCircle, Moon, Sun, Send,
  FileSignature, Globe, Shield, HardHat, Activity, PieChart,
  Ruler, Box, HardDrive, Briefcase, PenTool, Layers,
  UserCog, CreditCard, Wallet, FolderOpen, Search, Star,
  Hammer, Truck, Eye, GitBranch, AlertTriangle, GraduationCap,
  Building, Heart, Coins, BadgeDollarSign, CircleDollarSign
} from 'lucide-react'

// Types
interface NavItem {
  name: string
  href?: string
  icon: any
  children?: NavItem[]
  badge?: string
  adminOnly?: boolean
}

// Structure de navigation restructurée
const NAVIGATION: NavItem[] = [
  // DASHBOARD
  {
    name: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard
  },

  // PROJETS - Section principale
  {
    name: 'Projets',
    icon: FolderKanban,
    children: [
      { name: 'Tous les projets', href: '/projects', icon: ClipboardList },
      { name: 'Nouveau projet', href: '/projects/new', icon: PlusCircle },
      // Conception
      { name: '── Conception ──', href: '#', icon: PenTool },
      { name: 'Documents conception', href: '/conception', icon: FileText },
      { name: 'Revue & Coordination', href: '/conception?tab=coordination', icon: GitBranch },
      // Estimation
      { name: '── Estimation ──', href: '#', icon: Calculator },
      { name: 'Takeoff avancé', href: '/takeoff-advanced', icon: Ruler },
      { name: 'Base de coûts', href: '/cost-database', icon: Database },
      { name: 'Soumissions', href: '/soumissions', icon: FileText },
      { name: 'Comparatifs prix', href: '/estimation/comparatifs', icon: Scale },
      // Appels d'offres
      { name: '── Appels d\'offres ──', href: '#', icon: Megaphone },
      { name: 'Projets en soumission', href: '/projets/appels-offres', icon: Send },
      // Gestion
      { name: '── Gestion ──', href: '#', icon: ClipboardCheck },
      { name: 'Projets en cours', href: '/projets/gestion', icon: Hammer },
      { name: 'Contrats', href: '/contrats', icon: FileSignature },
      { name: 'Achats & Commandes', href: '/achats', icon: ShoppingCart },
      { name: 'SST Chantier', href: '/sst', icon: Shield },
      // Stockage
      { name: '── Stockage ──', href: '#', icon: HardDrive },
      { name: 'Documents projets', href: '/storage', icon: FolderOpen },
    ]
  },

  // APPELS D'OFFRE
  {
    name: 'Appels d\'offre',
    icon: Megaphone,
    children: [
      { name: '── SEAO ──', href: '#', icon: Globe },
      { name: 'Recherche SEAO', href: '/seao', icon: Search },
      { name: 'Mes favoris SEAO', href: '/seao?tab=favoris', icon: Star },
      { name: 'Mes soumissions SEAO', href: '/seao?tab=soumissions', icon: Send },
      { name: '── Autres plateformes ──', href: '#', icon: LinkIcon },
      { name: 'MERX', href: '/appels-offre/merx', icon: TrendingUp },
      { name: 'BuyGC', href: '/appels-offre/buy-gc', icon: ShoppingCart },
      { name: 'Bonfire', href: '/appels-offre/bonfire', icon: Flame },
    ]
  },

  // RÉPERTOIRES
  {
    name: 'Répertoires',
    icon: Users,
    children: [
      { name: 'Entrepreneurs RBQ', href: '/entrepreneurs/rbq', icon: Building2, badge: 'RBQ' },
      { name: 'Équipes de travail', href: '/entrepreneurs/equipes', icon: Users2 },
      { name: 'Clients CRM', href: '/clients', icon: Contact },
      { name: 'Fournisseurs', href: '/fournisseurs', icon: Truck },
    ]
  },

  // RH & PAIE
  {
    name: 'RH & Paie',
    icon: UserCog,
    children: [
      { name: '── Ressources humaines ──', href: '#', icon: Users },
      { name: 'Employés (non-CCQ)', href: '/rh/employes', icon: User },
      { name: 'Dossiers employés', href: '/rh/dossiers', icon: FolderOpen },
      { name: '── Paie ──', href: '#', icon: Wallet },
      { name: 'Paie Standard', href: '/paie/standard', icon: CreditCard },
      { name: 'Paie CCQ', href: '/paie/ccq', icon: BadgeDollarSign, badge: 'CCQ' },
    ]
  },

  // RESSOURCES
  {
    name: 'Ressources',
    icon: BookOpen,
    children: [
      { name: 'Codes Navigator', href: '/ressources/codes', icon: BookMarked },
      { name: 'CCQ Navigator', href: '/ressources/ccq', icon: Scale },
      { name: 'Contrats ACC/CCDC', href: '/ressources/contrats-types', icon: FileCheck },
      { name: 'Associations', href: '/ressources/associations', icon: Users2 },
      { name: 'Matériaux & Prix', href: '/ressources/materiaux', icon: Package },
    ]
  },

  // STOCKAGE BUSINESS
  {
    name: 'Stockage Business',
    href: '/storage/business',
    icon: Building
  },

  // ANALYTICS
  {
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { name: 'Dashboard BI', href: '/bi', icon: PieChart },
      { name: 'Rapports', href: '/rapports', icon: FileSpreadsheet },
      { name: 'KPIs', href: '/bi?tab=kpis', icon: Activity },
    ]
  },

  // SST GLOBAL (récapitulatif)
  {
    name: 'SST',
    icon: Shield,
    children: [
      { name: 'Tableau de bord SST', href: '/sst', icon: Activity },
      { name: 'Incidents', href: '/sst?tab=incidents', icon: AlertTriangle },
      { name: 'Inspections', href: '/sst?tab=inspections', icon: ClipboardCheck },
      { name: 'Formations', href: '/sst?tab=formations', icon: GraduationCap },
    ]
  },

  // PARAMÈTRES
  {
    name: 'Paramètres',
    icon: Settings,
    children: [
      { name: 'Mon profil', href: '/parametres/profil', icon: User },
      { name: 'Profil entreprise', href: '/parametres/entreprise', icon: Building2, adminOnly: true },
      { name: 'Utilisateurs', href: '/parametres/utilisateurs', icon: Users, adminOnly: true },
      { name: 'Abonnements', href: '/parametres/abonnements', icon: CreditCard, adminOnly: true },
      { name: 'Intégrations', href: '/parametres/integrations', icon: LinkIcon },
      { name: 'Notifications', href: '/parametres/notifications', icon: Bell },
    ]
  },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Projets'])
  const [user, setUser] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState(true) // TODO: real admin check

  useEffect(() => {
    loadUserAndCompany()
  }, [])

  const loadUserAndCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Charger le profil entreprise
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setCompanyProfile(profile)

      // Vérifier si admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      setIsAdmin(userRole?.role === 'admin' || userRole?.role === 'owner')
    }
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(m => m !== menuName)
        : [...prev, menuName]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isActive = (href?: string) => {
    if (!href || href === '#') return false
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    // Skip admin-only items if not admin
    if (item.adminOnly && !isAdmin) return null

    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedMenus.includes(item.name)
    const active = isActive(item.href)

    // Separator items
    if (item.name.startsWith('──')) {
      return (
        <div key={item.name} className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
          {item.name.replace(/──/g, '').trim()}
        </div>
      )
    }

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition ${
              isExpanded ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className={isExpanded ? 'text-teal-600' : ''} />
              <span className="font-medium">{item.name}</span>
            </div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        to={item.href || '#'}
        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition ${
          active
            ? 'bg-teal-50 text-teal-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon size={16} className={active ? 'text-teal-600' : 'text-gray-400'} />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <span className="px-1.5 py-0.5 text-xs bg-teal-100 text-teal-700 rounded">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white border-r transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-16'}
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Company Header */}
        <div className="p-4 border-b">
          {sidebarOpen ? (
            <div className="space-y-3">
              {/* Logo et nom entreprise */}
              <div className="flex items-center gap-3">
                {companyProfile?.logo_url ? (
                  <img 
                    src={companyProfile.logo_url} 
                    alt="Logo" 
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {companyProfile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">
                    {companyProfile?.name || 'Mon Entreprise'}
                  </h2>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              {/* Powered by DAST */}
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg">
                <img 
                  src="/dast-logo.png" 
                  alt="DAST" 
                  className="w-5 h-5 rounded"
                />
                <span className="text-xs text-gray-500">Powered by DAST CC</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src="/dast-logo.png" 
                alt="DAST" 
                className="w-8 h-8 rounded"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" style={{ height: 'calc(100vh - 200px)' }}>
          {sidebarOpen ? (
            NAVIGATION.map(item => renderNavItem(item))
          ) : (
            // Collapsed mode - icons only
            NAVIGATION.filter(item => !item.name.startsWith('──')).map(item => (
              <Link
                key={item.name}
                to={item.href || (item.children?.[0]?.href) || '#'}
                className={`flex items-center justify-center p-3 rounded-lg transition ${
                  isActive(item.href) ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title={item.name}
              >
                <item.icon size={20} />
              </Link>
            ))
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-2">
          {sidebarOpen && (
            <>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {darkMode ? 'Mode clair' : 'Mode sombre'}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </>
          )}
          
          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu size={20} />
              </button>
              
              {/* Breadcrumb / Page title */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {getBreadcrumbTitle(location.pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-teal-600" />
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// Helper function to get page title from path
function getBreadcrumbTitle(pathname: string): string {
  const routes: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/projects': 'Projets',
    '/projects/new': 'Nouveau projet',
    '/conception': 'Conception',
    '/takeoff-advanced': 'Takeoff avancé',
    '/cost-database': 'Base de coûts',
    '/soumissions': 'Soumissions',
    '/estimation': 'Estimation',
    '/contrats': 'Contrats',
    '/achats': 'Achats & Commandes',
    '/sst': 'Santé & Sécurité',
    '/seao': 'SEAO Québec',
    '/entrepreneurs/rbq': 'Bottin RBQ',
    '/entrepreneurs/equipes': 'Équipes de travail',
    '/clients': 'Clients CRM',
    '/fournisseurs': 'Fournisseurs',
    '/rh/employes': 'Employés',
    '/paie/standard': 'Paie Standard',
    '/paie/ccq': 'Paie CCQ',
    '/ressources/codes': 'Codes Navigator',
    '/ressources/ccq': 'CCQ Navigator',
    '/ressources/materiaux': 'Matériaux & Prix',
    '/storage/business': 'Stockage Business',
    '/storage': 'Documents Projets',
    '/bi': 'Analytics & BI',
    '/parametres/profil': 'Mon profil',
    '/parametres/entreprise': 'Profil entreprise',
    '/parametres/abonnements': 'Abonnements',
  }

  // Check exact match
  if (routes[pathname]) return routes[pathname]

  // Check partial match
  for (const [path, title] of Object.entries(routes)) {
    if (pathname.startsWith(path)) return title
  }

  return 'DAST Solutions'
}
