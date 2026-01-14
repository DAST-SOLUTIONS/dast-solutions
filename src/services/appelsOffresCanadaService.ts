/**
 * Service Appels d'Offres Canada
 * Agrégateur: SEAO (Québec), MERX (Fédéral), BuyGC (GC), Bonfire
 */

import { supabase } from '../lib/supabase/client';

// Types communs pour tous les appels d'offres
export interface AppelOffre {
  id: string;
  source: 'seao' | 'merx' | 'buygc' | 'bonfire' | 'bids_tenders' | 'autre';
  numero: string;
  titre: string;
  organisme: string;
  organisme_type?: string;
  niveau_gouvernement: 'municipal' | 'provincial' | 'federal' | 'prive';
  type: 'construction' | 'services' | 'approvisionnement' | 'travaux_publics';
  categorie: string;
  sous_categorie?: string;
  region: string;
  province: string;
  ville?: string;
  date_publication: string;
  date_ouverture?: string;
  date_fermeture: string;
  estimation_min?: number;
  estimation_max?: number;
  budget_affiche?: string;
  description: string;
  exigences?: string[];
  documents?: DocumentAppelOffre[];
  contact?: ContactAppelOffre;
  statut: 'ouvert' | 'ferme' | 'annule' | 'attribue' | 'prolonge';
  url_source: string;
  date_sync: string;
  is_favori?: boolean;
  notes_internes?: string;
  soumission_id?: string; // Si on a soumissionné
}

export interface DocumentAppelOffre {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille?: number;
  date_ajout: string;
}

export interface ContactAppelOffre {
  nom: string;
  titre?: string;
  telephone?: string;
  courriel?: string;
}

export interface RechercheParams {
  sources?: ('seao' | 'merx' | 'buygc' | 'bonfire')[];
  motsCles?: string;
  region?: string;
  province?: string;
  niveau_gouvernement?: string;
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  statut?: string;
  favorisUniquement?: boolean;
}

// ============ MERX ============
export interface MERXAppelOffre {
  reference: string;
  title_en: string;
  title_fr: string;
  organization: string;
  gsin?: string; // Goods and Services Identification Number
  unspsc?: string[]; // UNSPSC codes
  region: string;
  close_date: string;
  publish_date: string;
  amendment_date?: string;
  contract_value?: { min: number; max: number };
  description: string;
  solicitation_type: string;
  url: string;
}

// ============ BUYGC (Achatsetventes.gc.ca) ============
export interface BuyGCAppelOffre {
  tender_id: string;
  title: string;
  organization: string;
  gsin: string;
  region: string;
  closing_date: string;
  publication_date: string;
  contract_history?: string;
  description: string;
  tender_type: string;
  url: string;
}

// ============ BONFIRE ============
export interface BonfireAppelOffre {
  opportunity_id: string;
  title: string;
  buyer_organization: string;
  category: string;
  close_date: string;
  open_date: string;
  description: string;
  location: string;
  budget_range?: string;
  url: string;
}

// Catégories GSIN (Goods and Services Identification Number) pertinentes pour construction
export const GSIN_CONSTRUCTION = {
  'N': 'Construction',
  'N1': 'Construction de bâtiments',
  'N10': 'Bâtiments résidentiels',
  'N11': 'Bâtiments commerciaux',
  'N12': 'Bâtiments industriels',
  'N13': 'Bâtiments institutionnels',
  'N2': 'Génie civil',
  'N20': 'Routes et autoroutes',
  'N21': 'Ponts et viaducs',
  'N22': 'Aqueducs et égouts',
  'N3': 'Travaux spécialisés',
  'N30': 'Électricité',
  'N31': 'Plomberie',
  'N32': 'CVAC',
  'N33': 'Structure',
  'Y': 'Services professionnels',
  'Y1': 'Architecture',
  'Y2': 'Ingénierie',
  'Y3': 'Gestion de projets'
};

// Provinces canadiennes
export const PROVINCES_CANADA = [
  { code: 'QC', nom: 'Québec', nom_en: 'Quebec' },
  { code: 'ON', nom: 'Ontario', nom_en: 'Ontario' },
  { code: 'BC', nom: 'Colombie-Britannique', nom_en: 'British Columbia' },
  { code: 'AB', nom: 'Alberta', nom_en: 'Alberta' },
  { code: 'SK', nom: 'Saskatchewan', nom_en: 'Saskatchewan' },
  { code: 'MB', nom: 'Manitoba', nom_en: 'Manitoba' },
  { code: 'NB', nom: 'Nouveau-Brunswick', nom_en: 'New Brunswick' },
  { code: 'NS', nom: 'Nouvelle-Écosse', nom_en: 'Nova Scotia' },
  { code: 'PE', nom: 'Île-du-Prince-Édouard', nom_en: 'Prince Edward Island' },
  { code: 'NL', nom: 'Terre-Neuve-et-Labrador', nom_en: 'Newfoundland and Labrador' },
  { code: 'YT', nom: 'Yukon', nom_en: 'Yukon' },
  { code: 'NT', nom: 'Territoires du Nord-Ouest', nom_en: 'Northwest Territories' },
  { code: 'NU', nom: 'Nunavut', nom_en: 'Nunavut' },
  { code: 'CA', nom: 'Pancanadien', nom_en: 'Pan-Canadian' }
];

class AppelsOffresCanadaService {
  private sources = {
    seao: 'https://seao.ca',
    merx: 'https://www.merx.com',
    buygc: 'https://achatsetventes.gc.ca',
    bonfire: 'https://gobonfire.com'
  };

  /**
   * Recherche unifiée dans toutes les sources
   */
  async rechercher(params: RechercheParams): Promise<AppelOffre[]> {
    const sources = params.sources || ['seao', 'merx', 'buygc', 'bonfire'];
    const resultats: AppelOffre[] = [];

    // Recherche parallèle dans toutes les sources
    const promesses = sources.map(async source => {
      try {
        switch (source) {
          case 'seao':
            return this.rechercherSEAO(params);
          case 'merx':
            return this.rechercherMERX(params);
          case 'buygc':
            return this.rechercherBuyGC(params);
          case 'bonfire':
            return this.rechercherBonfire(params);
          default:
            return [];
        }
      } catch (error) {
        console.error(`Erreur recherche ${source}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promesses);
    results.forEach(r => resultats.push(...r));

    // Trier par date de fermeture
    resultats.sort((a, b) => 
      new Date(a.date_fermeture).getTime() - new Date(b.date_fermeture).getTime()
    );

    // Filtrer favoris si demandé
    if (params.favorisUniquement) {
      return resultats.filter(r => r.is_favori);
    }

    return resultats;
  }

  /**
   * Recherche SEAO (Québec)
   */
  async rechercherSEAO(params: RechercheParams): Promise<AppelOffre[]> {
    try {
      let query = supabase
        .from('seao_appels_offres')
        .select('*')
        .order('date_fermeture', { ascending: true });

      if (params.statut) query = query.eq('statut', params.statut);
      if (params.motsCles) query = query.ilike('titre', `%${params.motsCles}%`);
      if (params.region) query = query.eq('region', params.region);

      const { data, error } = await query.limit(50);
      if (error) throw error;

      return (data || []).map((row: any) => this.mapSEAOToAppelOffre(row));
    } catch (error) {
      console.error('Erreur SEAO:', error);
      return this.getMockSEAO();
    }
  }

  /**
   * Recherche MERX (Fédéral)
   */
  async rechercherMERX(params: RechercheParams): Promise<AppelOffre[]> {
    try {
      // Essayer l'Edge Function
      const { data, error } = await supabase.functions.invoke('merx-search', {
        body: { params }
      });

      if (error) throw error;
      return (data?.results || []).map((row: any) => this.mapMERXToAppelOffre(row));
    } catch (error) {
      console.error('Erreur MERX:', error);
      return this.getMockMERX();
    }
  }

  /**
   * Recherche BuyGC (Achatsetventes.gc.ca)
   */
  async rechercherBuyGC(params: RechercheParams): Promise<AppelOffre[]> {
    try {
      const { data, error } = await supabase.functions.invoke('buygc-search', {
        body: { params }
      });

      if (error) throw error;
      return (data?.results || []).map((row: any) => this.mapBuyGCToAppelOffre(row));
    } catch (error) {
      console.error('Erreur BuyGC:', error);
      return this.getMockBuyGC();
    }
  }

  /**
   * Recherche Bonfire
   */
  async rechercherBonfire(params: RechercheParams): Promise<AppelOffre[]> {
    try {
      const { data, error } = await supabase.functions.invoke('bonfire-search', {
        body: { params }
      });

      if (error) throw error;
      return (data?.results || []).map((row: any) => this.mapBonfireToAppelOffre(row));
    } catch (error) {
      console.error('Erreur Bonfire:', error);
      return this.getMockBonfire();
    }
  }

  /**
   * Ajouter/retirer des favoris
   */
  async toggleFavori(appelOffreId: string, source: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Vérifier si déjà en favori
      const { data: existing } = await supabase
        .from('appels_offres_favoris')
        .select('id')
        .eq('user_id', userData.user?.id)
        .eq('appel_offre_id', appelOffreId)
        .eq('source', source)
        .single();

      if (existing) {
        await supabase
          .from('appels_offres_favoris')
          .delete()
          .eq('id', existing.id);
        return false;
      } else {
        await (supabase
          .from('appels_offres_favoris')
          .insert({
            user_id: userData.user?.id,
            appel_offre_id: appelOffreId,
            source: source
          } as any) as any);
        return true;
      }
    } catch (error) {
      console.error('Erreur toggle favori:', error);
      return false;
    }
  }

  /**
   * Configurer des alertes
   */
  async configurerAlerte(config: {
    motsCles?: string[];
    categories?: string[];
    regions?: string[];
    sources: string[];
    montantMin?: number;
    montantMax?: number;
    frequence: 'immediat' | 'quotidien' | 'hebdomadaire';
    email: string;
  }): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await (supabase
        .from('appels_offres_alertes')
        .insert({
          user_id: userData.user?.id,
          ...config,
          active: true
        } as any) as any);

      return true;
    } catch (error) {
      console.error('Erreur configuration alerte:', error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques
   */
  async getStatistiques(): Promise<{
    total: number;
    parSource: Record<string, number>;
    parStatut: Record<string, number>;
    fermetureProchaine: number;
  }> {
    const appels = await this.rechercher({});
    const maintenant = new Date();
    const dans7jours = new Date(maintenant.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: appels.length,
      parSource: appels.reduce((acc, a) => {
        acc[a.source] = (acc[a.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      parStatut: appels.reduce((acc, a) => {
        acc[a.statut] = (acc[a.statut] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      fermetureProchaine: appels.filter(a => 
        new Date(a.date_fermeture) <= dans7jours && a.statut === 'ouvert'
      ).length
    };
  }

  // ============ Mappers ============
  
  private mapSEAOToAppelOffre(row: any): AppelOffre {
    return {
      id: `seao_${row.id}`,
      source: 'seao',
      numero: row.numero_seao,
      titre: row.titre,
      organisme: row.organisme,
      organisme_type: row.organisme_type,
      niveau_gouvernement: 'provincial',
      type: row.type || 'construction',
      categorie: row.categorie,
      region: row.region,
      province: 'QC',
      ville: row.ville,
      date_publication: row.date_publication,
      date_ouverture: row.date_ouverture,
      date_fermeture: row.date_fermeture,
      estimation_min: row.estimation_min,
      estimation_max: row.estimation_max,
      budget_affiche: row.budget_affiche,
      description: row.description,
      exigences: row.exigences_rbq,
      documents: row.documents,
      statut: row.statut,
      url_source: row.url_seao,
      date_sync: row.updated_at,
      is_favori: row.is_favori
    };
  }

  private mapMERXToAppelOffre(row: MERXAppelOffre): AppelOffre {
    return {
      id: `merx_${row.reference}`,
      source: 'merx',
      numero: row.reference,
      titre: row.title_fr || row.title_en,
      organisme: row.organization,
      niveau_gouvernement: 'federal',
      type: this.determineType(row.gsin),
      categorie: row.gsin || 'N',
      region: row.region,
      province: 'CA',
      date_publication: row.publish_date,
      date_fermeture: row.close_date,
      estimation_min: row.contract_value?.min,
      estimation_max: row.contract_value?.max,
      description: row.description,
      statut: 'ouvert',
      url_source: row.url,
      date_sync: new Date().toISOString()
    };
  }

  private mapBuyGCToAppelOffre(row: BuyGCAppelOffre): AppelOffre {
    return {
      id: `buygc_${row.tender_id}`,
      source: 'buygc',
      numero: row.tender_id,
      titre: row.title,
      organisme: row.organization,
      niveau_gouvernement: 'federal',
      type: this.determineType(row.gsin),
      categorie: row.gsin,
      region: row.region,
      province: 'CA',
      date_publication: row.publication_date,
      date_fermeture: row.closing_date,
      description: row.description,
      statut: 'ouvert',
      url_source: row.url,
      date_sync: new Date().toISOString()
    };
  }

  private mapBonfireToAppelOffre(row: BonfireAppelOffre): AppelOffre {
    return {
      id: `bonfire_${row.opportunity_id}`,
      source: 'bonfire',
      numero: row.opportunity_id,
      titre: row.title,
      organisme: row.buyer_organization,
      niveau_gouvernement: 'municipal',
      type: 'construction',
      categorie: row.category,
      region: row.location,
      province: this.determineProvince(row.location),
      date_ouverture: row.open_date,
      date_fermeture: row.close_date,
      budget_affiche: row.budget_range,
      description: row.description,
      statut: 'ouvert',
      url_source: row.url,
      date_sync: new Date().toISOString()
    };
  }

  private determineType(gsin?: string): 'construction' | 'services' | 'approvisionnement' | 'travaux_publics' {
    if (!gsin) return 'construction';
    if (gsin.startsWith('N')) return 'construction';
    if (gsin.startsWith('Y')) return 'services';
    return 'approvisionnement';
  }

  private determineProvince(location: string): string {
    const loc = location.toLowerCase();
    if (loc.includes('québec') || loc.includes('quebec') || loc.includes('montreal')) return 'QC';
    if (loc.includes('ontario') || loc.includes('toronto')) return 'ON';
    if (loc.includes('british columbia') || loc.includes('vancouver')) return 'BC';
    if (loc.includes('alberta') || loc.includes('calgary') || loc.includes('edmonton')) return 'AB';
    return 'CA';
  }

  // ============ Mock Data ============
  
  private getMockSEAO(): AppelOffre[] {
    return [
      {
        id: 'seao_mock_1',
        source: 'seao',
        numero: 'SEAO-2026-001',
        titre: 'Rénovation école Saint-Jean-Baptiste',
        organisme: 'Centre de services scolaire de Montréal',
        organisme_type: 'Éducation',
        niveau_gouvernement: 'provincial',
        type: 'construction',
        categorie: 'batiment',
        region: 'Montréal',
        province: 'QC',
        ville: 'Montréal',
        date_publication: '2026-01-10',
        date_fermeture: '2026-02-15',
        estimation_min: 2500000,
        estimation_max: 3500000,
        description: 'Travaux de rénovation majeurs incluant toiture, fenestration et CVAC',
        exigences: ['1.1.1 - Entrepreneur général', '4.1 - Électricité'],
        statut: 'ouvert',
        url_source: 'https://seao.ca/OpportuniteAffaires/SEAO-2026-001',
        date_sync: new Date().toISOString()
      }
    ];
  }

  private getMockMERX(): AppelOffre[] {
    return [
      {
        id: 'merx_mock_1',
        source: 'merx',
        numero: 'PW-$$NT-001-2026',
        titre: 'Construction Centre de données - Gatineau',
        organisme: 'Services publics et Approvisionnement Canada',
        niveau_gouvernement: 'federal',
        type: 'construction',
        categorie: 'N13',
        region: 'Région de la capitale nationale',
        province: 'CA',
        date_publication: '2026-01-08',
        date_fermeture: '2026-02-28',
        estimation_min: 15000000,
        estimation_max: 25000000,
        description: 'Construction d\'un nouveau centre de données gouvernemental',
        statut: 'ouvert',
        url_source: 'https://merx.com/tenders/PW-NT-001-2026',
        date_sync: new Date().toISOString()
      }
    ];
  }

  private getMockBuyGC(): AppelOffre[] {
    return [
      {
        id: 'buygc_mock_1',
        source: 'buygc',
        numero: 'BUY-2026-00123',
        titre: 'Réfection toiture - Édifice fédéral Montréal',
        organisme: 'Services publics et Approvisionnement Canada',
        niveau_gouvernement: 'federal',
        type: 'construction',
        categorie: 'N1',
        region: 'Québec',
        province: 'QC',
        date_publication: '2026-01-12',
        date_fermeture: '2026-02-20',
        description: 'Remplacement complet de la membrane de toiture',
        statut: 'ouvert',
        url_source: 'https://achatsetventes.gc.ca/donnees-sur-lapprovisionnement/appels-doffres/BUY-2026-00123',
        date_sync: new Date().toISOString()
      }
    ];
  }

  private getMockBonfire(): AppelOffre[] {
    return [
      {
        id: 'bonfire_mock_1',
        source: 'bonfire',
        numero: 'BONFIRE-MTL-2026-01',
        titre: 'Aménagement parc municipal - Plateau Mont-Royal',
        organisme: 'Ville de Montréal',
        niveau_gouvernement: 'municipal',
        type: 'construction',
        categorie: 'Aménagement paysager',
        region: 'Montréal',
        province: 'QC',
        ville: 'Montréal',
        date_publication: '2026-01-11',
        date_fermeture: '2026-02-10',
        budget_affiche: '500 000$ - 800 000$',
        description: 'Réaménagement complet du parc incluant mobilier urbain et plantation',
        statut: 'ouvert',
        url_source: 'https://montreal.gobonfire.com/opportunities/BONFIRE-MTL-2026-01',
        date_sync: new Date().toISOString()
      }
    ];
  }
}

export const appelsOffresCanadaService = new AppelsOffresCanadaService();
export default appelsOffresCanadaService;
