import React, { useState } from 'react';
import { 
  Brain, Upload, Sparkles, Target, Image as ImageIcon, 
  CheckCircle, Clock, AlertTriangle 
} from 'lucide-react';

const AIRecognitionModule: React.FC = () => {
  const [results] = useState([
    { type: 'Porte', count: 12, confidence: 94, status: 'validated' },
    { type: 'Fenêtre', count: 24, confidence: 91, status: 'validated' },
    { type: 'Prise électrique', count: 48, confidence: 87, status: 'pending' },
    { type: 'Luminaire', count: 36, confidence: 82, status: 'pending' },
    { type: 'Évier', count: 4, confidence: 78, status: 'review' },
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-purple-600" />
            Reconnaissance IA
          </h1>
          <p className="text-gray-600">Extraction automatique des quantités par intelligence artificielle</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Plans analysés</p>
          <p className="text-2xl font-bold">47</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Items détectés</p>
          <p className="text-2xl font-bold text-purple-600">1,284</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Précision moyenne</p>
          <p className="text-2xl font-bold text-green-600">89%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Temps économisé</p>
          <p className="text-2xl font-bold">24h</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Upload className="text-blue-600" size={20} />
            Analyser un plan
          </h3>
          <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer transition-colors">
            <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">Glissez un plan PDF ici</p>
            <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner</p>
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Détecter les portes et fenêtres</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm">Détecter les éléments électriques</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Détecter la plomberie</span>
            </label>
          </div>
          <button className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
            <Sparkles size={18} />
            Lancer l'analyse
          </button>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="text-green-600" size={20} />
              Résultats de détection
            </h3>
            <span className="text-sm text-gray-500">Plan: Niveau-1-Architectural.pdf</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Élément</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Quantité</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Confiance</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.type}</td>
                  <td className="p-3 text-right font-mono">{item.count}</td>
                  <td className="p-3 text-right">
                    <span className={`font-medium ${item.confidence >= 90 ? 'text-green-600' : item.confidence >= 80 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {item.confidence}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {item.status === 'validated' && <span className="inline-flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Validé</span>}
                    {item.status === 'pending' && <span className="inline-flex items-center gap-1 text-blue-600 text-sm"><Clock size={14} /> En attente</span>}
                    {item.status === 'review' && <span className="inline-flex items-center gap-1 text-orange-600 text-sm"><AlertTriangle size={14} /> À revoir</span>}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 hover:underline text-sm">Voir sur plan</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t flex justify-between">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Tout valider</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Exporter vers Takeoff</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecognitionModule;
