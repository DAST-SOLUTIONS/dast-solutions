import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Home, LogOut, Settings as SettingsIcon, Moon, Sun } from "lucide-react"
import { useState } from "react"

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
              </div>
            </div>
          </nav>

          {/* RIGHT SIDE - Dark Mode + User Menu */}
          <div className="ml-auto flex items-center gap-3">
            
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