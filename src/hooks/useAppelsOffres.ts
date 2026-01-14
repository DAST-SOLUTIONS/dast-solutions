/**
 * Hook useAppelsOffres - Gestion des appels d'offres
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { appelsOffresCanadaService, type AppelOffre } from '@/services/appelsOffresCanadaService';

export interface Invitation {
  id: string;
  appel_offre_id: string;
  entrepreneur_id: string;
  entrepreneur_name?: string;
  date_envoi?: string;
  date_reponse?: string;
  statut: 'envoyee' | 'acceptee' | 'refusee' | 'en_attente';
  status?: string;
}

export interface AppelOffreLocal {
  id: string;
  numero?: string;
  source_id?: string;
  source?: string;
  titre: string;
  organisme: string;
  date_publication: string;
  date_fermeture: string;
  date_limite?: string;
  budget_estime?: number;
  region?: string;
  specialite?: string;
  statut: 'nouveau' | 'en_analyse' | 'soumis' | 'gagne' | 'perdu' | 'archive' | 'en_cours' | 'envoye' | 'ferme' | 'termine';
  status?: string;
  notes?: string;
  project_id?: string;
  project?: { id: string; name: string };
  invitations_sent?: boolean;
  invitations?: Invitation[];
  soumissions_recues?: SoumissionRecue[];
  soumission_selectionnee_id?: string;
  user_id: string;
}

export type AppelOffreStatus = AppelOffreLocal['statut'];

export interface SoumissionRecue {
  id: string;
  appel_offre_id: string;
  entrepreneur_id: string;
  entrepreneur_name?: string;
  contact_nom?: string;
  montant: number;
  montant_total?: number;
  date_reception: string;
  notes?: string;
  is_selected?: boolean;
}

export type SpecialiteCode = 'CVAC' | 'ELEC' | 'PEINT' | 'GYPS' | 'GEN' | 'PLOMB' | 'MACONN' | 'CHARP' | 'TOIT' | 'PLANCH' | 'ARMOIR' | 'EXCAV' | 'BETON' | 'ISOL' | 'FENET' | 'ASCENS' | 'GICLEUR' | 'PAYSAG' | 'AUTRE' | string;

export function useAppelsOffres(projectId?: string) {
  const [appelsLocaux, setAppelsLocaux] = useState<AppelOffreLocal[]>([]);
  const [appelsExternes, setAppelsExternes] = useState<AppelOffre[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [soumissionsRecues, setSoumissionsRecues] = useState<SoumissionRecue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppels = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        let query = supabase
          .from('appels_offres')
          .select('*, projects(id, name)')
          .eq('user_id', user.id);
        
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        
        const { data } = await query.order('date_fermeture');
        
        const enriched = (data || []).map(a => ({
          ...a,
          date_limite: a.date_fermeture,
          status: a.statut,
          project: a.projects
        }));
        
        setAppelsLocaux(enriched);

        // Fetch invitations
        const { data: invData } = await supabase
          .from('appel_invitations')
          .select('*');
        setInvitations((invData || []).map(i => ({ ...i, status: i.statut })));

        // Fetch soumissions recues
        const { data: soumData } = await supabase
          .from('soumissions_recues')
          .select('*');
        setSoumissionsRecues((soumData || []).map(s => ({
          ...s,
          contact_nom: s.entrepreneur_name,
          montant_total: s.montant
        })));
      }

      try {
        const externes = await appelsOffresCanadaService.rechercher({
          province: 'QC',
          statut: 'ouvert'
        });
        setAppelsExternes(externes);
      } catch {
        setAppelsExternes([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAppels();
  }, [fetchAppels]);

  const appelsOffres = appelsLocaux;
  const appelOffres = appelsLocaux;
  const appelOffre = appelsLocaux[0] || null;

  const stats = useMemo(() => {
    const allSoumissions = soumissionsRecues;
    const montants = allSoumissions.map(s => s.montant || s.montant_total || 0).filter(m => m > 0);
    return {
      total: appelsLocaux.length,
      nouveaux: appelsLocaux.filter(a => a.statut === 'nouveau').length,
      enAnalyse: appelsLocaux.filter(a => a.statut === 'en_analyse').length,
      soumis: appelsLocaux.filter(a => a.statut === 'soumis').length,
      gagnes: appelsLocaux.filter(a => a.statut === 'gagne').length,
      perdus: appelsLocaux.filter(a => a.statut === 'perdu').length,
      totalInvitations: invitations.length,
      soumissionsRecues: soumissionsRecues.length,
      prixMin: montants.length > 0 ? Math.min(...montants) : 0,
      prixMax: montants.length > 0 ? Math.max(...montants) : 0
    };
  }, [appelsLocaux, invitations, soumissionsRecues]);

  const saveAppel = async (appel: AppelOffre) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase
      .from('appels_offres')
      .insert([{
        source_id: appel.id,
        source: appel.source,
        titre: appel.titre,
        organisme: appel.organisme,
        date_publication: appel.date_publication,
        date_fermeture: appel.date_fermeture,
        region: appel.region,
        statut: 'nouveau',
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    setAppelsLocaux(prev => [...prev, data]);
    return data;
  };

  const createAppelOffre = async (data: Partial<AppelOffreLocal>, specialite?: SpecialiteCode) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('appels_offres')
      .insert([{ ...data, specialite: specialite || data.specialite, statut: data.statut || 'nouveau', user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    setAppelsLocaux(prev => [...prev, newItem]);
    return newItem;
  };

  const deleteAppelOffre = async (id: string) => {
    const { error } = await supabase.from('appels_offres').delete().eq('id', id);
    if (error) throw error;
    setAppelsLocaux(prev => prev.filter(a => a.id !== id));
  };

  const updateStatut = async (id: string, statut: AppelOffreLocal['statut']) => {
    const { error } = await supabase
      .from('appels_offres')
      .update({ statut })
      .eq('id', id);

    if (error) throw error;
    setAppelsLocaux(prev => prev.map(a => a.id === id ? { ...a, statut, status: statut } : a));
  };

  const updateStatus = updateStatut;

  const getAppelOffre = (id: string) => appelsLocaux.find(a => a.id === id);

  const receiveSoumission = async (appelId: string, soumission: Partial<SoumissionRecue>) => {
    const { data, error } = await supabase
      .from('soumissions_recues')
      .insert([{ ...soumission, appel_offre_id: appelId }])
      .select()
      .single();
    if (error) throw error;
    await fetchAppels();
    return data;
  };

  const selectSoumission = async (appelId: string, soumissionId: string) => {
    await supabase
      .from('appels_offres')
      .update({ soumission_selectionnee_id: soumissionId })
      .eq('id', appelId);
    await fetchAppels();
  };

  const integrateToEstimation = async (appelId: string, estimationId: string, amount?: number) => {
    console.log(`Integrating ${appelId} to estimation ${estimationId} with amount ${amount}`);
    await fetchAppels();
  };

  const markInvitationsSent = async (appelId: string) => {
    await supabase
      .from('appels_offres')
      .update({ invitations_sent: true })
      .eq('id', appelId);
    await fetchAppels();
  };

  const sendInvitations = async (appelId: string, entrepreneurIds: string[]) => {
    const inserts = entrepreneurIds.map(eid => ({
      appel_offre_id: appelId,
      entrepreneur_id: eid,
      statut: 'envoyee' as const,
      date_envoi: new Date().toISOString()
    }));
    await supabase.from('appel_invitations').insert(inserts);
    await markInvitationsSent(appelId);
  };

  return {
    appelsLocaux,
    appelsExternes,
    appelsOffres,
    appelOffres,
    appelOffre,
    invitations,
    soumissionsRecues,
    stats,
    loading,
    error,
    saveAppel,
    createAppelOffre,
    deleteAppelOffre,
    updateStatut,
    updateStatus,
    getAppelOffre,
    receiveSoumission,
    selectSoumission,
    integrateToEstimation,
    markInvitationsSent,
    sendInvitations,
    refresh: fetchAppels,
    refetch: fetchAppels
  };
}

export const useAppelOffres = useAppelsOffres;

export function useAppelOffreDetail(id: string) {
  const hook = useAppelsOffres();
  const appel = hook.appelsLocaux.find(a => a.id === id);
  return { ...hook, appel };
}

export default useAppelsOffres;
