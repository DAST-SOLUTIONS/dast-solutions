import React from 'react';
import { DollarSign } from 'lucide-react';
import { useCosts } from '@/hooks/useCosts';
import { useParams } from 'react-router-dom';

export default function ProjectCosts() {
  const { projectId } = useParams<{ projectId: string }>();
  const { costs, loading, calculateSummary, materials, labor, equipment } = useCosts(projectId);
  const summary = calculateSummary();

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="w-6 h-6" /> Coûts du projet
      </h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{summary.total.toLocaleString()} $</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Main d'oeuvre</p>
          <p className="text-2xl font-bold">{summary.labor.toLocaleString()} $</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Matériaux</p>
          <p className="text-2xl font-bold">{summary.materials.toLocaleString()} $</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border divide-y">
        {costs.map(cost => (
          <div key={cost.id} className="p-4 flex justify-between">
            <div>
              <p className="font-medium">{cost.description}</p>
              <p className="text-sm text-gray-500">{cost.category}</p>
            </div>
            <p className="font-bold">{cost.total_cost.toLocaleString()} $</p>
          </div>
        ))}
      </div>
    </div>
  );
}
