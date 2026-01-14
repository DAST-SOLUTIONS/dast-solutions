import React, { useState } from 'react';
import { FileText, Plus, Save } from 'lucide-react';
import { useSoumissions, type SoumissionItem } from '@/hooks/useSoumissions';

export default function SoumissionBuilder() {
  const { createSoumission } = useSoumissions();
  const [titre, setTitre] = useState('');
  const [items, setItems] = useState<Partial<SoumissionItem>[]>([]);

  const addItem = () => {
    setItems([...items, { description: '', quantite: 0, unite: 'unité', prix_unitaire: 0, montant: 0 }]);
  };

  const updateItem = (index: number, updates: Partial<SoumissionItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    if (updates.quantite !== undefined || updates.prix_unitaire !== undefined) {
      newItems[index].montant = (newItems[index].quantite || 0) * (newItems[index].prix_unitaire || 0);
    }
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.montant || 0), 0);
  const tps = total * 0.05;
  const tvq = total * 0.09975;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7" /> Créer une soumission
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
          <Save className="w-4 h-4" /> Sauvegarder
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la soumission" className="w-full px-4 py-2 border rounded-lg text-lg" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Description</th>
              <th className="text-right p-3 w-24">Qté</th>
              <th className="text-left p-3 w-24">Unité</th>
              <th className="text-right p-3 w-32">Prix unit.</th>
              <th className="text-right p-3 w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="p-3"><input type="text" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} className="w-full px-2 py-1 border rounded" /></td>
                <td className="p-3"><input type="number" value={item.quantite} onChange={(e) => updateItem(idx, { quantite: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /></td>
                <td className="p-3"><input type="text" value={item.unite} onChange={(e) => updateItem(idx, { unite: e.target.value })} className="w-full px-2 py-1 border rounded" /></td>
                <td className="p-3"><input type="number" value={item.prix_unitaire} onChange={(e) => updateItem(idx, { prix_unitaire: Number(e.target.value) })} className="w-full px-2 py-1 border rounded text-right" /></td>
                <td className="p-3 text-right font-medium">{(item.montant || 0).toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t">
          <button onClick={addItem} className="flex items-center gap-2 text-blue-600"><Plus className="w-4 h-4" /> Ajouter une ligne</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mt-6 max-w-xs ml-auto">
        <div className="space-y-2">
          <div className="flex justify-between"><span>Sous-total:</span><span>{total.toFixed(2)} $</span></div>
          <div className="flex justify-between text-gray-600"><span>TPS:</span><span>{tps.toFixed(2)} $</span></div>
          <div className="flex justify-between text-gray-600"><span>TVQ:</span><span>{tvq.toFixed(2)} $</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>{(total + tps + tvq).toFixed(2)} $</span></div>
        </div>
      </div>
    </div>
  );
}
