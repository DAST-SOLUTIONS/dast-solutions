import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function AppHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { projectId } = useParams()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu)
  }

  // Détecter si on a un projectId dans l'URL
  const currentProjectId = projectId || location.pathname.match(/\/project\/([^\/]+)/)?.[1]

  const menuItems = [
    {
      label: 'Projets',
      items: [
        { label: 'Conception', path: '/projets/conception' },
        { 
          label: 'Estimation', 
          path: currentProjectId ? `/projets/${currentProjectId}/estimation` : '/dashboard',
          requiresProject: true
        },
        { label: 'Gestion', path: '/projets/gestion' }
      ]
    },
    {
      label: 'Entrepreneurs',
      items: [
        { label: 'Vérification RBQ', path: '/entrepreneurs/rbq' },
        { label: 'Gestion du personnel', path: '/entrepreneurs/personnel' }
      ]
    },
    {
      label: 'Appels d\'offre',
      items: [
        { label: 'SEAO', path: '/appels-offre/seao' },
        { label: 'MERX', path: '/appels-offre/merx' },
        { label: 'Buy GC', path: '/appels-offre/buy-gc' },
        { label: 'Bonfire', path: '/appels-offre/bonfire' }
      ]
    },
    {
      label: 'Ressources',
      items: [
        { label: 'Code Navigator', path: '/ressources/code-navigator' },
        { label: 'CCQ Navigator', path: '/ressources/ccq-navigator' },
        { label: 'Documents ACC/CCDC', path: '/ressources/documents-acc-ccdc' },
        { label: 'Associations', path: '/ressources/associations' }
      ]
    },
    {
      label: 'Outils avancés',
      items: [
        { label: 'Application mobile terrain', path: '/outils-avances/application-mobile' },
        { label: 'Messagerie équipe', path: '/outils-avances/messagerie' },
        { label: 'Géolocalisation', path: '/outils-avances/geolocalisation' }
      ]
    }
  ]

  return (
    <header className="bg-gradient-to-r from-teal-600 to-orange-500 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-teal-600">D</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              DASTCC Central Cloud
            </span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition"
            >
              Tableau de bord
            </Link>

            {menuItems.map((menu) => (
              <div key={menu.label} className="relative">
                <button
                  onClick={() => toggleDropdown(menu.label)}
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition flex items-center gap-1"
                >
                  {menu.label}
                  <ChevronDown size={16} />
                </button>

                {openDropdown === menu.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl py-2 z-50">
                    {menu.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => {
                          if (item.requiresProject && !currentProjectId) {
                            alert('Veuillez d\'abord sélectionner un projet depuis le tableau de bord')
                          }
                          setOpenDropdown(null)
                        }}
                        className="block px-4 py-2 text-gray-700 hover:bg-teal-50 transition"
                      >
                        {item.label}
                        {item.requiresProject && !currentProjectId && (
                          <span className="ml-2 text-xs text-orange-500">⚠️ Projet requis</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <span className="text-white text-sm hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/20">
            <Link
              to="/dashboard"
              className="block px-4 py-2 text-white hover:bg-white/10 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tableau de bord
            </Link>

            {menuItems.map((menu) => (
              <div key={menu.label} className="mt-2">
                <div className="px-4 py-2 text-white font-semibold">{menu.label}</div>
                {menu.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => {
                      if (item.requiresProject && !currentProjectId) {
                        alert('Veuillez d\'abord sélectionner un projet depuis le tableau de bord')
                      }
                      setMobileMenuOpen(false)
                    }}
                    className="block px-8 py-2 text-white/90 hover:bg-white/10 rounded-lg text-sm"
                  >
                    {item.label}
                    {item.requiresProject && !currentProjectId && (
                      <span className="ml-2 text-xs text-orange-300">⚠️</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fermer dropdown si on clique ailleurs */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </header>
  )
}
