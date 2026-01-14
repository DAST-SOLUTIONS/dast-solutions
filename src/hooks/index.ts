/**
 * Export de tous les hooks DAST Solutions
 */

// Hooks Supabase pour données réelles
export {
  useProjects,
  useProject,
  useCreateProject,
  useTakeoffs,
  useTakeoff,
  useInvoices,
  useInvoiceStats,
  useClients,
  useFournisseurs,
  useTeamMembers,
  useFieldReports,
  useDocuments,
  useNotifications,
  useActivities,
  useDashboardStats,
  useOfflineStatus
} from './useSupabase';

// Hooks PWA
export {
  usePWA,
  useOfflineStorage
} from './usePWA';

// Hooks authentification
export { useAuth } from './useAuth';

// Hooks CRUD additionnels
export { useProjects as useProjectsCRUD } from './useProjects';
export { useClients as useClientsCRUD } from './useClients';
export { useEntrepreneurs, useEntrepreneursCRUD } from './useEntrepreneurs';
export { useBottin } from './useBottin';
export { useAppelsOffres, useAppelOffres } from './useAppelsOffres';
export { useSoumissions } from './useSoumissions';
export { useSoumissionPDF } from './useSoumissionPDF';
export { useFactures } from './useFactures';
export { useMaterials } from './useMaterials';
export { useMateriauxPrix, MATERIAUX_QUEBEC } from './useMateriauxPrix';
export { useNotifications as useNotificationsCRUD } from './useNotifications';
export { useCosts, DEFAULT_COSTS } from './useCosts';
export { usePersonnelCCQ } from './usePersonnelCCQ';
