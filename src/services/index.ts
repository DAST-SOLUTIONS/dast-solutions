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
  RBQInfraction
} from './rbqService';

export {
  RBQ_CATEGORIES,
  RBQ_REGIONS
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
