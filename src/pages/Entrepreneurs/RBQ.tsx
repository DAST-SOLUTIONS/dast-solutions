import React, { useState } from 'react';
import { Building2, Plus, Search, Star } from 'lucide-react';
import { useEntrepreneursCRUD } from '@/hooks/useEntrepreneursCRUD';

export default function RBQ() {
  const { entrepreneurs, loading, createEntrepreneur, toggleFavori, verifyRBQ } = useEntrepreneursCRUD();
  const [search, setSearch] = useState('');

  const filtered = entrepreneurs.filter(e => 
    e.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.rbq_license?.includes(search)
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-7 h-7" /> Entrepreneurs RBQ
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Rechercher par nom ou licence RBQ..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="divide-y">
          {filtered.map(e => (
            <div key={e.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {e.company_name}
                  {e.is_favori && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                </p>
                <p className="text-sm text-gray-500">RBQ: {e.rbq_license || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-sm ${e.rbq_status === 'valide' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {e.rbq_status || 'Non vérifié'}
                </span>
                {e.evaluation_moyenne && <span className="text-sm">{e.evaluation_moyenne.toFixed(1)}/5</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
