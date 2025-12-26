/**
 * DAST Solutions - Types pour les modules Phases 1-4
 * NOTE: Les hooks font le mapping des colonnes DB vers ces interfaces
 */

// ============================================================================
// BOTTIN RESSOURCES
// ============================================================================

export interface Individu {
  id: string
  user_id: string
  prenom: string
  nom: string
  type: 'employe' | 'sous_traitant' | 'contact' | 'fournisseur'
  email?: string
  telephone?: string
  telephone_mobile?: string
  adresse?: string
  ville?: string
  code_postal?: string
  province?: string
  numero_ccq?: string
  metier_ccq?: string
  classification?: 'compagnon' | 'apprenti_1' | 'apprenti_2' | 'apprenti_3' | 'manoeuvre'
  taux_horaire_base: number
  taux_horaire_temps_demi: number
  taux_horaire_temps_double: number
  utiliser_taux_ccq: boolean
  certifications: { nom: string; numero?: string; expiration?: string }[]
  actif: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Equipement {
  id: string
  user_id: string
  nom: string
  categorie: 'nacelle' | 'echafaud' | 'skyjack' | 'outillage' | 'vehicule' | 'grue' | 'compresseur' | 'autre'
  numero_serie?: string
  marque?: string
  modele?: string
  cout_horaire: number
  cout_journalier: number
  cout_hebdomadaire: number
  cout_mensuel: number
  est_loue: boolean
  fournisseur_location?: string
  statut: 'disponible' | 'en_utilisation' | 'maintenance' | 'hors_service'
  actif: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Equipe {
  id: string
  user_id: string
  nom: string
  description?: string
  metier_principal?: string
  cout_horaire_total: number
  cout_journalier_total: number
  actif: boolean
  created_at: string
  updated_at: string
  membres?: EquipeMembre[]
  equipements?: EquipeEquipement[]
}

export interface EquipeMembre {
  id: string
  equipe_id: string
  individu_id: string
  role_equipe?: string
  heures_par_jour: number
  individu?: Individu
}

export interface EquipeEquipement {
  id: string
  equipe_id: string
  equipement_id: string
  quantite: number
  heures_par_jour: number
  equipement?: Equipement
}

// ============================================================================
// MATÉRIAUX & PRIX
// ============================================================================

export interface MateriauCategorie {
  id: string
  code: string
  nom: string
  description?: string
  parent_code?: string
  niveau: number
}

export interface Materiau {
  id: string
  user_id: string
  code?: string
  nom: string
  description?: string
  categorie_csc?: string
  unite: string
  unite_achat?: string
  facteur_conversion: number
  prix_unitaire: number
  prix_achat?: number
  devise: string
  fournisseur_nom?: string
  fournisseur_code?: string
  productivite_unite?: string
  productivite_valeur?: number
  metier_ccq?: string
  facteur_perte: number
  actif: boolean
  favori: boolean
  created_at: string
  updated_at: string
}

export interface PrixHistorique {
  id: string
  materiau_id: string
  prix_unitaire: number
  prix_achat?: number
  fournisseur_nom?: string
  source: string
  date_prix: string
}

export interface Productivite {
  id: string
  user_id: string
  nom: string
  description?: string
  categorie?: string
  unite_travail: string
  quantite_par_heure: number
  quantite_par_jour?: number
  facteur_simple: number
  facteur_moyen: number
  facteur_complexe: number
  facteur_tres_complexe: number
  metier_ccq?: string
  classification_min?: string
  source?: string
  reference?: string
  actif: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// SOUMISSIONS V2
// ============================================================================

export interface SoumissionV2 {
  id: string
  user_id: string
  project_id?: string
  numero: string
  revision: number
  client_nom?: string
  client_adresse?: string
  client_contact?: string
  client_email?: string
  client_telephone?: string
  projet_nom?: string
  projet_adresse?: string
  projet_description?: string
  date_soumission: string
  date_validite?: string
  date_debut_travaux?: string
  date_fin_travaux?: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  sous_total_mo: number
  sous_total_materiaux: number
  sous_total_equipements: number
  sous_total_sous_traitants: number
  sous_total_direct: number
  frais_generaux_pct: number
  frais_generaux_montant: number
  administration_pct: number
  administration_montant: number
  profit_pct: number
  profit_montant: number
  contingence_pct: number
  contingence_montant: number
  total_avant_taxes: number
  tps: number
  tvq: number
  total_avec_taxes: number
  conditions?: string
  exclusions?: string
  notes_internes?: string
  created_at: string
  updated_at: string
}

export interface SoumissionSection {
  id: string
  soumission_id: string
  nom: string
  code_csc?: string
  ordre: number
  sous_total_mo: number
  sous_total_materiaux: number
  sous_total: number
}

export interface SoumissionItem {
  id: string
  section_id: string
  numero_ligne?: number
  description: string
  quantite: number
  unite: string
  facteur_complexite: number
  productivite_id?: string
  mo_taux_horaire: number
  mo_heures: number
  mo_cout_unitaire: number
  mo_cout_total: number
  materiau_id?: string
  mat_prix_unitaire: number
  mat_facteur_perte: number
  mat_cout_total: number
  equipement_id?: string
  equip_cout_unitaire: number
  equip_cout_total: number
  sous_traitant_nom?: string
  st_cout_total: number
  cout_total: number
  ordre: number
  notes?: string
}

// ============================================================================
// APPELS D'OFFRES
// ============================================================================

export interface AppelOffre {
  id: string
  user_id: string
  project_id?: string
  soumission_id?: string
  numero: string
  titre: string
  description?: string
  etendue_travaux?: string
  documents_requis?: string
  specialite?: string
  code_csc?: string
  date_emission: string
  date_limite: string
  date_visite_chantier?: string
  heure_limite?: string
  budget_estime?: number
  statut: 'brouillon' | 'envoye' | 'en_cours' | 'ferme' | 'annule'
  soumissionnaire_choisi_id?: string
  montant_retenu?: number
  created_at: string
  updated_at: string
  invitations?: AppelOffreInvitation[]
  soumissions_recues?: AppelOffreSoumission[]
}

export interface AppelOffreInvitation {
  id: string
  appel_offre_id: string
  individu_id?: string
  entreprise_nom: string
  contact_nom?: string
  email?: string
  telephone?: string
  statut: 'a_envoyer' | 'envoye' | 'vu' | 'decline' | 'soumis'
  date_envoi?: string
  date_reponse?: string
  a_soumissionne: boolean
  raison_declin?: string
}

export interface AppelOffreSoumission {
  id: string
  appel_offre_id: string
  invitation_id?: string
  entreprise_nom: string
  contact_nom?: string
  email?: string
  telephone?: string
  numero_soumission?: string
  date_reception: string
  montant_total: number
  montant_mo?: number
  montant_materiaux?: number
  date_validite?: string
  delai_execution?: string
  inclusions?: string
  exclusions?: string
  conditions?: string
  documents?: { nom: string; url: string; type?: string }[]
  note_prix?: number
  note_qualite?: number
  note_delai?: number
  note_globale?: number
  commentaires_evaluation?: string
  statut: 'recu' | 'en_evaluation' | 'retenu' | 'rejete'
  est_retenu: boolean
}

export interface AppelOffreComparatif {
  id: string
  appel_offre_id: string
  nom: string
  criteres: { nom: string; poids: number }[]
  resultats: { soumission_id: string; scores: Record<string, number>; total: number }[]
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const METIERS_CCQ = [
  { code: 'briqueteur', nom: 'Briqueteur-maçon' },
  { code: 'calorifugeur', nom: 'Calorifugeur' },
  { code: 'carreleur', nom: 'Carreleur' },
  { code: 'charpentier', nom: 'Charpentier-menuisier' },
  { code: 'chaudronnier', nom: 'Chaudronnier' },
  { code: 'cimentier', nom: 'Cimentier-applicateur' },
  { code: 'couvreur', nom: 'Couvreur' },
  { code: 'electricien', nom: 'Électricien' },
  { code: 'ferblantier', nom: 'Ferblantier' },
  { code: 'ferrailleur', nom: 'Ferrailleur' },
  { code: 'frigoriste', nom: 'Frigoriste' },
  { code: 'grutier', nom: 'Grutier' },
  { code: 'mecanicien_ascenseur', nom: 'Mécanicien d\'ascenseur' },
  { code: 'mecanicien_machines', nom: 'Mécanicien de machines lourdes' },
  { code: 'mecanicien_protection', nom: 'Mécanicien en protection-incendie' },
  { code: 'monteur_acier', nom: 'Monteur d\'acier de structure' },
  { code: 'monteur_mecanicien', nom: 'Monteur-mécanicien (vitrier)' },
  { code: 'operateur_equipement', nom: 'Opérateur d\'équipement lourd' },
  { code: 'operateur_pelles', nom: 'Opérateur de pelles' },
  { code: 'peintre', nom: 'Peintre' },
  { code: 'platrier', nom: 'Plâtrier' },
  { code: 'plombier', nom: 'Plombier' },
  { code: 'poseur_revetements', nom: 'Poseur de revêtements souples' },
  { code: 'poseur_systemes', nom: 'Poseur de systèmes intérieurs' },
  { code: 'serrurier', nom: 'Serrurier de bâtiment' },
  { code: 'soudeur', nom: 'Soudeur' },
  { code: 'soudeur_distribution', nom: 'Soudeur en tuyauterie (distribution)' },
  { code: 'soudeur_haute', nom: 'Soudeur haute pression' },
  { code: 'tuyauteur', nom: 'Tuyauteur' },
]

export const CLASSIFICATIONS_CCQ = [
  { code: 'compagnon', nom: 'Compagnon', facteur: 1.0 },
  { code: 'apprenti_1', nom: 'Apprenti 1ère période', facteur: 0.50 },
  { code: 'apprenti_2', nom: 'Apprenti 2e période', facteur: 0.60 },
  { code: 'apprenti_3', nom: 'Apprenti 3e période', facteur: 0.70 },
  { code: 'manoeuvre', nom: 'Manoeuvre', facteur: 0.85 },
]

export const CATEGORIES_EQUIPEMENT = [
  { code: 'nacelle', nom: 'Nacelle élévatrice' },
  { code: 'echafaud', nom: 'Échafaudage' },
  { code: 'skyjack', nom: 'Skyjack / Ciseaux' },
  { code: 'outillage', nom: 'Outillage' },
  { code: 'vehicule', nom: 'Véhicule' },
  { code: 'grue', nom: 'Grue' },
  { code: 'compresseur', nom: 'Compresseur' },
  { code: 'autre', nom: 'Autre' },
]

export type FacteurComplexite = 'simple' | 'moyen' | 'complexe' | 'tres_complexe'
