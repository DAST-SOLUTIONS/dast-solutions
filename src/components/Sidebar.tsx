/**
 * DAST Solutions - Sidebar COMPLÈTE
 * Navigation avec TOUTES les fonctionnalités incluant les nouvelles améliorations
 * Version: 12 janvier 2026
 */
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FolderKanban, ChevronDown, ChevronRight,
  Pencil, Calculator, ClipboardList, FileText, Receipt, Users,
  Building2, BookOpen, Scale, Landmark, Package, LogOut,
  FolderOpen, Briefcase, Database, BarChart3, Settings,
  Cloud, Upload, MessageSquare, MapPin, FileSpreadsheet,
  Send, Calendar, Video, Mail, HardHat, Box, Truck,
  FileCheck, Smartphone, Cpu, Layers, Bell, AlertTriangle,
  Download, Plug, Key, Globe, TrendingUp,
  PieChart, Target, DollarSign, Wallet, CreditCard,
  FileInput, FileOutput, GitCompare, Flag,
  CalendarDays, UserCheck, Factory, ShoppingCart,
  ClipboardCheck, Shield, Wrench, Zap, GanttChartSquare
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

const PROJECT_PHASES = {
  estimation: ['draft', 'planning'],
  gestion: ['active', 'on_hold'],
  termine: ['completed'],
  annule: ['cancelled']
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    projets: true,
    gestionProjet: true,
    soumissions: false,
    finances: false,
    rapportsAnalytics: false,
    planification: false,
    ressources: false,
    appelsOffre: false,
    entrepreneurs: false,
    fournisseurs: false,
    integrations: false,
    outilsAvances: false,
    basesDonnees: false
  })

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

  useEffect(() => {
    const match = location.pathname.match(/\/project\/([^/]+)|\/takeoff\/([^/]+)|\/estimation\/([^/]+)/)
    if (match) {
      const projectId = match[1] || match[2] || match[3]
      const project = projects.find(p => p.id === projectId)
      setActiveProject(project || null)
    } else {
      setActiveProject(null)
    }
  }, [location.pathname, projects])

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  const projetEstimation = projects.filter(p => PROJECT_PHASES.estimation.includes(p.status))
  const projetGestion = projects.filter(p => PROJECT_PHASES.gestion.includes(p.status))

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
        <NavLink to="/dashboard" className={({ isActive }) => linkClass(isActive)}>
          <LayoutDashboard size={18} />
          Tableau de bord
        </NavLink>

        {/* Alertes */}
        <NavLink to="/alertes" className={({ isActive }) => linkClass(isActive)}>
          <Bell size={18} />
          Alertes
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
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg"
            >
              <span className="flex items-center gap-2 truncate">
                <Building2 size={16} />
                <span className="truncate">{activeProject.name}</span>
              </span>
              {expandedMenus.gestionProjet ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {expandedMenus.gestionProjet && (
              <div className="mt-1 space-y-0.5">
                <NavLink to={`/project/${activeProject.id}`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <LayoutDashboard size={14} />
                  Dashboard projet
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/budget`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <DollarSign size={14} />
                  Budget
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/change-orders`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileText size={14} />
                  Avenants
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/rfi`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <MessageSquare size={14} />
                  RFI
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/submittals`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Send size={14} />
                  Submittals
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/reunions`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Video size={14} />
                  Réunions
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/journal`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <FileSpreadsheet size={14} />
                  Journal
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/inspections`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <ClipboardCheck size={14} />
                  Inspections
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/punch-list`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Target size={14} />
                  Punch List
                </NavLink>
                <NavLink to={`/gestion/${activeProject.id}/payments`} className={({ isActive }) => gestionLinkClass(isActive)}>
                  <Receipt size={14} />
                  Paiements
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
                <FileText size={16} />
                Toutes les soumissions
              </NavLink>
              <NavLink to="/soumissions/templates" className={({ isActive }) => subLinkClass(isActive)}>
                <Layers size={16} />
                Templates
              </NavLink>
              <NavLink to="/soumissions/analytics" className={({ isActive }) => subLinkClass(isActive)}>
                <PieChart size={16} />
                Analytique
              </NavLink>
              <NavLink to="/soumission-builder" className={({ isActive }) => subLinkClass(isActive)}>
                <Pencil size={16} />
                Créer soumission
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ PLANIFICATION ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('planification')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <CalendarDays size={18} />
              Planification
            </span>
            {expandedMenus.planification ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.planification && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/planning" className={({ isActive }) => subLinkClass(isActive)}>
                <GanttChartSquare size={16} />
                Gantt / Planning
              </NavLink>
              <NavLink to="/calendrier" className={({ isActive }) => subLinkClass(isActive)}>
                <Calendar size={16} />
                Calendrier
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ RAPPORTS & ANALYTICS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('rapportsAnalytics')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <BarChart3 size={18} />
              Rapports
            </span>
            {expandedMenus.rapportsAnalytics ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.rapportsAnalytics && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/rapports" className={({ isActive }) => subLinkClass(isActive)}>
                <BarChart3 size={16} />
                Centre de rapports
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => subLinkClass(isActive)}>
                <TrendingUp size={16} />
                Analytique
              </NavLink>
              <NavLink to="/bi" className={({ isActive }) => subLinkClass(isActive)}>
                <PieChart size={16} />
                Business Intelligence
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ FINANCES ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('finances')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Wallet size={18} />
              Finances
            </span>
            {expandedMenus.finances ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.finances && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/factures" className={({ isActive }) => subLinkClass(isActive)}>
                <Receipt size={16} />
                Factures
              </NavLink>
              <NavLink to="/achats/bons-commande" className={({ isActive }) => subLinkClass(isActive)}>
                <ShoppingCart size={16} />
                Bons de commande
              </NavLink>
              <NavLink to="/paie/ccq" className={({ isActive }) => subLinkClass(isActive)}>
                <CreditCard size={16} />
                Paie CCQ
              </NavLink>
              <NavLink to="/paie/standard" className={({ isActive }) => subLinkClass(isActive)}>
                <DollarSign size={16} />
                Paie Standard
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ ENTREPRENEURS & PERSONNEL ============ */}
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
              <NavLink to="/bottin" className={({ isActive }) => subLinkClass(isActive)}>
                <Users size={16} />
                Bottin ressources
              </NavLink>
              <NavLink to="/entrepreneurs/rbq" className={({ isActive }) => subLinkClass(isActive)}>
                <Shield size={16} />
                Vérification RBQ
              </NavLink>
              <NavLink to="/entrepreneurs/personnel" className={({ isActive }) => subLinkClass(isActive)}>
                <HardHat size={16} />
                Personnel CCQ
              </NavLink>
              <NavLink to="/entrepreneurs/equipes" className={({ isActive }) => subLinkClass(isActive)}>
                <UserCheck size={16} />
                Équipes de travail
              </NavLink>
              <NavLink to="/clients" className={({ isActive }) => subLinkClass(isActive)}>
                <Building2 size={16} />
                Clients
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ FOURNISSEURS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('fournisseurs')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Factory size={18} />
              Fournisseurs
            </span>
            {expandedMenus.fournisseurs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.fournisseurs && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/fournisseurs" className={({ isActive }) => subLinkClass(isActive)}>
                <Factory size={16} />
                Tous les fournisseurs
              </NavLink>
              <NavLink to="/fournisseurs/sous-traitants" className={({ isActive }) => subLinkClass(isActive)}>
                <Wrench size={16} />
                Sous-traitants
              </NavLink>
              <NavLink to="/fournisseurs/materiaux" className={({ isActive }) => subLinkClass(isActive)}>
                <Package size={16} />
                Matériaux
              </NavLink>
              <NavLink to="/fournisseurs/equipements" className={({ isActive }) => subLinkClass(isActive)}>
                <Truck size={16} />
                Équipements
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
              <NavLink to="/appels-offres" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Mes appels
              </NavLink>
              <NavLink to="/appels-offre/seao" className={({ isActive }) => subLinkClass(isActive)}>
                <Landmark size={16} />
                SEAO
              </NavLink>
              <NavLink to="/appels-offre/merx" className={({ isActive }) => subLinkClass(isActive)}>
                <Globe size={16} />
                MERX
              </NavLink>
              <NavLink to="/appels-offre/bonfire" className={({ isActive }) => subLinkClass(isActive)}>
                <Zap size={16} />
                Bonfire
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ BASES DE DONNÉES ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('basesDonnees')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Database size={18} />
              Bases de données
            </span>
            {expandedMenus.basesDonnees ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.basesDonnees && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/database" className={({ isActive }) => subLinkClass(isActive)}>
                <Database size={16} />
                Coûts (ProEst)
              </NavLink>
              <NavLink to="/materials" className={({ isActive }) => subLinkClass(isActive)}>
                <Package size={16} />
                Matériaux
              </NavLink>
              <NavLink to="/materiaux-prix" className={({ isActive }) => subLinkClass(isActive)}>
                <Receipt size={16} />
                Prix Québec
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
              <NavLink to="/ressources/code-navigator" className={({ isActive }) => subLinkClass(isActive)}>
                <Scale size={16} />
                Code Navigator
              </NavLink>
              <NavLink to="/ressources/ccq-navigator" className={({ isActive }) => subLinkClass(isActive)}>
                <Landmark size={16} />
                CCQ Navigator
              </NavLink>
              <NavLink to="/ressources/documents-acc-ccdc" className={({ isActive }) => subLinkClass(isActive)}>
                <FileText size={16} />
                Contrats ACC/CCDC
              </NavLink>
              <NavLink to="/ressources/associations" className={({ isActive }) => subLinkClass(isActive)}>
                <Users size={16} />
                Associations
              </NavLink>
              <NavLink to="/plans/comparator" className={({ isActive }) => subLinkClass(isActive)}>
                <GitCompare size={16} />
                Comparateur plans
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ INTÉGRATIONS & API ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('integrations')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Plug size={18} />
              Intégrations
            </span>
            {expandedMenus.integrations ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.integrations && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/integrations/quebec" className={({ isActive }) => subLinkClass(isActive)}>
                <Building2 size={16} />
                <span className="flex-1">Dashboard Québec</span>
                <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">Nouveau</span>
              </NavLink>
              <NavLink to="/integrations" className={({ isActive }) => subLinkClass(isActive)}>
                <Plug size={16} />
                Toutes les intégrations
              </NavLink>
              <NavLink to="/ccq" className={({ isActive }) => subLinkClass(isActive)}>
                <HardHat size={16} />
                CCQ - Taux horaires
              </NavLink>
              <NavLink to="/entrepreneurs/rbq" className={({ isActive }) => subLinkClass(isActive)}>
                <Shield size={16} />
                RBQ - Licences
              </NavLink>
              <NavLink to="/paie/ccq" className={({ isActive }) => subLinkClass(isActive)}>
                <Wallet size={16} />
                Paie CCQ
              </NavLink>
              <NavLink to="/paie/standard" className={({ isActive }) => subLinkClass(isActive)}>
                <DollarSign size={16} />
                Paie Standard
              </NavLink>
              <NavLink to="/api" className={({ isActive }) => subLinkClass(isActive)}>
                <Key size={16} />
                Clés API
              </NavLink>
            </div>
          )}
        </div>

        {/* ============ OUTILS AVANCÉS ============ */}
        <div className="pt-2">
          <button
            onClick={() => toggleMenu('outilsAvances')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Cpu size={18} />
              Outils avancés
            </span>
            {expandedMenus.outilsAvances ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedMenus.outilsAvances && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/import-export" className={({ isActive }) => subLinkClass(isActive)}>
                <FileInput size={16} />
                Import / Export
              </NavLink>
              <NavLink to="/rapports-terrain" className={({ isActive }) => subLinkClass(isActive)}>
                <FileSpreadsheet size={16} />
                Rapports terrain
              </NavLink>
              <NavLink to="/storage" className={({ isActive }) => subLinkClass(isActive)}>
                <Cloud size={16} />
                Stockage cloud
              </NavLink>
              <NavLink to="/sst" className={({ isActive }) => subLinkClass(isActive)}>
                <Shield size={16} />
                SST - Sécurité
              </NavLink>
              <NavLink to="/outils-avances/messagerie" className={({ isActive }) => subLinkClass(isActive)}>
                <MessageSquare size={16} />
                Messagerie
              </NavLink>
              <NavLink to="/outils-avances/geolocalisation" className={({ isActive }) => subLinkClass(isActive)}>
                <MapPin size={16} />
                Géolocalisation
              </NavLink>
              <NavLink to="/outils-avances/application-mobile" className={({ isActive }) => subLinkClass(isActive)}>
                <Smartphone size={16} />
                Application mobile
              </NavLink>
            </div>
          )}
        </div>

        {/* Paramètres */}
        <NavLink to="/parametres" className={({ isActive }) => linkClass(isActive)}>
          <Settings size={18} />
          Paramètres
        </NavLink>
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
