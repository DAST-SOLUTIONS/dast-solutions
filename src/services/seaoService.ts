/**
 * Service SEAO - Système Électronique d'Appels d'Offres du Québec
 * Intégration avec l'API SEAO pour récupérer les appels d'offres publics
 */

import { supabase } from '../lib/supabase/client';

export interface SEAOAppelOffre {
  id: string;
  numeroSeao: string;
  titre: string;
  organisme: string;
  type: 'construction' | 'services' | 'approvisionnement';
  categorie: string;
  region: string;
  datePublication: string;
  dateOuverture: string;
  dateFermeture: string;
  estimationBudget?: number;
  description: string;
  documents: SEAODocument[];
  statut: 'ouvert' | 'ferme' | 'annule' | 'attribue';
  urlSeao: string;
}

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

class SEAOService {
  private cacheKey = 'seao_cache';
  private cacheDuration = 15 * 60 * 1000; // 15 minutes

  /**
   * Rechercher des appels d'offres sur SEAO
   */
  async searchAppelsOffres(params: SEAOSearchParams): Promise<SEAOAppelOffre[]> {
    try {
      // Vérifier le cache d'abord
      const cached = this.getFromCache(params);
      if (cached) return cached;

      // Appel à l'Edge Function Supabase pour scraping SEAO
      const { data, error } = await supabase.functions.invoke('seao-scraper', {
        body: { action: 'search', params }
      });

      if (error) throw error;

      const appelsOffres = data?.appelsOffres || [];
      
      // Sauvegarder en cache
      this.saveToCache(params, appelsOffres);
      
      // Sauvegarder en base pour historique
      await this.saveToDatabase(appelsOffres);

      return appelsOffres;
    } catch (error) {
      console.error('Erreur SEAO search:', error);
      // Fallback sur la base de données locale
      return this.getFromDatabase(params);
    }
  }

  /**
   * Récupérer les détails d'un appel d'offre
   */
  async getAppelOffreDetails(numeroSeao: string): Promise<SEAOAppelOffre | null> {
    try {
      const { data, error } = await supabase.functions.invoke('seao-scraper', {
        body: { action: 'details', numeroSeao }
      });

      if (error) throw error;
      return data?.appelOffre || null;
    } catch (error) {
      console.error('Erreur SEAO details:', error);
      
      // Fallback base de données
      const { data } = await supabase
        .from('seao_appels_offres')
        .select('*')
        .eq('numero_seao', numeroSeao)
        .single();
      
      return data ? this.mapToAppelOffre(data) : null;
    }
  }

  /**
   * S'abonner aux nouveaux appels d'offres (notifications)
   */
  async subscribeToAlerts(criteria: SEAOSearchParams, email: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('seao_alertes')
        .insert({
          user_id: user?.id,
          criteria: criteria,
          email: email,
          active: true
        });

      return !error;
    } catch (error) {
      console.error('Erreur subscription:', error);
      return false;
    }
  }

  /**
   * Récupérer les appels d'offres depuis la base de données
   */
  private async getFromDatabase(params: SEAOSearchParams): Promise<SEAOAppelOffre[]> {
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

    return data?.map(this.mapToAppelOffre) || [];
  }

  /**
   * Sauvegarder les appels d'offres en base
   */
  private async saveToDatabase(appelsOffres: SEAOAppelOffre[]): Promise<void> {
    for (const ao of appelsOffres) {
      await supabase
        .from('seao_appels_offres')
        .upsert({
          numero_seao: ao.numeroSeao,
          titre: ao.titre,
          organisme: ao.organisme,
          type: ao.type,
          categorie: ao.categorie,
          region: ao.region,
          date_publication: ao.datePublication,
          date_ouverture: ao.dateOuverture,
          date_fermeture: ao.dateFermeture,
          estimation_budget: ao.estimationBudget,
          description: ao.description,
          statut: ao.statut,
          url_seao: ao.urlSeao,
          updated_at: new Date().toISOString()
        }, { onConflict: 'numero_seao' });
    }
  }

  private mapToAppelOffre(row: any): SEAOAppelOffre {
    return {
      id: row.id,
      numeroSeao: row.numero_seao,
      titre: row.titre,
      organisme: row.organisme,
      type: row.type,
      categorie: row.categorie,
      region: row.region,
      datePublication: row.date_publication,
      dateOuverture: row.date_ouverture,
      dateFermeture: row.date_fermeture,
      estimationBudget: row.estimation_budget,
      description: row.description,
      documents: row.documents || [],
      statut: row.statut,
      urlSeao: row.url_seao
    };
  }

  private getFromCache(params: SEAOSearchParams): SEAOAppelOffre[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;
      
      const { timestamp, key, data } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheDuration) return null;
      if (JSON.stringify(params) !== key) return null;
      
      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(params: SEAOSearchParams, data: SEAOAppelOffre[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        timestamp: Date.now(),
        key: JSON.stringify(params),
        data
      }));
    } catch {
      // Cache full, ignore
    }
  }
}

export const seaoService = new SEAOService();
export default seaoService;
