/**
 * DAST Solutions - Sidebar COMPLÈTE
 * Avec projets filtrés par phase et menu Gestion enrichi (style ACC)
 */
import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FolderKanban, ChevronDown, ChevronRight,
  Pencil, Calculator, ClipboardList, FileText, Receipt, Users,
  Building2, BookOpen, Scale, Landmark, Package, LogOut,
  FolderOpen, Ruler, FileSpreadsheet, Briefcase, Settings,
  // Nouveaux icônes pour Gestion (style ACC)
  Home, Layers, FileSearch, AlertCircle, FormInput, Camera,
  MessageSquare, Send, Calendar, Wrench, BarChart3, UserCog,
  Link2, DollarSign, TrendingUp, PiggyBank, FileCheck,
  Clock, FolderCog, Users2, ChevronUp
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  client_name?: string
}

interface SidebarProps {
  user: any
  onLogout: () => void
}

// Phases des projets
const PROJECT_PHASES = {
  estimation: ['draft', 'planning'], // En conception/estimation
  gestion: ['active', 'on_hold'],    // En exécution
  termine: ['completed'],
  annule: ['cancelled']
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  
  // États des menus déroulants
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    projets: true,
    gestion: false,
    soumissions: false,
    ressources: false,
    appelsOffre: false,
    entrepreneurs: false
  })

  // Charger les projets
  useEffect(() => {
    const loadProjects = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data } = await supabase
        .from('projects')
        .select('id, name, status, client_name')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false })

      setProjects(data || [])
    }

    loadProjects()

    // Écouter les changements
    const channel = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, loadProjects)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Détecter le projet actif depuis l'URL
  useEffect(() => {
    const match = location.pathname.match(/\/project\/([^/]+)|\/takeoff\/([^/]+)|\/gestion\/([^/]+)/)
    if (match) {
      setActiveProjectId(match[1] || match[2] || match[3])
    }
  }, [location.pathname])

  // Toggle menu
  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  // Projets par phase
  const projetEstimation = projects.filter(p => PROJECT_PHASES.estimation.includes(p.status))
  const projetGestion = projects.filter(p => PROJECT_PHASES.gestion.includes(p.status))

  // Style liens
  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
      isActive ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
    }`

  const subLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 ml-4 rounded-lg text-sm transition ${
      isActive ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
    }`

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <Building2 className="text-white" size={22} />
          </div>
          <div>
            <span className="font-bold text-gray-900">DAST</span>
            <p className="text-xs text-gray-500">Solutions</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Tableau de bord */}
        <NavLink to="/" className={({ isActive }) => linkClass(isActive)}>
          <LayoutDashboard size={18} />
          Tableau de bord
        </NavLink>

        {/* ============ PROJETS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('projets')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <FolderKanban size={18} />
              Projets
            </span>
            {expandedMenus.projets ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.projets && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/projects" className={({ isActive }) => subLinkClass(isActive)}>
                <FolderOpen size={16} />
                Tous les projets
                <span className="ml-auto text-xs bg-gray-100 px-1.5 py-0.5 rounded">{projects.length}</span>
              </NavLink>

              <NavLink to="/projets/conception" className={({ isActive }) => subLinkClass(isActive)}>
                <Pencil size={16} />
                Conception
              </NavLink>

              <NavLink to="/projets/estimation" className={({ isActive }) => subLinkClass(isActive)}>
                <Calculator size={16} />
                Estimation
                {projetEstimation.length > 0 && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {projetEstimation.length}
                  </span>
                )}
              </NavLink>

              <NavLink to="/projets/gestion" className={({ isActive }) => subLinkClass(isActive)}>
                <ClipboardList size={16} />
                Gestion
                {projetGestion.length > 0 && (
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {projetGestion.length}
                  </span>
                )}
              </NavLink>

              <NavLink to="/appels-offres" className={({ isActive }) => subLinkClass(isActive)}>
                <Briefcase size={16} />
                Appels d'offres
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ GESTION PROJET ACTIF (Style ACC) ============ */}
        {activeProjectId && projetGestion.some(p => p.id === activeProjectId) && (
          <div className="pt-2 border-t mt-2">
            <button
              onClick={() => toggleMenu('gestionActive')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <Wrench size={18} />
                Gestion Projet
              </span>
              {expandedMenus.gestionActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedMenus.gestionActive !== false && (
              <div className="mt-1 space-y-0.5 bg-gray-50 rounded-lg p-2">
                {/* Home */}
                <NavLink 
                  to={`/gestion/${activeProjectId}`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Home size={16} />
                  Accueil
                </NavLink>

                {/* Budget & Coûts */}
                <div className="pt-1 pb-1">
                  <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Finances</p>
                </div>
                <NavLink 
                  to={`/gestion/${activeProjectId}/budget`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <PiggyBank size={16} />
                  Budget
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/couts`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <DollarSign size={16} />
                  Coûts
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/change-orders`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <FileCheck size={16} />
                  Ordres de chg.
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/previsions`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <TrendingUp size={16} />
                  Prévisions
                </NavLink>

                {/* Documents & Suivi */}
                <div className="pt-2 pb-1">
                  <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Suivi</p>
                </div>
                <NavLink 
                  to={`/gestion/${activeProjectId}/plans`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Layers size={16} />
                  Plans
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/documents`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <FileSearch size={16} />
                  Documents
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/echeancier`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Calendar size={16} />
                  Échéancier
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/photos`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Camera size={16} />
                  Photos
                </NavLink>

                {/* Communication */}
                <div className="pt-2 pb-1">
                  <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Communication</p>
                </div>
                <NavLink 
                  to={`/gestion/${activeProjectId}/problemes`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <AlertCircle size={16} />
                  Problèmes
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/rfi`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <MessageSquare size={16} />
                  RFIs
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/soumissions-fournisseurs`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Send size={16} />
                  Soum. fournisseurs
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/journal`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <FormInput size={16} />
                  Journal chantier
                </NavLink>

                {/* Rapports */}
                <div className="pt-2 pb-1">
                  <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Rapports</p>
                </div>
                <NavLink 
                  to={`/gestion/${activeProjectId}/rapports`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <BarChart3 size={16} />
                  Rapports
                </NavLink>
                <NavLink 
                  to={`/gestion/${activeProjectId}/equipe`} 
                  className={({ isActive }) => subLinkClass(isActive)}
                >
                  <Users2 size={16} />
                  Équipe
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* ============ SOUMISSIONS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('soumissions')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <FileText size={18} />
              Soumissions
            </span>
            {expandedMenus.soumissions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.soumissions && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/soumissions" className={({ isActive }) => subLinkClass(isActive)}>
                <FileSpreadsheet size={16} />
                Toutes
              </NavLink>
              <NavLink to="/soumissions/nouveau" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Nouvelle
              </NavLink>
            </div>
          )}
        </div>

        {/* Factures */}
        <NavLink to="/factures" className={({ isActive }) => linkClass(isActive)}>
          <Receipt size={18} />
          Factures
        </NavLink>

        {/* ============ ENTREPRENEURS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('entrepreneurs')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Users size={18} />
              Entrepreneurs
            </span>
            {expandedMenus.entrepreneurs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.entrepreneurs && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/entrepreneurs" className={({ isActive }) => subLinkClass(isActive)}>
                <Users size={16} />
                Bottin
              </NavLink>
              <NavLink to="/entrepreneurs/qualification" className={({ isActive }) => subLinkClass(isActive)}>
                <FileCheck size={16} />
                Qualification
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ APPELS D'OFFRE ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('appelsOffre')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Briefcase size={18} />
              Appels d'offre
            </span>
            {expandedMenus.appelsOffre ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.appelsOffre && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/appels-offre" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Mes appels
              </NavLink>
              <NavLink to="/appels-offre/seao" className={({ isActive }) => subLinkClass(isActive)}>
                <Landmark size={16} />
                SEAO
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ RESSOURCES ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('ressources')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={18} />
              Ressources
            </span>
            {expandedMenus.ressources ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.ressources && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/code-navigator" className={({ isActive }) => subLinkClass(isActive)}>
                <Scale size={16} />
                Code Navigator
              </NavLink>
              <NavLink to="/ccq-navigator" className={({ isActive }) => subLinkClass(isActive)}>
                <Landmark size={16} />
                CCQ Navigator
              </NavLink>
              <NavLink to="/contrats-acc-ccdc" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Contrats ACC/CCDC
              </NavLink>
              <NavLink to="/associations" className={({ isActive }) => subLinkClass(isActive)}>
                <Users size={16} />
                Associations
              </NavLink>
              <NavLink to="/materiaux-prix" className={({ isActive }) => subLinkClass(isActive)}>
                <Package size={16} />
                Matériaux & Prix
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Utilisateur */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-teal-700 font-medium text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Déconnexion"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
