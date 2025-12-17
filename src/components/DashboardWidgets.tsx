/**
 * DAST Solutions - Widgets Dashboard
 * Takeoffs récents, Soumissions en cours, Statistiques projets
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Calculator, TrendingUp, Clock, CheckCircle, AlertCircle,
  ArrowRight, Eye, Download, Calendar, DollarSign, Building,
  BarChart3, PieChart, Activity, Users, Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
interface TakeoffSummary {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  itemCount: number;
  totalValue: number;
  status: 'draft' | 'completed' | 'converted';
}

interface SoumissionSummary {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  createdAt: string;
  dueDate?: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalValue: number;
  avgProjectValue: number;
  projectsByStatus: { status: string; count: number }[];
  monthlyTrend: { month: string; value: number }[];
}

// ============================================================================
// WIDGET: DERNIERS TAKEOFFS
// ============================================================================
export function RecentTakeoffsWidget() {
  const navigate = useNavigate();
  const [takeoffs, setTakeoffs] = useState<TakeoffSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentTakeoffs();
  }, []);

  const loadRecentTakeoffs = async () => {
    try {
      // Charger depuis localStorage (takeoffs locaux) ou Supabase
      const localTakeoffs = localStorage.getItem('recent_takeoffs');
      if (localTakeoffs) {
        setTakeoffs(JSON.parse(localTakeoffs).slice(0, 5));
      }
      
      // Essayer de charger depuis Supabase aussi
      const { data } = await supabase
        .from('takeoffs')
        .select('id, project_id, created_at, item_count, total_value, status, projects(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (data && data.length > 0) {
        setTakeoffs(data.map((t: any) => ({
          id: t.id,
          projectId: t.project_id,
          projectName: t.projects?.name || 'Projet sans nom',
          createdAt: t.created_at,
          itemCount: t.item_count || 0,
          totalValue: t.total_value || 0,
          status: t.status || 'draft'
        })));
      }
    } catch (error) {
      console.error('Erreur chargement takeoffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Complété</span>;
      case 'converted':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Converti</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Brouillon</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Derniers Takeoffs
        </h3>
        <button
          onClick={() => navigate('/takeoff-advanced')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Nouveau <ArrowRight size={14} />
        </button>
      </div>

      {takeoffs.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">Aucun takeoff récent</p>
          <button
            onClick={() => navigate('/takeoff-advanced')}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Créer un takeoff
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {takeoffs.map(takeoff => (
            <div
              key={takeoff.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => navigate(`/takeoff-advanced/${takeoff.projectId}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {takeoff.projectName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {takeoff.itemCount} items • {formatDate(takeoff.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(takeoff.status)}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(takeoff.totalValue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WIDGET: SOUMISSIONS EN COURS
// ============================================================================
export function ActiveSoumissionsWidget() {
  const navigate = useNavigate();
  const [soumissions, setSoumissions] = useState<SoumissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSoumissions();
  }, []);

  const loadActiveSoumissions = async () => {
    try {
      const { data } = await supabase
        .from('soumissions')
        .select('id, project_id, client_name, created_at, due_date, total_amount, status, projects(name)')
        .in('status', ['draft', 'sent'])
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (data) {
        setSoumissions(data.map((s: any) => ({
          id: s.id,
          projectId: s.project_id,
          projectName: s.projects?.name || 'Projet sans nom',
          clientName: s.client_name || 'Client inconnu',
          createdAt: s.created_at,
          dueDate: s.due_date,
          totalAmount: s.total_amount || 0,
          status: s.status || 'draft'
        })));
      }
    } catch (error) {
      console.error('Erreur chargement soumissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1"><Clock size={12} /> Envoyée</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><CheckCircle size={12} /> Acceptée</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Refusée</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1"><AlertCircle size={12} /> Expirée</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Brouillon</span>;
    }
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="text-red-500 text-xs">En retard de {Math.abs(days)}j</span>;
    if (days === 0) return <span className="text-orange-500 text-xs">Aujourd'hui!</span>;
    if (days <= 3) return <span className="text-orange-500 text-xs">{days}j restants</span>;
    return <span className="text-gray-500 text-xs">{days}j restants</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calculator size={20} className="text-green-600" />
          Soumissions actives
        </h3>
        <button
          onClick={() => navigate('/estimation-advanced')}
          className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
        >
          Voir tout <ArrowRight size={14} />
        </button>
      </div>

      {soumissions.length === 0 ? (
        <div className="text-center py-8">
          <Calculator size={40} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">Aucune soumission en cours</p>
          <button
            onClick={() => navigate('/estimation-advanced')}
            className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            Nouvelle estimation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {soumissions.map(soumission => (
            <div
              key={soumission.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => navigate(`/estimation-advanced/${soumission.projectId}`)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {soumission.projectName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {soumission.clientName}
                  </p>
                  {getDaysUntilDue(soumission.dueDate)}
                </div>
                <div className="text-right">
                  {getStatusBadge(soumission.status)}
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(soumission.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WIDGET: STATISTIQUES PROJETS
// ============================================================================
export function ProjectStatsWidget() {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectStats();
  }, []);

  const loadProjectStats = async () => {
    try {
      // Charger les projets depuis Supabase
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, budget, created_at');
      
      if (projects) {
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        
        // Grouper par statut
        const statusCounts: Record<string, number> = {};
        projects.forEach(p => {
          const status = p.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const projectsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        }));
        
        // Tendance mensuelle (derniers 6 mois)
        const monthlyTrend: { month: string; value: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleDateString('fr-CA', { month: 'short' });
          const monthProjects = projects.filter(p => {
            const pDate = new Date(p.created_at);
            return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
          });
          monthlyTrend.push({
            month: monthKey,
            value: monthProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
          });
        }
        
        setStats({
          totalProjects,
          activeProjects,
          completedProjects,
          totalValue,
          avgProjectValue: totalProjects > 0 ? totalValue / totalProjects : 0,
          projectsByStatus,
          monthlyTrend
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      // Données de démo
      setStats({
        totalProjects: 24,
        activeProjects: 8,
        completedProjects: 14,
        totalValue: 4500000,
        avgProjectValue: 187500,
        projectsByStatus: [
          { status: 'active', count: 8 },
          { status: 'completed', count: 14 },
          { status: 'pending', count: 2 }
        ],
        monthlyTrend: [
          { month: 'juil', value: 450000 },
          { month: 'août', value: 680000 },
          { month: 'sept', value: 520000 },
          { month: 'oct', value: 890000 },
          { month: 'nov', value: 750000 },
          { month: 'déc', value: 420000 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M $`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k $`;
    }
    return `${amount.toFixed(0)} $`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Calculer la hauteur max pour le graphique
  const maxTrendValue = Math.max(...stats.monthlyTrend.map(t => t.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-600" />
          Statistiques
        </h3>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Building size={16} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Projets actifs</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.activeProjects}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">Complétés</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.completedProjects}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">Valeur totale</span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Moy. projet</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {formatCurrency(stats.avgProjectValue)}
          </p>
        </div>
      </div>

      {/* Mini graphique de tendance */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Tendance 6 mois</p>
        <div className="flex items-end gap-1 h-16">
          {stats.monthlyTrend.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                style={{ 
                  height: `${maxTrendValue > 0 ? (item.value / maxTrendValue) * 100 : 0}%`,
                  minHeight: '4px'
                }}
                title={formatCurrency(item.value)}
              />
              <span className="text-[10px] text-gray-400 mt-1">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WIDGET: ACTIVITÉ RÉCENTE
// ============================================================================
export function RecentActivityWidget() {
  const [activities, setActivities] = useState<{
    id: string;
    type: 'takeoff' | 'soumission' | 'project' | 'client';
    action: string;
    description: string;
    timestamp: string;
  }[]>([]);

  useEffect(() => {
    // Simuler des activités récentes
    setActivities([
      {
        id: '1',
        type: 'takeoff',
        action: 'Takeoff créé',
        description: 'Complexe résidentiel Maple - 45 items',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        type: 'soumission',
        action: 'Soumission envoyée',
        description: 'Centre commercial Laval - 1.2M $',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: '3',
        type: 'project',
        action: 'Projet mis à jour',
        description: 'Tour de bureaux Downtown - Phase 2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: '4',
        type: 'client',
        action: 'Nouveau client',
        description: 'Construction ABC Inc.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ]);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'takeoff': return <FileText size={16} className="text-blue-500" />;
      case 'soumission': return <Calculator size={16} className="text-green-500" />;
      case 'project': return <Building size={16} className="text-purple-500" />;
      case 'client': return <Users size={16} className="text-orange-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Activity size={20} className="text-teal-600" />
        Activité récente
      </h3>

      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="mt-1">{getIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.action}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================
export default {
  RecentTakeoffsWidget,
  ActiveSoumissionsWidget,
  ProjectStatsWidget,
  RecentActivityWidget
};
