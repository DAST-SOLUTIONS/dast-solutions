/**
 * DAST Solutions - CCQ Calculator Avancé
 * Calculs complets pour équipes CCQ avec tous les avantages sociaux
 */

// ============================================================================
// TYPES
// ============================================================================
export interface CCQMetier {
  code: string;
  nom: string;
  secteur: 'IC' | 'GC' | 'RES' | 'VOIRIE';
  classes: CCQClasse[];
}

export interface CCQClasse {
  nom: string;
  tauxBase: number;
  tauxSupp: number;
  tauxDouble: number;
}

export interface CCQAvantages {
  vacances: number;        // % du salaire brut
  congesObligatoires: number;
  assurance: number;
  retraite: number;
  formationFonds: number;
  csst: number;
  cnesst: number;
  employeurRRQ: number;
  employeurAE: number;
  rqap: number;
  fsst: number;            // Fonds sécurité
  totalEmployeur: number;
}

export interface CCQEmploye {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  metier: string;
  classe: string;
  tauxHoraire: number;
  heuresRegulieresParSemaine: number;
  actif: boolean;
}

export interface CCQEquipe {
  id: string;
  nom: string;
  projet?: string;
  employes: CCQEmployeEquipe[];
  dateDebut: string;
  dateFin?: string;
}

export interface CCQEmployeEquipe {
  employeId: string;
  employe: CCQEmploye;
  heuresHebdo: number;
  heuresSupp: number;
  heuresDouble: number;
}

export interface CCQCalculResult {
  employe: CCQEmploye;
  heuresRegulier: number;
  heuresSupp: number;
  heuresDouble: number;
  salaireRegulier: number;
  salaireSupp: number;
  salaireDouble: number;
  salaireBrut: number;
  avantages: CCQAvantages;
  coutTotalEmployeur: number;
  tauxHoraireCharge: number;
}

export interface CCQEquipeCalculResult {
  equipe: CCQEquipe;
  periode: { debut: string; fin: string };
  totalHeures: number;
  totalSalaireBrut: number;
  totalAvantages: number;
  totalCoutEmployeur: number;
  tauxHoraireMoyenCharge: number;
  details: CCQCalculResult[];
}

// ============================================================================
// TAUX CCQ 2024 (QUÉBEC)
// ============================================================================
export const CCQ_TAUX_2024: CCQMetier[] = [
  {
    code: 'CARP',
    nom: 'Charpentier-menuisier',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 45.97, tauxSupp: 68.96, tauxDouble: 91.94 },
      { nom: 'Apprenti 1ère période', tauxBase: 27.58, tauxSupp: 41.37, tauxDouble: 55.16 },
      { nom: 'Apprenti 2e période', tauxBase: 32.18, tauxSupp: 48.27, tauxDouble: 64.36 },
      { nom: 'Apprenti 3e période', tauxBase: 36.78, tauxSupp: 55.17, tauxDouble: 73.56 },
      { nom: 'Apprenti 4e période', tauxBase: 41.37, tauxSupp: 62.06, tauxDouble: 82.74 }
    ]
  },
  {
    code: 'ELEC',
    nom: 'Électricien',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 48.72, tauxSupp: 73.08, tauxDouble: 97.44 },
      { nom: 'Apprenti 1ère période', tauxBase: 24.36, tauxSupp: 36.54, tauxDouble: 48.72 },
      { nom: 'Apprenti 2e période', tauxBase: 29.23, tauxSupp: 43.85, tauxDouble: 58.46 },
      { nom: 'Apprenti 3e période', tauxBase: 34.10, tauxSupp: 51.15, tauxDouble: 68.20 },
      { nom: 'Apprenti 4e période', tauxBase: 38.98, tauxSupp: 58.47, tauxDouble: 77.96 },
      { nom: 'Apprenti 5e période', tauxBase: 43.85, tauxSupp: 65.78, tauxDouble: 87.70 }
    ]
  },
  {
    code: 'PLOM',
    nom: 'Plombier',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 48.53, tauxSupp: 72.80, tauxDouble: 97.06 },
      { nom: 'Apprenti 1ère période', tauxBase: 24.27, tauxSupp: 36.40, tauxDouble: 48.54 },
      { nom: 'Apprenti 2e période', tauxBase: 29.12, tauxSupp: 43.68, tauxDouble: 58.24 },
      { nom: 'Apprenti 3e période', tauxBase: 33.97, tauxSupp: 50.96, tauxDouble: 67.94 },
      { nom: 'Apprenti 4e période', tauxBase: 38.82, tauxSupp: 58.23, tauxDouble: 77.64 },
      { nom: 'Apprenti 5e période', tauxBase: 43.68, tauxSupp: 65.52, tauxDouble: 87.36 }
    ]
  },
  {
    code: 'FERR',
    nom: 'Ferblantier',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 46.89, tauxSupp: 70.34, tauxDouble: 93.78 },
      { nom: 'Apprenti 1ère période', tauxBase: 28.13, tauxSupp: 42.20, tauxDouble: 56.26 },
      { nom: 'Apprenti 2e période', tauxBase: 32.82, tauxSupp: 49.23, tauxDouble: 65.64 },
      { nom: 'Apprenti 3e période', tauxBase: 37.51, tauxSupp: 56.27, tauxDouble: 75.02 },
      { nom: 'Apprenti 4e période', tauxBase: 42.20, tauxSupp: 63.30, tauxDouble: 84.40 }
    ]
  },
  {
    code: 'PEIN',
    nom: 'Peintre',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 42.65, tauxSupp: 63.98, tauxDouble: 85.30 },
      { nom: 'Apprenti 1ère période', tauxBase: 25.59, tauxSupp: 38.39, tauxDouble: 51.18 },
      { nom: 'Apprenti 2e période', tauxBase: 29.86, tauxSupp: 44.79, tauxDouble: 59.72 },
      { nom: 'Apprenti 3e période', tauxBase: 34.12, tauxSupp: 51.18, tauxDouble: 68.24 }
    ]
  },
  {
    code: 'BRIC',
    nom: 'Briqueteur-maçon',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 45.78, tauxSupp: 68.67, tauxDouble: 91.56 },
      { nom: 'Apprenti 1ère période', tauxBase: 27.47, tauxSupp: 41.20, tauxDouble: 54.94 },
      { nom: 'Apprenti 2e période', tauxBase: 32.05, tauxSupp: 48.07, tauxDouble: 64.10 },
      { nom: 'Apprenti 3e période', tauxBase: 36.62, tauxSupp: 54.93, tauxDouble: 73.24 }
    ]
  },
  {
    code: 'COUT',
    nom: 'Couvreur',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 44.23, tauxSupp: 66.35, tauxDouble: 88.46 },
      { nom: 'Apprenti 1ère période', tauxBase: 26.54, tauxSupp: 39.81, tauxDouble: 53.08 },
      { nom: 'Apprenti 2e période', tauxBase: 30.96, tauxSupp: 46.44, tauxDouble: 61.92 },
      { nom: 'Apprenti 3e période', tauxBase: 35.38, tauxSupp: 53.07, tauxDouble: 70.76 }
    ]
  },
  {
    code: 'PLAT',
    nom: 'Plâtrier',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 44.56, tauxSupp: 66.84, tauxDouble: 89.12 },
      { nom: 'Apprenti 1ère période', tauxBase: 26.74, tauxSupp: 40.11, tauxDouble: 53.48 },
      { nom: 'Apprenti 2e période', tauxBase: 31.19, tauxSupp: 46.79, tauxDouble: 62.38 },
      { nom: 'Apprenti 3e période', tauxBase: 35.65, tauxSupp: 53.48, tauxDouble: 71.30 }
    ]
  },
  {
    code: 'CARR',
    nom: 'Carreleur',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 44.12, tauxSupp: 66.18, tauxDouble: 88.24 },
      { nom: 'Apprenti 1ère période', tauxBase: 26.47, tauxSupp: 39.71, tauxDouble: 52.94 },
      { nom: 'Apprenti 2e période', tauxBase: 30.88, tauxSupp: 46.32, tauxDouble: 61.76 },
      { nom: 'Apprenti 3e période', tauxBase: 35.30, tauxSupp: 52.95, tauxDouble: 70.60 }
    ]
  },
  {
    code: 'JOURN',
    nom: 'Journalier',
    secteur: 'IC',
    classes: [
      { nom: 'Classe A', tauxBase: 32.45, tauxSupp: 48.68, tauxDouble: 64.90 },
      { nom: 'Classe B', tauxBase: 30.87, tauxSupp: 46.31, tauxDouble: 61.74 }
    ]
  },
  {
    code: 'GRUT',
    nom: 'Grutier',
    secteur: 'IC',
    classes: [
      { nom: 'Classe A', tauxBase: 49.85, tauxSupp: 74.78, tauxDouble: 99.70 },
      { nom: 'Classe B', tauxBase: 47.36, tauxSupp: 71.04, tauxDouble: 94.72 }
    ]
  },
  {
    code: 'OPEQ',
    nom: 'Opérateur d\'équipement lourd',
    secteur: 'IC',
    classes: [
      { nom: 'Classe A', tauxBase: 44.67, tauxSupp: 67.01, tauxDouble: 89.34 },
      { nom: 'Classe B', tauxBase: 42.44, tauxSupp: 63.66, tauxDouble: 84.88 },
      { nom: 'Classe C', tauxBase: 40.20, tauxSupp: 60.30, tauxDouble: 80.40 }
    ]
  },
  {
    code: 'CIME',
    nom: 'Cimentier-applicateur',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 43.87, tauxSupp: 65.81, tauxDouble: 87.74 },
      { nom: 'Apprenti 1ère période', tauxBase: 26.32, tauxSupp: 39.48, tauxDouble: 52.64 },
      { nom: 'Apprenti 2e période', tauxBase: 30.71, tauxSupp: 46.06, tauxDouble: 61.42 },
      { nom: 'Apprenti 3e période', tauxBase: 35.10, tauxSupp: 52.65, tauxDouble: 70.20 }
    ]
  },
  {
    code: 'TUYAU',
    nom: 'Tuyauteur',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 48.89, tauxSupp: 73.34, tauxDouble: 97.78 },
      { nom: 'Apprenti 1ère période', tauxBase: 24.45, tauxSupp: 36.67, tauxDouble: 48.90 },
      { nom: 'Apprenti 2e période', tauxBase: 29.33, tauxSupp: 44.00, tauxDouble: 58.66 },
      { nom: 'Apprenti 3e période', tauxBase: 34.22, tauxSupp: 51.33, tauxDouble: 68.44 },
      { nom: 'Apprenti 4e période', tauxBase: 39.11, tauxSupp: 58.67, tauxDouble: 78.22 },
      { nom: 'Apprenti 5e période', tauxBase: 44.00, tauxSupp: 66.00, tauxDouble: 88.00 }
    ]
  },
  {
    code: 'FRIGG',
    nom: 'Frigoriste',
    secteur: 'IC',
    classes: [
      { nom: 'Compagnon', tauxBase: 49.12, tauxSupp: 73.68, tauxDouble: 98.24 },
      { nom: 'Apprenti 1ère période', tauxBase: 24.56, tauxSupp: 36.84, tauxDouble: 49.12 },
      { nom: 'Apprenti 2e période', tauxBase: 29.47, tauxSupp: 44.21, tauxDouble: 58.94 },
      { nom: 'Apprenti 3e période', tauxBase: 34.38, tauxSupp: 51.57, tauxDouble: 68.76 },
      { nom: 'Apprenti 4e période', tauxBase: 39.30, tauxSupp: 58.95, tauxDouble: 78.60 },
      { nom: 'Apprenti 5e période', tauxBase: 44.21, tauxSupp: 66.32, tauxDouble: 88.42 }
    ]
  }
];

// ============================================================================
// TAUX AVANTAGES SOCIAUX CCQ 2024
// ============================================================================
export const CCQ_AVANTAGES_2024 = {
  vacances: 13.0,              // 13% du salaire brut
  congesObligatoires: 5.5,     // 5.5% pour congés fériés
  assurance: 3.95,             // Assurance collective
  retraite: 7.4,               // Régime de retraite
  formationFonds: 0.35,        // Fonds de formation
  csst: 2.15,                  // CSST (varie selon secteur)
  cnesst: 0.0,                 // Inclus dans CSST
  employeurRRQ: 6.4,           // Part employeur RRQ (2024)
  employeurAE: 2.282,          // Part employeur AE (1.4 x employé)
  rqap: 0.692,                 // RQAP employeur
  fsst: 0.10,                  // Fonds santé sécurité
};

// ============================================================================
// FONCTIONS DE CALCUL
// ============================================================================

/**
 * Calculer les avantages sociaux pour un salaire brut
 */
export function calculerAvantages(salaireBrut: number): CCQAvantages {
  const taux = CCQ_AVANTAGES_2024;
  
  const vacances = salaireBrut * (taux.vacances / 100);
  const congesObligatoires = salaireBrut * (taux.congesObligatoires / 100);
  const assurance = salaireBrut * (taux.assurance / 100);
  const retraite = salaireBrut * (taux.retraite / 100);
  const formationFonds = salaireBrut * (taux.formationFonds / 100);
  const csst = salaireBrut * (taux.csst / 100);
  const cnesst = 0;
  const employeurRRQ = Math.min(salaireBrut * (taux.employeurRRQ / 100), 4038.40); // Max 2024
  const employeurAE = Math.min(salaireBrut * (taux.employeurAE / 100), 1435.07); // Max 2024
  const rqap = salaireBrut * (taux.rqap / 100);
  const fsst = salaireBrut * (taux.fsst / 100);
  
  const totalEmployeur = vacances + congesObligatoires + assurance + retraite + 
    formationFonds + csst + employeurRRQ + employeurAE + rqap + fsst;
  
  return {
    vacances,
    congesObligatoires,
    assurance,
    retraite,
    formationFonds,
    csst,
    cnesst,
    employeurRRQ,
    employeurAE,
    rqap,
    fsst,
    totalEmployeur
  };
}

/**
 * Calculer le coût total pour un employé
 */
export function calculerCoutEmploye(
  employe: CCQEmploye,
  heuresRegulier: number,
  heuresSupp: number = 0,
  heuresDouble: number = 0
): CCQCalculResult {
  // Trouver le métier et la classe
  const metier = CCQ_TAUX_2024.find(m => m.code === employe.metier || m.nom === employe.metier);
  const classe = metier?.classes.find(c => c.nom === employe.classe);
  
  // Utiliser les taux CCQ ou les taux personnalisés
  const tauxBase = classe?.tauxBase || employe.tauxHoraire;
  const tauxSupp = classe?.tauxSupp || tauxBase * 1.5;
  const tauxDouble = classe?.tauxDouble || tauxBase * 2;
  
  // Calculer les salaires
  const salaireRegulier = heuresRegulier * tauxBase;
  const salaireSupp = heuresSupp * tauxSupp;
  const salaireDouble = heuresDouble * tauxDouble;
  const salaireBrut = salaireRegulier + salaireSupp + salaireDouble;
  
  // Calculer les avantages
  const avantages = calculerAvantages(salaireBrut);
  
  // Coût total employeur
  const coutTotalEmployeur = salaireBrut + avantages.totalEmployeur;
  
  // Taux horaire chargé
  const totalHeures = heuresRegulier + heuresSupp + heuresDouble;
  const tauxHoraireCharge = totalHeures > 0 ? coutTotalEmployeur / totalHeures : 0;
  
  return {
    employe,
    heuresRegulier,
    heuresSupp,
    heuresDouble,
    salaireRegulier,
    salaireSupp,
    salaireDouble,
    salaireBrut,
    avantages,
    coutTotalEmployeur,
    tauxHoraireCharge
  };
}

/**
 * Calculer le coût total pour une équipe
 */
export function calculerCoutEquipe(
  equipe: CCQEquipe,
  nombreSemaines: number = 1
): CCQEquipeCalculResult {
  const details: CCQCalculResult[] = [];
  
  equipe.employes.forEach(empEquipe => {
    const result = calculerCoutEmploye(
      empEquipe.employe,
      empEquipe.heuresHebdo * nombreSemaines,
      empEquipe.heuresSupp * nombreSemaines,
      empEquipe.heuresDouble * nombreSemaines
    );
    details.push(result);
  });
  
  const totalHeures = details.reduce((sum, d) => 
    sum + d.heuresRegulier + d.heuresSupp + d.heuresDouble, 0);
  const totalSalaireBrut = details.reduce((sum, d) => sum + d.salaireBrut, 0);
  const totalAvantages = details.reduce((sum, d) => sum + d.avantages.totalEmployeur, 0);
  const totalCoutEmployeur = details.reduce((sum, d) => sum + d.coutTotalEmployeur, 0);
  const tauxHoraireMoyenCharge = totalHeures > 0 ? totalCoutEmployeur / totalHeures : 0;
  
  return {
    equipe,
    periode: {
      debut: equipe.dateDebut,
      fin: equipe.dateFin || new Date().toISOString().split('T')[0]
    },
    totalHeures,
    totalSalaireBrut,
    totalAvantages,
    totalCoutEmployeur,
    tauxHoraireMoyenCharge,
    details
  };
}

/**
 * Obtenir le taux horaire chargé pour un métier/classe
 */
export function getTauxHoraireCharge(metierCode: string, classeNom: string): number {
  const metier = CCQ_TAUX_2024.find(m => m.code === metierCode);
  const classe = metier?.classes.find(c => c.nom === classeNom);
  
  if (!classe) return 0;
  
  // Estimer sur 40h/semaine régulières
  const salaireBrutHebdo = classe.tauxBase * 40;
  const avantages = calculerAvantages(salaireBrutHebdo);
  const coutHebdo = salaireBrutHebdo + avantages.totalEmployeur;
  
  return coutHebdo / 40;
}

/**
 * Rechercher des métiers
 */
export function rechercherMetiers(query: string): CCQMetier[] {
  const q = query.toLowerCase();
  return CCQ_TAUX_2024.filter(m => 
    m.nom.toLowerCase().includes(q) || 
    m.code.toLowerCase().includes(q)
  );
}

/**
 * Obtenir tous les métiers par secteur
 */
export function getMetiersParSecteur(secteur: 'IC' | 'GC' | 'RES' | 'VOIRIE'): CCQMetier[] {
  return CCQ_TAUX_2024.filter(m => m.secteur === secteur);
}

export default {
  calculerAvantages,
  calculerCoutEmploye,
  calculerCoutEquipe,
  getTauxHoraireCharge,
  rechercherMetiers,
  getMetiersParSecteur,
  CCQ_TAUX_2024,
  CCQ_AVANTAGES_2024
};
