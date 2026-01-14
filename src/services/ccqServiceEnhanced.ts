/**
 * Service CCQ Enhanced - Taux horaires et données CCQ 2025-2026
 */

export interface CCQMetier {
  code: string;
  nom: string;
  secteurs?: string[];
  description?: string;
  id?: string;
  name_fr?: string;
}

export interface CCQSecteur {
  code: string;
  nom: string;
  nom_complet: string;
  id?: string;
  name_fr?: string;
}

export interface CCQTauxHoraire {
  taux_base: number;
  vacances: number;
  conges_feries: number;
  assurance: number;
  retraite: number;
  formation: number;
  total_employeur: number;
}

export const CCQ_METIERS: CCQMetier[] = [
  { code: 'ELEC', nom: 'Électricien', id: 'elec', name_fr: 'Électricien' },
  { code: 'PLOMB', nom: 'Plombier', id: 'plomb', name_fr: 'Plombier' },
  { code: 'CHARP', nom: 'Charpentier-menuisier', id: 'charp', name_fr: 'Charpentier-menuisier' },
  { code: 'BRIC', nom: 'Briqueteur-maçon', id: 'bric', name_fr: 'Briqueteur-maçon' },
  { code: 'PEINT', nom: 'Peintre', id: 'peint', name_fr: 'Peintre' },
  { code: 'FERR', nom: 'Ferrailleur', id: 'ferr', name_fr: 'Ferrailleur' },
  { code: 'COUT', nom: 'Couvreur', id: 'cout', name_fr: 'Couvreur' },
  { code: 'GIPS', nom: 'Tireur de joints / Plâtrier', id: 'gips', name_fr: 'Tireur de joints / Plâtrier' },
  { code: 'MECAN', nom: 'Mécanicien de chantier', id: 'mecan', name_fr: 'Mécanicien de chantier' },
  { code: 'GRUT', nom: 'Grutier', id: 'grut', name_fr: 'Grutier' },
  { code: 'OPER', nom: 'Opérateur de machinerie lourde', id: 'oper', name_fr: 'Opérateur de machinerie lourde' },
  { code: 'JOURN', nom: 'Journalier', id: 'journ', name_fr: 'Journalier' }
];

export const CCQ_SECTEURS: CCQSecteur[] = [
  { code: 'CI', nom: 'Institutionnel et Commercial', nom_complet: 'Secteur Institutionnel et Commercial', id: 'ci', name_fr: 'Institutionnel et Commercial' },
  { code: 'IC', nom: 'Industriel', nom_complet: 'Secteur Industriel', id: 'ic', name_fr: 'Industriel' },
  { code: 'GC', nom: 'Génie civil', nom_complet: 'Secteur Génie civil et voirie', id: 'gc', name_fr: 'Génie civil' },
  { code: 'RES', nom: 'Résidentiel', nom_complet: 'Secteur Résidentiel', id: 'res', name_fr: 'Résidentiel' }
];

export const CCQ_TAUX_2025_2026: Record<string, Record<string, CCQTauxHoraire>> = {
  CI: {
    electricien: { taux_base: 45.82, vacances: 6.01, conges_feries: 3.67, assurance: 3.89, retraite: 4.12, formation: 0.35, total_employeur: 63.86 },
    plombier: { taux_base: 45.82, vacances: 6.01, conges_feries: 3.67, assurance: 3.89, retraite: 4.12, formation: 0.35, total_employeur: 63.86 },
    charpentier: { taux_base: 43.48, vacances: 5.70, conges_feries: 3.48, assurance: 3.69, retraite: 3.91, formation: 0.35, total_employeur: 60.61 },
    briqueteur: { taux_base: 44.65, vacances: 5.85, conges_feries: 3.57, assurance: 3.79, retraite: 4.02, formation: 0.35, total_employeur: 62.23 },
    peintre: { taux_base: 41.14, vacances: 5.39, conges_feries: 3.29, assurance: 3.49, retraite: 3.70, formation: 0.35, total_employeur: 57.36 },
    ferrailleur: { taux_base: 44.65, vacances: 5.85, conges_feries: 3.57, assurance: 3.79, retraite: 4.02, formation: 0.35, total_employeur: 62.23 },
    couvreur: { taux_base: 43.48, vacances: 5.70, conges_feries: 3.48, assurance: 3.69, retraite: 3.91, formation: 0.35, total_employeur: 60.61 },
    gipsier: { taux_base: 42.31, vacances: 5.55, conges_feries: 3.38, assurance: 3.59, retraite: 3.81, formation: 0.35, total_employeur: 58.99 },
    mecanicien: { taux_base: 46.99, vacances: 6.16, conges_feries: 3.76, assurance: 3.99, retraite: 4.23, formation: 0.35, total_employeur: 65.48 },
    grutier: { taux_base: 48.16, vacances: 6.31, conges_feries: 3.85, assurance: 4.09, retraite: 4.33, formation: 0.35, total_employeur: 67.09 },
    operateur: { taux_base: 44.65, vacances: 5.85, conges_feries: 3.57, assurance: 3.79, retraite: 4.02, formation: 0.35, total_employeur: 62.23 },
    journalier: { taux_base: 35.46, vacances: 4.65, conges_feries: 2.84, assurance: 3.01, retraite: 3.19, formation: 0.35, total_employeur: 49.50 }
  },
  IC: {
    electricien: { taux_base: 47.00, vacances: 6.16, conges_feries: 3.76, assurance: 3.99, retraite: 4.23, formation: 0.35, total_employeur: 65.49 },
    plombier: { taux_base: 47.00, vacances: 6.16, conges_feries: 3.76, assurance: 3.99, retraite: 4.23, formation: 0.35, total_employeur: 65.49 },
    charpentier: { taux_base: 44.60, vacances: 5.85, conges_feries: 3.57, assurance: 3.79, retraite: 4.01, formation: 0.35, total_employeur: 62.17 },
    journalier: { taux_base: 36.38, vacances: 4.77, conges_feries: 2.91, assurance: 3.09, retraite: 3.27, formation: 0.35, total_employeur: 50.77 }
  },
  GC: {
    operateur: { taux_base: 45.82, vacances: 6.01, conges_feries: 3.67, assurance: 3.89, retraite: 4.12, formation: 0.35, total_employeur: 63.86 },
    journalier: { taux_base: 36.38, vacances: 4.77, conges_feries: 2.91, assurance: 3.09, retraite: 3.27, formation: 0.35, total_employeur: 50.77 }
  },
  RES: {
    electricien: { taux_base: 42.50, vacances: 5.57, conges_feries: 3.40, assurance: 3.61, retraite: 3.83, formation: 0.35, total_employeur: 59.26 },
    plombier: { taux_base: 42.50, vacances: 5.57, conges_feries: 3.40, assurance: 3.61, retraite: 3.83, formation: 0.35, total_employeur: 59.26 },
    charpentier: { taux_base: 40.32, vacances: 5.29, conges_feries: 3.23, assurance: 3.42, retraite: 3.63, formation: 0.35, total_employeur: 56.24 },
    journalier: { taux_base: 32.90, vacances: 4.31, conges_feries: 2.63, assurance: 2.79, retraite: 2.96, formation: 0.35, total_employeur: 45.94 }
  }
};

export function getTauxHoraire(secteur: string, metier: string): CCQTauxHoraire | null {
  const tauxSecteur = CCQ_TAUX_2025_2026[secteur];
  if (!tauxSecteur) return null;
  return tauxSecteur[metier.toLowerCase()] || null;
}

export function calculerCoutMain(
  secteur: string, 
  metier: string, 
  heures: number, 
  nombreTravailleurs: number = 1
): { tauxBase: number; totalEmployeur: number; coutTotal: number } | null {
  const taux = getTauxHoraire(secteur, metier);
  if (!taux) return null;
  
  return {
    tauxBase: taux.taux_base,
    totalEmployeur: taux.total_employeur,
    coutTotal: taux.total_employeur * heures * nombreTravailleurs
  };
}

export default {
  CCQ_METIERS,
  CCQ_SECTEURS,
  CCQ_TAUX_2025_2026,
  getTauxHoraire,
  calculerCoutMain
};
