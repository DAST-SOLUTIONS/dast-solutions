import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar,
  PieChart, ArrowUpRight, ArrowDownRight, Filter, Download, RefreshCw,
  Building2, Clock, Target, AlertTriangle, CheckCircle, Activity
} from 'lucide-react';

interface KPI {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  target?: string;
}

interface ProjectMetric {
  name: string;
  budget: number;
  spent: number;
  profit: number;
  profitMargin: number;
  status: 'on_track' | 'at_risk' | 'delayed';
}

const DashboardBIModule: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const [kpis] = useState<KPI[]>([
    { id: '1', label: 'Revenus YTD', value: '4.2M$', change: 12.5, trend: 'up', target: '5M$' },
    { id: '2', label: 'Marge brute', value: '28.4%', change: 2.1, trend: 'up', target: '30%' },
    { id: '3', label: 'Projets actifs', value: '12', change: 0, trend: 'neutral' },
    { id: '4', label: 'Carnet commandes', value: '8.5M$', change: -5.2, trend: 'down', target: '10M$' },
    { id: '5', label: 'Délai moyen', value: '2.3 jours', change: -15, trend: 'up' },
    { id: '6', label: 'Satisfaction client', value: '94%', change: 3, trend: 'up', target: '95%' },
  ]);

  const [projectMetrics] = useState<ProjectMetric[]>([
    { name: 'Tour Deloitte', budget: 12500000, spent: 5625000, profit: 1125000, profitMargin: 18, status: 'on_track' },
    { name: 'Centre Bell', budget: 8500000, spent: 6120000, profit: 680000, profitMargin: 8, status: 'at_risk' },
    { name: 'Résidence Soleil', budget: 3200000, spent: 3180000, profit: 640000, profitMargin: 20, status: 'on_track' },
    { name: 'Hôpital Ste-Justine', budget: 15000000, spent: 2250000, profit: 450000, profitMargin: 15, status: 'on_track' },
    { name: 'École Primaire', budget: 2800000, spent: 2520000, profit: 168000, profitMargin: 6, status: 'delayed' },
  ]);

  const monthlyData = [
    { month: 'Jan', revenue: 420000, costs: 310000, margin: 26 },
    { month: 'Fév', revenue: 380000, costs: 285000, margin: 25 },
    { month: 'Mar', revenue: 520000, costs: 370000, margin: 29 },
    { month: 'Avr', revenue: 480000, costs: 345000, margin: 28 },
    { month: 'Mai', revenue: 550000, costs: 390000, margin: 29 },
    { month: 'Juin', revenue: 610000, costs: 425000, margin: 30 },
    { month: 'Juil', revenue: 580000, costs: 410000, margin: 29 },
    { month: 'Août', revenue: 490000, costs: 360000, margin: 27 },
    { month: 'Sep', revenue: 620000, costs: 430000, margin: 31 },
    { month: 'Oct', revenue: 680000, costs: 470000, margin: 31 },
    { month: 'Nov', revenue: 590000, costs: 420000, margin: 29 },
    { month: 'Déc', revenue: 450000, costs: 340000, margin: 24 },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      on_track: 'bg-green-100 text-green-700',
      at_risk: 'bg-yellow-100 text-yellow-700',
      delayed: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      on_track: 'Dans les temps',
      at_risk: 'À risque',
      delayed: 'En retard',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Tableau de Bord BI
          </h1>
          <p className="text-gray-600">Analytics et indicateurs de performance en temps réel</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
            {['week', 'month', 'quarter', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded text-sm ${period === p ? 'bg-blue-100 text-blue-600' : ''}`}
              >
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'quarter' ? 'Trimestre' : 'Année'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white">
            <RefreshCw size={18} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              {kpi.trend === 'up' ? (
                <ArrowUpRight size={16} className="text-green-500" />
              ) : kpi.trend === 'down' ? (
                <ArrowDownRight size={16} className="text-red-500" />
              ) : null}
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${
                kpi.change > 0 ? 'text-green-600' : kpi.change < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {kpi.change > 0 ? '+' : ''}{kpi.change}%
              </span>
              {kpi.target && (
                <span className="text-xs text-gray-400">Cible: {kpi.target}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Graphique Revenus */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Revenus et Coûts Mensuels
            </h3>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                Revenus
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                Coûts
              </span>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="h-64 flex items-end gap-2">
            {monthlyData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-1" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  />
                  <div 
                    className="w-full bg-gray-300 rounded-b"
                    style={{ height: `${(data.costs / maxRevenue) * 100}%`, marginTop: '-' + ((data.costs / maxRevenue) * 100) + '%' }}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par type */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-purple-600" />
            Répartition par type de projet
          </h3>
          
          {/* Simple pie chart representation */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" 
                      strokeDasharray="100 151" strokeDashoffset="0" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20" 
                      strokeDasharray="60 191" strokeDashoffset="-100" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" 
                      strokeDasharray="50 201" strokeDashoffset="-160" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" 
                      strokeDasharray="41 210" strokeDashoffset="-210" />
            </svg>
          </div>
          
          <div className="space-y-2">
            {[
              { label: 'Commercial', value: '40%', color: 'bg-blue-500' },
              { label: 'Institutionnel', value: '24%', color: 'bg-green-500' },
              { label: 'Industriel', value: '20%', color: 'bg-yellow-500' },
              { label: 'Résidentiel', value: '16%', color: 'bg-purple-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Rentabilité par projet */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-600" />
            Rentabilité par projet
          </h3>
          <div className="space-y-4">
            {projectMetrics.map((project, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="font-medium">{project.name}</span>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium">{(project.budget / 1000000).toFixed(1)}M$</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dépensé</p>
                    <p className="font-medium">{(project.spent / 1000000).toFixed(2)}M$</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Profit</p>
                    <p className="font-medium text-green-600">{(project.profit / 1000).toFixed(0)}K$</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Marge</p>
                    <p className={`font-medium ${project.profitMargin >= 15 ? 'text-green-600' : project.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {project.profitMargin}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(project.spent / project.budget) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes et tendances */}
        <div className="space-y-6">
          {/* Alertes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600" />
              Alertes
            </h3>
            <div className="space-y-3">
              {[
                { type: 'warning', message: 'Centre Bell: Marge inférieure à 10%', time: 'Il y a 2h' },
                { type: 'error', message: 'École Primaire: Retard de 5 jours', time: 'Il y a 4h' },
                { type: 'info', message: 'Carnet de commandes en baisse de 5%', time: 'Hier' },
              ].map((alert, i) => (
                <div key={i} className={`p-3 rounded-lg flex items-start gap-3 ${
                  alert.type === 'error' ? 'bg-red-50' :
                  alert.type === 'warning' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}>
                  <AlertTriangle size={16} className={
                    alert.type === 'error' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  } />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top performers */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target size={18} className="text-green-600" />
              Performance équipes
            </h3>
            <div className="space-y-3">
              {[
                { team: 'Équipe Béton', productivity: 112, trend: 'up' },
                { team: 'Équipe Structure', productivity: 105, trend: 'up' },
                { team: 'Équipe Finition', productivity: 98, trend: 'neutral' },
                { team: 'Équipe Mécanique', productivity: 92, trend: 'down' },
              ].map((team, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      team.productivity >= 100 ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Users size={16} className={team.productivity >= 100 ? 'text-green-600' : 'text-gray-500'} />
                    </div>
                    <span>{team.team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      team.productivity >= 100 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {team.productivity}%
                    </span>
                    {team.trend === 'up' ? (
                      <ArrowUpRight size={14} className="text-green-500" />
                    ) : team.trend === 'down' ? (
                      <ArrowDownRight size={14} className="text-red-500" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBIModule;
