import React, { useState } from 'react';
import { 
  DollarSign, Users, Search, Download, Upload, RefreshCw, Calendar,
  Filter, ChevronDown, ChevronRight, Clock, TrendingUp, Building2,
  MapPin, Briefcase, FileSpreadsheet, Check, AlertCircle, Info
} from 'lucide-react';

interface TauxCCQ {
  id: string;
  metier: string;
  classe: string;
  region: string;
  tauxBase: number;
  vacances: number;
  conges: number;
  assurances: number;
  retraite: number;
  formation: number;
  total: number;
  dateEffective: string;
}

interface MetierGroupe {
  secteur: string;
  metiers: string[];
  expanded: boolean;
}

const CCQModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSecteur, setSelectedSecteur] = useState('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('2026-01-10 14:30');

  const regions = [
    'Montréal', 'Québec', 'Laval', 'Montérégie', 'Laurentides', 
    'Lanaudière', 'Estrie', 'Mauricie', 'Saguenay', 'Outaouais',
    'Abitibi', 'Côte-Nord', 'Bas-Saint-Laurent', 'Gaspésie'
  ];

  const secteurs = [
    'Institutionnel et commercial', 'Industriel', 'Génie civil et voirie', 'Résidentiel'
  ];

  const [metiersGroupes] = useState<MetierGroupe[]>([
    { secteur: 'Gros œuvre', metiers: ['Charpentier-menuisier', 'Cimentier-applicateur', 'Ferblantier', 'Ferrailleur', 'Grutier', 'Manœuvre'], expanded: true },
    { secteur: 'Mécanique', metiers: ['Électricien', 'Frigoriste', 'Mécanicien de machines lourdes', 'Plombier', 'Tuyauteur'], expanded: false },
    { secteur: 'Finition', metiers: ['Briqueteur-maçon', 'Carreleur', 'Peintre', 'Plâtrier', 'Poseur de revêtements'], expanded: false },
  ]);

  const [tauxCCQ] = useState<TauxCCQ[]>([
    { id: '1', metier: 'Charpentier-menuisier', classe: 'Compagnon', region: 'Montréal', tauxBase: 42.85, vacances: 5.57, conges: 3.43, assurances: 4.28, retraite: 6.43, formation: 0.85, total: 63.41, dateEffective: '2026-01-01' },
    { id: '2', metier: 'Charpentier-menuisier', classe: 'Apprenti 1', region: 'Montréal', tauxBase: 25.71, vacances: 3.34, conges: 2.06, assurances: 2.57, retraite: 3.86, formation: 0.51, total: 38.05, dateEffective: '2026-01-01' },
    { id: '3', metier: 'Électricien', classe: 'Compagnon', region: 'Montréal', tauxBase: 46.52, vacances: 6.05, conges: 3.72, assurances: 4.65, retraite: 6.98, formation: 0.93, total: 68.85, dateEffective: '2026-01-01' },
    { id: '4', metier: 'Briqueteur-maçon', classe: 'Compagnon', region: 'Montréal', tauxBase: 44.28, vacances: 5.76, conges: 3.54, assurances: 4.43, retraite: 6.64, formation: 0.89, total: 65.54, dateEffective: '2026-01-01' },
    { id: '5', metier: 'Plombier', classe: 'Compagnon', region: 'Montréal', tauxBase: 47.15, vacances: 6.13, conges: 3.77, assurances: 4.72, retraite: 7.07, formation: 0.94, total: 69.78, dateEffective: '2026-01-01' },
    { id: '6', metier: 'Ferblantier', classe: 'Compagnon', region: 'Montréal', tauxBase: 44.92, vacances: 5.84, conges: 3.59, assurances: 4.49, retraite: 6.74, formation: 0.90, total: 66.48, dateEffective: '2026-01-01' },
    { id: '7', metier: 'Grutier', classe: 'Compagnon', region: 'Montréal', tauxBase: 48.75, vacances: 6.34, conges: 3.90, assurances: 4.88, retraite: 7.31, formation: 0.97, total: 72.15, dateEffective: '2026-01-01' },
    { id: '8', metier: 'Manœuvre', classe: 'Spécialisé', region: 'Montréal', tauxBase: 32.45, vacances: 4.22, conges: 2.60, assurances: 3.25, retraite: 4.87, formation: 0.65, total: 48.04, dateEffective: '2026-01-01' },
  ]);

  const filteredTaux = tauxCCQ.filter(t => {
    const matchSearch = t.metier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       t.classe.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = selectedRegion === 'all' || t.region === selectedRegion;
    return matchSearch && matchRegion;
  });

  const handleSync = () => {
    setLastUpdate(new Date().toLocaleString('fr-CA'));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" />
            Taux CCQ - Convention Collective
          </h1>
          <p className="text-gray-600">Taux horaires officiels de la CCQ avec avantages sociaux</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter Excel
          </button>
          <button 
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Synchroniser CCQ
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-blue-900">Taux en vigueur - Convention 2024-2028</p>
          <p className="text-sm text-blue-700">Dernière mise à jour: {lastUpdate} | Secteur: Institutionnel et commercial</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Métiers</p>
          <p className="text-2xl font-bold">26</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Taux moyen</p>
          <p className="text-2xl font-bold text-green-600">65.28$/h</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Avantages sociaux</p>
          <p className="text-2xl font-bold text-blue-600">~48%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Régions</p>
          <p className="text-2xl font-bold">{regions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Prochaine hausse</p>
          <p className="text-2xl font-bold text-orange-600">1er mai</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar - Métiers par catégorie */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            Métiers par secteur
          </h3>
          <div className="space-y-2">
            {metiersGroupes.map((groupe, idx) => (
              <div key={idx} className="border rounded-lg">
                <button 
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  onClick={() => {}}
                >
                  <span className="font-medium text-sm">{groupe.secteur}</span>
                  {groupe.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {groupe.expanded && (
                  <div className="border-t px-3 py-2 space-y-1">
                    {groupe.metiers.map((metier, i) => (
                      <button 
                        key={i}
                        className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-blue-50 hover:text-blue-600"
                      >
                        {metier}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-3 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un métier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les régions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={selectedSecteur}
                onChange={(e) => setSelectedSecteur(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les secteurs</option>
                {secteurs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Métier</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Classe</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Taux base</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Avantages</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Total/h</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Détails</th>
                </tr>
              </thead>
              <tbody>
                {filteredTaux.map((taux) => (
                  <React.Fragment key={taux.id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="font-medium">{taux.metier}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          taux.classe === 'Compagnon' ? 'bg-green-100 text-green-700' :
                          taux.classe.includes('Apprenti') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {taux.classe}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{taux.tauxBase.toFixed(2)}$</td>
                      <td className="p-3 text-right font-mono text-gray-500">
                        +{(taux.total - taux.tauxBase).toFixed(2)}$
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        {taux.total.toFixed(2)}$
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => setShowDetails(showDetails === taux.id ? null : taux.id)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {showDetails === taux.id ? 'Masquer' : 'Voir'}
                        </button>
                      </td>
                    </tr>
                    {showDetails === taux.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-6 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Vacances (13%)</p>
                              <p className="font-medium">{taux.vacances.toFixed(2)}$</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Congés (8%)</p>
                              <p className="font-medium">{taux.conges.toFixed(2)}$</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Assurances (10%)</p>
                              <p className="font-medium">{taux.assurances.toFixed(2)}$</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Retraite (15%)</p>
                              <p className="font-medium">{taux.retraite.toFixed(2)}$</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Formation (2%)</p>
                              <p className="font-medium">{taux.formation.toFixed(2)}$</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Effectif depuis</p>
                              <p className="font-medium">{taux.dateEffective}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculateur rapide */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-green-600" />
              Calculateur de coût main-d'œuvre
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Métier</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Charpentier-menuisier</option>
                  <option>Électricien</option>
                  <option>Plombier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Heures</label>
                <input type="number" defaultValue={40} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre ouvriers</label>
                <input type="number" defaultValue={2} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Coût total</label>
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold">
                  5,072.80 $
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCQModule;
