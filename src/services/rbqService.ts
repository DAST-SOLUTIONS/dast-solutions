/**
 * Service RBQ - Régie du bâtiment du Québec
 * Vérification des licences, répertoire des entrepreneurs, infractions
 */

import { supabase } from '../lib/supabase/client';

// Types RBQ
export interface RBQEntrepreneur {
  neq: string; // Numéro d'entreprise du Québec
  nom_entreprise: string;
  nom_dirigeant?: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone?: string;
  courriel?: string;
  site_web?: string;
  licence: RBQLicence;
  infractions: RBQInfraction[];
  statut: 'actif' | 'suspendu' | 'revoque' | 'expire';
  date_verification: string;
}

export interface RBQLicence {
  numero: string;
  categorie: RBQCategorie[];
  date_emission: string;
  date_expiration: string;
  statut: 'valide' | 'suspendue' | 'revoquee' | 'expiree';
  restrictions?: string[];
  cautionnement: number;
}

export interface RBQCategorie {
  code: string;
  description: string;
  sous_categories?: RBQSousCategorie[];
}

export interface RBQSousCategorie {
  code: string;
  description: string;
}

export interface RBQInfraction {
  date: string;
  type: string;
  description: string;
  decision: string;
  amende?: number;
}

// Catégories RBQ officielles
export const RBQ_CATEGORIES = {
  '1': {
    nom: 'Bâtiments résidentiels neufs et petits bâtiments',
    sous_categories: {
      '1.1': 'Bâtiments de 4 logements ou moins et maisons',
      '1.1.1': 'Entrepreneur général',
      '1.1.2': 'Petits travaux de rénovation',
      '1.2': 'Petits bâtiments autres que résidentiels'
    }
  },
  '2': {
    nom: 'Bâtiments résidentiels de type mixte ou de grande hauteur',
    sous_categories: {
      '2.1': 'Pour l\'ensemble des travaux',
      '2.2': 'Bâtiments de 5 à 8 logements',
      '2.3': 'Bâtiments de plus de 8 logements'
    }
  },
  '3': {
    nom: 'Travaux de génie civil et voirie',
    sous_categories: {
      '3.1': 'Ouvrages de génie civil',
      '3.2': 'Voirie municipale et travaux connexes'
    }
  },
  '4': {
    nom: 'Électricité',
    sous_categories: {
      '4.1': 'Installations électriques',
      '4.2': 'Appareillage électrique',
      '4.3': 'Systèmes d\'alarme et sécurité'
    }
  },
  '5': {
    nom: 'Gaz',
    sous_categories: {
      '5.1': 'Installations de gaz',
      '5.2': 'Appareils au gaz'
    }
  },
  '6': {
    nom: 'Plomberie',
    sous_categories: {
      '6.1': 'Plomberie'
    }
  },
  '7': {
    nom: 'Chauffage',
    sous_categories: {
      '7.1': 'Systèmes de chauffage',
      '7.2': 'Systèmes de ventilation',
      '7.3': 'Climatisation et réfrigération'
    }
  },
  '8': {
    nom: 'Équipements pétroliers',
    sous_categories: {
      '8.1': 'Réservoirs et tuyauterie',
      '8.2': 'Appareils de distribution'
    }
  },
  '9': {
    nom: 'Ascenseurs et autres appareils élévateurs',
    sous_categories: {
      '9.1': 'Ascenseurs',
      '9.2': 'Monte-charges et escaliers mécaniques'
    }
  },
  '10': {
    nom: 'Systèmes de gicleurs',
    sous_categories: {
      '10.1': 'Systèmes de gicleurs'
    }
  },
  '11': {
    nom: 'Construction d\'aires de glissement',
    sous_categories: {
      '11.1': 'Aires de glissement'
    }
  },
  '12': {
    nom: 'Installations sous pression',
    sous_categories: {
      '12.1': 'Chaudières et récipients sous pression'
    }
  },
  '13': {
    nom: 'Travaux d\'excavation et de forage',
    sous_categories: {
      '13.1': 'Excavation et terrassement',
      '13.2': 'Forage et sondage'
    }
  },
  '14': {
    nom: 'Travaux de fondations',
    sous_categories: {
      '14.1': 'Fondations profondes',
      '14.2': 'Fondations superficielles'
    }
  },
  '15': {
    nom: 'Structures de béton',
    sous_categories: {
      '15.1': 'Structures de béton armé',
      '15.2': 'Structures de béton précontraint'
    }
  },
  '16': {
    nom: 'Structures d\'acier et métalliques',
    sous_categories: {
      '16.1': 'Charpentes d\'acier',
      '16.2': 'Revêtements métalliques'
    }
  }
};

// Régions administratives RBQ
export const RBQ_REGIONS = [
  { code: '01', nom: 'Bas-Saint-Laurent' },
  { code: '02', nom: 'Saguenay–Lac-Saint-Jean' },
  { code: '03', nom: 'Capitale-Nationale' },
  { code: '04', nom: 'Mauricie' },
  { code: '05', nom: 'Estrie' },
  { code: '06', nom: 'Montréal' },
  { code: '07', nom: 'Outaouais' },
  { code: '08', nom: 'Abitibi-Témiscamingue' },
  { code: '09', nom: 'Côte-Nord' },
  { code: '10', nom: 'Nord-du-Québec' },
  { code: '11', nom: 'Gaspésie–Îles-de-la-Madeleine' },
  { code: '12', nom: 'Chaudière-Appalaches' },
  { code: '13', nom: 'Laval' },
  { code: '14', nom: 'Lanaudière' },
  { code: '15', nom: 'Laurentides' },
  { code: '16', nom: 'Montérégie' },
  { code: '17', nom: 'Centre-du-Québec' }
];

class RBQService {
  private baseUrl = 'https://www.rbq.gouv.qc.ca';
  
  /**
   * Vérifier une licence RBQ
   */
  async verifierLicence(numeroLicence: string): Promise<RBQEntrepreneur | null> {
    try {
      // Essayer d'abord notre cache/base de données
      const cached = await this.getFromDatabase(numeroLicence);
      if (cached && this.isCacheValid(cached.date_verification)) {
        return cached;
      }

      // Appeler l'Edge Function pour scraper RBQ
      const { data, error } = await supabase.functions.invoke('rbq-verification', {
        body: { action: 'verify', licenceNumber: numeroLicence }
      });

      if (error) throw error;

      if (data?.entrepreneur) {
        // Sauvegarder en cache
        await this.saveToDatabase(data.entrepreneur);
        return data.entrepreneur;
      }

      return null;
    } catch (error) {
      console.error('Erreur vérification RBQ:', error);
      return this.getFromDatabase(numeroLicence);
    }
  }

  /**
   * Rechercher des entrepreneurs par critères
   */
  async rechercherEntrepreneurs(params: {
    nom?: string;
    ville?: string;
    region?: string;
    categorie?: string;
    statut?: string;
  }): Promise<RBQEntrepreneur[]> {
    try {
      let query = supabase
        .from('rbq_entrepreneurs')
        .select('*')
        .eq('statut', params.statut || 'actif')
        .order('nom_entreprise', { ascending: true });

      if (params.nom) {
        query = query.ilike('nom_entreprise', `%${params.nom}%`);
      }
      if (params.ville) {
        query = query.ilike('ville', `%${params.ville}%`);
      }
      if (params.region) {
        query = query.eq('region', params.region);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;

      // Filtrer par catégorie côté client si nécessaire
      if (params.categorie && data) {
        return data.filter((e: any) => 
          e.licence?.categorie?.some((c: any) => c.code.startsWith(params.categorie!))
        );
      }

      return data || [];
    } catch (error) {
      console.error('Erreur recherche RBQ:', error);
      return [];
    }
  }

  /**
   * Vérifier si un entrepreneur a les catégories requises pour un projet
   */
  async verifierCategoriePourProjet(
    numeroLicence: string, 
    categoriesRequises: string[]
  ): Promise<{
    valide: boolean;
    categoriesManquantes: string[];
    entrepreneur?: RBQEntrepreneur;
  }> {
    const entrepreneur = await this.verifierLicence(numeroLicence);
    
    if (!entrepreneur) {
      return { 
        valide: false, 
        categoriesManquantes: categoriesRequises 
      };
    }

    const categoriesEntrepreneur = entrepreneur.licence.categorie.map(c => c.code);
    const categoriesManquantes = categoriesRequises.filter(
      req => !categoriesEntrepreneur.some(cat => cat.startsWith(req) || req.startsWith(cat))
    );

    return {
      valide: categoriesManquantes.length === 0 && entrepreneur.licence.statut === 'valide',
      categoriesManquantes,
      entrepreneur
    };
  }

  /**
   * Obtenir les infractions d'un entrepreneur
   */
  async getInfractions(numeroLicence: string): Promise<RBQInfraction[]> {
    const entrepreneur = await this.verifierLicence(numeroLicence);
    return entrepreneur?.infractions || [];
  }

  /**
   * Générer le lien de vérification RBQ
   */
  getLienVerification(numeroLicence: string): string {
    return `${this.baseUrl}/services-en-ligne/verification-licence/?licence=${numeroLicence}`;
  }

  /**
   * Formater un numéro de licence RBQ
   */
  formaterNumeroLicence(numero: string): string {
    // Format: 1234-5678-90
    const cleaned = numero.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return numero;
  }

  private async getFromDatabase(numeroLicence: string): Promise<RBQEntrepreneur | null> {
    try {
      const { data } = await supabase
        .from('rbq_entrepreneurs')
        .select('*')
        .eq('licence_numero', numeroLicence.replace(/-/g, ''))
        .single();
      
      return data ? this.mapToEntrepreneur(data) : null;
    } catch {
      return null;
    }
  }

  private async saveToDatabase(entrepreneur: RBQEntrepreneur): Promise<void> {
    try {
      await (supabase.from('rbq_entrepreneurs').upsert({
        neq: entrepreneur.neq,
        nom_entreprise: entrepreneur.nom_entreprise,
        nom_dirigeant: entrepreneur.nom_dirigeant,
        adresse: entrepreneur.adresse,
        ville: entrepreneur.ville,
        code_postal: entrepreneur.code_postal,
        telephone: entrepreneur.telephone,
        courriel: entrepreneur.courriel,
        site_web: entrepreneur.site_web,
        licence_numero: entrepreneur.licence.numero.replace(/-/g, ''),
        licence: entrepreneur.licence,
        infractions: entrepreneur.infractions,
        statut: entrepreneur.statut,
        date_verification: new Date().toISOString()
      } as any) as any);
    } catch (error) {
      console.error('Erreur sauvegarde RBQ:', error);
    }
  }

  private mapToEntrepreneur(row: any): RBQEntrepreneur {
    return {
      neq: row.neq,
      nom_entreprise: row.nom_entreprise,
      nom_dirigeant: row.nom_dirigeant,
      adresse: row.adresse,
      ville: row.ville,
      code_postal: row.code_postal,
      telephone: row.telephone,
      courriel: row.courriel,
      site_web: row.site_web,
      licence: row.licence,
      infractions: row.infractions || [],
      statut: row.statut,
      date_verification: row.date_verification
    };
  }

  private isCacheValid(dateVerification: string): boolean {
    const cacheDate = new Date(dateVerification);
    const now = new Date();
    const diffDays = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 7; // Cache valide 7 jours
  }
}

export const rbqService = new RBQService();

// ============ EXPORTS POUR COMPATIBILITÉ ============

// Type alias pour compatibilité avec l'ancien code
export interface RBQVerificationResult {
  success: boolean;
  valid: boolean;
  entrepreneur?: RBQEntrepreneur;
  licenseNumber?: string;
  companyName?: string;
  categories?: RBQCategorie[];
  status?: string;
  expirationDate?: string;
  message?: string;
  error?: string;
}

/**
 * Vérifier une licence RBQ (fonction exportée pour compatibilité)
 */
export async function verifyRBQLicense(licenseNumber: string): Promise<RBQVerificationResult> {
  try {
    const entrepreneur = await rbqService.verifierLicence(licenseNumber);
    
    if (!entrepreneur) {
      return {
        success: false,
        valid: false,
        message: 'Licence non trouvée'
      };
    }

    return {
      success: true,
      valid: entrepreneur.licence.statut === 'valide',
      entrepreneur,
      licenseNumber: entrepreneur.licence.numero,
      companyName: entrepreneur.nom_entreprise,
      categories: entrepreneur.licence.categorie,
      status: entrepreneur.licence.statut,
      expirationDate: entrepreneur.licence.date_expiration,
      message: entrepreneur.licence.statut === 'valide' 
        ? 'Licence valide' 
        : `Licence ${entrepreneur.licence.statut}`
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Erreur de vérification'
    };
  }
}

/**
 * Mettre à jour le statut RBQ d'un entrepreneur dans la DB
 */
export async function updateEntrepreneurRBQStatus(
  entrepreneurId: string, 
  rbqData: Partial<RBQEntrepreneur>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('entrepreneurs')
      .update({
        rbq_licence: rbqData.licence?.numero,
        rbq_statut: rbqData.statut,
        rbq_categories: rbqData.licence?.categorie,
        rbq_derniere_verification: new Date().toISOString()
      })
      .eq('id', entrepreneurId);
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Vérification batch de plusieurs licences
 */
export async function batchVerifyRBQ(
  licenseNumbers: string[]
): Promise<Map<string, RBQVerificationResult>> {
  const results = new Map<string, RBQVerificationResult>();
  
  for (const license of licenseNumbers) {
    const result = await verifyRBQLicense(license);
    results.set(license, result);
  }
  
  return results;
}

/**
 * Obtenir l'URL de vérification RBQ
 */
export function getRBQVerificationUrl(licenseNumber: string): string {
  return rbqService.getLienVerification(licenseNumber);
}

/**
 * Obtenir la description d'une catégorie RBQ
 */
export function getRBQCategoryDescription(categoryCode: string): string {
  const parts = categoryCode.split('.');
  const mainCode = parts[0];
  const cat = RBQ_CATEGORIES[mainCode as keyof typeof RBQ_CATEGORIES];
  
  if (!cat) return categoryCode;
  
  if (parts.length > 1) {
    const fullCode = `${parts[0]}.${parts[1]}`;
    const sousCat = cat.sous_categories?.[fullCode as keyof typeof cat.sous_categories];
    if (sousCat) return sousCat;
  }
  
  return cat.nom;
}

export default rbqService;
