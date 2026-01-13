import React, { useState } from 'react';
import { 
  Brain, DollarSign, TrendingUp, TrendingDown, Search, Filter,
  Database, Sparkles, Target, BarChart3, PieChart, AlertTriangle,
  CheckCircle, Clock, Building2, MapPin, Calendar, ArrowRight,
  Zap, RefreshCw, Download, Settings, Info, ChevronRight
} from 'lucide-react';

interface PriceSuggestion {
  id: string;
  element: string;
  categorie: string;
  quantite: number;
  unite: string;
  prixSuggere: number;
  prixMin: number;
  prixMax: number;
  confiance: number;
  baseSur: number;
  tendance: 'up' | 'down' | 'stable';
  variation: number;
}

interface ProjetSimilaire {
  id: string;
  nom: string;
  client: string;
  region: string;
  annee: number;
  montant: number;
  type: string;
  similarite: number;
}

const AIEstimationModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [showProjectSearch, setShowProjectSearch] = useState(false);

  const [suggestions] = useState<PriceSuggestion[]>([
    { id: '1', element: 'Béton armé 30 MPa', categorie: 'Béton', quantite: 185, unite: 'm³', prixSuggere: 285, prixMin: 265, prixMax: 310, confiance: 94, baseSur: 847, tendance: 'up', variation: 3.2 },
    { id: '2', element: 'Coffrage standard', categorie: 'Coffrage', quantite: 1250, unite: 'm²', prixSuggere: 45, prixMin: 38, prixMax: 52, confiance: 91, baseSur: 623, tendance: 'stable', variation: 0.5 },
    { id: '3', element: 'Armature 15M', categorie: 'Acier', quantite: 12500, unite: 'kg', prixSuggere: 2.85, prixMin: 2.65, prixMax: 3.10, confiance: 96, baseSur: 1245, tendance: 'up', variation: 5.8 },
    { id: '4', element: 'Maçonnerie brique', categorie: 'Maçonnerie', quantite: 845, unite: 'm²', prixSuggere: 185, prixMin: 165, prixMax: 210, confiance: 89, baseSur: 412, tendance: 'down', variation: -2.1 },
    { id: '5', element: 'Membrane élastomère', categorie: 'Toiture', quantite: 1320, unite: 'm²', prixSuggere: 68, prixMin: 58, prixMax: 78, confiance: 92, baseSur: 534, tendance: 'up', variation: 4.5 },
    { id: '6', element: 'Fenêtre aluminium', categorie: 'Fenestration', quantite: 24, unite: 'unités', prixSuggere: 1250, prixMin: 1100, prixMax: 1450, confiance: 88, baseSur: 356, tendance: 'stable', variation: 1.2 },
    { id: '7', element: 'Porte acier', categorie: 'Portes', quantite: 42, unite: 'unités', prixSuggere: 850, prixMin: 750, prixMax: 980, confiance: 90, baseSur: 289, tendance: 'up', variation: 2.8 },
    { id: '8', element: 'Isolation R-24', categorie: 'Isolation', quantite: 2100, unite: 'm²', prixSuggere: 12, prixMin: 10, prixMax: 15, confiance: 93, baseSur: 678, tendance: 'stable', variation: 0.8 },
  ]);

  const [projetsSimilaires] = useState<ProjetSimilaire[]>([
    { id: '1', nom: 'Centre commercial Place Laurier', client: 'Ivanhoé Cambridge', region: 'Québec', annee: 2025, montant: 15200000, type: 'Commercial', similarite: 94 },
    { id: '2', nom: 'Tour de bureaux Desjardins', client: 'Desjardins', region: 'Montréal', annee: 2024, montant: 12800000, type: 'Commercial', similarite: 91 },
    { id: '3', nom: 'École secondaire St-Laurent', client: 'CSDM', region: 'Montréal', annee: 2025, montant: 8500000, type: 'Institutionnel', similarite: 87 },
    { id: '4', nom: 'Résidence pour aînés Soleil', client: 'Groupe Santé', region: 'Laval', annee: 2024, montant: 11200000, type: 'Résidentiel', similarite: 85 },
  ]);

  const categories = ['Béton', 'Coffrage', 'Acier', 'Maçonnerie', 'Toiture', 'Fenestration', 'Portes', 'Isolation'];

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-600 bg-green-100';
    if (conf >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredSuggestions = suggestions.filter(s => {
    const matchSearch = s.element.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategorie = selectedCategorie === 'all' || s.categorie === selectedCategorie;
    return matchSearch && matchCategorie;
  });

  const totalSuggere = suggestions.reduce((sum, s) => sum + (s.prixSuggere * s.quantite), 0);
  const totalMin = suggestions.reduce((sum, s) => sum + (s.prixMin * s.quantite), 0);
  const totalMax = suggestions.reduce((sum, s) => sum + (s.prixMax * s.quantite), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-green-600" />
            AI Estimation
          </h1>
          <p className="text-gray-600">Suggestions de prix basées sur 3000+ projets historiques</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowProjectSearch(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Database size={18} />
            Projets similaires
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Sparkles size={18} />
            Générer estimation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Estimation suggérée</p>
            <DollarSign size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{(totalSuggere / 1000).toFixed(0)}K$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Fourchette basse</p>
            <TrendingDown size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{(totalMin / 1000).toFixed(0)}K$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Fourchette haute</p>
            <TrendingUp size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{(totalMax / 1000).toFixed(0)}K$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Confiance moyenne</p>
            <Target size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-600">91.6%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Projets analysés</p>
            <Database size={20} className="text-gray-500" />
          </div>
          <p className="text-2xl font-bold mt-2">3,247</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-green-900">Analyse basée sur votre historique</p>
          <p className="text-sm text-green-700">Les prix suggérés sont calculés à partir de vos 3,247 projets similaires dans la région de Montréal. Dernière mise à jour des données: Il y a 2 jours.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Tableau des suggestions */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Filters */}
          <div className="p-4 border-b flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un élément..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Élément</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Qté</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Prix suggéré</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Fourchette</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Confiance</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Tendance</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSuggestions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-sm">{s.element}</p>
                      <p className="text-xs text-gray-500">{s.categorie} • {s.baseSur} projets</p>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono">{s.quantite.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-1">{s.unite}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-green-600">{s.prixSuggere.toFixed(2)}$</span>
                      <span className="text-xs text-gray-500">/{s.unite}</span>
                    </td>
                    <td className="p-3 text-right text-sm text-gray-500">
                      {s.prixMin.toFixed(2)}$ - {s.prixMax.toFixed(2)}$
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(s.confiance)}`}>
                        {s.confiance}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.tendance === 'up' && <TrendingUp size={14} className="text-red-500" />}
                        {s.tendance === 'down' && <TrendingDown size={14} className="text-green-500" />}
                        {s.tendance === 'stable' && <ArrowRight size={14} className="text-gray-400" />}
                        <span className={`text-xs ${
                          s.tendance === 'up' ? 'text-red-500' : 
                          s.tendance === 'down' ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          {s.variation > 0 ? '+' : ''}{s.variation}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold">
                      {((s.prixSuggere * s.quantite) / 1000).toFixed(1)}K$
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-green-50">
                <tr>
                  <td colSpan={6} className="p-3 text-right font-bold">Total estimé:</td>
                  <td className="p-3 text-right font-bold text-green-600 text-lg">
                    {(totalSuggere / 1000).toFixed(1)}K$
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Graphique tendances */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Tendances des prix (12 mois)
            </h3>
            <div className="h-40 flex items-end gap-2">
              {[65, 70, 68, 75, 80, 78, 85, 82, 88, 90, 92, 95].map((value, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-gray-400">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">
              Indice moyen des prix construction Québec
            </p>
          </div>

          {/* Projets similaires */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Database size={18} className="text-purple-600" />
              Projets similaires
            </h3>
            <div className="space-y-3">
              {projetsSimilaires.slice(0, 3).map((projet) => (
                <div key={projet.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{projet.nom}</p>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      {projet.similarite}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {projet.region}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {projet.annee}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-green-600 mt-1">
                    {(projet.montant / 1000000).toFixed(1)}M$
                  </p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowProjectSearch(true)}
              className="w-full mt-3 py-2 text-sm text-purple-600 hover:underline flex items-center justify-center gap-1"
            >
              Voir tous les projets similaires <ChevronRight size={14} />
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle size={18} />
                Appliquer à la soumission
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50">
                <Download size={18} />
                Exporter rapport
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg hover:bg-gray-50">
                <RefreshCw size={18} />
                Recalculer
              </button>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-800">
              <AlertTriangle size={18} />
              Points d'attention
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Prix acier en hausse (+5.8% sur 6 mois)</li>
              <li>• 2 éléments avec confiance &lt; 90%</li>
              <li>• Réviser fenestration (moins de données)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Projets similaires */}
      {showProjectSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Base de données - Projets similaires</h2>
              <button onClick={() => setShowProjectSearch(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Rechercher un projet..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
                <select className="px-4 py-2 border rounded-lg">
                  <option>Toutes régions</option>
                  <option>Montréal</option>
                  <option>Québec</option>
                  <option>Laval</option>
                </select>
                <select className="px-4 py-2 border rounded-lg">
                  <option>Tous types</option>
                  <option>Commercial</option>
                  <option>Institutionnel</option>
                  <option>Résidentiel</option>
                </select>
              </div>
              <div className="space-y-3">
                {projetsSimilaires.map((projet) => (
                  <div key={projet.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{projet.nom}</h4>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            Similarité: {projet.similarite}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{projet.client}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {projet.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {projet.annee}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 size={12} />
                            {projet.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          {(projet.montant / 1000000).toFixed(1)}M$
                        </p>
                        <button className="mt-2 text-sm text-blue-600 hover:underline">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIEstimationModule;
