/**
 * Service Paie Construction - CCQ et Standard
 * Calcul des salaires, DAS, avantages sociaux, rapports de paie
 */

import { supabase } from '../lib/supabase/client';
import { CCQ_TAUX_2025_2026, CCQ_SECTEURS, CCQ_METIERS } from './ccqServiceEnhanced';

// ============ TYPES ============

export interface Employe {
  id: string;
  numero_employe: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  nas?: string; // Crypté en DB
  adresse?: string;
  ville?: string;
  code_postal?: string;
  telephone?: string;
  courriel?: string;
  date_embauche: string;
  type_employe: 'ccq' | 'standard' | 'cadre';
  // CCQ spécifique
  numero_ccq?: string;
  metier_ccq?: string;
  classification_ccq?: 'apprenti' | 'compagnon' | 'occupation';
  niveau_apprenti?: number;
  secteur_ccq?: 'IC' | 'CI' | 'GC' | 'RE';
  // Standard
  taux_horaire?: number;
  salaire_annuel?: number;
  // Déductions
  td1_federal?: number;
  tp1_provincial?: number;
  exonere_ae?: boolean;
  exonere_rqap?: boolean;
  cotisation_syndicale?: number;
  pension_employeur?: number;
  assurance_collective?: number;
  statut: 'actif' | 'inactif' | 'termine';
}

export interface PeriodePaie {
  id: string;
  numero: number;
  annee: number;
  date_debut: string;
  date_fin: string;
  date_paiement: string;
  statut: 'ouverte' | 'fermee' | 'payee';
  type: 'hebdomadaire' | 'bi_hebdomadaire' | 'mensuel';
}

export interface FeuilleTemps {
  id: string;
  employe_id: string;
  periode_id: string;
  projet_id?: string;
  date: string;
  heures_regulieres: number;
  heures_supplementaires: number;
  heures_doubles: number;
  heures_feries?: number;
  prime_deplacement?: number;
  prime_hauteur?: number;
  prime_nuit?: number;
  notes?: string;
  statut: 'brouillon' | 'soumis' | 'approuve' | 'refuse';
}

export interface CalculPaie {
  employe_id: string;
  periode_id: string;
  // Heures
  heures_regulieres: number;
  heures_supplementaires: number;
  heures_doubles: number;
  heures_feries: number;
  total_heures: number;
  // Gains
  salaire_regulier: number;
  salaire_supplementaire: number;
  salaire_double: number;
  salaire_ferie: number;
  primes: number;
  salaire_brut: number;
  // CCQ spécifique
  vacances_ccq?: number; // 13%
  conges_feries_ccq?: number;
  // Déductions employé
  impot_federal: number;
  impot_provincial: number;
  rqap_employe: number;
  ae_employe: number;
  rrq_employe: number;
  cotisation_syndicale: number;
  assurance_employe: number;
  autres_deductions: number;
  total_deductions: number;
  salaire_net: number;
  // Contributions employeur
  rqap_employeur: number;
  ae_employeur: number;
  rrq_employeur: number;
  fss_employeur: number; // Fonds des services de santé
  cnt_employeur: number; // Commission des normes du travail
  ccq_avantages?: number;
  ccq_retraite?: number;
  ccq_formation?: number;
  total_employeur: number;
  cout_total: number;
}

export interface TalentPaieParams {
  employe: Employe;
  heures: {
    regulieres: number;
    supplementaires: number;
    doubles: number;
    feries: number;
  };
  primes?: {
    deplacement?: number;
    hauteur?: number;
    nuit?: number;
    autres?: number;
  };
  periode: PeriodePaie;
}

// ============ CONSTANTES 2025 ============

export const TAUX_GOUVERNEMENT_2025 = {
  // RRQ (Régime des rentes du Québec)
  rrq: {
    taux_employe: 0.0640,
    taux_employeur: 0.0640,
    maximum_gains: 71300,
    exemption: 3500,
    maximum_cotisation: 4347.52
  },
  // RQAP (Régime québécois d'assurance parentale)
  rqap: {
    taux_employe: 0.00494,
    taux_employeur: 0.00692,
    maximum_gains: 98000,
    maximum_cotisation_employe: 484.12,
    maximum_cotisation_employeur: 678.16
  },
  // AE (Assurance-emploi) - Québec
  ae: {
    taux_employe: 0.0127,
    taux_employeur: 0.01778, // 1.4x
    maximum_gains: 65700,
    maximum_cotisation_employe: 834.39,
    maximum_cotisation_employeur: 1168.15
  },
  // FSS (Fonds des services de santé)
  fss: {
    taux_base: 0.0165, // Varie selon masse salariale
    taux_reduit: 0.0145 // PME
  },
  // CNT (Commission des normes du travail)
  cnt: {
    taux: 0.0006
  },
  // CNESST (pour info, varie par secteur)
  cnesst: {
    taux_construction: 0.0585 // Exemple, varie selon code
  }
};

// Tables d'impôt simplifiées 2025 (fédéral)
export const TABLES_IMPOT_FEDERAL_2025 = [
  { min: 0, max: 55867, taux: 0.15 },
  { min: 55867, max: 111733, taux: 0.205 },
  { min: 111733, max: 173205, taux: 0.26 },
  { min: 173205, max: 246752, taux: 0.29 },
  { min: 246752, max: Infinity, taux: 0.33 }
];

// Tables d'impôt simplifiées 2025 (Québec)
export const TABLES_IMPOT_QUEBEC_2025 = [
  { min: 0, max: 51780, taux: 0.14 },
  { min: 51780, max: 103545, taux: 0.19 },
  { min: 103545, max: 126000, taux: 0.24 },
  { min: 126000, max: Infinity, taux: 0.2575 }
];

// Exemptions personnelles de base 2025
export const EXEMPTIONS_2025 = {
  federal: 16129,
  quebec: 18056
};

class PaieService {
  /**
   * Calculer la paie complète d'un employé
   */
  async calculerPaie(params: TalentPaieParams): Promise<CalculPaie> {
    const { employe, heures, primes, periode } = params;

    // Obtenir le taux horaire selon le type d'employé
    const tauxHoraire = this.getTauxHoraire(employe);
    
    // Calculer les gains
    const salaire_regulier = heures.regulieres * tauxHoraire;
    const salaire_supplementaire = heures.supplementaires * tauxHoraire * 1.5;
    const salaire_double = heures.doubles * tauxHoraire * 2;
    const salaire_ferie = heures.feries * tauxHoraire * 2; // Double pour férié travaillé
    
    const totalPrimes = (primes?.deplacement || 0) + 
                        (primes?.hauteur || 0) + 
                        (primes?.nuit || 0) + 
                        (primes?.autres || 0);

    const salaire_brut = salaire_regulier + salaire_supplementaire + 
                         salaire_double + salaire_ferie + totalPrimes;

    // Calculer les déductions employé
    const deductions = this.calculerDeductionsEmploye(salaire_brut, employe, periode);
    
    // CCQ: Ajouter vacances et congés si applicable
    let vacances_ccq = 0;
    let conges_feries_ccq = 0;
    if (employe.type_employe === 'ccq') {
      vacances_ccq = salaire_brut * 0.13; // 13% vacances CCQ
      conges_feries_ccq = salaire_brut * 0.085; // ~8.5% congés fériés
    }

    // Calculer contributions employeur
    const contributions = this.calculerContributionsEmployeur(salaire_brut, employe);

    const salaire_net = salaire_brut - deductions.total;
    const cout_total = salaire_brut + contributions.total;

    return {
      employe_id: employe.id,
      periode_id: periode.id,
      // Heures
      heures_regulieres: heures.regulieres,
      heures_supplementaires: heures.supplementaires,
      heures_doubles: heures.doubles,
      heures_feries: heures.feries,
      total_heures: heures.regulieres + heures.supplementaires + heures.doubles + heures.feries,
      // Gains
      salaire_regulier,
      salaire_supplementaire,
      salaire_double,
      salaire_ferie,
      primes: totalPrimes,
      salaire_brut,
      vacances_ccq,
      conges_feries_ccq,
      // Déductions
      impot_federal: deductions.impot_federal,
      impot_provincial: deductions.impot_provincial,
      rqap_employe: deductions.rqap,
      ae_employe: deductions.ae,
      rrq_employe: deductions.rrq,
      cotisation_syndicale: deductions.syndicale,
      assurance_employe: deductions.assurance,
      autres_deductions: deductions.autres,
      total_deductions: deductions.total,
      salaire_net,
      // Contributions employeur
      rqap_employeur: contributions.rqap,
      ae_employeur: contributions.ae,
      rrq_employeur: contributions.rrq,
      fss_employeur: contributions.fss,
      cnt_employeur: contributions.cnt,
      ccq_avantages: contributions.ccq_avantages,
      ccq_retraite: contributions.ccq_retraite,
      ccq_formation: contributions.ccq_formation,
      total_employeur: contributions.total,
      cout_total
    };
  }

  /**
   * Obtenir le taux horaire d'un employé
   */
  private getTauxHoraire(employe: Employe): number {
    if (employe.type_employe === 'ccq' && employe.metier_ccq && employe.secteur_ccq) {
      const tauxCCQ = CCQ_TAUX_2025_2026[employe.secteur_ccq]?.[employe.metier_ccq];
      if (tauxCCQ && typeof tauxCCQ === 'object' && 'taux_base' in tauxCCQ) {
        return (tauxCCQ as any).taux_base || 0;
      }
    }
    return employe.taux_horaire || 0;
  }

  /**
   * Calculer les déductions de l'employé
   */
  private calculerDeductionsEmploye(
    salaireBrut: number,
    employe: Employe,
    periode: PeriodePaie
  ): {
    impot_federal: number;
    impot_provincial: number;
    rrq: number;
    rqap: number;
    ae: number;
    syndicale: number;
    assurance: number;
    autres: number;
    total: number;
  } {
    // Nombre de périodes par an
    const periodesParAn = periode.type === 'hebdomadaire' ? 52 : 
                          periode.type === 'bi_hebdomadaire' ? 26 : 12;
    
    // Annualiser le salaire
    const salaireAnnuel = salaireBrut * periodesParAn;

    // Impôt fédéral (simplifié)
    const impotFederalAnnuel = this.calculerImpot(
      salaireAnnuel, 
      TABLES_IMPOT_FEDERAL_2025, 
      employe.td1_federal || EXEMPTIONS_2025.federal
    );
    const impot_federal = impotFederalAnnuel / periodesParAn;

    // Impôt provincial (simplifié)
    const impotProvincialAnnuel = this.calculerImpot(
      salaireAnnuel, 
      TABLES_IMPOT_QUEBEC_2025, 
      employe.tp1_provincial || EXEMPTIONS_2025.quebec
    );
    const impot_provincial = impotProvincialAnnuel / periodesParAn;

    // RRQ
    const rrq = Math.min(
      salaireBrut * TAUX_GOUVERNEMENT_2025.rrq.taux_employe,
      TAUX_GOUVERNEMENT_2025.rrq.maximum_cotisation / periodesParAn
    );

    // RQAP
    const rqap = employe.exonere_rqap ? 0 : Math.min(
      salaireBrut * TAUX_GOUVERNEMENT_2025.rqap.taux_employe,
      TAUX_GOUVERNEMENT_2025.rqap.maximum_cotisation_employe / periodesParAn
    );

    // AE
    const ae = employe.exonere_ae ? 0 : Math.min(
      salaireBrut * TAUX_GOUVERNEMENT_2025.ae.taux_employe,
      TAUX_GOUVERNEMENT_2025.ae.maximum_cotisation_employe / periodesParAn
    );

    // Syndicale
    const syndicale = employe.cotisation_syndicale || 0;

    // Assurance
    const assurance = employe.assurance_collective || 0;

    const total = impot_federal + impot_provincial + rrq + rqap + ae + syndicale + assurance;

    return {
      impot_federal,
      impot_provincial,
      rrq,
      rqap,
      ae,
      syndicale,
      assurance,
      autres: 0,
      total
    };
  }

  /**
   * Calculer les contributions employeur
   */
  private calculerContributionsEmployeur(
    salaireBrut: number,
    employe: Employe
  ): {
    rrq: number;
    rqap: number;
    ae: number;
    fss: number;
    cnt: number;
    ccq_avantages: number;
    ccq_retraite: number;
    ccq_formation: number;
    total: number;
  } {
    // RRQ employeur (même montant que employé)
    const rrq = salaireBrut * TAUX_GOUVERNEMENT_2025.rrq.taux_employeur;

    // RQAP employeur
    const rqap = salaireBrut * TAUX_GOUVERNEMENT_2025.rqap.taux_employeur;

    // AE employeur
    const ae = salaireBrut * TAUX_GOUVERNEMENT_2025.ae.taux_employeur;

    // FSS
    const fss = salaireBrut * TAUX_GOUVERNEMENT_2025.fss.taux_base;

    // CNT
    const cnt = salaireBrut * TAUX_GOUVERNEMENT_2025.cnt.taux;

    // CCQ spécifique
    let ccq_avantages = 0;
    let ccq_retraite = 0;
    let ccq_formation = 0;

    if (employe.type_employe === 'ccq' && employe.metier_ccq && employe.secteur_ccq) {
      const tauxCCQ = CCQ_TAUX_2025_2026[employe.secteur_ccq]?.[employe.metier_ccq];
      if (tauxCCQ && typeof tauxCCQ === 'object' && 'taux_base' in tauxCCQ) {
        const taux = tauxCCQ as any;
        const heuresEquivalentes = salaireBrut / (taux.taux_base || 1);
        ccq_avantages = (taux.avantages_sociaux || 0) * heuresEquivalentes;
        ccq_retraite = (taux.regime_retraite || 0) * heuresEquivalentes;
        ccq_formation = (taux.fonds_formation || 0) * heuresEquivalentes;
      }
    }

    const total = rrq + rqap + ae + fss + cnt + ccq_avantages + ccq_retraite + ccq_formation;

    return {
      rrq,
      rqap,
      ae,
      fss,
      cnt,
      ccq_avantages,
      ccq_retraite,
      ccq_formation,
      total
    };
  }

  /**
   * Calculer l'impôt selon une table
   */
  private calculerImpot(
    revenuAnnuel: number, 
    table: typeof TABLES_IMPOT_FEDERAL_2025,
    exemption: number
  ): number {
    const revenuImposable = Math.max(0, revenuAnnuel - exemption);
    let impot = 0;
    let revenuRestant = revenuImposable;

    for (const tranche of table) {
      if (revenuRestant <= 0) break;
      
      const montantDansTranche = Math.min(
        revenuRestant, 
        tranche.max - tranche.min
      );
      
      impot += montantDansTranche * tranche.taux;
      revenuRestant -= montantDansTranche;
    }

    return impot;
  }

  /**
   * Générer un relevé de paie
   */
  async genererRelevePaie(calculPaie: CalculPaie, employe: Employe): Promise<any> {
    return {
      ...calculPaie,
      employe: {
        nom: employe.nom,
        prenom: employe.prenom,
        numero: employe.numero_employe,
        metier: employe.metier_ccq,
        classification: employe.classification_ccq
      },
      date_generation: new Date().toISOString()
    };
  }

  /**
   * Obtenir le sommaire des périodes de paie
   */
  async getSommairePeriode(periodeId: string): Promise<{
    periode: PeriodePaie;
    nombreEmployes: number;
    totalBrut: number;
    totalNet: number;
    totalDeductions: number;
    totalEmployeur: number;
    coutTotal: number;
  } | null> {
    try {
      const { data: periode } = await supabase
        .from('periodes_paie')
        .select('*')
        .eq('id', periodeId)
        .single();

      if (!periode) return null;

      const { data: calculs } = await supabase
        .from('calculs_paie')
        .select('*')
        .eq('periode_id', periodeId);

      const sommaire = (calculs || []).reduce((acc, c) => ({
        nombreEmployes: acc.nombreEmployes + 1,
        totalBrut: acc.totalBrut + (c.salaire_brut || 0),
        totalNet: acc.totalNet + (c.salaire_net || 0),
        totalDeductions: acc.totalDeductions + (c.total_deductions || 0),
        totalEmployeur: acc.totalEmployeur + (c.total_employeur || 0),
        coutTotal: acc.coutTotal + (c.cout_total || 0)
      }), {
        nombreEmployes: 0,
        totalBrut: 0,
        totalNet: 0,
        totalDeductions: 0,
        totalEmployeur: 0,
        coutTotal: 0
      });

      return {
        periode,
        ...sommaire
      };
    } catch (error) {
      console.error('Erreur sommaire période:', error);
      return null;
    }
  }

  /**
   * Exporter les données pour Desjardins/institution financière
   */
  async exporterPaiementsBancaires(periodeId: string): Promise<{
    format: 'CPA-005' | 'CSV';
    data: string;
    total: number;
    nombrePaiements: number;
  }> {
    const { data: calculs } = await supabase
      .from('calculs_paie')
      .select('*, employes(*)')
      .eq('periode_id', periodeId);

    // Format CSV simplifié (le vrai CPA-005 est plus complexe)
    const lignes = ['Numero,Nom,Prenom,Transit,Compte,Montant'];
    let total = 0;

    (calculs || []).forEach((c: any) => {
      lignes.push(`${c.employes.numero_employe},${c.employes.nom},${c.employes.prenom},${c.employes.transit_bancaire || ''},${c.employes.compte_bancaire || ''},${c.salaire_net.toFixed(2)}`);
      total += c.salaire_net;
    });

    return {
      format: 'CSV',
      data: lignes.join('\n'),
      total,
      nombrePaiements: calculs?.length || 0
    };
  }

  /**
   * Rapport T4/Relevé 1 annuel
   */
  async genererRapportAnnuel(annee: number, employeId: string): Promise<{
    revenus_bruts: number;
    impot_federal: number;
    impot_provincial: number;
    cotisations_rrq: number;
    cotisations_rqap: number;
    cotisations_ae: number;
    avantages_imposables: number;
  }> {
    const { data: calculs } = await supabase
      .from('calculs_paie')
      .select('*, periodes_paie!inner(*)')
      .eq('employe_id', employeId)
      .eq('periodes_paie.annee', annee);

    return (calculs || []).reduce((acc, c) => ({
      revenus_bruts: acc.revenus_bruts + (c.salaire_brut || 0),
      impot_federal: acc.impot_federal + (c.impot_federal || 0),
      impot_provincial: acc.impot_provincial + (c.impot_provincial || 0),
      cotisations_rrq: acc.cotisations_rrq + (c.rrq_employe || 0),
      cotisations_rqap: acc.cotisations_rqap + (c.rqap_employe || 0),
      cotisations_ae: acc.cotisations_ae + (c.ae_employe || 0),
      avantages_imposables: acc.avantages_imposables + (c.vacances_ccq || 0)
    }), {
      revenus_bruts: 0,
      impot_federal: 0,
      impot_provincial: 0,
      cotisations_rrq: 0,
      cotisations_rqap: 0,
      cotisations_ae: 0,
      avantages_imposables: 0
    });
  }
}

export const paieService = new PaieService();
export default paieService;
