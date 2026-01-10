/**
 * DAST Solutions - Index des exports du module Gestion
 */

// Layout principal
export { default as GestionProjetLayout } from './GestionProjetLayout'

// Pages complètes - Phase 1
export { default as GestionBudget } from './Budget'
export { default as GestionChangeOrders } from './ChangeOrders'
export { default as GestionJournal } from './Journal'

// Pages complètes - Phase 2 (Modules Procore-style)
export { default as GestionRFI } from './RFI'
export { default as GestionSubmittals } from './Submittals'
export { default as GestionInspections } from './Inspections'
export { default as GestionPunchList } from './PunchList'
export { default as GestionReunions } from './Reunions'

// Pages placeholder (à développer)
export {
  GestionCouts,
  GestionPrevisions,
  GestionPlans,
  GestionDocuments,
  GestionEcheancier,
  GestionPhotos,
  GestionProblemes,
  GestionSoumissionsFournisseurs,
  GestionRapports,
  GestionEquipe
} from './PlaceholderPages'
