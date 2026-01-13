import React, { useState } from 'react';
import { 
  LayoutGrid, List, Filter, Download, RefreshCw, Search,
  Building2, DollarSign, Calendar, Users, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, MapPin, Eye, MoreVertical,
  ChevronRight, Activity, Target, Briefcase, ArrowUpRight
} from 'lucide-react';

interface Project {
  id: string;
  nom: string;
  client: string;
  type: string;
  region: string;
  budget: number;
  depense: number;
  avancement: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  dateDebut: string;
  dateFin: string;
  chef: string;
  equipe: number;
  risque: 'low' | 'medium' | 'high';
  tendance: 'up' | 'down' | 'stable';
}

const MultiProjetsModule: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisque, setFilterRisque] = useState('all');
  const [sortBy, setSortBy] = useState('avancement');

  const [projets] = useState<Project[]>([
    { id: '1', nom: 'Tour Deloitte - Phase 2', client: 'Deloitte Canada', type: 'Commercial', region: 'Montréal', budget: 12500000, depense: 5625000, avancement: 45, status: 'active', dateDebut: '2025-09-01', dateFin: '2026-08-31', chef: 'Jean Tremblay', equipe: 45, risque: 'low', tendance: 'up' },
    { id: '2', nom: 'Centre Bell - Loges VIP', client: 'Groupe CH', type: 'Commercial', region: 'Montréal', budget: 4500000, depense: 3240000, avancement: 72, status: 'active', dateDebut: '2025-10-15', dateFin: '2026-04-30', chef: 'Marie Dubois', equipe: 28, risque: 'medium', tendance: 'stable' },
    { id: '3', nom: 'Résidence Soleil', client: 'Développements Soleil', type: 'Résidentiel', region: 'Laval', budget: 3200000, depense: 3180000, avancement: 100, status: 'completed', dateDebut: '2025-01-10', dateFin: '2025-12-15', chef: 'Pierre Martin', equipe: 0, risque: 'low', tendance: 'stable' },
    { id: '4', nom: 'Hôpital Ste-Justine', client: 'CHU Ste-Justine', type: 'Institutionnel', region: 'Montréal', budget: 15000000, depense: 2250000, avancement: 15, status: 'active', dateDebut: '2026-02-01', dateFin: '2027-06-30', chef: 'Sophie Lavoie', equipe: 52, risque: 'low', tendance: 'up' },
    { id: '5', nom: 'École Primaire St-Louis', client: 'CSDM', type: 'Institutionnel', region: 'Montréal', budget: 2800000, depense: 2520000, avancement: 90, status: 'active', dateDebut: '2025-05-01', dateFin: '2026-01-31', chef: 'Luc Gagnon', equipe: 18, risque: 'high', tendance: 'down' },
    { id: '6', nom: 'Entrepôt Amazon YUL2', client: 'Amazon Canada', type: 'Industriel', region: 'Montérégie', budget: 8500000, depense: 850000, avancement: 10, status: 'active', dateDebut: '2026-01-15', dateFin: '2026-09-30', chef: 'Marie Dubois', equipe: 35, risque: 'low', tendance: 'up' },
    { id: '7', nom: 'Condo Rivière', client: 'Groupe Immobilier QC', type: 'Résidentiel', region: 'Québec', budget: 5200000, depense: 0, avancement: 0, status: 'planning', dateDebut: '2026-03-01', dateFin: '2027-02-28', chef: 'Jean Tremblay', equipe: 0, risque: 'medium', tendance: 'stable' },
    { id: '8', nom: 'Bibliothèque Municipale', client: 'Ville de Laval', type: 'Institutionnel', region: 'Laval', budget: 4100000, depense: 1025000, avancement: 25, status: 'on_hold', dateDebut: '2025-11-01', dateFin: '2026-08-15', chef: 'Pierre Martin', equipe: 12, risque: 'high', tendance: 'down' },
  ]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-600',
      active: 'bg-green-100 text-green-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      planning: 'Planification',
      active: 'En cours',
      on_hold: 'En pause',
      completed: 'Terminé',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const getRisqueBadge = (risque: string) => {
    const styles: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[risque]}`}>{labels[risque]}</span>;
  };

  const filteredProjets = projets.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchRisque = filterRisque === 'all' || p.risque === filterRisque;
    return matchSearch && matchStatus && matchRisque;
  });

  const stats = {
    projetsActifs: projets.filter(p => p.status === 'active').length,
    budgetTotal: projets.filter(p => p.status !== 'completed').reduce((sum, p) => sum + p.budget, 0),
    avancementMoyen: Math.round(projets.filter(p => p.status === 'active').reduce((sum, p) => sum + p.avancement, 0) / projets.filter(p => p.status === 'active').length),
    equipeTotale: projets.reduce((sum, p) => sum + p.equipe, 0),
    projetsRisque: projets.filter(p => p.risque === 'high' && p.status === 'active').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="text-blue-600" />
            Tableau Multi-Projets
          </h1>
          <p className="text-gray-600">Vue consolidée de tous les projets actifs</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <List size={18} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white">
            <Download size={18} />
            Exporter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Projets actifs</p>
            <Activity size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.projetsActifs}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Budget total</p>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{(stats.budgetTotal / 1000000).toFixed(1)}M$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Avancement moyen</p>
            <Target size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.avancementMoyen}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Équipe totale</p>
            <Users size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.equipeTotale}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Projets à risque</p>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600">{stats.projetsRisque}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un projet ou client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tous les statuts</option>
            <option value="planning">Planification</option>
            <option value="active">En cours</option>
            <option value="on_hold">En pause</option>
            <option value="completed">Terminé</option>
          </select>
          <select
            value={filterRisque}
            onChange={(e) => setFilterRisque(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tous les risques</option>
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Élevé</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="avancement">Trier par avancement</option>
            <option value="budget">Trier par budget</option>
            <option value="dateFin">Trier par échéance</option>
            <option value="risque">Trier par risque</option>
          </select>
        </div>
      </div>

      {/* Projets */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-3 gap-4">
          {filteredProjets.map((projet) => (
            <div key={projet.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{projet.nom}</h3>
                  <p className="text-sm text-gray-500">{projet.client}</p>
                </div>
                <div className="flex items-center gap-2">
                  {projet.tendance === 'up' && <TrendingUp size={16} className="text-green-500" />}
                  {projet.tendance === 'down' && <TrendingDown size={16} className="text-red-500" />}
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(projet.status)}
                {getRisqueBadge(projet.risque)}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12} />
                  {projet.region}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Avancement</span>
                  <span className="font-medium">{projet.avancement}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      projet.avancement >= 75 ? 'bg-green-500' :
                      projet.avancement >= 50 ? 'bg-blue-500' :
                      projet.avancement >= 25 ? 'bg-yellow-500' :
                      'bg-gray-300'
                    }`}
                    style={{ width: `${projet.avancement}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">{(projet.budget / 1000000).toFixed(1)}M$</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Échéance</p>
                    <p className="font-medium">{new Date(projet.dateFin).toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Équipe</p>
                    <p className="font-medium">{projet.equipe} pers.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-gray-400" />
                  <div>
                    <p className="text-gray-500">Chef</p>
                    <p className="font-medium truncate">{projet.chef.split(' ')[0]}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Voir détails <ChevronRight size={14} />
                </button>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voir le projet">
                    <Eye size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Projet</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Budget</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Avancement</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Risque</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Échéance</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Équipe</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProjets.map((projet) => (
                <tr key={projet.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {projet.tendance === 'up' && <TrendingUp size={14} className="text-green-500" />}
                      {projet.tendance === 'down' && <TrendingDown size={14} className="text-red-500" />}
                      <span className="font-medium">{projet.nom}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{projet.client}</td>
                  <td className="p-4">{getStatusBadge(projet.status)}</td>
                  <td className="p-4 text-right font-medium">{(projet.budget / 1000000).toFixed(1)}M$</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${projet.avancement}%` }}
                        />
                      </div>
                      <span className="text-sm">{projet.avancement}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">{getRisqueBadge(projet.risque)}</td>
                  <td className="p-4">{projet.dateFin}</td>
                  <td className="p-4 text-center">{projet.equipe}</td>
                  <td className="p-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Eye size={16} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline résumé */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          Échéances à venir
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {projets
            .filter(p => p.status === 'active')
            .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime())
            .slice(0, 5)
            .map((projet) => (
              <div key={projet.id} className="flex-shrink-0 w-48 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm truncate">{projet.nom}</p>
                <p className="text-xs text-gray-500 mb-2">{projet.client}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">{projet.dateFin}</span>
                  <span className="text-xs text-gray-500">{projet.avancement}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MultiProjetsModule;
