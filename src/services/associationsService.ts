/**
 * Service Associations Professionnelles - Construction Québec
 * ACQ, APCHQ, APECQ, AEMQ, CMMTQ, CMEQ, CIQS, AEÉCQ, etc.
 */

import { supabase } from '../lib/supabase/client';

// Types
export interface Association {
  id: string;
  acronyme: string;
  nom_complet: string;
  nom_complet_en?: string;
  description: string;
  secteurs: string[];
  services: string[];
  site_web: string;
  telephone: string;
  courriel?: string;
  adresse: string;
  ville: string;
  code_postal: string;
  logo_url?: string;
  avantages_membres: string[];
  cout_adhesion?: {
    individuel?: number;
    entreprise?: number;
    etudiant?: number;
  };
  formations_offertes?: Formation[];
  certifications?: Certification[];
  evenements_url?: string;
  bottin_membres_url?: string;
}

export interface Formation {
  id: string;
  titre: string;
  description: string;
  duree: string;
  cout?: number;
  certification?: boolean;
  url: string;
}

export interface Certification {
  id: string;
  acronyme: string;
  nom: string;
  description: string;
  prerequis: string[];
  examen: boolean;
  renouvellement: string;
  url: string;
}

export interface MembreAssociation {
  id: string;
  association_id: string;
  entreprise_nom: string;
  contact_nom?: string;
  telephone?: string;
  courriel?: string;
  site_web?: string;
  adresse?: string;
  ville?: string;
  specialites?: string[];
  certifications?: string[];
  membre_depuis?: string;
}

// Base de données des associations québécoises
export const ASSOCIATIONS_QUEBEC: Association[] = [
  // ============ ASSOCIATIONS PATRONALES ============
  {
    id: 'acq',
    acronyme: 'ACQ',
    nom_complet: 'Association de la construction du Québec',
    description: 'Plus grande association patronale de l\'industrie de la construction au Québec',
    secteurs: ['Institutionnel', 'Commercial', 'Industriel'],
    services: ['Relations de travail', 'Formation', 'Services juridiques', 'Assurances collectives'],
    site_web: 'https://www.acq.org',
    telephone: '514-354-0609',
    courriel: 'info@acq.org',
    adresse: '9200, boul. Métropolitain Est',
    ville: 'Montréal',
    code_postal: 'H1K 4L2',
    avantages_membres: [
      'Représentation auprès des gouvernements',
      'Services juridiques en relations de travail',
      'Accès au Bottin des membres',
      'Formations continues accréditées',
      'Assurances collectives avantageuses',
      'Veille réglementaire'
    ],
    evenements_url: 'https://www.acq.org/evenements',
    bottin_membres_url: 'https://www.acq.org/bottin'
  },
  {
    id: 'apchq',
    acronyme: 'APCHQ',
    nom_complet: 'Association des professionnels de la construction et de l\'habitation du Québec',
    description: 'Association représentant les entrepreneurs en construction résidentielle',
    secteurs: ['Résidentiel', 'Rénovation'],
    services: ['Garantie Qualité Habitation', 'Formation', 'Services techniques', 'Assurances'],
    site_web: 'https://www.apchq.com',
    telephone: '514-353-9960',
    adresse: '5930, boul. Louis-H.-La Fontaine',
    ville: 'Anjou',
    code_postal: 'H1M 1S7',
    avantages_membres: [
      'Programme Garantie Qualité Habitation',
      'Formations Novoclimat',
      'Accompagnement technique',
      'Accès aux plans types',
      'Réseautage professionnel'
    ],
    evenements_url: 'https://www.apchq.com/evenements',
    bottin_membres_url: 'https://www.apchq.com/trouver-entrepreneur'
  },
  {
    id: 'aecq',
    acronyme: 'AECQ',
    nom_complet: 'Association des entrepreneurs en construction du Québec',
    description: 'Association regroupant les entrepreneurs généraux',
    secteurs: ['Général', 'Multi-secteurs'],
    services: ['Représentation', 'Réseautage', 'Information'],
    site_web: 'https://www.aecq.org',
    telephone: '514-354-8249',
    adresse: '8175, boul. Saint-Laurent',
    ville: 'Montréal',
    code_postal: 'H2P 2M1',
    avantages_membres: [
      'Représentation sectorielle',
      'Réseau d\'entrepreneurs',
      'Information sur les appels d\'offres'
    ]
  },

  // ============ ASSOCIATIONS PROFESSIONNELLES - ESTIMATION ============
  {
    id: 'ciqs',
    acronyme: 'CIQS/ICÉC',
    nom_complet: 'Institut canadien des économistes en construction - Section Québec',
    nom_complet_en: 'Canadian Institute of Quantity Surveyors',
    description: 'Organisme de certification des estimateurs professionnels',
    secteurs: ['Estimation', 'Économie de la construction'],
    services: ['Certification PQS/ÉCQ', 'Formation continue', 'Code d\'éthique'],
    site_web: 'https://www.ciqs.org',
    telephone: '416-972-0919',
    adresse: '90 Nolan Court, Unit 19',
    ville: 'Markham',
    code_postal: 'L3R 4L9',
    avantages_membres: [
      'Désignation PQS (Professional Quantity Surveyor)',
      'Désignation ÉCQ (Économiste en Construction Qualifié)',
      'Reconnaissance professionnelle',
      'Formation continue obligatoire',
      'Réseau pancanadien'
    ],
    certifications: [
      {
        id: 'pqs',
        acronyme: 'PQS',
        nom: 'Professional Quantity Surveyor',
        description: 'Certification professionnelle en économie de la construction',
        prerequis: ['5 ans d\'expérience', 'Formation pertinente', 'Examen'],
        examen: true,
        renouvellement: 'Annuel - 20 heures de formation continue',
        url: 'https://www.ciqs.org/designation'
      },
      {
        id: 'ecq',
        acronyme: 'ÉCQ',
        nom: 'Économiste en Construction Qualifié',
        description: 'Désignation québécoise équivalente au PQS',
        prerequis: ['5 ans d\'expérience', 'Formation en estimation', 'Examen'],
        examen: true,
        renouvellement: 'Annuel',
        url: 'https://www.ciqs.org/designation'
      }
    ],
    evenements_url: 'https://www.ciqs.org/events'
  },
  {
    id: 'aeecq',
    acronyme: 'AEÉCQ',
    nom_complet: 'Association des estimateurs et des économistes en construction du Québec',
    description: 'Association québécoise des professionnels de l\'estimation',
    secteurs: ['Estimation', 'Économie de la construction'],
    services: ['Certification', 'Formation', 'Réseautage', 'Conférences'],
    site_web: 'https://www.aeecq.org',
    telephone: '514-384-5240',
    courriel: 'info@aeecq.org',
    adresse: '1255, boul. Robert-Bourassa, bureau 800',
    ville: 'Montréal',
    code_postal: 'H3B 3V8',
    avantages_membres: [
      'Certification AEÉCQ reconnue',
      'Formations en estimation',
      'Conférences mensuelles',
      'Réseautage avec estimateurs',
      'Accès au bottin des membres',
      'Tarifs préférentiels événements'
    ],
    certifications: [
      {
        id: 'aeecq-cert',
        acronyme: 'Cert. AEÉCQ',
        nom: 'Estimateur certifié AEÉCQ',
        description: 'Certification québécoise en estimation',
        prerequis: ['3 ans d\'expérience', 'Formation reconnue'],
        examen: true,
        renouvellement: 'Annuel',
        url: 'https://www.aeecq.org/certification'
      }
    ],
    evenements_url: 'https://www.aeecq.org/evenements'
  },

  // ============ ASSOCIATIONS SPÉCIALISÉES ============
  {
    id: 'apecq',
    acronyme: 'APECQ',
    nom_complet: 'Association patronale des entreprises en construction du Québec',
    description: 'Association représentant les entrepreneurs spécialisés',
    secteurs: ['Spécialisé', 'Sous-traitance'],
    services: ['Relations de travail', 'Formation', 'Représentation'],
    site_web: 'https://www.apecq.org',
    telephone: '514-382-3883',
    adresse: '920, rue Jean-Talon Est',
    ville: 'Montréal',
    code_postal: 'H2R 1V3',
    avantages_membres: [
      'Négociation collective',
      'Services juridiques',
      'Formation SST',
      'Représentation gouvernementale'
    ]
  },
  {
    id: 'aemq',
    acronyme: 'AEMQ',
    nom_complet: 'Association des entrepreneurs en maçonnerie du Québec',
    description: 'Association regroupant les entrepreneurs en maçonnerie',
    secteurs: ['Maçonnerie', 'Briquetage', 'Pierre'],
    services: ['Formation technique', 'Promotion du métier', 'Standards de qualité'],
    site_web: 'https://www.aemq.qc.ca',
    telephone: '514-355-5055',
    adresse: '9405, rue Sherbrooke Est',
    ville: 'Montréal',
    code_postal: 'H1L 6P3',
    avantages_membres: [
      'Formation continue en maçonnerie',
      'Normes et standards techniques',
      'Promotion des membres',
      'Support technique'
    ]
  },
  {
    id: 'cmmtq',
    acronyme: 'CMMTQ',
    nom_complet: 'Corporation des maîtres mécaniciens en tuyauterie du Québec',
    description: 'Corporation des entrepreneurs en plomberie et chauffage',
    secteurs: ['Plomberie', 'Chauffage', 'Gaz'],
    services: ['Licence maître-mécanicien', 'Formation', 'Services techniques'],
    site_web: 'https://www.cmmtq.org',
    telephone: '514-382-2668',
    courriel: 'info@cmmtq.org',
    adresse: '8175, boul. Saint-Laurent',
    ville: 'Montréal',
    code_postal: 'H2P 2M1',
    avantages_membres: [
      'Licence de maître mécanicien',
      'Formation continue obligatoire',
      'Support technique',
      'Représentation professionnelle'
    ],
    evenements_url: 'https://www.cmmtq.org/evenements',
    bottin_membres_url: 'https://www.cmmtq.org/trouver-entrepreneur'
  },
  {
    id: 'cmeq',
    acronyme: 'CMEQ',
    nom_complet: 'Corporation des maîtres électriciens du Québec',
    description: 'Corporation des entrepreneurs en électricité',
    secteurs: ['Électricité', 'Électromécanique'],
    services: ['Licence maître-électricien', 'Formation', 'Code électrique'],
    site_web: 'https://www.cmeq.org',
    telephone: '514-738-2184',
    courriel: 'info@cmeq.org',
    adresse: '5925, boul. Décarie',
    ville: 'Montréal',
    code_postal: 'H3W 3C9',
    avantages_membres: [
      'Licence de maître électricien',
      'Formation Code électrique',
      'Support technique',
      'Représentation'
    ],
    evenements_url: 'https://www.cmeq.org/evenements',
    bottin_membres_url: 'https://www.cmeq.org/trouver-electricien'
  },

  // ============ ORDRES PROFESSIONNELS ============
  {
    id: 'oiq',
    acronyme: 'OIQ',
    nom_complet: 'Ordre des ingénieurs du Québec',
    description: 'Ordre professionnel régissant la pratique du génie au Québec',
    secteurs: ['Ingénierie', 'Génie civil', 'Génie du bâtiment'],
    services: ['Permis d\'exercice', 'Formation continue', 'Discipline'],
    site_web: 'https://www.oiq.qc.ca',
    telephone: '514-845-6141',
    adresse: '1100, rue University, bureau 350',
    ville: 'Montréal',
    code_postal: 'H3B 2G7',
    avantages_membres: [
      'Titre réservé ing.',
      'Protection du public',
      'Formation continue',
      'Assurance responsabilité'
    ],
    evenements_url: 'https://www.oiq.qc.ca/evenements',
    bottin_membres_url: 'https://www.oiq.qc.ca/bottin'
  },
  {
    id: 'oaq',
    acronyme: 'OAQ',
    nom_complet: 'Ordre des architectes du Québec',
    description: 'Ordre professionnel régissant la pratique de l\'architecture',
    secteurs: ['Architecture', 'Design'],
    services: ['Permis d\'exercice', 'Formation continue', 'Concours'],
    site_web: 'https://www.oaq.com',
    telephone: '514-937-6168',
    adresse: '1825, boul. René-Lévesque Ouest',
    ville: 'Montréal',
    code_postal: 'H3H 1R4',
    avantages_membres: [
      'Titre réservé architecte',
      'Protection du public',
      'Formation continue',
      'Concours d\'architecture'
    ],
    evenements_url: 'https://www.oaq.com/evenements'
  },

  // ============ PROGRAMMES DE CERTIFICATION ============
  {
    id: 'goldseal',
    acronyme: 'Gold Seal / Sceau d\'or',
    nom_complet: 'Programme de certification Sceau d\'or',
    nom_complet_en: 'Gold Seal Certification Program',
    description: 'Programme national de certification des gestionnaires de construction',
    secteurs: ['Gestion de projet', 'Surintendance', 'Estimation', 'Sécurité'],
    services: ['Certification nationale', 'Reconnaissance pancanadienne'],
    site_web: 'https://www.goldsealcertification.com',
    telephone: '613-236-9455',
    adresse: '75 Albert Street, Suite 400',
    ville: 'Ottawa',
    code_postal: 'K1P 5E7',
    avantages_membres: [
      'Certification reconnue nationalement',
      'Désignation GSC',
      'Avancement de carrière',
      'Reconnaissance professionnelle'
    ],
    certifications: [
      {
        id: 'gsc-pm',
        acronyme: 'GSC',
        nom: 'Gold Seal Certified - Project Manager',
        description: 'Certification en gestion de projet de construction',
        prerequis: ['7 ans d\'expérience', 'Formation en gestion', 'Heures de travail documentées'],
        examen: true,
        renouvellement: '5 ans',
        url: 'https://www.goldsealcertification.com/project-manager'
      },
      {
        id: 'gsc-sup',
        acronyme: 'GSC',
        nom: 'Gold Seal Certified - Superintendent',
        description: 'Certification en surintendance',
        prerequis: ['7 ans d\'expérience terrain', 'Formation SST'],
        examen: true,
        renouvellement: '5 ans',
        url: 'https://www.goldsealcertification.com/superintendent'
      },
      {
        id: 'gsc-est',
        acronyme: 'GSC',
        nom: 'Gold Seal Certified - Estimator',
        description: 'Certification en estimation',
        prerequis: ['7 ans d\'expérience', 'Formation en estimation'],
        examen: true,
        renouvellement: '5 ans',
        url: 'https://www.goldsealcertification.com/estimator'
      }
    ]
  },

  // ============ GESTION DE PROJET ============
  {
    id: 'pmi-levis',
    acronyme: 'PMI-Lévis Québec',
    nom_complet: 'Project Management Institute - Chapitre Lévis Québec',
    description: 'Chapitre québécois du PMI pour la gestion de projet',
    secteurs: ['Gestion de projet', 'Multi-industries'],
    services: ['Certification PMP', 'Formation', 'Réseautage'],
    site_web: 'https://www.pmiquebec.qc.ca',
    telephone: '418-800-0764',
    courriel: 'info@pmiquebec.qc.ca',
    adresse: 'Québec',
    ville: 'Québec',
    code_postal: 'G1R 0A0',
    avantages_membres: [
      'Préparation certification PMP',
      'PDU (Professional Development Units)',
      'Événements de réseautage',
      'Conférences mensuelles'
    ],
    certifications: [
      {
        id: 'pmp',
        acronyme: 'PMP',
        nom: 'Project Management Professional',
        description: 'Certification internationale en gestion de projet',
        prerequis: ['35h de formation', '3-5 ans d\'expérience', '4500-7500h de direction de projet'],
        examen: true,
        renouvellement: '3 ans - 60 PDU',
        url: 'https://www.pmi.org/certifications/pmp'
      }
    ],
    evenements_url: 'https://www.pmiquebec.qc.ca/evenements'
  }
];

class AssociationsService {
  /**
   * Obtenir toutes les associations
   */
  async getAssociations(secteur?: string): Promise<Association[]> {
    if (secteur) {
      return ASSOCIATIONS_QUEBEC.filter(a => 
        a.secteurs.some(s => s.toLowerCase().includes(secteur.toLowerCase()))
      );
    }
    return ASSOCIATIONS_QUEBEC;
  }

  /**
   * Obtenir une association par ID
   */
  async getAssociation(id: string): Promise<Association | undefined> {
    return ASSOCIATIONS_QUEBEC.find(a => a.id === id);
  }

  /**
   * Rechercher des associations
   */
  async rechercher(query: string): Promise<Association[]> {
    const q = query.toLowerCase();
    return ASSOCIATIONS_QUEBEC.filter(a =>
      a.acronyme.toLowerCase().includes(q) ||
      a.nom_complet.toLowerCase().includes(q) ||
      a.secteurs.some(s => s.toLowerCase().includes(q)) ||
      a.services.some(s => s.toLowerCase().includes(q))
    );
  }

  /**
   * Obtenir les associations par catégorie
   */
  async getAssociationsParCategorie(): Promise<Record<string, Association[]>> {
    return {
      'Associations patronales': ASSOCIATIONS_QUEBEC.filter(a => 
        ['acq', 'apchq', 'aecq', 'apecq'].includes(a.id)
      ),
      'Estimation et économie': ASSOCIATIONS_QUEBEC.filter(a => 
        ['ciqs', 'aeecq'].includes(a.id)
      ),
      'Métiers spécialisés': ASSOCIATIONS_QUEBEC.filter(a => 
        ['aemq', 'cmmtq', 'cmeq'].includes(a.id)
      ),
      'Ordres professionnels': ASSOCIATIONS_QUEBEC.filter(a => 
        ['oiq', 'oaq'].includes(a.id)
      ),
      'Certifications nationales': ASSOCIATIONS_QUEBEC.filter(a => 
        ['goldseal', 'pmi-levis'].includes(a.id)
      )
    };
  }

  /**
   * Obtenir les certifications disponibles
   */
  async getCertifications(): Promise<Certification[]> {
    const certs: Certification[] = [];
    ASSOCIATIONS_QUEBEC.forEach(a => {
      if (a.certifications) {
        certs.push(...a.certifications);
      }
    });
    return certs;
  }

  /**
   * Sauvegarder l'adhésion d'un utilisateur
   */
  async sauvegarderAdhesion(adhesion: {
    association_id: string;
    numero_membre?: string;
    date_adhesion?: string;
    date_expiration?: string;
    certifications?: string[];
  }): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      await (supabase.from('user_associations').upsert({
        user_id: userData.user?.id,
        ...adhesion,
        updated_at: new Date().toISOString()
      } as any) as any);

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde adhésion:', error);
      return false;
    }
  }

  /**
   * Obtenir les adhésions d'un utilisateur
   */
  async getMesAdhesions(): Promise<any[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('user_associations')
        .select('*')
        .eq('user_id', userData.user?.id);

      if (error) throw error;

      return (data || []).map((a: any) => ({
        ...a,
        association: ASSOCIATIONS_QUEBEC.find(assoc => assoc.id === a.association_id)
      }));
    } catch (error) {
      console.error('Erreur récupération adhésions:', error);
      return [];
    }
  }

  /**
   * Rechercher des membres dans les bottins
   */
  async rechercherMembres(params: {
    association?: string;
    nom?: string;
    ville?: string;
    specialite?: string;
  }): Promise<MembreAssociation[]> {
    try {
      let query = supabase
        .from('association_membres')
        .select('*')
        .order('entreprise_nom', { ascending: true });

      if (params.association) {
        query = query.eq('association_id', params.association);
      }
      if (params.nom) {
        query = query.ilike('entreprise_nom', `%${params.nom}%`);
      }
      if (params.ville) {
        query = query.ilike('ville', `%${params.ville}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur recherche membres:', error);
      return [];
    }
  }
}

export const associationsService = new AssociationsService();
export default associationsService;
