/**
 * Export de tous les services DAST Solutions
 * Intégrations: RBQ, CCQ, SEAO, MERX, BuyGC, Bonfire, Associations
 */

// ============ SERVICES PRINCIPAUX ============
export { seaoService } from './seaoService';
export { ccqService } from './ccqService';
export { aiService } from './aiService';

// ============ NOUVEAUX SERVICES INTÉGRATIONS ============
export { rbqService } from './rbqService';
export { ccqServiceEnhanced } from './ccqServiceEnhanced';
export { appelsOffresCanadaService } from './appelsOffresCanadaService';
export { associationsService, ASSOCIATIONS_QUEBEC } from './associationsService';
export { paieService } from './paieService';

// ============ TYPES SEAO ============
export type { 
  SEAOAppelOffre, 
  SEAODocument, 
  SEAOSearchParams,
  AppelOffreSEAO 
} from './seaoService';

// ============ TYPES CCQ ============
export type { 
  CCQTauxHoraire, 
  CCQMetier, 
  CCQSearchParams 
} from './ccqService';

export type {
  CCQTravailleur,
  FormationSST,
  ConventionCollective
} from './ccqServiceEnhanced';

export {
  CCQ_SECTEURS,
  CCQ_METIERS,
  CCQ_TAUX_2025_2026,
  CCQ_FORMATIONS_SST
} from './ccqServiceEnhanced';

// ============ TYPES RBQ ============
export type {
  RBQEntrepreneur,
  RBQLicence,
  RBQCategorie,
  RBQSousCategorie,
  RBQInfraction,
  RBQVerificationResult
} from './rbqService';

export {
  RBQ_CATEGORIES,
  RBQ_REGIONS,
  verifyRBQLicense,
  updateEntrepreneurRBQStatus,
  batchVerifyRBQ,
  getRBQVerificationUrl,
  getRBQCategoryDescription
} from './rbqService';

// ============ TYPES APPELS D'OFFRES CANADA ============
export type {
  AppelOffre,
  DocumentAppelOffre,
  ContactAppelOffre,
  RechercheParams,
  MERXAppelOffre,
  BuyGCAppelOffre,
  BonfireAppelOffre
} from './appelsOffresCanadaService';

export {
  GSIN_CONSTRUCTION,
  PROVINCES_CANADA
} from './appelsOffresCanadaService';

// ============ TYPES ASSOCIATIONS ============
export type {
  Association,
  Formation,
  Certification,
  MembreAssociation
} from './associationsService';

// ============ TYPES AI ============
export type { 
  OCRResult, 
  OCRLigne, 
  TakeoffAIResult, 
  TakeoffElement, 
  ChatMessage, 
  ChatResponse 
} from './aiService';

// ============ TYPES PAIE ============
export type {
  Employe,
  PeriodePaie,
  FeuilleTemps,
  CalculPaie,
  TalentPaieParams
} from './paieService';

export {
  TAUX_GOUVERNEMENT_2025,
  TABLES_IMPOT_FEDERAL_2025,
  TABLES_IMPOT_QUEBEC_2025,
  EXEMPTIONS_2025
} from './paieService';
