/**
 * DAST Solutions - Sidebar UNIFIÉE
 * Navigation cohérente - un seul chemin vers chaque fonctionnalité
 * Inspiré d'Autodesk Construction Cloud
 */
import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FolderKanban, ChevronDown, ChevronRight,
  Pencil, Calculator, ClipboardList, FileText, Receipt, Users,
  Building2, BookOpen, Scale, Landmark, Package, LogOut,
  FolderOpen, Ruler, Briefcase,
  // Icons Gestion (ACC Style)
  Home, Layers, FileSearch, AlertCircle, Camera, Settings,
  MessageSquare, Send, Calendar, Wrench, BarChart3, UserCog,
  DollarSign, TrendingUp, PiggyBank, FileCheck, FormInput,
  FileSpreadsheet, Video, Mail, HardHat, Box, Truck
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
  estimation: ['draft', 'planning'],
  gestion: ['active', 'on_hold'],
  termine: ['completed'],
  annule: ['cancelled']
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  
  // États des menus déroulants
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    projets: true,
    gestionProjet: true,
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
      const projectId = match[1] || match[2] || match[3]
      const project = projects.find(p => p.id === projectId)
      setActiveProject(project || null)
    } else {
      setActiveProject(null)
    }
  }, [location.pathname, projects])

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
    `flex items-center gap-3 px-3 py-2 ml-3 rounded-lg text-sm transition ${
      isActive ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
    }`

  const gestionLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-1.5 ml-6 rounded-lg text-xs transition ${
      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
    }`

  // Vérifier si on est dans un contexte de projet actif (gestion)
  const isInGestionContext = activeProject && PROJECT_PHASES.gestion.includes(activeProject.status)

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40">
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

      {/* Navigation */}
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

        {/* ============ PROJET ACTIF EN GESTION ============ */}
        {isInGestionContext && activeProject && (
          <div className="pt-2 mt-2 border-t">
            <button
              onClick={() => toggleMenu('gestionProjet')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg"
            >
              <span className="flex items-center gap-2 truncate">
                <Wrench size={18} />
                <span className="truncate">{activeProject.name}</span>
              </span>
              {expandedMenus.gestionProjet ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedMenus.gestionProjet && (
              <div className="mt-1 space-y-0.5 bg-gray-50 rounded-lg p-1.5">
                {/* Accueil */}
                <NavLink 
                  to={`/project/${activeProject.id}`} 
                  end
                  className={({ isActive }) => gestionLinkClass(isActive)}
                >
                  <Home size={14} />
                  Accueil
                </NavLink>

                {/* === FINANCES === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Finances
                </p>
                <NavLink to={`/project/${activeProject.id}/budget`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <PiggyBank size={14} />
                  Budget
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/couts`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <DollarSign size={14} />
                  Coûts
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/change-orders`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileCheck size={14} />
                  Ordres de chg.
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/previsions`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <TrendingUp size={14} />
                  Prévisions
                </NavLink>

                {/* === DOCUMENTS === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Documents
                </p>
                <NavLink to={`/takeoff/${activeProject.id}`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Ruler size={14} />
                  Takeoff
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/plans`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Layers size={14} />
                  Plans
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/specifications`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileSpreadsheet size={14} />
                  Devis techniques
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/documents`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileSearch size={14} />
                  Documents
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/photos`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Camera size={14} />
                  Photos
                </NavLink>

                {/* === SUIVI === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Suivi
                </p>
                <NavLink to={`/project/${activeProject.id}/echeancier`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Calendar size={14} />
                  Échéancier
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/journal`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FormInput size={14} />
                  Journal chantier
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/problemes`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <AlertCircle size={14} />
                  Problèmes
                </NavLink>

                {/* === COMMUNICATION === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Communication
                </p>
                <NavLink to={`/project/${activeProject.id}/rfi`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <MessageSquare size={14} />
                  RFIs
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/soumissions-st`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Send size={14} />
                  Soum. sous-traitants
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/correspondance`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Mail size={14} />
                  Correspondance
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/reunions`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Video size={14} />
                  Réunions
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/formulaires`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileText size={14} />
                  Formulaires
                </NavLink>

                {/* === RESSOURCES === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Ressources
                </p>
                <NavLink to={`/project/${activeProject.id}/equipe`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <HardHat size={14} />
                  Équipe
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/equipements`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Truck size={14} />
                  Équipements
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/materiaux`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Box size={14} />
                  Matériaux
                </NavLink>

                {/* === RAPPORTS === */}
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Rapports
                </p>
                <NavLink to={`/project/${activeProject.id}/rapports`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <BarChart3 size={14} />
                  Rapports
                </NavLink>
                <NavLink to={`/project/${activeProject.id}/parametres`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Settings size={14} />
                  Paramètres
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
                Toutes les soumissions
              </NavLink>
              <NavLink to="/soumissions/nouveau" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Nouvelle soumission
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
