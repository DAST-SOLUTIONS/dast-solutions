import React, { useState } from 'react';
import { 
  Scale, Upload, FileText, CheckCircle, AlertTriangle, Trophy,
  DollarSign, Clock, Star, Search, Filter, Download, Eye,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Building2,
  Users, Calendar, Sparkles, Brain, ChevronRight, ChevronDown,
  X, Plus, Target, Award, TrendingUp, TrendingDown
} from 'lucide-react';

interface Soumissionnaire {
  id: string;
  nom: string;
  montantTotal: number;
  delai: number;
  score: number;
  rang: number;
  recommande: boolean;
  forces: string[];
  faiblesses: string[];
  details: DetailLigne[];
}

interface DetailLigne {
  poste: string;
  montant: number;
  ecartMoyen: number;
  flag?: 'low' | 'high' | 'normal';
}

interface ComparaisonProjet {
  id: string;
  nom: string;
  dateOuverture: string;
  nombreSoumissions: number;
  budgetEstime: number;
  status: 'analyzing' | 'completed' | 'pending';
}

const ComparaisonSoumissionsModule: React.FC = () => {
  const [selectedProjet, setSelectedProjet] = useState<string>('1');
  const [expandedSoumissionnaire, setExpandedSoumissionnaire] = useState<string | null>('1');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [projets] = useState<ComparaisonProjet[]>([
    { id: '1', nom: 'Rénovation Centre Bell - Loges', dateOuverture: '2026-01-10', nombreSoumissions: 5, budgetEstime: 4500000, status: 'completed' },
    { id: '2', nom: 'École Primaire St-Louis - Agrandissement', dateOuverture: '2026-01-08', nombreSoumissions: 4, budgetEstime: 2800000, status: 'completed' },
    { id: '3', nom: 'Stationnement Hôpital', dateOuverture: '2026-01-12', nombreSoumissions: 3, budgetEstime: 1200000, status: 'analyzing' },
  ]);

  const [soumissionnaires] = useState<Soumissionnaire[]>([
    { 
      id: '1', 
      nom: 'Construction ABC Inc.', 
      montantTotal: 4285000, 
      delai: 180, 
      score: 92, 
      rang: 1,
      recommande: true,
      forces: ['Prix compétitif', 'Excellentes références', 'Équipe expérimentée', 'Délai réaliste'],
      faiblesses: ['Garantie limitée sur électricité'],
      details: [
        { poste: 'Démolition', montant: 185000, ecartMoyen: -5, flag: 'normal' },
        { poste: 'Structure', montant: 1250000, ecartMoyen: -8, flag: 'low' },
        { poste: 'Mécanique', montant: 890000, ecartMoyen: 2, flag: 'normal' },
        { poste: 'Électricité', montant: 720000, ecartMoyen: -3, flag: 'normal' },
        { poste: 'Finitions', montant: 1240000, ecartMoyen: -2, flag: 'normal' },
      ]
    },
    { 
      id: '2', 
      nom: 'Groupe Construction MTL', 
      montantTotal: 4450000, 
      delai: 165, 
      score: 85, 
      rang: 2,
      recommande: false,
      forces: ['Délai le plus court', 'Garantie étendue', 'Présence locale'],
      faiblesses: ['Prix plus élevé', 'Moins d\'expérience en rénovation'],
      details: [
        { poste: 'Démolition', montant: 195000, ecartMoyen: 0, flag: 'normal' },
        { poste: 'Structure', montant: 1320000, ecartMoyen: -3, flag: 'normal' },
        { poste: 'Mécanique', montant: 925000, ecartMoyen: 6, flag: 'high' },
        { poste: 'Électricité', montant: 750000, ecartMoyen: 1, flag: 'normal' },
        { poste: 'Finitions', montant: 1260000, ecartMoyen: -1, flag: 'normal' },
      ]
    },
    { 
      id: '3', 
      nom: 'Bâtisseurs Québec', 
      montantTotal: 4620000, 
      delai: 200, 
      score: 78, 
      rang: 3,
      recommande: false,
      forces: ['Équipe spécialisée LEED', 'Excellente qualité'],
      faiblesses: ['Prix le plus élevé', 'Délai le plus long'],
      details: [
        { poste: 'Démolition', montant: 210000, ecartMoyen: 8, flag: 'high' },
        { poste: 'Structure', montant: 1380000, ecartMoyen: 2, flag: 'normal' },
        { poste: 'Mécanique', montant: 950000, ecartMoyen: 9, flag: 'high' },
        { poste: 'Électricité', montant: 780000, ecartMoyen: 5, flag: 'normal' },
        { poste: 'Finitions', montant: 1300000, ecartMoyen: 2, flag: 'normal' },
      ]
    },
    { 
      id: '4', 
      nom: 'Pro-Construction Laval', 
      montantTotal: 4180000, 
      delai: 195, 
      score: 72, 
      rang: 4,
      recommande: false,
      forces: ['Prix le plus bas'],
      faiblesses: ['Structure anormalement basse', 'Délai optimiste', 'Références limitées'],
      details: [
        { poste: 'Démolition', montant: 175000, ecartMoyen: -10, flag: 'low' },
        { poste: 'Structure', montant: 1150000, ecartMoyen: -15, flag: 'low' },
        { poste: 'Mécanique', montant: 870000, ecartMoyen: 0, flag: 'normal' },
        { poste: 'Électricité', montant: 695000, ecartMoyen: -6, flag: 'low' },
        { poste: 'Finitions', montant: 1290000, ecartMoyen: 1, flag: 'normal' },
      ]
    },
    { 
      id: '5', 
      nom: 'Constructions Élite', 
      montantTotal: 4380000, 
      delai: 175, 
      score: 80, 
      rang: 5,
      recommande: false,
      forces: ['Bonne réputation', 'Flexibilité'],
      faiblesses: ['Mécanique élevée', 'Équipe réduite'],
      details: [
        { poste: 'Démolition', montant: 190000, ecartMoyen: -3, flag: 'normal' },
        { poste: 'Structure', montant: 1280000, ecartMoyen: -6, flag: 'normal' },
        { poste: 'Mécanique', montant: 960000, ecartMoyen: 10, flag: 'high' },
        { poste: 'Électricité', montant: 710000, ecartMoyen: -4, flag: 'normal' },
        { poste: 'Finitions', montant: 1240000, ecartMoyen: -2, flag: 'normal' },
      ]
    },
  ]);

  const currentProjet = projets.find(p => p.id === selectedProjet);
  const moyenneMontant = soumissionnaires.reduce((sum, s) => sum + s.montantTotal, 0) / soumissionnaires.length;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFlagIcon = (flag?: string) => {
    if (flag === 'low') return <ArrowDownRight size={14} className="text-orange-500" />;
    if (flag === 'high') return <ArrowUpRight size={14} className="text-red-500" />;
    return null;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="text-blue-600" />
            Comparaison des Soumissions
          </h1>
          <p className="text-gray-600">Analyse IA des soumissions reçues</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Upload size={18} />
            Importer soumissions
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Sparkles size={18} />
            Analyser
          </button>
        </div>
      </div>

      {/* Sélection projet */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="font-medium">Appel d'offres:</span>
          <select
            value={selectedProjet}
            onChange={(e) => setSelectedProjet(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border rounded-lg"
          >
            {projets.map(p => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar size={14} />
              Ouvert le {currentProjet?.dateOuverture}
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <FileText size={14} />
              {currentProjet?.nombreSoumissions} soumissions
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <DollarSign size={14} />
              Budget: {((currentProjet?.budgetEstime || 0) / 1000000).toFixed(1)}M$
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Plus basse</p>
          <p className="text-2xl font-bold text-green-600">4.18M$</p>
          <p className="text-xs text-gray-400">Pro-Construction Laval</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Moyenne</p>
          <p className="text-2xl font-bold">{(moyenneMontant / 1000000).toFixed(2)}M$</p>
          <p className="text-xs text-gray-400">5 soumissions</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Plus haute</p>
          <p className="text-2xl font-bold text-red-600">4.62M$</p>
          <p className="text-xs text-gray-400">Bâtisseurs Québec</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Écart</p>
          <p className="text-2xl font-bold text-orange-600">10.5%</p>
          <p className="text-xs text-gray-400">Entre min et max</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Recommandé IA</p>
          <p className="text-2xl font-bold text-blue-600">ABC Inc.</p>
          <p className="text-xs text-gray-400">Score: 92/100</p>
        </div>
      </div>

      {/* Recommandation IA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Recommandation IA: Construction ABC Inc.</h3>
              <p className="text-blue-100 mb-3">
                Meilleur rapport qualité-prix avec un score global de 92/100. Prix compétitif (-4.9% vs moyenne), 
                délai réaliste et excellentes références vérifiées.
              </p>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
                  Voir le détail
                </button>
                <button className="px-4 py-2 bg-white/20 rounded-lg font-medium hover:bg-white/30">
                  Générer rapport comparatif
                </button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">4,285,000$</p>
            <p className="text-blue-200">-4.9% vs moyenne</p>
          </div>
        </div>
      </div>

      {/* Liste des soumissionnaires */}
      <div className="space-y-4">
        {soumissionnaires.map((soum) => (
          <div key={soum.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${soum.recommande ? 'ring-2 ring-blue-500' : ''}`}>
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedSoumissionnaire(expandedSoumissionnaire === soum.id ? null : soum.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    soum.rang === 1 ? 'bg-yellow-100 text-yellow-600' :
                    soum.rang === 2 ? 'bg-gray-100 text-gray-600' :
                    soum.rang === 3 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    #{soum.rang}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{soum.nom}</h4>
                      {soum.recommande && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Star size={10} fill="currentColor" />
                          Recommandé
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {soum.delai} jours
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(soum.score)}`}>
                        Score: {soum.score}/100
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-bold">{(soum.montantTotal / 1000000).toFixed(3)}M$</p>
                    <p className={`text-sm ${soum.montantTotal < moyenneMontant ? 'text-green-600' : 'text-red-600'}`}>
                      {soum.montantTotal < moyenneMontant ? '' : '+'}{(((soum.montantTotal - moyenneMontant) / moyenneMontant) * 100).toFixed(1)}% vs moy.
                    </p>
                  </div>
                  {expandedSoumissionnaire === soum.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </div>
            </div>

            {expandedSoumissionnaire === soum.id && (
              <div className="border-t p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-6">
                  {/* Détail par poste */}
                  <div className="col-span-2">
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 size={16} className="text-blue-600" />
                      Ventilation par poste
                    </h5>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left py-2">Poste</th>
                          <th className="text-right py-2">Montant</th>
                          <th className="text-right py-2">Écart vs moy.</th>
                          <th className="text-center py-2">Analyse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {soum.details.map((detail, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2">{detail.poste}</td>
                            <td className="text-right py-2 font-mono">{(detail.montant / 1000).toFixed(0)}K$</td>
                            <td className={`text-right py-2 ${detail.ecartMoyen < 0 ? 'text-green-600' : detail.ecartMoyen > 5 ? 'text-red-600' : ''}`}>
                              {detail.ecartMoyen > 0 ? '+' : ''}{detail.ecartMoyen}%
                            </td>
                            <td className="text-center py-2">
                              {getFlagIcon(detail.flag)}
                              {detail.flag === 'low' && <span className="text-xs text-orange-600 ml-1">Anormalement bas</span>}
                              {detail.flag === 'high' && <span className="text-xs text-red-600 ml-1">Élevé</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Forces et faiblesses */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2 text-green-700 flex items-center gap-1">
                        <CheckCircle size={14} />
                        Points forts
                      </h5>
                      <ul className="space-y-1">
                        {soum.forces.map((force, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            {force}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {soum.faiblesses.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 text-orange-700 flex items-center gap-1">
                          <AlertTriangle size={14} />
                          Points d'attention
                        </h5>
                        <ul className="space-y-1">
                          {soum.faiblesses.map((faiblesse, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                              {faiblesse}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Voir soumission complète
                  </button>
                  <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
                    Demander clarifications
                  </button>
                  <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
                    Exporter analyse
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Upload */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Importer des soumissions</h2>
              <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center mb-4">
                <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="font-medium text-gray-700 mb-1">Glissez vos fichiers ici</p>
                <p className="text-sm text-gray-500 mb-3">PDF, Excel ou Word</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Parcourir
                </button>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">Formats acceptés:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Soumissions scannées (PDF)</li>
                  <li>Tableaux Excel avec ventilation</li>
                  <li>Documents Word</li>
                </ul>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded-lg">
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                <Sparkles size={18} />
                Analyser avec IA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparaisonSoumissionsModule;
