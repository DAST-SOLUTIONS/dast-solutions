import React, { useState } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';

export default function MaterialDatabase() {
  const { materials, categories, loading, createMaterial } = useMaterials();
  const [search, setSearch] = useState('');

  const filtered = materials.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-7 h-7" /> Base de données matériaux
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Ajouter un matériau
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select className="px-4 py-2 border rounded-lg">
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Code</th>
              <th className="text-left p-4">Nom</th>
              <th className="text-left p-4">Catégorie</th>
              <th className="text-left p-4">Unité</th>
              <th className="text-right p-4">Prix</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(material => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-sm">{material.code}</td>
                <td className="p-4 font-medium">{material.name}</td>
                <td className="p-4">{material.category}</td>
                <td className="p-4">{material.unit}</td>
                <td className="p-4 text-right">{material.unit_price?.toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
