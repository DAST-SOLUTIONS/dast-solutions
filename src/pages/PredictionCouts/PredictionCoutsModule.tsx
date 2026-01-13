import React, { useState } from 'react';
import { 
  TrendingUp, AlertTriangle, DollarSign, Target, Brain, BarChart3,
  PieChart, ArrowUpRight, ArrowDownRight, Calendar, Building2,
  RefreshCw, Download, Settings, Info, CheckCircle, Clock,
  ChevronRight, Sparkles, Activity, Gauge, AlertCircle
} from 'lucide-react';

interface Prediction {
  id: string;
  projet: string;
  budgetInitial: number;
  depenseActuelle: number;
  predictionFinale: number;
  ecartPredit: number;
  ecartPourcentage: number;
  confiance: number;
  risque: 'low' | 'medium' | 'high' | 'critical';
  facteurs: FacteurRisque[];
}

interface FacteurRisque {
  nom: string;
  impact: number;
  tendance: 'up' | 'down' | 'stable';
  description: string;
}

interface AlertePrediction {
  id: string;
  projet: string;
  type: 'depassement' | 'retard' | 'ressources';
  message: string;
  probabilite: number;
  date: string;
}

const PredictionCoutsModule: React.FC = () => {
  const [selectedProjet, setSelectedProjet] = useState<string | null>('1');
  const [periodeAnalyse, setPeriodeAnalyse] = useState('6months');
  const [showDetails, setShowDetails] = useState(false);

  const [predictions] = useState<Prediction[]>([
    { 
      id: '1', 
      projet: 'Tour Deloitte', 
      budgetInitial: 12500000, 
      depenseActuelle: 5625000, 
      predictionFinale: 12850000, 
      ecartPredit: 350000, 
      ecartPourcentage: 2.8,
      confiance: 87,
      risque: 'medium',
      facteurs: [
        { nom: 'Hausse prix acier', impact: 180000, tendance: 'up', description: '+5.8% depuis 6 mois' },
        { nom: 'Productivité équipe', impact: -45000, tendance: 'down', description: 'Meilleure que prévu' },
        { nom: 'Météo hivernale', impact: 120000, tendance: 'up', description: 'Retards possibles' },
        { nom: 'RFI en attente', impact: 95000, tendance: 'stable', description: '3 changements potentiels' },
      ]
    },
    { 
      id: '2', 
      projet: 'Centre Bell', 
      budgetInitial: 4500000, 
      depenseActuelle: 3240000, 
      predictionFinale: 4680000, 
      ecartPredit: 180000, 
      ecartPourcentage: 4.0,
      confiance: 82,
      risque: 'high',
      facteurs: [
        { nom: 'Main-d\'œuvre spécialisée', impact: 120000, tendance: 'up', description: 'Pénurie techniciens' },
        { nom: 'Matériaux importés', impact: 85000, tendance: 'up', description: 'Délais douane' },
        { nom: 'Heures supplémentaires', impact: -25000, tendance: 'down', description: 'Moins que prévu' },
      ]
    },
    { 
      id: '3', 
      projet: 'Résidence Soleil', 
      budgetInitial: 3200000, 
      depenseActuelle: 3180000, 
      predictionFinale: 3195000, 
      ecartPredit: -5000, 
      ecartPourcentage: -0.2,
      confiance: 95,
      risque: 'low',
      facteurs: [
        { nom: 'Projet quasi terminé', impact: -5000, tendance: 'down', description: 'Finitions mineures' },
      ]
    },
    { 
      id: '4', 
      projet: 'École Primaire', 
      budgetInitial: 2800000, 
      depenseActuelle: 2520000, 
      predictionFinale: 3080000, 
      ecartPredit: 280000, 
      ecartPourcentage: 10.0,
      confiance: 78,
      risque: 'critical',
      facteurs: [
        { nom: 'Changements de portée', impact: 150000, tendance: 'up', description: 'Ajouts client non prévus' },
        { nom: 'Problèmes fondations', impact: 95000, tendance: 'up', description: 'Sol instable découvert' },
        { nom: 'Retards fournisseurs', impact: 35000, tendance: 'stable', description: 'Pénalités possibles' },
      ]
    },
  ]);

  const [alertes] = useState<AlertePrediction[]>([
    { id: '1', projet: 'École Primaire', type: 'depassement', message: 'Risque de dépassement budget de 10%', probabilite: 78, date: '2026-01-12' },
    { id: '2', projet: 'Centre Bell', type: 'retard', message: 'Retard probable de 2 semaines', probabilite: 65, date: '2026-01-11' },
    { id: '3', projet: 'Tour Deloitte', type: 'ressources', message: 'Pénurie ferrailleurs prévue en février', probabilite: 72, date: '2026-01-10' },
  ]);

  const getRisqueBadge = (risque: string) => {
    const styles: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
      critical: 'Critique',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[risque]}`}>{labels[risque]}</span>;
  };

  const currentPrediction = predictions.find(p => p.id === selectedProjet);

  const globalStats = {
    budgetTotal: predictions.reduce((sum, p) => sum + p.budgetInitial, 0),
    predictionTotal: predictions.reduce((sum, p) => sum + p.predictionFinale, 0),
    ecartTotal: predictions.reduce((sum, p) => sum + p.ecartPredit, 0),
    projetsRisque: predictions.filter(p => p.risque === 'high' || p.risque === 'critical').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-red-600" />
            Prédiction des Coûts
          </h1>
          <p className="text-gray-600">Analyse prédictive des dépassements de budget par IA</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periodeAnalyse}
            onChange={(e) => setPeriodeAnalyse(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="3months">3 prochains mois</option>
            <option value="6months">6 prochains mois</option>
            <option value="endproject">Fin de projet</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw size={18} />
            Recalculer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Download size={18} />
            Rapport prédictif
          </button>
        </div>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600" size={20} />
            <span className="font-semibold text-red-900">Alertes prédictives ({alertes.length})</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {alertes.map((alerte) => (
              <div key={alerte.id} className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm">{alerte.projet}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    {alerte.probabilite}% probable
                  </span>
                </div>
                <p className="text-sm text-gray-600">{alerte.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Budget total</p>
            <DollarSign size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{(globalStats.budgetTotal / 1000000).toFixed(1)}M$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Prédiction finale</p>
            <TrendingUp size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">{(globalStats.predictionTotal / 1000000).toFixed(1)}M$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Écart prédit</p>
            {globalStats.ecartTotal > 0 ? (
              <ArrowUpRight size={20} className="text-red-500" />
            ) : (
              <ArrowDownRight size={20} className="text-green-500" />
            )}
          </div>
          <p className={`text-2xl font-bold mt-2 ${globalStats.ecartTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {globalStats.ecartTotal > 0 ? '+' : ''}{(globalStats.ecartTotal / 1000).toFixed(0)}K$
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Projets à risque</p>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600">{globalStats.projetsRisque}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des projets */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              Projets analysés
            </h3>
          </div>
          <div className="divide-y">
            {predictions.map((pred) => (
              <div 
                key={pred.id}
                onClick={() => setSelectedProjet(pred.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedProjet === pred.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{pred.projet}</p>
                    <p className="text-sm text-gray-500">
                      Budget: {(pred.budgetInitial / 1000000).toFixed(1)}M$
                    </p>
                  </div>
                  {getRisqueBadge(pred.risque)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Gauge size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Confiance: {pred.confiance}%</span>
                  </div>
                  <span className={`font-bold ${pred.ecartPredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {pred.ecartPredit > 0 ? '+' : ''}{pred.ecartPourcentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail prédiction */}
        <div className="col-span-2 space-y-4">
          {currentPrediction ? (
            <>
              {/* Résumé prédiction */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{currentPrediction.projet}</h3>
                    <p className="text-gray-500">Analyse prédictive des coûts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Niveau de confiance</p>
                      <p className="text-2xl font-bold text-purple-600">{currentPrediction.confiance}%</p>
                    </div>
                    {getRisqueBadge(currentPrediction.risque)}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Budget initial</p>
                    <p className="text-xl font-bold">{(currentPrediction.budgetInitial / 1000000).toFixed(2)}M$</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Dépensé</p>
                    <p className="text-xl font-bold">{(currentPrediction.depenseActuelle / 1000000).toFixed(2)}M$</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">Prédiction finale</p>
                    <p className="text-xl font-bold text-purple-700">{(currentPrediction.predictionFinale / 1000000).toFixed(2)}M$</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${currentPrediction.ecartPredit > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-sm mb-1 ${currentPrediction.ecartPredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Écart prédit
                    </p>
                    <p className={`text-xl font-bold ${currentPrediction.ecartPredit > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {currentPrediction.ecartPredit > 0 ? '+' : ''}{(currentPrediction.ecartPredit / 1000).toFixed(0)}K$
                    </p>
                  </div>
                </div>

                {/* Jauge visuelle */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression budget</span>
                    <span>{((currentPrediction.depenseActuelle / currentPrediction.budgetInitial) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(currentPrediction.depenseActuelle / currentPrediction.budgetInitial) * 100}%` }}
                    />
                    {currentPrediction.ecartPredit > 0 && (
                      <div 
                        className="absolute top-0 h-full bg-red-300"
                        style={{ 
                          left: '100%',
                          width: `${(currentPrediction.ecartPredit / currentPrediction.budgetInitial) * 100}%`,
                          marginLeft: '-1px'
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0$</span>
                    <span>Budget: {(currentPrediction.budgetInitial / 1000000).toFixed(1)}M$</span>
                    {currentPrediction.ecartPredit > 0 && (
                      <span className="text-red-500">Prédit: {(currentPrediction.predictionFinale / 1000000).toFixed(2)}M$</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Facteurs de risque */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-orange-600" />
                  Facteurs d'impact identifiés
                </h3>
                <div className="space-y-3">
                  {currentPrediction.facteurs.map((facteur, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          facteur.impact > 0 ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {facteur.tendance === 'up' && <TrendingUp size={18} className="text-red-500" />}
                          {facteur.tendance === 'down' && <ArrowDownRight size={18} className="text-green-500" />}
                          {facteur.tendance === 'stable' && <Activity size={18} className="text-gray-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{facteur.nom}</p>
                          <p className="text-sm text-gray-500">{facteur.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${facteur.impact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {facteur.impact > 0 ? '+' : ''}{(facteur.impact / 1000).toFixed(0)}K$
                        </p>
                        <p className="text-xs text-gray-500">Impact estimé</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles size={18} />
                  Recommandations IA
                </h3>
                <div className="space-y-3">
                  {currentPrediction.risque === 'critical' || currentPrediction.risque === 'high' ? (
                    <>
                      <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Réviser immédiatement le budget avec le client pour les changements de portée identifiés</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                        <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Négocier des contrats à prix fixe avec les fournisseurs pour limiter l'exposition aux hausses de prix</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                        <Clock size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Planifier une réunion de révision budgétaire dans les 5 prochains jours</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                        <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Le projet est bien contrôlé. Maintenir la surveillance actuelle des coûts</p>
                      </div>
                      <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
                        <Target size={18} className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm">Opportunité: Négocier les prochains achats d'acier avant la hausse prévue</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Brain size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Sélectionnez un projet pour voir les prédictions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionCoutsModule;
