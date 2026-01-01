/**
 * DAST Solutions - Sidebar Navigation
 * Mise à jour avec les modules Phases 1-4
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Calculator,
  Users,
  Building2,
  FileSearch,
  Briefcase,
  BookOpen,
  Wrench,
  Settings,
  ChevronDown,
  ChevronRight,
  Brain,
  Ruler,
  FileSpreadsheet,
  PenTool,
  Package,
  UserCircle,
  Truck,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// STRUCTURE DU MENU AVEC MODULES PHASES 1-4
// ============================================================================
export const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    title: 'Projets',
    icon: FolderKanban,
    submenu: [
      { title: 'Liste des projets', path: '/projects' },
      { title: 'Conception', path: '/projets/conception' },
      { title: 'Estimation', path: '/projets/estimation' },
      { title: 'Gestion', path: '/projets/gestion' },
      { title: 'Appels d\'offres', path: '/projets/appels-offres' },
    ]
  },
  {
    title: 'Soumissions',
    icon: FileText,
    path: '/soumissions'
  },
  {
    title: 'Appels d\'offres V2',
    icon: Briefcase,
    path: '/appels-offres',
    isNew: true
  },
  {
    title: 'Bottin Ressources',
    icon: UserCircle,
    path: '/bottin',
    isNew: true
  },
  {
    title: 'Matériaux & Prix',
    icon: Package,
    path: '/materiaux',
    isNew: true
  },
  {
    title: 'Entrepreneurs',
    icon: Building2,
    submenu: [
      { title: 'RBQ', path: '/entrepreneurs/rbq' },
      { title: 'Personnel CCQ', path: '/entrepreneurs/personnel' },
    ]
  },
  {
    title: 'Clients',
    icon: Users,
    path: '/clients'
  },
  {
    title: 'Plateformes AO',
    icon: FileSearch,
    submenu: [
      { title: 'SEAO', path: '/appels-offre/seao' },
      { title: 'MERX', path: '/appels-offre/merx' },
      { title: 'Buy & Gc', path: '/appels-offre/buy-gc' },
      { title: 'Bonfire', path: '/appels-offre/bonfire' },
    ]
  },
  {
    title: 'Ressources',
    icon: BookOpen,
    submenu: [
      { title: 'Code Navigator', path: '/ressources/code-navigator' },
      { title: 'CCQ Navigator', path: '/ressources/ccq-navigator' },
      { title: 'Documents ACC/CCDC', path: '/ressources/documents-acc-ccdc' },
      { title: 'Associations', path: '/ressources/associations' },
    ]
  },
  {
    title: 'Outils Avancés',
    icon: Wrench,
    submenu: [
      { title: 'Application Mobile', path: '/outils-avances/application-mobile' },
      { title: 'Messagerie', path: '/outils-avances/messagerie' },
      { title: 'Géolocalisation', path: '/outils-avances/geolocalisation' },
      { title: 'Rapports Terrain', path: '/rapports-terrain' },
      { title: 'Cloud Storage', path: '/cloud-storage' },
      { title: 'Import Données', path: '/import-data' },
    ]
  },
  {
    title: 'Analytics',
    icon: Calculator,
    path: '/analytics'
  },
  {
    title: 'Paramètres',
    icon: Settings,
    path: '/settings'
  }
];

// ============================================================================
// COMPOSANT MENU ITEM
// ============================================================================
interface SubMenuItem {
  title: string;
  path: string;
  isNew?: boolean;
}

interface MenuItemType {
  title: string;
  icon: any;
  path?: string;
  submenu?: SubMenuItem[];
  isNew?: boolean;
}

interface MenuItemProps {
  item: MenuItemType;
  collapsed?: boolean;
}

export function MenuItem({ item, collapsed }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = 'submenu' in item && item.submenu;
  const Icon = item.icon;

  if (hasSubmenu) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Icon size={20} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </>
          )}
        </button>
        
        {!collapsed && isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {item.submenu?.map((subItem) => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {subItem.title}
                {subItem.isNew && (
                  <span className="px-1.5 py-0.5 text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded">
                    NEW
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      }
    >
      <Icon size={20} />
      {!collapsed && (
        <span className="flex-1 text-sm font-medium flex items-center gap-2">
          {item.title}
          {item.isNew && (
            <span className="px-1.5 py-0.5 text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded">
              NEW
            </span>
          )}
        </span>
      )}
    </NavLink>
  );
}

// ============================================================================
// COMPOSANT SIDEBAR COMPLET
// ============================================================================
interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => (
        <MenuItem key={item.title} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}
