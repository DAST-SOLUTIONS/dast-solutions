/**
 * DAST Solutions - Types Soumissions
 * Système de gestion des soumissions/devis construction
 */

// ============================================================================
// ENUMS & CONSTANTES
// ============================================================================

export type SoumissionStatus = 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree';

export const SOUMISSION_STATUS_LABELS: Record<SoumissionStatus, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  expiree: 'Expirée'
};

export const SOUMISSION_STATUS_COLORS: Record<SoumissionStatus, string> = {
  brouillon: '#6B7280',  // gray
  envoyee: '#3B82F6',    // blue
  acceptee: '#10B981',   // green
  refusee: '#EF4444',    // red
  expiree: '#F59E0B'     // amber
};

// Taux de taxes Québec 2024
export const TAX_RATES = {
  TPS: 0.05,    // 5%
  TVQ: 0.09975  // 9.975%
} as const;

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Client/Destinataire de la soumission
 */
export interface SoumissionClient {
  name: string;
  company?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
}

/**
 * Ligne d'item dans une soumission
 */
export interface SoumissionItem {
  id: string;
  soumission_id: string;
  
  // Détails de l'item
  description: string;
  category?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  
  // Métadonnées
  notes?: string;
  sort_order: number;
  
  // Référence takeoff (optionnel)
  takeoff_item_id?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Soumission principale
 */
export interface Soumission {
  id: string;
  project_id: string;
  
  // Numérotation
  soumission_number: string;
  revision?: number;
  
  // Client
  client_name: string;
  client_company?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  client_phone?: string;
  client_email?: string;
  
  // Projet
  project_name?: string;
  project_address?: string;
  project_description?: string;
  
  // Montants
  subtotal: number;
  tps_amount: number;
  tvq_amount: number;
  total: number;
  
  // Dates
  date_created: string;
  date_sent?: string;
  date_valid_until?: string;
  
  // Statut
  status: SoumissionStatus;
  
  // Conditions et notes
  conditions?: string;
  notes_internes?: string;
  exclusions?: string;
  
  // Métadonnées
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations (optionnelles)
  items?: SoumissionItem[];
  project?: {
    id: string;
    name: string;
  };
}

/**
 * Paramètres pour créer une soumission
 */
export interface CreateSoumissionParams {
  project_id: string;
  client: SoumissionClient;
  project_name?: string;
  project_address?: string;
  project_description?: string;
  items: Omit<SoumissionItem, 'id' | 'soumission_id' | 'created_at' | 'updated_at'>[];
  conditions?: string;
  exclusions?: string;
  notes_internes?: string;
  date_valid_until?: string;
}

/**
 * Résumé pour liste des soumissions
 */
export interface SoumissionSummary {
  id: string;
  soumission_number: string;
  client_name: string;
  client_company?: string;
  project_name?: string;
  total: number;
  status: SoumissionStatus;
  date_created: string;
  date_valid_until?: string;
}

/**
 * Données pour génération PDF
 */
export interface SoumissionPDFData extends Soumission {
  items: SoumissionItem[];
  company_info: {
    name: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    phone: string;
    email: string;
    rbq_license?: string;
    neq?: string;
  };
}

// ============================================================================
// CONSTANTES UTILES
// ============================================================================

export const DEFAULT_CONDITIONS = `
1. Cette soumission est valide pour 30 jours à compter de la date d'émission.
2. Un dépôt de 30% est requis à la signature du contrat.
3. Le solde est payable selon l'avancement des travaux.
4. Les travaux débuteront selon la disponibilité de notre équipe.
5. Cette soumission est basée sur les plans et devis fournis.
6. Tout changement aux plans entraînera une révision de prix.
7. Les permis de construction sont à la charge du client, sauf indication contraire.
8. Garantie selon les normes de l'industrie et la GCR (si applicable).
`.trim();

export const DEFAULT_EXCLUSIONS = `
- Permis de construction et frais municipaux
- Études géotechniques et arpentage
- Branchements aux services publics (Hydro-Québec, Gaz, etc.)
- Aménagement paysager
- Mobilier et électroménagers
- Décoration intérieure
`.trim();

/**
 * Générer un numéro de soumission
 */
export function generateSoumissionNumber(prefix: string = 'SOU'): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${year}-${timestamp}`;
}

/**
 * Calculer les totaux d'une soumission
 */
export function calculateSoumissionTotals(items: { quantity: number; unit_price: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tps_amount = subtotal * TAX_RATES.TPS;
  const tvq_amount = subtotal * TAX_RATES.TVQ;
  const total = subtotal + tps_amount + tvq_amount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tps_amount: Math.round(tps_amount * 100) / 100,
    tvq_amount: Math.round(tvq_amount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}