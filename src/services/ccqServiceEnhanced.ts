/**
 * Service CCQ - Commission de la construction du Québec
 * Taux horaires, conventions collectives, cartes de compétence, formations
 */

import { supabase } from '../lib/supabase/client';

// ============ TYPES ============

export interface CCQTravailleur {
  numero_ccq: string;
  nom: string;
  prenom: string;
  metier: string;
  classification: 'apprenti' | 'compagnon' | 'occupation';
  niveau_apprenti?: number; // 1, 2, 3, 4
  carte_competence: {
    numero: string;
    date_emission: string;
    date_expiration: string;
    statut: 'valide' | 'expiree' | 'suspendue';
  };
  formations_sst: FormationSST[];
  heures_travaillees?: number;
  region_domicile?: string;
}

export interface FormationSST {
  code: string;
  nom: string;
  date_obtention: string;
  date_expiration?: string;
  statut: 'valide' | 'expiree' | 'a_renouveler';
}

export interface CCQMetier {
  code: string;
  nom: string;
  secteurs: string[];
  classification: 'metier' | 'occupation' | 'specialite';
  apprentissage: {
    duree_heures: number;
    nombre_periodes: number;
    ratio_compagnon: string; // ex: "1:1", "1:2"
  };
  taux_horaires: CCQTauxHoraire;
  description: string;
}

export interface CCQTauxHoraire {
  metier: string;
  classification: string;
  secteur: string;
  taux_base: number;
  vacances: number; // 13%
  conges_feries: number;
  avantages_sociaux: number;
  fonds_formation: number;
  regime_retraite: number;
  assurance: number;
  total_employeur: number;
  date_vigueur: string;
  date_fin?: string;
  convention_collective: string;
}

export interface ConventionCollective {
  secteur: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  parties: string[];
  url_document: string;
  derniere_modification: string;
}

// ============ CONSTANTES ============

// Secteurs de l'industrie de la construction
export const CCQ_SECTEURS = {
  IC: { code: 'IC', nom: 'Industriel', nom_complet: 'Secteur industriel' },
  CI: { code: 'CI', nom: 'Institutionnel-Commercial', nom_complet: 'Secteur institutionnel et commercial' },
  GC: { code: 'GC', nom: 'Génie civil et voirie', nom_complet: 'Secteur du génie civil et de la voirie' },
  RE: { code: 'RE', nom: 'Résidentiel', nom_complet: 'Secteur résidentiel' }
};

// Métiers de la construction (liste complète)
export const CCQ_METIERS: CCQMetier[] = [
  {
    code: 'BRI',
    nom: 'Briqueteur-maçon',
    secteurs: ['IC', 'CI', 'GC', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Pose de briques, blocs, pierres et matériaux réfractaires'
  },
  {
    code: 'CAR',
    nom: 'Charpentier-menuisier',
    secteurs: ['IC', 'CI', 'GC', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Travaux de charpente, coffrages, finition intérieure'
  },
  {
    code: 'CIM',
    nom: 'Cimentier-applicateur',
    secteurs: ['IC', 'CI', 'GC', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 4000, nombre_periodes: 3, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Finition du béton, application de produits cimentaires'
  },
  {
    code: 'COU',
    nom: 'Couvreur',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 4000, nombre_periodes: 3, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation et réparation de toitures'
  },
  {
    code: 'ELE',
    nom: 'Électricien',
    secteurs: ['IC', 'CI', 'GC', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 8000, nombre_periodes: 5, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation et entretien de systèmes électriques'
  },
  {
    code: 'FER',
    nom: 'Ferrailleur',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation d\'armatures d\'acier pour béton armé'
  },
  {
    code: 'FRI',
    nom: 'Frigoriste',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 8000, nombre_periodes: 5, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation et entretien de systèmes de réfrigération et climatisation'
  },
  {
    code: 'GRU',
    nom: 'Grutier',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 2000, nombre_periodes: 2, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Opération de grues et équipements de levage'
  },
  {
    code: 'MEC',
    nom: 'Mécanicien de machines lourdes',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Entretien et réparation d\'équipements lourds'
  },
  {
    code: 'MPI',
    nom: 'Mécanicien en protection-incendie',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 8000, nombre_periodes: 5, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation de systèmes de gicleurs et protection incendie'
  },
  {
    code: 'OEQ',
    nom: 'Opérateur d\'équipement lourd',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 4000, nombre_periodes: 3, ratio_compagnon: '1:2' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Opération de machinerie lourde de construction'
  },
  {
    code: 'OPE',
    nom: 'Opérateur de pelles',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 4000, nombre_periodes: 3, ratio_compagnon: '1:2' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Opération de pelles mécaniques et excavatrices'
  },
  {
    code: 'PEI',
    nom: 'Peintre',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Application de peintures et revêtements'
  },
  {
    code: 'PLO',
    nom: 'Plombier',
    secteurs: ['IC', 'CI', 'GC', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 8000, nombre_periodes: 5, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation et entretien de systèmes de plomberie'
  },
  {
    code: 'SER',
    nom: 'Serrurier de bâtiment',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 4000, nombre_periodes: 3, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation de quincaillerie architecturale et serrurerie'
  },
  {
    code: 'TFB',
    nom: 'Tuyauteur',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 8000, nombre_periodes: 5, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation de tuyauterie industrielle et procédés'
  },
  {
    code: 'VIT',
    nom: 'Vitrier',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation de verre, vitrage et murs-rideaux'
  },
  {
    code: 'CAL',
    nom: 'Calorifugeur',
    secteurs: ['IC', 'CI'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Installation d\'isolants thermiques et acoustiques'
  },
  {
    code: 'MON',
    nom: 'Monteur d\'acier de structure',
    secteurs: ['IC', 'CI', 'GC'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Montage de structures d\'acier'
  },
  {
    code: 'FER',
    nom: 'Ferblantier',
    secteurs: ['IC', 'CI', 'RE'],
    classification: 'metier',
    apprentissage: { duree_heures: 6000, nombre_periodes: 4, ratio_compagnon: '1:1' },
    taux_horaires: {} as CCQTauxHoraire,
    description: 'Fabrication et installation de produits en tôle'
  }
];

// Taux horaires 2025-2026 par secteur
export const CCQ_TAUX_2025_2026: Record<string, Record<string, CCQTauxHoraire>> = {
  'CI': {
    'Briqueteur-maçon': {
      metier: 'Briqueteur-maçon',
      classification: 'compagnon',
      secteur: 'CI',
      taux_base: 47.89,
      vacances: 6.23,
      conges_feries: 4.07,
      avantages_sociaux: 4.75,
      fonds_formation: 0.25,
      regime_retraite: 4.79,
      assurance: 2.87,
      total_employeur: 70.85,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    },
    'Charpentier-menuisier': {
      metier: 'Charpentier-menuisier',
      classification: 'compagnon',
      secteur: 'CI',
      taux_base: 46.85,
      vacances: 6.09,
      conges_feries: 3.98,
      avantages_sociaux: 4.65,
      fonds_formation: 0.25,
      regime_retraite: 4.69,
      assurance: 2.81,
      total_employeur: 69.32,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    },
    'Électricien': {
      metier: 'Électricien',
      classification: 'compagnon',
      secteur: 'CI',
      taux_base: 49.52,
      vacances: 6.44,
      conges_feries: 4.21,
      avantages_sociaux: 4.91,
      fonds_formation: 0.25,
      regime_retraite: 4.95,
      assurance: 2.97,
      total_employeur: 73.25,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    },
    'Plombier': {
      metier: 'Plombier',
      classification: 'compagnon',
      secteur: 'CI',
      taux_base: 49.15,
      vacances: 6.39,
      conges_feries: 4.18,
      avantages_sociaux: 4.87,
      fonds_formation: 0.25,
      regime_retraite: 4.92,
      assurance: 2.95,
      total_employeur: 72.71,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    },
    'Ferrailleur': {
      metier: 'Ferrailleur',
      classification: 'compagnon',
      secteur: 'CI',
      taux_base: 46.45,
      vacances: 6.04,
      conges_feries: 3.95,
      avantages_sociaux: 4.61,
      fonds_formation: 0.25,
      regime_retraite: 4.65,
      assurance: 2.79,
      total_employeur: 68.74,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    }
  },
  'RE': {
    'Briqueteur-maçon': {
      metier: 'Briqueteur-maçon',
      classification: 'compagnon',
      secteur: 'RE',
      taux_base: 45.25,
      vacances: 5.88,
      conges_feries: 3.85,
      avantages_sociaux: 4.49,
      fonds_formation: 0.22,
      regime_retraite: 4.53,
      assurance: 2.71,
      total_employeur: 66.93,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective Résidentiel 2025-2029'
    },
    'Charpentier-menuisier': {
      metier: 'Charpentier-menuisier',
      classification: 'compagnon',
      secteur: 'RE',
      taux_base: 44.35,
      vacances: 5.77,
      conges_feries: 3.77,
      avantages_sociaux: 4.40,
      fonds_formation: 0.22,
      regime_retraite: 4.44,
      assurance: 2.66,
      total_employeur: 65.61,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective Résidentiel 2025-2029'
    },
    'Électricien': {
      metier: 'Électricien',
      classification: 'compagnon',
      secteur: 'RE',
      taux_base: 46.89,
      vacances: 6.10,
      conges_feries: 3.99,
      avantages_sociaux: 4.65,
      fonds_formation: 0.22,
      regime_retraite: 4.69,
      assurance: 2.81,
      total_employeur: 69.35,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective Résidentiel 2025-2029'
    },
    'Plombier': {
      metier: 'Plombier',
      classification: 'compagnon',
      secteur: 'RE',
      taux_base: 46.52,
      vacances: 6.05,
      conges_feries: 3.95,
      avantages_sociaux: 4.61,
      fonds_formation: 0.22,
      regime_retraite: 4.65,
      assurance: 2.79,
      total_employeur: 68.79,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective Résidentiel 2025-2029'
    }
  },
  'GC': {
    'Opérateur d\'équipement lourd': {
      metier: 'Opérateur d\'équipement lourd',
      classification: 'compagnon',
      secteur: 'GC',
      taux_base: 44.85,
      vacances: 5.83,
      conges_feries: 3.81,
      avantages_sociaux: 4.45,
      fonds_formation: 0.25,
      regime_retraite: 4.49,
      assurance: 2.69,
      total_employeur: 66.37,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective GC 2025-2029'
    },
    'Opérateur de pelles': {
      metier: 'Opérateur de pelles',
      classification: 'compagnon',
      secteur: 'GC',
      taux_base: 46.25,
      vacances: 6.01,
      conges_feries: 3.93,
      avantages_sociaux: 4.59,
      fonds_formation: 0.25,
      regime_retraite: 4.63,
      assurance: 2.78,
      total_employeur: 68.44,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective GC 2025-2029'
    }
  },
  'IC': {
    'Tuyauteur': {
      metier: 'Tuyauteur',
      classification: 'compagnon',
      secteur: 'IC',
      taux_base: 51.25,
      vacances: 6.66,
      conges_feries: 4.36,
      avantages_sociaux: 5.08,
      fonds_formation: 0.25,
      regime_retraite: 5.13,
      assurance: 3.08,
      total_employeur: 75.81,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    },
    'Monteur d\'acier de structure': {
      metier: 'Monteur d\'acier de structure',
      classification: 'compagnon',
      secteur: 'IC',
      taux_base: 48.95,
      vacances: 6.36,
      conges_feries: 4.16,
      avantages_sociaux: 4.86,
      fonds_formation: 0.25,
      regime_retraite: 4.90,
      assurance: 2.94,
      total_employeur: 72.42,
      date_vigueur: '2025-05-01',
      convention_collective: 'Convention collective IC 2025-2029'
    }
  }
};

// Formations SST obligatoires
export const CCQ_FORMATIONS_SST = [
  { code: 'ASP', nom: 'Santé et sécurité générale sur les chantiers de construction', duree: '30h', obligatoire: true },
  { code: 'SIMDUT', nom: 'Système d\'information sur les matières dangereuses', duree: '4h', obligatoire: true },
  { code: 'NACELLE', nom: 'Utilisation sécuritaire des plates-formes élévatrices', duree: '8h', obligatoire: false },
  { code: 'ESPACE', nom: 'Travail en espace clos', duree: '8h', obligatoire: false },
  { code: 'HAUTEUR', nom: 'Protection contre les chutes', duree: '8h', obligatoire: false },
  { code: 'EXCAVATION', nom: 'Travaux d\'excavation et de tranchées', duree: '8h', obligatoire: false },
  { code: 'SIGNALEUR', nom: 'Signaleur de chantier', duree: '16h', obligatoire: false }
];

class CCQServiceEnhanced {
  private baseUrl = 'https://www.ccq.org';

  /**
   * Obtenir les taux horaires par métier et secteur
   */
  async getTauxHoraires(params?: {
    metier?: string;
    secteur?: string;
    classification?: string;
  }): Promise<CCQTauxHoraire[]> {
    try {
      // D'abord essayer la base de données
      let query = supabase
        .from('ccq_taux_horaires')
        .select('*')
        .order('metier', { ascending: true });

      if (params?.metier) {
        query = query.eq('metier', params.metier);
      }
      if (params?.secteur) {
        query = query.eq('secteur', params.secteur);
      }
      if (params?.classification) {
        query = query.eq('classification', params.classification);
      }

      const { data, error } = await query;
      
      if (error || !data?.length) {
        // Retourner les données statiques
        return this.getTauxFromStatic(params);
      }

      return data;
    } catch {
      return this.getTauxFromStatic(params);
    }
  }

  /**
   * Obtenir un taux spécifique
   */
  async getTaux(metier: string, secteur: string, classification: string = 'compagnon'): Promise<CCQTauxHoraire | null> {
    const taux = await this.getTauxHoraires({ metier, secteur, classification });
    return taux[0] || null;
  }

  /**
   * Calculer le coût total de main-d'œuvre
   */
  calculerCoutMainOeuvre(params: {
    metier: string;
    secteur: string;
    heures: number;
    classification?: string;
    nombreTravailleurs?: number;
  }): {
    taux: CCQTauxHoraire | null;
    heures: number;
    nombreTravailleurs: number;
    coutHoraire: number;
    coutTotal: number;
    details: {
      salaires: number;
      vacances: number;
      avantagesSociaux: number;
      regimeRetraite: number;
      assurance: number;
    };
  } {
    const tauxData = CCQ_TAUX_2025_2026[params.secteur]?.[params.metier];
    const nombreTravailleurs = params.nombreTravailleurs || 1;
    
    if (!tauxData) {
      return {
        taux: null,
        heures: params.heures,
        nombreTravailleurs,
        coutHoraire: 0,
        coutTotal: 0,
        details: { salaires: 0, vacances: 0, avantagesSociaux: 0, regimeRetraite: 0, assurance: 0 }
      };
    }

    const coutTotal = tauxData.total_employeur * params.heures * nombreTravailleurs;

    return {
      taux: tauxData,
      heures: params.heures,
      nombreTravailleurs,
      coutHoraire: tauxData.total_employeur,
      coutTotal,
      details: {
        salaires: tauxData.taux_base * params.heures * nombreTravailleurs,
        vacances: tauxData.vacances * params.heures * nombreTravailleurs,
        avantagesSociaux: tauxData.avantages_sociaux * params.heures * nombreTravailleurs,
        regimeRetraite: tauxData.regime_retraite * params.heures * nombreTravailleurs,
        assurance: tauxData.assurance * params.heures * nombreTravailleurs
      }
    };
  }

  /**
   * Obtenir la liste des métiers
   */
  async getMetiers(secteur?: string): Promise<CCQMetier[]> {
    if (secteur) {
      return CCQ_METIERS.filter(m => m.secteurs.includes(secteur));
    }
    return CCQ_METIERS;
  }

  /**
   * Obtenir un métier par code
   */
  async getMetier(code: string): Promise<CCQMetier | undefined> {
    return CCQ_METIERS.find(m => m.code === code);
  }

  /**
   * Vérifier une carte de compétence (simulation)
   */
  async verifierCarteCompetence(numeroCarte: string): Promise<{
    valide: boolean;
    travailleur?: CCQTravailleur;
    message: string;
  }> {
    try {
      // Appeler l'Edge Function pour vérification réelle
      const { data, error } = await supabase.functions.invoke('ccq-verification', {
        body: { action: 'verify-card', cardNumber: numeroCarte }
      });

      if (error) throw error;

      return data || { valide: false, message: 'Carte non trouvée' };
    } catch {
      return {
        valide: false,
        message: 'Service de vérification temporairement indisponible'
      };
    }
  }

  /**
   * Obtenir les formations SST
   */
  getFormationsSST(obligatoiresUniquement: boolean = false): typeof CCQ_FORMATIONS_SST {
    if (obligatoiresUniquement) {
      return CCQ_FORMATIONS_SST.filter(f => f.obligatoire);
    }
    return CCQ_FORMATIONS_SST;
  }

  /**
   * Obtenir les secteurs
   */
  getSecteurs(): typeof CCQ_SECTEURS {
    return CCQ_SECTEURS;
  }

  /**
   * Générer le lien vers le site CCQ
   */
  getLienCCQ(section: 'taux' | 'metiers' | 'carte' | 'formations'): string {
    const liens = {
      taux: `${this.baseUrl}/fr/salaires`,
      metiers: `${this.baseUrl}/fr/metiers-occupations`,
      carte: `${this.baseUrl}/fr/carte-competence`,
      formations: `${this.baseUrl}/fr/formation`
    };
    return liens[section];
  }

  /**
   * Calculer le pourcentage d'apprenti pour un projet
   */
  calculerRatioApprentis(params: {
    nombreCompagnons: number;
    metier: string;
  }): {
    apprentisPermis: number;
    ratio: string;
    explication: string;
  } {
    const metier = CCQ_METIERS.find(m => m.nom === params.metier);
    const ratio = metier?.apprentissage.ratio_compagnon || '1:1';
    
    let apprentisPermis = 0;
    if (ratio === '1:1') {
      apprentisPermis = params.nombreCompagnons;
    } else if (ratio === '1:2') {
      apprentisPermis = Math.floor(params.nombreCompagnons / 2);
    }

    return {
      apprentisPermis,
      ratio,
      explication: `Pour ${params.nombreCompagnons} compagnon(s) ${params.metier}, vous pouvez avoir ${apprentisPermis} apprenti(s) selon le ratio ${ratio}`
    };
  }

  /**
   * Synchroniser les taux avec la base de données
   */
  async syncTauxHoraires(): Promise<boolean> {
    try {
      const tauxToInsert: any[] = [];
      
      Object.entries(CCQ_TAUX_2025_2026).forEach(([secteur, metiers]) => {
        Object.values(metiers).forEach(taux => {
          tauxToInsert.push({
            ...taux,
            id: `${secteur}_${taux.metier.replace(/[^a-zA-Z]/g, '_')}`,
            updated_at: new Date().toISOString()
          });
        });
      });

      await (supabase.from('ccq_taux_horaires').upsert(tauxToInsert as any) as any);
      return true;
    } catch (error) {
      console.error('Erreur sync CCQ:', error);
      return false;
    }
  }

  private getTauxFromStatic(params?: {
    metier?: string;
    secteur?: string;
  }): CCQTauxHoraire[] {
    const results: CCQTauxHoraire[] = [];
    
    Object.entries(CCQ_TAUX_2025_2026).forEach(([secteur, metiers]) => {
      if (params?.secteur && secteur !== params.secteur) return;
      
      Object.values(metiers).forEach(taux => {
        if (params?.metier && taux.metier !== params.metier) return;
        results.push(taux);
      });
    });

    return results;
  }
}

export const ccqServiceEnhanced = new CCQServiceEnhanced();
export default ccqServiceEnhanced;
