import React, { useState } from 'react';
import { Check, Ruler, Square, Circle, Zap, Link2, Calculator } from 'lucide-react';

const TakeoffSyncModule: React.FC = () => {
  const [measurements] = useState([
    { id: '1', type: 'area', name: 'Plancher béton N1', value: 450, unit: 'm²', layer: 'Béton', linked: true },
    { id: '2', type: 'length', name: 'Mur extérieur', value: 120, unit: 'm', layer: 'Maçonnerie', linked: true },
    { id: '3', type: 'count', name: 'Fenêtres standard', value: 24, unit: 'unités', layer: 'Fenestration', linked: false },
    { id: '4', type: 'area', name: 'Toiture plate', value: 380, unit: 'm²', layer: 'Toiture', linked: true },
    { id: '5', type: 'length', name: 'Conduits CVAC', value: 85, unit: 'm', layer: 'Mécanique', linked: false },
  ]);

  const [quoteItems] = useState([
    { measurement: 'Plancher béton N1', qty: 450, unit: 'm²', unitCost: 85, labor: 25, total: 49500 },
    { measurement: 'Mur extérieur', qty: 120, unit: 'm', unitCost: 220, labor: 45, total: 31800 },
    { measurement: 'Toiture plate', qty: 380, unit: 'm²', unitCost: 125, labor: 35, total: 60800 },
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="text-blue-600" />
            Takeoff → Soumission
          </h1>
          <p className="text-gray-600">Conversion automatique des mesures en soumission</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Zap size={18} />
          Générer soumission
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center gap-2">
            <Ruler className="text-blue-600" />
            <h3 className="font-semibold">Mesures du Takeoff</h3>
          </div>
          <div className="divide-y">
            {measurements.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {m.type === 'area' && <Square size={18} className="text-blue-500" />}
                  {m.type === 'length' && <Ruler size={18} className="text-green-500" />}
                  {m.type === 'count' && <Circle size={18} className="text-purple-500" />}
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.layer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">{m.value} {m.unit}</span>
                  {m.linked ? (
                    <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> Lié</span>
                  ) : (
                    <button className="text-blue-600 text-sm hover:underline">Lier</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center gap-2">
            <Calculator className="text-green-600" />
            <h3 className="font-semibold">Soumission générée</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Item</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Qté</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Mat.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">M.O.</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 text-sm">{item.measurement}</td>
                  <td className="p-3 text-right text-sm">{item.qty} {item.unit}</td>
                  <td className="p-3 text-right text-sm">{item.unitCost}$</td>
                  <td className="p-3 text-right text-sm">{item.labor}$</td>
                  <td className="p-3 text-right font-medium">{item.total.toLocaleString()}$</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="p-3 text-right font-medium">Sous-total</td>
                <td className="p-3 text-right font-bold">{quoteItems.reduce((s, i) => s + i.total, 0).toLocaleString()}$</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4">Règles de conversion automatique</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { layer: 'Béton', material: '85$/m²', labor: '25$/m²', overhead: '10%' },
            { layer: 'Maçonnerie', material: '220$/m', labor: '45$/m', overhead: '12%' },
            { layer: 'Toiture', material: '125$/m²', labor: '35$/m²', overhead: '10%' },
          ].map((rule, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{rule.layer}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Matériel: {rule.material}</p>
                <p>Main d'œuvre: {rule.labor}</p>
                <p>Frais généraux: {rule.overhead}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TakeoffSyncModule;
