/**
 * DAST Solutions - Types Entrepreneurs & Appels d'offres
 * Gestion des sous-traitants et invitations à soumissionner
 */

// ============================================================================
// ENUMS & CONSTANTES
// ============================================================================

export type EntrepreneurStatus = 'actif' | 'inactif' | 'bloque';
export type AppelOffreStatus = 'brouillon' | 'envoye' | 'en_cours' | 'termine' | 'annule';
export type SoumissionSTStatus = 'en_attente' | 'recu' | 'accepte' | 'refuse' | 'expire';

export const ENTREPRENEUR_STATUS_LABELS: Record<EntrepreneurStatus, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  bloque: 'Bloqué'
};

export const APPEL_OFFRE_STATUS_LABELS: Record<AppelOffreStatus, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé'
};

export const SOUMISSION_ST_STATUS_LABELS: Record<SoumissionSTStatus, string> = {
  en_attente: 'En attente',
  recu: 'Reçu',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré'
};

// Spécialités de construction (basées sur les catégories RBQ)
export const SPECIALITES = [
  { code: 'GEN', name: 'Entrepreneur général' },
  { code: 'ELEC', name: 'Électricité' },
  { code: 'PLOMB', name: 'Plomberie' },
  { code: 'CVAC', name: 'Chauffage, ventilation, climatisation' },
  { code: 'MACONN', name: 'Maçonnerie' },
  { code: 'CHARP', name: 'Charpente / Structure' },
  { code: 'TOIT', name: 'Toiture' },
  { code: 'GYPS', name: 'Gypse / Plâtrage' },
  { code: 'PEINT', name: 'Peinture' },
  { code: 'PLANCH', name: 'Revêtement de sol' },
  { code: 'ARMOIR', name: 'Armoires / Ébénisterie' },
  { code: 'EXCAV', name: 'Excavation' },
  { code: 'BETON', name: 'Béton / Fondation' },
  { code: 'ISOL', name: 'Isolation' },
  { code: 'FENET', name: 'Portes et fenêtres' },
  { code: 'ASCENS', name: 'Ascenseurs' },
  { code: 'GICLEUR', name: 'Gicleurs / Protection incendie' },
  { code: 'PAYSAG', name: 'Aménagement paysager' },
  { code: 'AUTRE', name: 'Autre spécialité' }
] as const;

export type SpecialiteCode = typeof SPECIALITES[number]['code'];

// ============================================================================
// INTERFACES - ENTREPRENEUR
// ============================================================================

/**
 * Entrepreneur (sous-traitant) dans le bottin personnel
 */
export interface Entrepreneur {
  id: string;
  
  // Informations de base
  company_name: string;
  contact_name?: string;
  
  // Coordonnées
  email?: string;
  phone?: string;
  cell?: string;
  fax?: string;
  
  // Adresse
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  
  // RBQ
  rbq_license?: string;
  rbq_status?: 'valide' | 'invalide' | 'suspendu' | 'inconnu';
  rbq_categories?: string[];
  rbq_last_verified?: string;
  
  // Spécialités
  specialites: SpecialiteCode[];
  
  // Notes et évaluation
  notes?: string;
  rating?: number; // 1-5
  
  // Statistiques
  total_invitations?: number;
  total_soumissions?: number;
  total_contrats?: number;
  
  // Source
  source: 'manuel' | 'rbq' | 'import';
  rbq_data?: Record<string, any>; // Données brutes du RBQ si importé
  
  // Statut
  status: EntrepreneurStatus;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
}

/**
 * Paramètres pour créer un entrepreneur
 */
export interface CreateEntrepreneurParams {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  cell?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  rbq_license?: string;
  specialites?: SpecialiteCode[];
  notes?: string;
  source?: 'manuel' | 'rbq' | 'import';
}

// ============================================================================
// INTERFACES - APPEL D'OFFRES
// ============================================================================

/**
 * Appel d'offres (invitation à soumissionner)
 */
export interface AppelOffre {
  id: string;
  project_id: string;
  
  // Identification
  numero: string;
  titre: string;
  
  // Description des travaux
  description: string;
  etendue_travaux: string; // Texte libre décrivant l'étendue
  
  // Documents joints (IDs)
  documents?: string[];
  
  // Dates
  date_creation: string;
  date_envoi?: string;
  date_limite: string;
  date_ouverture?: string;
  
  // Statut
  status: AppelOffreStatus;
  
  // Métadonnées
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  invitations?: InvitationSoumission[];
  project?: {
    id: string;
    name: string;
  };
}

/**
 * Invitation envoyée à un entrepreneur
 */
export interface InvitationSoumission {
  id: string;
  appel_offre_id: string;
  entrepreneur_id: string;
  
  // Statut
  status: SoumissionSTStatus;
  
  // Dates
  date_envoi?: string;
  date_reception?: string;
  date_relance?: string;
  
  // Réponse de l'entrepreneur
  montant?: number;
  inclusions?: string;
  exclusions?: string;
  conditions?: string;
  validite_jours?: number;
  document_soumission_url?: string;
  
  // Notes
  notes_internes?: string;
  
  // Sélection
  is_selected: boolean;
  
  // Métadonnées
  created_at: string;
  updated_at: string;
  
  // Relations
  entrepreneur?: Entrepreneur;
}

/**
 * Paramètres pour créer un appel d'offres
 */
export interface CreateAppelOffreParams {
  project_id: string;
  titre: string;
  description: string;
  etendue_travaux: string;
  date_limite: string;
  entrepreneur_ids: string[]; // Entrepreneurs à inviter
}

// ============================================================================
// INTERFACES - COMPARAISON
// ============================================================================

/**
 * Ligne de comparaison pour tableau comparatif
 */
export interface ComparaisonLigne {
  critere: string;
  valeurs: {
    entrepreneur_id: string;
    entrepreneur_name: string;
    valeur: string | number | boolean;
    is_best?: boolean;
  }[];
}

/**
 * Tableau comparatif complet
 */
export interface TableauComparatif {
  appel_offre_id: string;
  titre: string;
  soumissions: InvitationSoumission[];
  lignes: ComparaisonLigne[];
  meilleur_prix_id?: string;
  selection_id?: string;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Générer un numéro d'appel d'offres
 */
export function generateAppelOffreNumero(projectCode?: string): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-4);
  const prefix = projectCode ? projectCode.slice(0, 3).toUpperCase() : 'AO';
  return `${prefix}-${year}-${timestamp}`;
}

/**
 * Formater le numéro RBQ (XXXX-XXXX-XX)
 */
export function formatRBQLicense(license: string): string {
  const cleaned = license.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 10)}`;
  }
  return license;
}

/**
 * Valider le format d'un numéro RBQ
 */
export function isValidRBQLicense(license: string): boolean {
  const cleaned = license.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Obtenir le nom d'une spécialité par son code
 */
export function getSpecialiteName(code: SpecialiteCode): string {
  return SPECIALITES.find(s => s.code === code)?.name || code;
}

/**
 * Calculer l'écart en % par rapport au prix le plus bas
 */
export function calculatePriceVariance(price: number, lowestPrice: number): number {
  if (lowestPrice === 0) return 0;
  return Math.round(((price - lowestPrice) / lowestPrice) * 100);
}

/**
 * Trouver le meilleur prix parmi les soumissions
 */
export function findBestPrice(invitations: InvitationSoumission[]): InvitationSoumission | null {
  const received = invitations.filter(i => i.status === 'recu' && i.montant && i.montant > 0);
  if (received.length === 0) return null;
  
  return received.reduce((best, current) => 
    (current.montant! < best.montant!) ? current : best
  );
}