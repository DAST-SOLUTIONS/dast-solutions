/**
 * DAST Solutions - Sidebar Navigation
 * Inclut les nouveaux liens pour AI Takeoff et Estimation Avancée
 * 
 * NOTE: Ce fichier montre les éléments de menu à ajouter.
 * Intégrez ces éléments dans votre Sidebar existant.
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
  PenTool
} from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// STRUCTURE DU MENU AVEC NOUVEAUX LIENS
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
      // ============================================
      // NOUVEAUX LIENS - AI TAKEOFF & ESTIMATION
      // ============================================
      { title: '🤖 AI Takeoff', path: '/ai-takeoff', isNew: true },
      { title: '📐 Takeoff Avancé', path: '/takeoff-advanced', isNew: true },
      { title: '💰 Estimation Avancée', path: '/estimation-advanced', isNew: true },
    ]
  },
  {
    title: 'Soumissions',
    icon: FileText,
    path: '/factures' // ou /soumissions si vous avez cette page
  },
  {
    title: 'Entrepreneurs',
    icon: Building2,
    submenu: [
      { title: 'RBQ', path: '/entrepreneurs/rbq' },
      { title: 'Personnel', path: '/entrepreneurs/personnel' },
    ]
  },
  {
    title: 'Clients',
    icon: Users,
    path: '/clients'
  },
  {
    title: 'Appels d\'offre',
    icon: Briefcase,
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
      { title: 'Prix Matériaux', path: '/materiaux' },
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
      { title: 'Analytics', path: '/analytics' },
    ]
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
interface MenuItemProps {
  item: typeof menuItems[0];
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
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
              >
                {subItem.title}
                {'isNew' in subItem && subItem.isNew && (
                  <span className="px-1.5 py-0.5 bg-teal-500 text-white text-[10px] rounded-full font-bold">
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
      to={item.path || '#'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      }
    >
      <Icon size={20} />
      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
    </NavLink>
  );
}

// ============================================================================
// COMPOSANT SIDEBAR COMPLET (EXEMPLE)
// ============================================================================
interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        {collapsed ? (
          <span className="text-2xl font-bold text-teal-600">D</span>
        ) : (
          <span className="text-xl font-bold text-teal-600">DAST Solutions</span>
        )}
      </div>

      {/* Menu */}
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}

// ============================================================================
// INSTRUCTIONS D'INTÉGRATION
// ============================================================================
/*
Pour intégrer les nouveaux liens dans votre Sidebar existant:

1. AJOUTEZ CES IMPORTS (si nécessaire):
   import { Brain, Ruler, FileSpreadsheet } from 'lucide-react';

2. AJOUTEZ CES LIENS dans votre section "Projets" du menu:
   
   { title: '🤖 AI Takeoff', path: '/ai-takeoff' },
   { title: '📐 Takeoff Avancé', path: '/takeoff-advanced' },
   { title: '💰 Estimation Avancée', path: '/estimation-advanced' },

3. OU créez une nouvelle section "Outils AI":
   
   {
     title: 'Outils AI',
     icon: Brain,
     submenu: [
       { title: 'AI Takeoff', path: '/ai-takeoff' },
       { title: 'Takeoff Avancé', path: '/takeoff-advanced' },
       { title: 'Estimation Avancée', path: '/estimation-advanced' },
     ]
   }
*/
