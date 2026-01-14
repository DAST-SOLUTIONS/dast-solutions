import React, { useState } from 'react';
import { FileSearch, Plus, Search } from 'lucide-react';
import { useAppelsOffres } from '@/hooks/useAppelsOffres';

export default function AppelsOffres() {
  const { appelsLocaux, appelsExternes, loading, stats, createAppelOffre, updateStatut } = useAppelsOffres();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'locaux' | 'externes'>('locaux');

  const filtered = (tab === 'locaux' ? appelsLocaux : appelsExternes).filter(a => 
    a.titre?.toLowerCase().includes(search.toLowerCase()) ||
    a.organisme?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSearch className="w-7 h-7" /> Appels d'offres
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouvel appel
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Nouveaux</p>
          <p className="text-2xl font-bold text-blue-600">{stats.nouveaux}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Gagnés</p>
          <p className="text-2xl font-bold text-green-600">{stats.gagnes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">En analyse</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enAnalyse}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex border-b">
          <button onClick={() => setTab('locaux')} className={`px-6 py-3 font-medium ${tab === 'locaux' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            Mes appels ({appelsLocaux.length})
          </button>
          <button onClick={() => setTab('externes')} className={`px-6 py-3 font-medium ${tab === 'externes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            SEAO/Externes ({appelsExternes.length})
          </button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
        </div>
        <div className="divide-y">
          {filtered.map((appel: any) => (
            <div key={appel.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{appel.titre}</p>
                  <p className="text-sm text-gray-500">{appel.organisme}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(appel.date_fermeture).toLocaleDateString('fr-CA')}</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    appel.statut === 'gagne' ? 'bg-green-100 text-green-800' :
                    appel.statut === 'perdu' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>{appel.statut || 'ouvert'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
