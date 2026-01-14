/**
 * Hook useFactures - Gestion des factures
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Facture {
  id: string;
  project_id?: string;
  project_name?: string;
  project_address?: string;
  client_id?: string;
  client_name?: string;
  client_company?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_postal_code?: string;
  client_email?: string;
  client_phone?: string;
  numero: string;
  facture_number?: string;
  date_facture: string;
  date_echeance: string;
  montant_ht: number;
  subtotal?: number;
  tps: number;
  tps_amount?: number;
  tvq: number;
  tvq_amount?: number;
  montant_total: number;
  total?: number;
  balance_due?: number;
  amount_paid?: number;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  status?: string;
  conditions?: string;
  notes?: string;
  items?: FactureItem[];
  payment_method?: string;
  payment_date?: string;
  paiements?: Paiement[];
  user_id: string;
}

export interface FactureItem {
  id?: string;
  facture_id?: string;
  description: string;
  quantite?: number;
  quantity?: number;
  unite?: string;
  unit?: string;
  prix_unitaire?: number;
  unit_price?: number;
  montant?: number;
  total_price?: number;
}

export interface Paiement {
  id: string;
  facture_id: string;
  montant: number;
  date_paiement: string;
  methode: string;
  reference?: string;
  notes?: string;
}

export interface FacturePDFData {
  entreprise: {
    name: string;
    address: string;
    phone: string;
    email: string;
    rbq_license?: string;
    neq?: string;
    nom?: string;
  };
  facture_number: string;
  date_facture: string;
  date_echeance: string;
  client: {
    name: string;
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  };
  project_name?: string;
  project_address?: string;
  items: FactureItem[];
  subtotal: number;
  tps_amount: number;
  tvq_amount: number;
  total: number;
  amount_paid?: number;
  balance_due?: number;
  conditions?: string;
  notes?: string;
}

export const FACTURE_STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée'
};

export const FACTURE_STATUS_COLORS: Record<string, string> = {
  brouillon: 'gray',
  envoyee: 'blue',
  payee: 'green',
  en_retard: 'red',
  annulee: 'gray'
};

export const PAYMENT_METHODS = [
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte', label: 'Carte de crédit' },
  { value: 'comptant', label: 'Comptant' },
  { value: 'interac', label: 'Interac' }
];

export function calculateFactureTotals(items: FactureItem[]): { 
  montant_ht: number; tps: number; tvq: number; montant_total: number;
  subtotal: number; tps_amount: number; tvq_amount: number; total: number;
} {
  const montant_ht = items.reduce((sum, item) => sum + (item.montant || item.total_price || 0), 0);
  const tps = montant_ht * 0.05;
  const tvq = montant_ht * 0.09975;
  const montant_total = montant_ht + tps + tvq;
  return { 
    montant_ht, tps, tvq, montant_total,
    subtotal: montant_ht, tps_amount: tps, tvq_amount: tvq, total: montant_total
  };
}

export function useFactures(projectId?: string) {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFactures = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('factures')
        .select(`*, projects(name, address), clients(name, company_name, address, city, province, postal_code, email, phone)`)
        .eq('user_id', user.id);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error: fetchError } = await query.order('date_facture', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formatted = (data || []).map(f => ({
        ...f,
        project_name: f.projects?.name,
        project_address: f.projects?.address,
        client_name: f.clients?.name || f.clients?.company_name,
        client_company: f.clients?.company_name,
        client_address: f.clients?.address,
        client_city: f.clients?.city,
        client_province: f.clients?.province,
        client_postal_code: f.clients?.postal_code,
        client_email: f.clients?.email,
        client_phone: f.clients?.phone,
        facture_number: f.numero,
        status: f.statut,
        subtotal: f.montant_ht,
        tps_amount: f.tps,
        tvq_amount: f.tvq,
        total: f.montant_total,
        balance_due: f.montant_total,
        amount_paid: 0
      }));
      
      setFactures(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  const createFacture = async (data: Partial<Facture>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: newItem, error } = await supabase
      .from('factures')
      .insert([{ ...data, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    await fetchFactures();
    return newItem;
  };

  const createFromSoumission = async (soumissionId: string, soumissionData: any) => {
    const factureData: Partial<Facture> = {
      project_id: soumissionData.project_id,
      client_id: soumissionData.client_id,
      numero: `F-${Date.now()}`,
      date_facture: new Date().toISOString(),
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      montant_ht: soumissionData.montant_ht,
      tps: soumissionData.tps,
      tvq: soumissionData.tvq,
      montant_total: soumissionData.montant_total,
      statut: 'brouillon',
      notes: `Créée depuis soumission ${soumissionData.numero}`
    };
    return createFacture(factureData);
  };

  const updateFacture = async (id: string, data: Partial<Facture>) => {
    const { data: updated, error } = await supabase
      .from('factures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchFactures();
    return updated;
  };

  const updateStatus = async (id: string, newStatus: string) => {
    return updateFacture(id, { statut: newStatus as Facture['statut'] });
  };

  const deleteFacture = async (id: string) => {
    const { error } = await supabase.from('factures').delete().eq('id', id);
    if (error) throw error;
    setFactures(prev => prev.filter(f => f.id !== id));
  };

  const markAsPaid = async (id: string, payment_method?: string) => {
    return updateFacture(id, { 
      statut: 'payee', 
      payment_date: new Date().toISOString(),
      payment_method 
    });
  };

  const addPaiement = async (factureId: string, paiement: Partial<Paiement>) => {
    const { data, error } = await supabase
      .from('paiements')
      .insert([{ ...paiement, facture_id: factureId }])
      .select()
      .single();
    if (error) throw error;
    await fetchFactures();
    return data;
  };

  const stats = {
    total: factures.length,
    enAttente: factures.filter(f => f.statut === 'envoyee').length,
    payees: factures.filter(f => f.statut === 'payee').length,
    enRetard: factures.filter(f => f.statut === 'en_retard').length,
    montantTotal: factures.reduce((sum, f) => sum + (f.montant_total || 0), 0),
    montantEnAttente: factures
      .filter(f => f.statut === 'envoyee')
      .reduce((sum, f) => sum + (f.montant_total || 0), 0)
  };

  const getStats = () => stats;

  return { 
    factures, 
    loading, 
    error, 
    stats,
    getStats,
    createFacture,
    createFromSoumission,
    updateFacture,
    updateStatus,
    deleteFacture,
    markAsPaid,
    addPaiement,
    refresh: fetchFactures,
    refetch: fetchFactures
  };
}

export default useFactures;
