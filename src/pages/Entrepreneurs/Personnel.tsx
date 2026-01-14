import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { usePersonnelCCQ } from '@/hooks/usePersonnelCCQ';

export default function Personnel() {
  const { personnel, loading, stats, metiers, secteurs, createPersonnel } = usePersonnelCCQ();
  const [search, setSearch] = useState('');

  const filtered = personnel.filter(p => 
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.prenom?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" /> Personnel CCQ
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Compagnons</p>
          <p className="text-2xl font-bold">{stats.compagnons}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Apprentis</p>
          <p className="text-2xl font-bold">{stats.apprentis}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Nom</th>
              <th className="text-left p-4">Métier</th>
              <th className="text-left p-4">Classification</th>
              <th className="text-right p-4">Taux horaire</th>
              <th className="text-left p-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{p.prenom} {p.nom}</td>
                <td className="p-4">{p.metier_nom || p.metier_code}</td>
                <td className="p-4">{p.classification}</td>
                <td className="p-4 text-right">{p.taux_horaire?.toFixed(2)} $/h</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${p.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
