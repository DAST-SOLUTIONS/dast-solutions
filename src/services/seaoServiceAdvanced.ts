/**
 * DAST Solutions - Service SEAO (Système électronique d'appel d'offres)
 * Scraping et gestion des appels d'offres publics du Québec
 */

// ============================================================================
// TYPES
// ============================================================================
export interface SEAOAppelOffre {
  id: string;
  numero: string;
  titre: string;
  organisme: string;
  region: string;
  categorie: string;
  sousCategorie?: string;
  datePublication: string;
  dateFermeture: string;
  dateFermetureTime?: string;
  montantEstime?: string;
  description?: string;
  contact?: {
    nom: string;
    telephone?: string;
    courriel?: string;
  };
  documents?: SEAODocument[];
  url: string;
  status: 'ouvert' | 'ferme' | 'annule' | 'reporte';
  favoris?: boolean;
  notes?: string;
  soumissionStatus?: 'none' | 'interested' | 'preparing' | 'submitted' | 'won' | 'lost';
}

export interface SEAODocument {
  id: string;
  nom: string;
  type: string;
  taille?: string;
  url: string;
  dateAjout?: string;
}

export interface SEAOFilters {
  motsCles?: string;
  regions?: string[];
  categories?: string[];
  organismes?: string[];
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  status?: ('ouvert' | 'ferme')[];
}

export interface SEAOSearchResult {
  total: number;
  page: number;
  pageSize: number;
  appelsOffres: SEAOAppelOffre[];
}

// ============================================================================
// CONSTANTES
// ============================================================================
export const SEAO_REGIONS = [
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

export const SEAO_CATEGORIES_CONSTRUCTION = [
  { code: 'CONST', nom: 'Construction', subcategories: [
    { code: 'BAT-COMM', nom: 'Bâtiment commercial' },
    { code: 'BAT-INST', nom: 'Bâtiment institutionnel' },
    { code: 'BAT-INDUS', nom: 'Bâtiment industriel' },
    { code: 'BAT-RESID', nom: 'Bâtiment résidentiel' },
    { code: 'GENIE', nom: 'Génie civil' },
    { code: 'VOIRIE', nom: 'Voirie et pavage' },
    { code: 'ELECT', nom: 'Électricité' },
    { code: 'PLOMB', nom: 'Plomberie' },
    { code: 'CVAC', nom: 'Chauffage, ventilation, climatisation' },
    { code: 'STRUCT', nom: 'Structure' },
    { code: 'TOITURE', nom: 'Toiture et étanchéité' },
    { code: 'RENOV', nom: 'Rénovation' },
    { code: 'DEMOLIT', nom: 'Démolition' },
    { code: 'AMENA', nom: 'Aménagement paysager' }
  ]},
  { code: 'SERV-PROF', nom: 'Services professionnels', subcategories: [
    { code: 'ARCH', nom: 'Architecture' },
    { code: 'ING', nom: 'Ingénierie' },
    { code: 'GEST-PROJ', nom: 'Gestion de projet' },
    { code: 'SURV', nom: 'Surveillance de chantier' }
  ]}
];

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================
class SEAOService {
  private baseUrl = 'https://seao.ca';
  private apiUrl = '/api/seao'; // Notre API proxy (Supabase Edge Function)
  
  /**
   * Rechercher des appels d'offres
   */
  async search(filters: SEAOFilters, page: number = 1, pageSize: number = 20): Promise<SEAOSearchResult> {
    try {
      // Dans un environnement réel, cela appellerait notre Edge Function
      // qui fait le scraping du site SEAO
      const response = await fetch(`${this.apiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, page, pageSize })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche SEAO');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur SEAO search:', error);
      // Retourner des données de démo en cas d'erreur
      return this.getDemoData(filters, page, pageSize);
    }
  }
  
  /**
   * Obtenir les détails d'un appel d'offres
   */
  async getDetails(id: string): Promise<SEAOAppelOffre | null> {
    try {
      const response = await fetch(`${this.apiUrl}/details/${id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur SEAO getDetails:', error);
      return null;
    }
  }
  
  /**
   * Télécharger un document
   */
  async downloadDocument(doc: SEAODocument): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.apiUrl}/document/${doc.id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Erreur SEAO downloadDocument:', error);
      return null;
    }
  }
  
  /**
   * S'abonner aux alertes pour des critères spécifiques
   */
  async subscribeAlerts(
    userId: string,
    filters: SEAOFilters,
    frequency: 'immediate' | 'daily' | 'weekly'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/alerts/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, filters, frequency })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erreur SEAO subscribeAlerts:', error);
      return false;
    }
  }
  
  /**
   * Données de démonstration
   */
  private getDemoData(filters: SEAOFilters, page: number, pageSize: number): SEAOSearchResult {
    const demoAppels: SEAOAppelOffre[] = [
      {
        id: 'seao-2024-001',
        numero: 'AO-2024-MTL-0145',
        titre: 'Rénovation de l\'école primaire Saint-Jean',
        organisme: 'Centre de services scolaire de Montréal',
        region: 'Montréal',
        categorie: 'Construction',
        sousCategorie: 'Rénovation',
        datePublication: '2024-12-10',
        dateFermeture: '2024-12-28',
        dateFermetureTime: '14:00',
        montantEstime: '2 500 000 $ - 5 000 000 $',
        description: 'Travaux de rénovation majeure incluant la mise aux normes électriques, le remplacement des fenêtres et la réfection de la toiture.',
        contact: {
          nom: 'Marie Tremblay',
          telephone: '514-555-1234',
          courriel: 'marie.tremblay@cssdm.gouv.qc.ca'
        },
        documents: [
          { id: 'doc-001', nom: 'Cahier des charges', type: 'PDF', taille: '2.5 MB', url: '#' },
          { id: 'doc-002', nom: 'Plans architecturaux', type: 'PDF', taille: '15 MB', url: '#' },
          { id: 'doc-003', nom: 'Devis techniques', type: 'PDF', taille: '8 MB', url: '#' },
          { id: 'doc-004', nom: 'Addenda #1', type: 'PDF', taille: '500 KB', url: '#' }
        ],
        url: 'https://seao.ca/AO-2024-MTL-0145',
        status: 'ouvert'
      },
      {
        id: 'seao-2024-002',
        numero: 'AO-2024-QC-0089',
        titre: 'Construction d\'un centre communautaire',
        organisme: 'Ville de Québec',
        region: 'Capitale-Nationale',
        categorie: 'Construction',
        sousCategorie: 'Bâtiment institutionnel',
        datePublication: '2024-12-05',
        dateFermeture: '2025-01-15',
        dateFermetureTime: '15:00',
        montantEstime: '8 000 000 $ - 12 000 000 $',
        description: 'Construction d\'un nouveau centre communautaire de 3 000 m² comprenant une salle multifonctionnelle, des salles de réunion et des bureaux administratifs.',
        contact: {
          nom: 'Jean-Pierre Lavoie',
          telephone: '418-555-5678',
          courriel: 'jp.lavoie@ville.quebec.qc.ca'
        },
        documents: [
          { id: 'doc-005', nom: 'Appel d\'offres complet', type: 'PDF', taille: '45 MB', url: '#' }
        ],
        url: 'https://seao.ca/AO-2024-QC-0089',
        status: 'ouvert'
      },
      {
        id: 'seao-2024-003',
        numero: 'AO-2024-LAV-0023',
        titre: 'Réfection de toiture - Aréna municipal',
        organisme: 'Ville de Laval',
        region: 'Laval',
        categorie: 'Construction',
        sousCategorie: 'Toiture et étanchéité',
        datePublication: '2024-12-12',
        dateFermeture: '2024-12-30',
        dateFermetureTime: '10:00',
        montantEstime: '500 000 $ - 1 000 000 $',
        description: 'Remplacement complet de la membrane de toiture et réparation de l\'isolation.',
        contact: {
          nom: 'Sophie Martin',
          courriel: 'sophie.martin@laval.ca'
        },
        url: 'https://seao.ca/AO-2024-LAV-0023',
        status: 'ouvert'
      },
      {
        id: 'seao-2024-004',
        numero: 'AO-2024-MTG-0067',
        titre: 'Travaux de voirie - Boulevard Principal',
        organisme: 'Ville de Longueuil',
        region: 'Montérégie',
        categorie: 'Construction',
        sousCategorie: 'Voirie et pavage',
        datePublication: '2024-12-08',
        dateFermeture: '2024-12-22',
        dateFermetureTime: '14:00',
        montantEstime: '3 000 000 $ - 4 500 000 $',
        description: 'Réfection complète du boulevard sur 2.5 km incluant les infrastructures souterraines.',
        url: 'https://seao.ca/AO-2024-MTG-0067',
        status: 'ouvert'
      },
      {
        id: 'seao-2024-005',
        numero: 'AO-2024-SLJ-0012',
        titre: 'Agrandissement de l\'hôpital régional',
        organisme: 'CIUSSS Saguenay-Lac-Saint-Jean',
        region: 'Saguenay–Lac-Saint-Jean',
        categorie: 'Construction',
        sousCategorie: 'Bâtiment institutionnel',
        datePublication: '2024-11-28',
        dateFermeture: '2025-01-30',
        dateFermetureTime: '14:00',
        montantEstime: '25 000 000 $ - 35 000 000 $',
        description: 'Projet d\'agrandissement de l\'urgence et ajout de 50 lits supplémentaires.',
        url: 'https://seao.ca/AO-2024-SLJ-0012',
        status: 'ouvert'
      }
    ];
    
    // Filtrer selon les critères
    let filtered = [...demoAppels];
    
    if (filters.motsCles) {
      const keywords = filters.motsCles.toLowerCase();
      filtered = filtered.filter(ao => 
        ao.titre.toLowerCase().includes(keywords) ||
        ao.description?.toLowerCase().includes(keywords) ||
        ao.organisme.toLowerCase().includes(keywords)
      );
    }
    
    if (filters.regions && filters.regions.length > 0) {
      filtered = filtered.filter(ao => 
        filters.regions!.some(r => ao.region.includes(r))
      );
    }
    
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(ao => 
        filters.categories!.some(c => ao.categorie.includes(c) || ao.sousCategorie?.includes(c))
      );
    }
    
    // Pagination
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);
    
    return {
      total: filtered.length,
      page,
      pageSize,
      appelsOffres: paginated
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculer le nombre de jours restants avant fermeture
 */
export function getJoursRestants(dateFermeture: string): number {
  const fermeture = new Date(dateFermeture);
  const aujourdhui = new Date();
  const diff = fermeture.getTime() - aujourdhui.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formater le montant estimé
 */
export function formatMontantEstime(montant: string | undefined): string {
  if (!montant) return 'Non spécifié';
  return montant;
}

/**
 * Obtenir la couleur selon le statut
 */
export function getStatusColor(status: SEAOAppelOffre['status']): string {
  switch (status) {
    case 'ouvert': return 'text-green-600 bg-green-100';
    case 'ferme': return 'text-gray-600 bg-gray-100';
    case 'annule': return 'text-red-600 bg-red-100';
    case 'reporte': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Obtenir la couleur selon l'urgence (jours restants)
 */
export function getUrgenceColor(joursRestants: number): string {
  if (joursRestants <= 3) return 'text-red-600 bg-red-100';
  if (joursRestants <= 7) return 'text-orange-600 bg-orange-100';
  if (joursRestants <= 14) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
}

// Export singleton
export const seaoService = new SEAOService();

export default seaoService;
