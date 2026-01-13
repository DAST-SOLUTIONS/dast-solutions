/**
 * Service SEAO - Système Électronique d'Appels d'Offres du Québec
 */

import { supabase } from '../lib/supabase/client';

// Types exportés
export interface SEAODocument {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille: number;
}

export interface SEAOSearchParams {
  motsCles?: string;
  region?: string;
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  statut?: string;
}

// Type principal pour compatibilité avec SEAO.tsx (format snake_case)
export interface AppelOffreSEAO {
  id: string;
  numero_seao: string;
  titre: string;
  organisme: string;
  organisme_type?: string;
  type: 'construction' | 'services' | 'approvisionnement';
  categorie: string;
  region: string;
  ville?: string;
  date_publication: string;
  date_ouverture: string;
  date_fermeture: string;
  estimation_min?: number;
  estimation_max?: number;
  estimation_budget?: number;
  budget_affiche?: string;
  description: string;
  documents?: SEAODocument[];
  statut: 'ouvert' | 'ferme' | 'annule' | 'attribue';
  url_seao: string;
  is_favori?: boolean;
  exigences_rbq?: string[];
}

// Alias pour compatibilité avec anciens imports
export type SEAOAppelOffre = AppelOffreSEAO;

// Constantes exportées
export const CATEGORIES_CIBLES = [
  'Construction de bâtiments',
  'Travaux de génie civil',
  'Rénovation',
  'Maçonnerie',
  'Béton',
  'Charpente',
  'Électricité',
  'Plomberie',
  'CVAC'
];

export const REGIONS_QUEBEC = [
  'Montréal',
  'Québec',
  'Laval',
  'Longueuil',
  'Gatineau',
  'Sherbrooke',
  'Trois-Rivières',
  'Saguenay',
  'Lévis',
  'Terrebonne'
];

// Données mock pour tests
const MOCK_APPELS: AppelOffreSEAO[] = [
  {
    id: '1',
    numero_seao: 'SEAO-2026-001',
    titre: 'Rénovation de l\'école primaire Saint-Jean',
    organisme: 'Commission scolaire de Montréal',
    organisme_type: 'Commission scolaire',
    type: 'construction',
    categorie: 'batiment',
    region: 'Montréal',
    ville: 'Montréal',
    date_publication: '2026-01-05',
    date_ouverture: '2026-01-10',
    date_fermeture: '2026-02-15',
    estimation_min: 2000000,
    estimation_max: 3500000,
    description: 'Travaux de rénovation majeurs incluant toiture, fenestration et CVAC',
    statut: 'ouvert',
    url_seao: 'https://seao.ca/OpportuniteAffaires/ConsulterOpportuniteAffaires/SEAO-2026-001',
    exigences_rbq: ['1.1.1 - Entrepreneur général', '4.1 - Électricité']
  },
  {
    id: '2',
    numero_seao: 'SEAO-2026-002',
    titre: 'Construction d\'un nouveau centre sportif',
    organisme: 'Ville de Laval',
    organisme_type: 'Municipal',
    type: 'construction',
    categorie: 'batiment',
    region: 'Laval',
    ville: 'Laval',
    date_publication: '2026-01-08',
    date_ouverture: '2026-01-15',
    date_fermeture: '2026-02-28',
    estimation_min: 15000000,
    estimation_max: 20000000,
    description: 'Construction d\'un centre sportif multifonctionnel de 5000 m²',
    statut: 'ouvert',
    url_seao: 'https://seao.ca/OpportuniteAffaires/ConsulterOpportuniteAffaires/SEAO-2026-002',
    exigences_rbq: ['1.1.1 - Entrepreneur général']
  },
  {
    id: '3',
    numero_seao: 'SEAO-2026-003',
    titre: 'Réfection de la chaussée - Boulevard Henri-Bourassa',
    organisme: 'Ville de Québec',
    organisme_type: 'Municipal',
    type: 'construction',
    categorie: 'genie_civil',
    region: 'Québec',
    ville: 'Québec',
    date_publication: '2026-01-10',
    date_ouverture: '2026-01-20',
    date_fermeture: '2026-02-10',
    estimation_min: 5000000,
    estimation_max: 7000000,
    description: 'Réfection complète de la chaussée sur 3 km',
    statut: 'ouvert',
    url_seao: 'https://seao.ca/OpportuniteAffaires/ConsulterOpportuniteAffaires/SEAO-2026-003',
    exigences_rbq: ['3.1 - Entrepreneur en excavation']
  }
];

class SEAOService {
  private cacheKey = 'seao_cache';
  private cacheDuration = 15 * 60 * 1000;

  async searchAppelsOffres(params?: SEAOSearchParams): Promise<AppelOffreSEAO[]> {
    try {
      // Essayer d'abord la base de données
      const dbResults = await this.getFromDatabase(params || {});
      if (dbResults.length > 0) {
        return dbResults;
      }

      // Sinon retourner les données mock
      return this.filterMockData(MOCK_APPELS, params);
    } catch (error) {
      console.error('Erreur SEAO search:', error);
      return this.filterMockData(MOCK_APPELS, params);
    }
  }

  async getAppelOffreDetails(numeroSeao: string): Promise<AppelOffreSEAO | null> {
    try {
      const { data } = await supabase
        .from('seao_appels_offres')
        .select('*')
        .eq('numero_seao', numeroSeao)
        .single();
      
      return data ? this.mapToAppelOffre(data) : null;
    } catch (error) {
      console.error('Erreur SEAO details:', error);
      return MOCK_APPELS.find(a => a.numero_seao === numeroSeao) || null;
    }
  }

  async subscribeToAlerts(criteria: SEAOSearchParams, email: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await (supabase
        .from('seao_alertes')
        .insert({
          user_id: userData.user?.id,
          criteria: criteria,
          email: email,
          active: true
        } as any) as any);

      return true;
    } catch (error) {
      console.error('Erreur subscription:', error);
      return false;
    }
  }

  private async getFromDatabase(params: SEAOSearchParams): Promise<AppelOffreSEAO[]> {
    try {
      let query = supabase
        .from('seao_appels_offres')
        .select('*')
        .order('date_fermeture', { ascending: true });

      if (params.statut) {
        query = query.eq('statut', params.statut);
      }
      if (params.motsCles) {
        query = query.ilike('titre', `%${params.motsCles}%`);
      }
      if (params.region) {
        query = query.eq('region', params.region);
      }
      if (params.categorie) {
        query = query.eq('categorie', params.categorie);
      }

      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('Erreur DB SEAO:', error);
        return [];
      }

      return (data || []).map((row: any) => this.mapToAppelOffre(row));
    } catch {
      return [];
    }
  }

  private filterMockData(data: AppelOffreSEAO[], params?: SEAOSearchParams): AppelOffreSEAO[] {
    if (!params) return data;
    
    return data.filter(appel => {
      if (params.motsCles && !appel.titre.toLowerCase().includes(params.motsCles.toLowerCase())) {
        return false;
      }
      if (params.region && appel.region !== params.region) {
        return false;
      }
      if (params.categorie && appel.categorie !== params.categorie) {
        return false;
      }
      if (params.statut && appel.statut !== params.statut) {
        return false;
      }
      return true;
    });
  }

  private mapToAppelOffre(row: any): AppelOffreSEAO {
    return {
      id: row.id,
      numero_seao: row.numero_seao,
      titre: row.titre,
      organisme: row.organisme,
      organisme_type: row.organisme_type,
      type: row.type,
      categorie: row.categorie,
      region: row.region,
      ville: row.ville,
      date_publication: row.date_publication,
      date_ouverture: row.date_ouverture,
      date_fermeture: row.date_fermeture,
      estimation_min: row.estimation_min,
      estimation_max: row.estimation_max,
      estimation_budget: row.estimation_budget,
      budget_affiche: row.budget_affiche,
      description: row.description,
      documents: row.documents || [],
      statut: row.statut,
      url_seao: row.url_seao,
      is_favori: row.is_favori,
      exigences_rbq: row.exigences_rbq || []
    };
  }
}

export const seaoService = new SEAOService();

// Exports nommés pour compatibilité avec SEAO.tsx
export async function fetchAppelsOffresSEAO(params?: SEAOSearchParams): Promise<AppelOffreSEAO[]> {
  return seaoService.searchAppelsOffres(params);
}

export async function syncAppelsOffresSupabase(): Promise<void> {
  // Placeholder pour sync
}

export async function getAppelsOffresFromDB(params?: SEAOSearchParams): Promise<AppelOffreSEAO[]> {
  return seaoService.searchAppelsOffres(params);
}

export default seaoService;
