/**
 * DAST Solutions - Service CCQ Avancé
 * Calculs d'équipes, coûts complets avec avantages sociaux Québec 2024
 */

// ============================================================================
// TYPES
// ============================================================================
export interface CCQMetier {
  code: string;
  nom: string;
  secteur: 'IC' | 'ICI' | 'GC' | 'RES'; // Industriel-Commercial, Institutionnel-Commercial-Industriel, Génie Civil, Résidentiel
  tauxBase: number;
  tauxCompagnon: number;
  tauxApprentis: Record<number, number>; // niveau -> taux
  vacances: number; // %
  congesPayes: number; // %
  assurances: number; // %
  retraite: number; // %
  formation: number; // %
  autres: number; // %
}

export interface CCQEmploye {
  id: string;
  nom: string;
  prenom: string;
  numeroCCQ?: string;
  metierCode: string;
  classification: 'compagnon' | 'apprenti';
  niveauApprenti?: number;
  tauxHoraire?: number; // Override si différent
  dateEmbauche?: Date;
  actif: boolean;
}

export interface CCQEquipe {
  id: string;
  nom: string;
  membres: CCQEmployeMembre[];
  tauxHoraireTotal: number;
  coutHoraireTotal: number; // Incluant avantages
}

export interface CCQEmployeMembre {
  employeId: string;
  employe?: CCQEmploye;
  heuresParJour: number;
}

export interface CCQCalculResult {
  tauxBase: number;
  vacances: number;
  congesPayes: number;
  assurances: number;
  retraite: number;
  formation: number;
  autres: number;
  totalAvantages: number;
  coutHoraireTotal: number;
  coutJournalier8h: number;
  coutHebdo40h: number;
  facteurCharge: number; // % d'augmentation sur le taux de base
}

// ============================================================================
// DONNÉES CCQ 2024
// ============================================================================
export const CCQ_METIERS_2024: CCQMetier[] = [
  // SECTEUR IC/ICI
  {
    code: 'ELEC',
    nom: 'Électricien',
    secteur: 'ICI',
    tauxBase: 47.85,
    tauxCompagnon: 47.85,
    tauxApprentis: { 1: 21.53, 2: 28.71, 3: 35.89, 4: 43.07 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'PLOM',
    nom: 'Plombier',
    secteur: 'ICI',
    tauxBase: 47.85,
    tauxCompagnon: 47.85,
    tauxApprentis: { 1: 21.53, 2: 28.71, 3: 35.89, 4: 43.07 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'FRIG',
    nom: 'Frigoriste',
    secteur: 'ICI',
    tauxBase: 48.50,
    tauxCompagnon: 48.50,
    tauxApprentis: { 1: 21.83, 2: 29.10, 3: 36.38, 4: 43.65 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'FERB',
    nom: 'Ferblantier',
    secteur: 'ICI',
    tauxBase: 45.75,
    tauxCompagnon: 45.75,
    tauxApprentis: { 1: 20.59, 2: 27.45, 3: 34.31, 4: 41.18 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'CHARP',
    nom: 'Charpentier-menuisier',
    secteur: 'ICI',
    tauxBase: 44.75,
    tauxCompagnon: 44.75,
    tauxApprentis: { 1: 20.14, 2: 26.85, 3: 33.56, 4: 40.28 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'BRIC',
    nom: 'Briqueteur-maçon',
    secteur: 'ICI',
    tauxBase: 45.50,
    tauxCompagnon: 45.50,
    tauxApprentis: { 1: 20.48, 2: 27.30, 3: 34.13, 4: 40.95 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'PEINT',
    nom: 'Peintre',
    secteur: 'ICI',
    tauxBase: 40.25,
    tauxCompagnon: 40.25,
    tauxApprentis: { 1: 18.11, 2: 24.15, 3: 30.19, 4: 36.23 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'PLAT',
    nom: 'Plâtrier',
    secteur: 'ICI',
    tauxBase: 42.00,
    tauxCompagnon: 42.00,
    tauxApprentis: { 1: 18.90, 2: 25.20, 3: 31.50, 4: 37.80 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'CARR',
    nom: 'Carreleur',
    secteur: 'ICI',
    tauxBase: 43.25,
    tauxCompagnon: 43.25,
    tauxApprentis: { 1: 19.46, 2: 25.95, 3: 32.44, 4: 38.93 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'COUV',
    nom: 'Couvreur',
    secteur: 'ICI',
    tauxBase: 44.00,
    tauxCompagnon: 44.00,
    tauxApprentis: { 1: 19.80, 2: 26.40, 3: 33.00, 4: 39.60 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'SOUD',
    nom: 'Soudeur',
    secteur: 'ICI',
    tauxBase: 42.50,
    tauxCompagnon: 42.50,
    tauxApprentis: { 1: 19.13, 2: 25.50, 3: 31.88, 4: 38.25 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'MONT',
    nom: 'Monteur d\'acier de structure',
    secteur: 'ICI',
    tauxBase: 46.75,
    tauxCompagnon: 46.75,
    tauxApprentis: { 1: 21.04, 2: 28.05, 3: 35.06, 4: 42.08 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'ISOL',
    nom: 'Calorifugeur',
    secteur: 'ICI',
    tauxBase: 44.50,
    tauxCompagnon: 44.50,
    tauxApprentis: { 1: 20.03, 2: 26.70, 3: 33.38, 4: 40.05 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'JOUR',
    nom: 'Journalier',
    secteur: 'ICI',
    tauxBase: 34.50,
    tauxCompagnon: 34.50,
    tauxApprentis: {},
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'OPER',
    nom: 'Opérateur d\'équipement lourd',
    secteur: 'GC',
    tauxBase: 43.00,
    tauxCompagnon: 43.00,
    tauxApprentis: { 1: 19.35, 2: 25.80, 3: 32.25, 4: 38.70 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  {
    code: 'GRUE',
    nom: 'Grutier',
    secteur: 'ICI',
    tauxBase: 48.00,
    tauxCompagnon: 48.00,
    tauxApprentis: { 1: 21.60, 2: 28.80, 3: 36.00, 4: 43.20 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.50,
    retraite: 7.80,
    formation: 0.20,
    autres: 2.0
  },
  // SECTEUR RÉSIDENTIEL (taux légèrement différents)
  {
    code: 'ELEC-RES',
    nom: 'Électricien (résidentiel)',
    secteur: 'RES',
    tauxBase: 42.00,
    tauxCompagnon: 42.00,
    tauxApprentis: { 1: 18.90, 2: 25.20, 3: 31.50, 4: 37.80 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.20,
    retraite: 7.50,
    formation: 0.20,
    autres: 1.8
  },
  {
    code: 'PLOM-RES',
    nom: 'Plombier (résidentiel)',
    secteur: 'RES',
    tauxBase: 42.00,
    tauxCompagnon: 42.00,
    tauxApprentis: { 1: 18.90, 2: 25.20, 3: 31.50, 4: 37.80 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.20,
    retraite: 7.50,
    formation: 0.20,
    autres: 1.8
  },
  {
    code: 'CHARP-RES',
    nom: 'Charpentier-menuisier (résidentiel)',
    secteur: 'RES',
    tauxBase: 38.50,
    tauxCompagnon: 38.50,
    tauxApprentis: { 1: 17.33, 2: 23.10, 3: 28.88, 4: 34.65 },
    vacances: 13,
    congesPayes: 5.5,
    assurances: 3.20,
    retraite: 7.50,
    formation: 0.20,
    autres: 1.8
  }
];

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================
class CCQService {
  
  /**
   * Obtenir un métier par son code
   */
  getMetier(code: string): CCQMetier | undefined {
    return CCQ_METIERS_2024.find(m => m.code === code);
  }
  
  /**
   * Obtenir tous les métiers d'un secteur
   */
  getMetiersBySecteur(secteur: CCQMetier['secteur']): CCQMetier[] {
    return CCQ_METIERS_2024.filter(m => m.secteur === secteur);
  }
  
  /**
   * Calculer le coût horaire complet d'un employé
   */
  calculerCoutEmploye(
    metierCode: string,
    classification: 'compagnon' | 'apprenti',
    niveauApprenti?: number,
    tauxOverride?: number
  ): CCQCalculResult {
    const metier = this.getMetier(metierCode);
    if (!metier) {
      throw new Error(`Métier ${metierCode} non trouvé`);
    }
    
    // Déterminer le taux de base
    let tauxBase: number;
    if (tauxOverride) {
      tauxBase = tauxOverride;
    } else if (classification === 'compagnon') {
      tauxBase = metier.tauxCompagnon;
    } else if (niveauApprenti && metier.tauxApprentis[niveauApprenti]) {
      tauxBase = metier.tauxApprentis[niveauApprenti];
    } else {
      tauxBase = metier.tauxBase;
    }
    
    // Calculer les avantages sociaux
    const vacances = tauxBase * (metier.vacances / 100);
    const congesPayes = tauxBase * (metier.congesPayes / 100);
    const assurances = tauxBase * (metier.assurances / 100);
    const retraite = tauxBase * (metier.retraite / 100);
    const formation = tauxBase * (metier.formation / 100);
    const autres = tauxBase * (metier.autres / 100);
    
    const totalAvantages = vacances + congesPayes + assurances + retraite + formation + autres;
    const coutHoraireTotal = tauxBase + totalAvantages;
    
    return {
      tauxBase,
      vacances,
      congesPayes,
      assurances,
      retraite,
      formation,
      autres,
      totalAvantages,
      coutHoraireTotal,
      coutJournalier8h: coutHoraireTotal * 8,
      coutHebdo40h: coutHoraireTotal * 40,
      facteurCharge: (totalAvantages / tauxBase) * 100
    };
  }
  
  /**
   * Calculer le coût d'une équipe
   */
  calculerCoutEquipe(
    membres: Array<{
      metierCode: string;
      classification: 'compagnon' | 'apprenti';
      niveauApprenti?: number;
      heuresParJour: number;
      tauxOverride?: number;
    }>
  ): {
    coutHoraireTotal: number;
    coutJournalier: number;
    coutHebdo: number;
    details: Array<CCQCalculResult & { heuresParJour: number }>;
  } {
    let coutHoraireTotal = 0;
    const details: Array<CCQCalculResult & { heuresParJour: number }> = [];
    
    for (const membre of membres) {
      const calcul = this.calculerCoutEmploye(
        membre.metierCode,
        membre.classification,
        membre.niveauApprenti,
        membre.tauxOverride
      );
      
      // Pondérer par les heures
      coutHoraireTotal += calcul.coutHoraireTotal * (membre.heuresParJour / 8);
      
      details.push({
        ...calcul,
        heuresParJour: membre.heuresParJour
      });
    }
    
    const totalHeuresJour = membres.reduce((sum, m) => sum + m.heuresParJour, 0);
    
    return {
      coutHoraireTotal,
      coutJournalier: details.reduce((sum, d) => sum + (d.coutHoraireTotal * d.heuresParJour), 0),
      coutHebdo: details.reduce((sum, d) => sum + (d.coutHoraireTotal * d.heuresParJour * 5), 0),
      details
    };
  }
  
  /**
   * Estimer le coût main-d'œuvre pour une quantité de travail
   */
  estimerCoutMainOeuvre(
    metierCode: string,
    heuresEstimees: number,
    includeOvertime: boolean = false,
    heuresOvertime: number = 0
  ): {
    coutRegulier: number;
    coutOvertime: number;
    coutTotal: number;
    details: CCQCalculResult;
  } {
    const calcul = this.calculerCoutEmploye(metierCode, 'compagnon');
    
    const coutRegulier = heuresEstimees * calcul.coutHoraireTotal;
    const coutOvertime = includeOvertime ? heuresOvertime * calcul.coutHoraireTotal * 1.5 : 0;
    
    return {
      coutRegulier,
      coutOvertime,
      coutTotal: coutRegulier + coutOvertime,
      details: calcul
    };
  }
  
  /**
   * Rechercher des métiers par nom
   */
  rechercherMetiers(query: string): CCQMetier[] {
    const q = query.toLowerCase();
    return CCQ_METIERS_2024.filter(m => 
      m.nom.toLowerCase().includes(q) || 
      m.code.toLowerCase().includes(q)
    );
  }
  
  /**
   * Obtenir les statistiques des taux
   */
  getStatistiquesTaux(): {
    min: number;
    max: number;
    moyenne: number;
    mediane: number;
  } {
    const taux = CCQ_METIERS_2024.map(m => m.tauxCompagnon).sort((a, b) => a - b);
    const sum = taux.reduce((a, b) => a + b, 0);
    
    return {
      min: taux[0],
      max: taux[taux.length - 1],
      moyenne: sum / taux.length,
      mediane: taux[Math.floor(taux.length / 2)]
    };
  }
  
  /**
   * Formater un montant en devise
   */
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(montant);
  }
  
  /**
   * Formater un taux horaire
   */
  formatTauxHoraire(taux: number): string {
    return `${taux.toFixed(2)} $/h`;
  }
}

// Export singleton
export const ccqService = new CCQService();

export default ccqService;
