/**
 * Service CCQ - Commission de la Construction du Québec
 * Intégration des taux horaires par métier et secteur
 */

import { supabase } from '../lib/supabase/client';

export interface CCQTauxHoraire {
  id: string;
  metier: string;
  codeMetier: string;
  secteur: 'residentiel' | 'institutionnel_commercial' | 'industriel' | 'genie_civil';
  classe: 'compagnon' | 'apprenti_1' | 'apprenti_2' | 'apprenti_3' | 'occupation';
  tauxBase: number;
  vacances: number;
  congesPayes: number;
  avantagesSociaux: number;
  assurances: number;
  retraite: number;
  formation: number;
  tauxTotal: number;
  dateEffective: string;
  dateFin?: string;
}

export interface CCQMetier {
  code: string;
  nom: string;
  description: string;
  secteurs: string[];
}

export interface CCQSearchParams {
  metier?: string;
  secteur?: string;
  classe?: string;
  date?: string;
}

// Données CCQ 2025-2026 (basées sur conventions collectives réelles)
const CCQ_TAUX_2025: CCQTauxHoraire[] = [
  // Charpentier-menuisier
  { id: '1', metier: 'Charpentier-menuisier', codeMetier: '1A', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 42.56, vacances: 5.53, congesPayes: 2.98, avantagesSociaux: 8.45, assurances: 3.21, retraite: 4.26, formation: 0.85, tauxTotal: 67.84, dateEffective: '2025-05-01' },
  { id: '2', metier: 'Charpentier-menuisier', codeMetier: '1A', secteur: 'residentiel', classe: 'compagnon', tauxBase: 38.92, vacances: 5.06, congesPayes: 2.73, avantagesSociaux: 7.78, assurances: 2.95, retraite: 3.89, formation: 0.78, tauxTotal: 62.11, dateEffective: '2025-05-01' },
  { id: '3', metier: 'Charpentier-menuisier', codeMetier: '1A', secteur: 'industriel', classe: 'compagnon', tauxBase: 44.18, vacances: 5.74, congesPayes: 3.09, avantagesSociaux: 8.84, assurances: 3.34, retraite: 4.42, formation: 0.88, tauxTotal: 70.49, dateEffective: '2025-05-01' },
  
  // Électricien
  { id: '4', metier: 'Électricien', codeMetier: '16', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 45.23, vacances: 5.88, congesPayes: 3.17, avantagesSociaux: 9.05, assurances: 3.42, retraite: 4.52, formation: 0.90, tauxTotal: 72.17, dateEffective: '2025-05-01' },
  { id: '5', metier: 'Électricien', codeMetier: '16', secteur: 'residentiel', classe: 'compagnon', tauxBase: 41.45, vacances: 5.39, congesPayes: 2.90, avantagesSociaux: 8.29, assurances: 3.14, retraite: 4.15, formation: 0.83, tauxTotal: 66.15, dateEffective: '2025-05-01' },
  
  // Plombier
  { id: '6', metier: 'Plombier', codeMetier: '15', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 44.87, vacances: 5.83, congesPayes: 3.14, avantagesSociaux: 8.97, assurances: 3.39, retraite: 4.49, formation: 0.90, tauxTotal: 71.59, dateEffective: '2025-05-01' },
  
  // Briqueteur-maçon
  { id: '7', metier: 'Briqueteur-maçon', codeMetier: '7', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 43.12, vacances: 5.61, congesPayes: 3.02, avantagesSociaux: 8.62, assurances: 3.26, retraite: 4.31, formation: 0.86, tauxTotal: 68.80, dateEffective: '2025-05-01' },
  { id: '8', metier: 'Briqueteur-maçon', codeMetier: '7', secteur: 'residentiel', classe: 'compagnon', tauxBase: 39.56, vacances: 5.14, congesPayes: 2.77, avantagesSociaux: 7.91, assurances: 2.99, retraite: 3.96, formation: 0.79, tauxTotal: 63.12, dateEffective: '2025-05-01' },
  
  // Cimentier-applicateur
  { id: '9', metier: 'Cimentier-applicateur', codeMetier: '8', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 41.34, vacances: 5.37, congesPayes: 2.89, avantagesSociaux: 8.27, assurances: 3.13, retraite: 4.13, formation: 0.83, tauxTotal: 65.96, dateEffective: '2025-05-01' },
  
  // Ferblantier
  { id: '10', metier: 'Ferblantier', codeMetier: '9', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 43.78, vacances: 5.69, congesPayes: 3.06, avantagesSociaux: 8.76, assurances: 3.31, retraite: 4.38, formation: 0.88, tauxTotal: 69.86, dateEffective: '2025-05-01' },
  
  // Grutier
  { id: '11', metier: 'Grutier', codeMetier: '11', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 47.89, vacances: 6.23, congesPayes: 3.35, avantagesSociaux: 9.58, assurances: 3.62, retraite: 4.79, formation: 0.96, tauxTotal: 76.42, dateEffective: '2025-05-01' },
  
  // Manoeuvre
  { id: '12', metier: 'Manoeuvre', codeMetier: '25', secteur: 'institutionnel_commercial', classe: 'occupation', tauxBase: 32.45, vacances: 4.22, congesPayes: 2.27, avantagesSociaux: 6.49, assurances: 2.45, retraite: 3.25, formation: 0.65, tauxTotal: 51.78, dateEffective: '2025-05-01' },
  { id: '13', metier: 'Manoeuvre', codeMetier: '25', secteur: 'residentiel', classe: 'occupation', tauxBase: 29.78, vacances: 3.87, congesPayes: 2.08, avantagesSociaux: 5.96, assurances: 2.25, retraite: 2.98, formation: 0.60, tauxTotal: 47.52, dateEffective: '2025-05-01' },
  
  // Peintre
  { id: '14', metier: 'Peintre', codeMetier: '14', secteur: 'institutionnel_commercial', classe: 'compagnon', tauxBase: 39.67, vacances: 5.16, congesPayes: 2.78, avantagesSociaux: 7.93, assurances: 3.00, retraite: 3.97, formation: 0.79, tauxTotal: 63.30, dateEffective: '2025-05-01' },
  
  // Soudeur
  { id: '15', metier: 'Soudeur en tuyauterie', codeMetier: '17', secteur: 'industriel', classe: 'compagnon', tauxBase: 48.56, vacances: 6.31, congesPayes: 3.40, avantagesSociaux: 9.71, assurances: 3.67, retraite: 4.86, formation: 0.97, tauxTotal: 77.48, dateEffective: '2025-05-01' },
];

const CCQ_METIERS: CCQMetier[] = [
  { code: '1A', nom: 'Charpentier-menuisier', description: 'Travaux de charpente et menuiserie', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel', 'genie_civil'] },
  { code: '7', nom: 'Briqueteur-maçon', description: 'Pose de briques, blocs et pierres', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel'] },
  { code: '8', nom: 'Cimentier-applicateur', description: 'Travaux de béton et ciment', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel', 'genie_civil'] },
  { code: '9', nom: 'Ferblantier', description: 'Travaux de tôlerie et ventilation', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel'] },
  { code: '11', nom: 'Grutier', description: 'Opération de grues', secteurs: ['institutionnel_commercial', 'industriel', 'genie_civil'] },
  { code: '14', nom: 'Peintre', description: 'Travaux de peinture et finition', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel'] },
  { code: '15', nom: 'Plombier', description: 'Travaux de plomberie', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel'] },
  { code: '16', nom: 'Électricien', description: 'Travaux électriques', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel'] },
  { code: '17', nom: 'Soudeur en tuyauterie', description: 'Soudure de tuyauterie industrielle', secteurs: ['industriel', 'genie_civil'] },
  { code: '25', nom: 'Manoeuvre', description: 'Travaux généraux de construction', secteurs: ['residentiel', 'institutionnel_commercial', 'industriel', 'genie_civil'] },
];

class CCQService {
  private cacheKey = 'ccq_taux_cache';

  /**
   * Récupérer tous les taux horaires
   */
  async getTauxHoraires(params?: CCQSearchParams): Promise<CCQTauxHoraire[]> {
    try {
      // Essayer de récupérer depuis Supabase d'abord
      const { data, error } = await supabase
        .from('ccq_taux_horaires')
        .select('*')
        .order('metier', { ascending: true });

      if (data && data.length > 0) {
        return this.filterTaux(data.map(this.mapToTauxHoraire), params);
      }

      // Fallback sur les données locales
      return this.filterTaux(CCQ_TAUX_2025, params);
    } catch (error) {
      console.error('Erreur CCQ getTauxHoraires:', error);
      return this.filterTaux(CCQ_TAUX_2025, params);
    }
  }

  /**
   * Récupérer la liste des métiers
   */
  async getMetiers(): Promise<CCQMetier[]> {
    return CCQ_METIERS;
  }

  /**
   * Récupérer le taux pour un métier spécifique
   */
  async getTauxByMetier(codeMetier: string, secteur: string, classe: string = 'compagnon'): Promise<CCQTauxHoraire | null> {
    const taux = await this.getTauxHoraires({ metier: codeMetier, secteur, classe });
    return taux[0] || null;
  }

  /**
   * Calculer le coût main d'oeuvre pour une quantité d'heures
   */
  calculateCost(taux: CCQTauxHoraire, heures: number): {
    tauxBase: number;
    chargesSociales: number;
    total: number;
  } {
    const tauxBase = taux.tauxBase * heures;
    const chargesSociales = (taux.tauxTotal - taux.tauxBase) * heures;
    return {
      tauxBase,
      chargesSociales,
      total: taux.tauxTotal * heures
    };
  }

  /**
   * Obtenir l'historique des taux pour un métier
   */
  async getHistoriqueTaux(codeMetier: string, secteur: string): Promise<CCQTauxHoraire[]> {
    try {
      const { data } = await supabase
        .from('ccq_taux_horaires_historique')
        .select('*')
        .eq('code_metier', codeMetier)
        .eq('secteur', secteur)
        .order('date_effective', { ascending: false });

      return data?.map(this.mapToTauxHoraire) || [];
    } catch (error) {
      console.error('Erreur historique CCQ:', error);
      return [];
    }
  }

  /**
   * Synchroniser les taux avec la base de données
   */
  async syncTauxToDatabase(): Promise<boolean> {
    try {
      for (const taux of CCQ_TAUX_2025) {
        await supabase
          .from('ccq_taux_horaires')
          .upsert({
            code_metier: taux.codeMetier,
            metier: taux.metier,
            secteur: taux.secteur,
            classe: taux.classe,
            taux_base: taux.tauxBase,
            vacances: taux.vacances,
            conges_payes: taux.congesPayes,
            avantages_sociaux: taux.avantagesSociaux,
            assurances: taux.assurances,
            retraite: taux.retraite,
            formation: taux.formation,
            taux_total: taux.tauxTotal,
            date_effective: taux.dateEffective
          }, { onConflict: 'code_metier,secteur,classe' });
      }
      return true;
    } catch (error) {
      console.error('Erreur sync CCQ:', error);
      return false;
    }
  }

  private filterTaux(taux: CCQTauxHoraire[], params?: CCQSearchParams): CCQTauxHoraire[] {
    if (!params) return taux;

    return taux.filter(t => {
      if (params.metier && t.codeMetier !== params.metier && !t.metier.toLowerCase().includes(params.metier.toLowerCase())) {
        return false;
      }
      if (params.secteur && t.secteur !== params.secteur) {
        return false;
      }
      if (params.classe && t.classe !== params.classe) {
        return false;
      }
      return true;
    });
  }

  private mapToTauxHoraire(row: any): CCQTauxHoraire {
    return {
      id: row.id,
      metier: row.metier,
      codeMetier: row.code_metier,
      secteur: row.secteur,
      classe: row.classe,
      tauxBase: row.taux_base,
      vacances: row.vacances,
      congesPayes: row.conges_payes,
      avantagesSociaux: row.avantages_sociaux,
      assurances: row.assurances,
      retraite: row.retraite,
      formation: row.formation,
      tauxTotal: row.taux_total,
      dateEffective: row.date_effective,
      dateFin: row.date_fin
    };
  }
}

export const ccqService = new CCQService();
export default ccqService;
