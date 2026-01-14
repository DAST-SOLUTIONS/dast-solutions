import React, { useState } from 'react';
import { Calculator, Plus, FileUp, FileDown } from 'lucide-react';
import { useSoumissions } from '@/hooks/useSoumissions';
import type { EstimationItem } from '@/types/pricing-types';

export default function EstimationAdvanced() {
  const { createSoumission } = useSoumissions();
  const [items, setItems] = useState<EstimationItem[]>([]);
  const [projectName, setProjectName] = useState('');

  const addItem = () => {
    const newItem: EstimationItem = {
      id: Date.now().toString(),
      numero: items.length + 1,
      description: '',
      categorie: '',
      quantite: 0,
      unite: 'unité',
      prix_unitaire: 0,
      montant: 0,
      source: 'manual'
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<EstimationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.montant = updated.quantite * updated.prix_unitaire;
        return updated;
      }
      return item;
    }));
  };

  const total = items.reduce((sum, item) => sum + item.montant, 0);
  const tps = total * 0.05;
  const tvq = total * 0.09975;
  const grandTotal = total + tps + tvq;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-7 h-7" /> Estimation avancée
        </h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <FileUp className="w-4 h-4" /> Importer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <FileDown className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b">
          <input type="text" placeholder="Nom du projet" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-lg font-medium" />
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 w-12">#</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3 w-24">Qté</th>
              <th className="text-left p-3 w-24">Unité</th>
              <th className="text-right p-3 w-32">Prix unit.</th>
              <th className="text-right p-3 w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="p-3">{idx + 1}</td>
                <td className="p-3">
                  <input type="text" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className="w-full px-2 py-1 border rounded" />
                </td>
                <td className="p-3">
                  <input type="number" value={item.quantite} onChange={(e) => updateItem(item.id, { quantite: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" />
                </td>
                <td className="p-3">
                  <input type="text" value={item.unite} onChange={(e) => updateItem(item.id, { unite: e.target.value })} className="w-full px-2 py-1 border rounded" />
                </td>
                <td className="p-3">
                  <input type="number" value={item.prix_unitaire} onChange={(e) => updateItem(item.id, { prix_unitaire: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" />
                </td>
                <td className="p-3 text-right font-medium">{item.montant.toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 border-t">
          <button onClick={addItem} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Plus className="w-4 h-4" /> Ajouter une ligne
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between"><span>Sous-total:</span><span>{total.toFixed(2)} $</span></div>
          <div className="flex justify-between text-gray-600"><span>TPS (5%):</span><span>{tps.toFixed(2)} $</span></div>
          <div className="flex justify-between text-gray-600"><span>TVQ (9.975%):</span><span>{tvq.toFixed(2)} $</span></div>
          <div className="flex justify-between font-bold text-xl pt-2 border-t"><span>Total:</span><span>{grandTotal.toFixed(2)} $</span></div>
        </div>
      </div>
    </div>
  );
}
