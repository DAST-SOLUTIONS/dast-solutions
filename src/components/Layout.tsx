import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  Ruler,
  Calculator,
  FileCheck,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Plug,
  Calendar,
  Truck,
  // Icons pour 10-19
  Users,
  Target,
  ClipboardList,
  MessageSquare,
  MapPin,
  Bell,
  Smartphone,
  Link2,
  Brain,
  // Icons pour Phase 3 (20-29)
  HardHat,
  CalendarDays,
  UserCircle,
  ShoppingCart,
  PieChart,
  HelpCircle,
  Globe,
  FileSignature,
  ClipboardCheck,
  Layers,
  // Icons pour Phase 4 IA (30-35)
  Sparkles,
  DollarSign,
  ScanLine,
  Bot,
  TrendingUp,
  Scale,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
        { id: 'projects', label: 'Projets', icon: FolderOpen, path: '/projects' },
        { id: 'multi-projets', label: 'Multi-Projets', icon: Layers, path: '/multi-projets' },
        { id: 'takeoff', label: 'Takeoff', icon: Ruler, path: '/takeoff' },
        { id: 'estimating', label: 'Estimation', icon: Calculator, path: '/estimating' },
        { id: 'soumissions', label: 'Soumissions', icon: FileCheck, path: '/soumissions' },
      ],
    },
    {
      title: 'Planification',
      items: [
        { id: 'planning', label: 'Planning / Gantt', icon: Calendar, path: '/planning' },
        { id: 'calendrier', label: 'Calendrier', icon: CalendarDays, path: '/calendrier' },
        { id: 'teams', label: 'Équipes', icon: Users, path: '/teams' },
        { id: 'field-reports', label: 'Rapports terrain', icon: ClipboardList, path: '/field-reports' },
        { id: 'inspections', label: 'Inspections Qualité', icon: ClipboardCheck, path: '/inspections' },
        { id: 'geolocation', label: 'Géolocalisation', icon: MapPin, path: '/geolocation' },
      ],
    },
    {
      title: 'Affaires',
      items: [
        { id: 'crm', label: 'CRM', icon: Target, path: '/crm' },
        { id: 'portail-client', label: 'Portail Client', icon: UserCircle, path: '/portail-client' },
        { id: 'invoicing', label: 'Facturation', icon: FileText, path: '/invoicing' },
        { id: 'contrats', label: 'Contrats & Avenants', icon: FileSignature, path: '/contrats' },
        { id: 'bons-commande', label: 'Bons de Commande', icon: ShoppingCart, path: '/bons-commande' },
        { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/fournisseurs' },
      ],
    },
    {
      title: 'Appels d\'offres',
      items: [
        { id: 'seao', label: 'SEAO Québec', icon: Globe, path: '/seao' },
        { id: 'rfi', label: 'RFI / Questions', icon: HelpCircle, path: '/rfi' },
        { id: 'comparaison', label: 'Comparaison Soumissions', icon: Scale, path: '/comparaison-soumissions' },
      ],
    },
    {
      title: 'Intelligence Artificielle',
      items: [
        { id: 'ai-takeoff', label: 'AI Takeoff Auto', icon: Sparkles, path: '/ai-takeoff', badge: 'IA' },
        { id: 'ai-estimation', label: 'AI Estimation', icon: DollarSign, path: '/ai-estimation', badge: 'IA' },
        { id: 'ocr-documents', label: 'OCR Documents', icon: ScanLine, path: '/ocr-documents' },
        { id: 'assistant-ia', label: 'Assistant IA', icon: Bot, path: '/assistant-ia', badge: 'IA' },
        { id: 'prediction-couts', label: 'Prédiction Coûts', icon: TrendingUp, path: '/prediction-couts' },
        { id: 'ai-recognition', label: 'IA Reconnaissance', icon: Brain, path: '/ai-recognition' },
      ],
    },
    {
      title: 'Québec',
      items: [
        { id: 'ccq', label: 'CCQ Taux Horaires', icon: HardHat, path: '/ccq' },
        { id: 'dashboard-bi', label: 'Dashboard BI', icon: PieChart, path: '/dashboard-bi' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { id: 'messaging', label: 'Messagerie', icon: MessageSquare, path: '/messaging' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
      ],
    },
    {
      title: 'Outils',
      items: [
        { id: 'reports', label: 'Centre Rapports', icon: BarChart3, path: '/reports' },
        { id: 'takeoff-sync', label: 'Takeoff → Soumission', icon: Link2, path: '/takeoff-sync' },
        { id: 'integrations', label: 'Intégrations', icon: Plug, path: '/integrations' },
      ],
    },
    {
      title: 'Système',
      items: [
        { id: 'pwa', label: 'App Mobile', icon: Smartphone, path: '/pwa' },
        { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-gray-200 transition-all duration-300
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="font-bold text-gray-900">DAST Solutions</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'Utilisateur'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                >
                  <LogOut size={12} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;
