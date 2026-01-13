import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  BarChart3, PieChart, Calendar, Filter, Download, RefreshCw,
  ChevronRight, ArrowUpRight, ArrowDownRight, Target, Wallet
} from 'lucide-react';

interface ProjetBudget {
  id: string;
  nom: string;
  budgetInitial: number;
  budgetRevise: number;
  depensesReelles: number;
  engagements: number;
  avancement: number;
  ecart: number;
  statut: 'sous_budget' | 'sur_budget' | 'critique' | 'normal';
}

interface Depense {
  id: string;
  date: string;
  projet: string;
  categorie: string;
  description: string;
  montant: number;
  fournisseur: string;
}

const BudgetTempsReelModule: React.FC = () => {
  const [selectedProjet, setSelectedProjet] = useState<string>('all');
  const [periode, setPeriode] = useState('mois');

  const [projets] = useState<ProjetBudget[]>([
    { id: '1', nom: 'Tour Deloitte', budgetInitial: 12500000, budgetRevise: 12850000, depensesReelles: 5620000, engagements: 1850000, avancement: 45, ecart: 2.8, statut: 'normal' },
    { id: '2', nom: 'Centre Bell', budgetInitial: 4500000, budgetRevise: 4680000, depensesReelles: 3120000, engagements: 890000, avancement: 72, ecart: 4.0, statut: 'sur_budget' },
    { id: '3', nom: 'École Primaire', budgetInitial: 2800000, budgetRevise: 3080000, depensesReelles: 2450000, engagements: 420000, avancement: 85, ecart: 10.0, statut: 'critique' },
    { id: '4', nom: 'Résidence Soleil', budgetInitial: 8200000, budgetRevise: 8200000, depensesReelles: 1640000, engagements: 980000, avancement: 22, ecart: -2.5, statut: 'sous_budget' },
  ]);

  const [depensesRecentes] = useState<Depense[]>([
    { id: '1', date: '2026-01-13', projet: 'Tour Deloitte', categorie: 'Matériaux', description: 'Acier structure - Lot 3', montant: 185000, fournisseur: 'Acier MTL' },
    { id: '2', date: '2026-01-12', projet: 'Centre Bell', categorie: 'Main d\'oeuvre', description: 'Paie semaine 2', montant: 78500, fournisseur: 'Interne' },
    { id: '3', date: '2026-01-12', projet: 'Tour Deloitte', categorie: 'Équipements', description: 'Location grue - Janvier', montant: 42000, fournisseur: 'Grues Québec' },
    { id: '4', date: '2026-01-11', projet: 'École Primaire', categorie: 'Sous-traitance', description: 'Électricité - Acompte 3', montant: 125000, fournisseur: 'Électro Plus' },
    { id: '5', date: '2026-01-10', projet: 'Tour Deloitte', categorie: 'Matériaux', description: 'Béton 30MPa - 85m³', montant: 24225, fournisseur: 'Béton Québec' },
  ]);

  const totalBudget = projets.reduce((sum, p) => sum + p.budgetRevise, 0);
  const totalDepenses = projets.reduce((sum, p) => sum + p.depensesReelles, 0);
  const totalEngagements = projets.reduce((sum, p) => sum + p.engagements, 0);
  const disponible = totalBudget - totalDepenses - totalEngagements;

  const getStatutBadge = (statut: string, ecart: number) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      sous_budget: { bg: 'bg-green-100', text: 'text-green-700', label: 'Sous budget' },
      normal: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Normal' },
      sur_budget: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sur budget' },
      critique: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critique' },
    };
    const { bg, text, label } = config[statut];
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label}</span>
        <span className={`text-sm font-medium ${ecart > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {ecart > 0 ? '+' : ''}{ecart}%
        </span>
      </div>
    );
  };

  // Données pour courbe S simplifiée
  const courbeS = [
    { mois: 'Jan', prevu: 8, reel: 7 },
    { mois: 'Fév', prevu: 15, reel: 14 },
    { mois: 'Mar', prevu: 25, reel: 26 },
    { mois: 'Avr', prevu: 38, reel: 40 },
    { mois: 'Mai', prevu: 52, reel: 55 },
    { mois: 'Juin', prevu: 65, reel: null },
    { mois: 'Juil', prevu: 78, reel: null },
    { mois: 'Août', prevu: 88, reel: null },
    { mois: 'Sept', prevu: 95, reel: null },
    { mois: 'Oct', prevu: 100, reel: null },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-green-600" />
            Budget Temps Réel
          </h1>
          <p className="text-gray-600">Suivi budgétaire en direct, alertes et courbes S</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw size={18} />
            Actualiser
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download size={18} />
            Exporter
          </button>
        </div>
      </div>

      {/* Stats globaux */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Budget total</p>
            <Target size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{(totalBudget / 1000000).toFixed(1)}M$</p>
          <p className="text-xs text-gray-500 mt-1">4 projets actifs</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Dépensé</p>
            <TrendingUp size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-600">{(totalDepenses / 1000000).toFixed(1)}M$</p>
          <p className="text-xs text-gray-500 mt-1">{((totalDepenses / totalBudget) * 100).toFixed(0)}% du budget</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Engagé</p>
            <BarChart3 size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">{(totalEngagements / 1000000).toFixed(1)}M$</p>
          <p className="text-xs text-gray-500 mt-1">Commandes en cours</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Disponible</p>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{(disponible / 1000000).toFixed(1)}M$</p>
          <p className="text-xs text-gray-500 mt-1">{((disponible / totalBudget) * 100).toFixed(0)}% restant</p>
        </div>
      </div>

      {/* Alertes */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <p className="font-medium text-red-800">Alerte dépassement budgétaire</p>
            <p className="text-sm text-red-700">École Primaire: +10% sur budget révisé • Centre Bell: tendance à surveiller (+4%)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste projets */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Budget par projet</h3>
              <select 
                value={selectedProjet}
                onChange={(e) => setSelectedProjet(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="all">Tous les projets</option>
                {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div className="divide-y">
              {projets.map(projet => {
                const depensesPct = (projet.depensesReelles / projet.budgetRevise) * 100;
                const engagementsPct = (projet.engagements / projet.budgetRevise) * 100;
                return (
                  <div key={projet.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{projet.nom}</h4>
                        <p className="text-sm text-gray-500">Avancement: {projet.avancement}%</p>
                      </div>
                      {getStatutBadge(projet.statut, projet.ecart)}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget révisé: {(projet.budgetRevise / 1000000).toFixed(2)}M$</span>
                        <span>Disponible: {((projet.budgetRevise - projet.depensesReelles - projet.engagements) / 1000000).toFixed(2)}M$</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${depensesPct}%` }}
                          title={`Dépensé: ${depensesPct.toFixed(0)}%`}
                        />
                        <div 
                          className="h-full bg-yellow-400" 
                          style={{ width: `${engagementsPct}%` }}
                          title={`Engagé: ${engagementsPct.toFixed(0)}%`}
                        />
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded" /> Dépensé ({depensesPct.toFixed(0)}%)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded" /> Engagé ({engagementsPct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courbe S */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4">Courbe S - Tour Deloitte</h3>
            <div className="h-48 flex items-end gap-2">
              {courbeS.map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 justify-center" style={{ height: '160px' }}>
                    <div 
                      className="w-3 bg-blue-200 rounded-t"
                      style={{ height: `${point.prevu * 1.6}px` }}
                    />
                    {point.reel !== null && (
                      <div 
                        className="w-3 bg-green-500 rounded-t"
                        style={{ height: `${point.reel * 1.6}px` }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{point.mois}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-xs justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded" /> Prévu</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Réel</span>
            </div>
          </div>
        </div>

        {/* Dépenses récentes */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Dépenses récentes</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-auto">
            {depensesRecentes.map(dep => (
              <div key={dep.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{dep.description}</p>
                    <p className="text-xs text-gray-500">{dep.projet} • {dep.fournisseur}</p>
                  </div>
                  <span className="font-bold text-red-600">{(dep.montant / 1000).toFixed(0)}K$</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{dep.categorie}</span>
                  <span className="text-xs text-gray-400">{dep.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t">
            <button className="w-full text-center text-sm text-blue-600 hover:underline">
              Voir toutes les dépenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTempsReelModule;
