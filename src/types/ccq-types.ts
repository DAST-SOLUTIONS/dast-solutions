/**
 * DAST Solutions - Types CCQ/ACQ
 * Système complet de gestion des taux horaires et cotisations CCQ
 */

// ============================================================================
// ENUMS & CONSTANTES
// ============================================================================

export type SectorCode = 'ICI' | 'BAIE_JAMES' | 'IND_LOURD' | 'RES_LEGER' | 'RES_LOURD';
export type TradeCategory = 'metier' | 'occupation';
export type RegionCode = 'MTL' | 'QC' | 'MONTEREGIE' | 'OUTAOUAIS' | 'AUTRES';
export type RateType = 'base' | 'time_half' | 'double' | 'evening_base' | 'evening_time_half' | 'evening_double';

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Secteur de construction CCQ
 */
export interface CCQSector {
  id: string;
  code: SectorCode;
  name_fr: string;
  name_en?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Métier ou occupation CCQ
 */
export interface CCQTrade {
  id: string;
  code: string;
  name_fr: string;
  name_en?: string;
  category: TradeCategory;
  description?: string;
  requires_license: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Taux horaire CCQ
 */
export interface CCQHourlyRate {
  id: string;
  trade_id: string;
  sector_id: string;
  region_id?: string;
  
  // Dates de validité
  effective_date: string;
  expiry_date?: string;
  
  // Taux horaires réguliers
  base_rate: number;
  rate_time_half?: number;
  rate_double_time?: number;
  
  // Taux de soir (19h-7h)
  evening_base_rate?: number;
  evening_rate_time_half?: number;
  evening_rate_double_time?: number;
  
  // Métadonnées
  source_document?: string;
  notes?: string;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Relations (optionnelles)
  trade?: CCQTrade;
  sector?: CCQSector;
}

/**
 * Cotisations avantages sociaux
 */
export interface CCQSocialBenefit {
  id: string;
  trade_id: string;
  sector_id: string;
  
  effective_date: string;
  expiry_date?: string;
  
  // Cotisations (en % du salaire)
  health_insurance_rate?: number;
  pension_plan_rate?: number;
  training_fund_rate?: number;
  vacation_fund_rate?: number;        // Typiquement 13%
  statutory_holidays_rate?: number;   // Typiquement 5.5%
  
  // Cotisations patronales
  employer_health_rate?: number;
  employer_pension_rate?: number;
  employer_training_rate?: number;
  
  source_document?: string;
  notes?: string;
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
  
  trade?: CCQTrade;
  sector?: CCQSector;
}

/**
 * Résultat du calcul de coût employé
 */
export interface EmployeeCostResult {
  // Salaire de base
  base_salary: number;
  
  // Avantages sociaux
  vacation: number;              // 13%
  statutory_holidays: number;    // 5.5%
  health_insurance: number;
  pension: number;
  training_fund: number;
  
  // Sous-total
  social_benefits: number;
  
  // Coût total
  total_cost: number;
  
  // Détails des calculs
  hours_worked: number;
  hourly_rate: number;
  effective_date: string;
}

/**
 * Paramètres pour calcul de coût
 */
export interface EmployeeCostParams {
  trade_code: string;
  sector_code: string;
  region_code?: string;
  hours_worked: number;
  rate_type?: RateType;
  calculation_date?: string;
}

/**
 * Vue simplifiée des taux actuels
 */
export interface CurrentCCQRate {
  trade_code: string;
  trade_name: string;
  sector_code: string;
  sector_name: string;
  base_rate: number;
  rate_time_half: number;
  rate_double_time: number;
  vacation_rate: number;
  holidays_rate: number;
  effective_date: string;
}

// ============================================================================
// CONSTANTES UTILES
// ============================================================================

export const CCQ_CONSTANTS = {
  // Taux standards
  VACATION_RATE: 0.13,           // 13%
  STATUTORY_HOLIDAYS_RATE: 0.055, // 5.5%
  
  // Heures
  REGULAR_HOURS_PER_DAY: 8,
  REGULAR_HOURS_PER_WEEK: 40,
  EVENING_START: '19:00',
  EVENING_END: '07:00',
  
  // Multiplicateurs
  TIME_HALF_MULTIPLIER: 1.5,
  DOUBLE_TIME_MULTIPLIER: 2.0,
} as const;

/**
 * Codes de métiers les plus courants
 */
export const COMMON_TRADES = {
  CARP: 'Charpentier-menuisier',
  ELEC: 'Électricien',
  PLMB: 'Plombier',
  BRIQ: 'Briqueteur-maçon',
  PEIN: 'Peintre',
  FRIG: 'Frigoriste',
  TUYA: 'Tuyauteur',
  FERB: 'Ferblantier',
  COUV: 'Couvreur',
  COND: 'Conducteur d\'engins',
} as const;
