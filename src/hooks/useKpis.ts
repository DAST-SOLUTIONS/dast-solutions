import { useProjects } from './useProjects';
import { useSoumissions } from './useSoumissions';
import { useFactures } from './useFactures';

export function useKpis() {
  const { projects } = useProjects();
  const { soumissions } = useSoumissions();
  const { factures } = useFactures();

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  const totalSoumissions = soumissions.length;
  const acceptedSoumissions = soumissions.filter(s => s.statut === 'acceptee' || s.statut === 'accepte').length;
  const conversionRate = totalSoumissions > 0 ? (acceptedSoumissions / totalSoumissions * 100) : 0;

  const totalFactures = factures.length;
  const paidFactures = factures.filter(f => f.statut === 'payee').length;
  const revenue = factures.filter(f => f.statut === 'payee').reduce((sum, f) => sum + (f.montant_total || 0), 0);

  return {
    totalProjects,
    activeProjects,
    totalValue,
    totalSoumissions,
    acceptedSoumissions,
    conversionRate,
    totalFactures,
    paidFactures,
    revenue,
    kpis: {
      projects: { total: totalProjects, active: activeProjects, value: totalValue },
      soumissions: { total: totalSoumissions, accepted: acceptedSoumissions, rate: conversionRate },
      factures: { total: totalFactures, paid: paidFactures, revenue }
    }
  };
}

export default useKpis;
