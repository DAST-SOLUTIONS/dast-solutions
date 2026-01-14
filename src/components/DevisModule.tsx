/**
 * DevisModule Component - Quick quote generation module
 */
import React, { useState } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';

interface DevisItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface DevisModuleProps {
  onSave?: (items: DevisItem[], total: number) => void;
}

export function DevisModule({ onSave }: DevisModuleProps) {
  const [items, setItems] = useState<DevisItem[]>([]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('unité');
  const [unitPrice, setUnitPrice] = useState(0);

  const addItem = () => {
    if (!description || unitPrice <= 0) return;
    
    const newItem: DevisItem = {
      id: Date.now().toString(),
      description,
      quantity,
      unit,
      unitPrice
    };
    
    setItems([...items, newItem]);
    setDescription('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tps = total * 0.05;
  const tvq = total * 0.09975;
  const grandTotal = total + tps + tvq;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Devis rapide</h2>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-2 px-3 py-2 border rounded-md"
        />
        <input
          type="number"
          placeholder="Qté"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="px-3 py-2 border rounded-md"
        />
        <input
          type="number"
          placeholder="Prix unitaire"
          value={unitPrice}
          onChange={(e) => setUnitPrice(Number(e.target.value))}
          className="px-3 py-2 border rounded-md"
        />
        <button
          onClick={addItem}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="space-y-2 mb-6">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span>{item.description}</span>
            <div className="flex items-center gap-4">
              <span>{item.quantity} {item.unit}</span>
              <span>{(item.quantity * item.unitPrice).toFixed(2)} $</span>
              <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between"><span>Sous-total:</span><span>{total.toFixed(2)} $</span></div>
        <div className="flex justify-between text-gray-600"><span>TPS (5%):</span><span>{tps.toFixed(2)} $</span></div>
        <div className="flex justify-between text-gray-600"><span>TVQ (9.975%):</span><span>{tvq.toFixed(2)} $</span></div>
        <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{grandTotal.toFixed(2)} $</span></div>
      </div>
    </div>
  );
}

export default DevisModule;
