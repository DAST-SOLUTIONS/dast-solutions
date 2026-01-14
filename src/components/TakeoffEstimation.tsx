import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import type { TakeoffItem } from '@/services/aiTakeoffService';
import { useMaterials } from '@/hooks/useMaterials';

interface TakeoffEstimationProps {
  items: TakeoffItem[];
  onEstimationComplete?: (estimation: any) => void;
}

export function TakeoffEstimation({ items, onEstimationComplete }: TakeoffEstimationProps) {
  const { materials, calculatePrice } = useMaterials();
  const [linkedItems, setLinkedItems] = useState<Map<string, string>>(new Map());

  const linkMaterial = (itemId: string, materialId: string) => {
    setLinkedItems(prev => new Map(prev).set(itemId, materialId));
  };

  const calculateTotal = () => {
    let total = 0;
    items.forEach(item => {
      const materialId = linkedItems.get(item.id);
      if (materialId) {
        const material = materials.find(m => m.id === materialId);
        if (material) {
          const result = calculatePrice(material, item.quantity);
          total += result.total_price;
        }
      }
    });
    return total;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold">Estimation des coûts</h2>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{item.description}</p>
              <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
            </div>
            <select className="px-3 py-2 border rounded-md" value={linkedItems.get(item.id) || ''} onChange={(e) => linkMaterial(item.id, e.target.value)}>
              <option value="">Sélectionner un matériau</option>
              {materials.map(m => (<option key={m.id} value={m.id}>{m.name} - {m.unit_price}$/unité</option>))}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total estimé:</span>
          <span className="text-2xl font-bold text-blue-600">{calculateTotal().toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
        </div>
      </div>
    </div>
  );
}
export default TakeoffEstimation;
