import { 
  Users, Smartphone, Bell, Target, FileText, Link2, 
  ClipboardList, MessageSquare, MapPin, Brain,
  LayoutDashboard, FolderOpen, Calculator, Ruler,
  FileCheck, BarChart3, Settings, Truck, Calendar
} from 'lucide-react';

// Navigation items pour le sidebar - AJOUTS AMÉLIORATIONS 10-19
export const navigationItems = [
  // Existants
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/' },
  { id: 'projects', label: 'Projets', icon: FolderOpen, path: '/projects' },
  { id: 'takeoff', label: 'Takeoff', icon: Ruler, path: '/takeoff' },
  { id: 'estimating', label: 'Estimation', icon: Calculator, path: '/estimating' },
  { id: 'soumissions', label: 'Soumissions', icon: FileCheck, path: '/soumissions' },
  { id: 'planning', label: 'Planification', icon: Calendar, path: '/planning' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: Truck, path: '/fournisseurs' },
  { id: 'reports', label: 'Rapports', icon: BarChart3, path: '/reports' },
  
  // NOUVEAUX - Améliorations 10-19
  { id: 'divider1', type: 'divider', label: 'Gestion' },
  { id: 'teams', label: 'Équipes', icon: Users, path: '/teams', badge: '10' },
  { id: 'crm', label: 'CRM', icon: Target, path: '/crm', badge: '13' },
  { id: 'invoicing', label: 'Facturation', icon: FileText, path: '/invoicing', badge: '14' },
  
  { id: 'divider2', type: 'divider', label: 'Terrain' },
  { id: 'field-reports', label: 'Rapports terrain', icon: ClipboardList, path: '/field-reports', badge: '16' },
  { id: 'geolocation', label: 'Géolocalisation', icon: MapPin, path: '/geolocation', badge: '18' },
  
  { id: 'divider3', type: 'divider', label: 'Communication' },
  { id: 'messaging', label: 'Messagerie', icon: MessageSquare, path: '/messaging', badge: '17' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: '12' },
  
  { id: 'divider4', type: 'divider', label: 'Outils avancés' },
  { id: 'takeoff-sync', label: 'Takeoff → Soumission', icon: Link2, path: '/takeoff-sync', badge: '15' },
  { id: 'ai-recognition', label: 'IA Reconnaissance', icon: Brain, path: '/ai-recognition', badge: '19' },
  { id: 'pwa', label: 'App Mobile', icon: Smartphone, path: '/pwa', badge: '11' },
  
  { id: 'divider5', type: 'divider', label: 'Système' },
  { id: 'settings', label: 'Paramètres', icon: Settings, path: '/settings' },
];

// Routes configuration
export const routesConfig = [
  { path: '/teams', component: 'TeamsModule' },
  { path: '/pwa', component: 'PWAModule' },
  { path: '/notifications', component: 'NotificationsModule' },
  { path: '/crm', component: 'CRMModule' },
  { path: '/invoicing', component: 'InvoicingModule' },
  { path: '/takeoff-sync', component: 'TakeoffSyncModule' },
  { path: '/field-reports', component: 'FieldReportsModule' },
  { path: '/messaging', component: 'MessagingModule' },
  { path: '/geolocation', component: 'GeolocationModule' },
  { path: '/ai-recognition', component: 'AIRecognitionModule' },
];

export default navigationItems;
