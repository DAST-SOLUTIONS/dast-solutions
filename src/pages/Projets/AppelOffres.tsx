import React, { useState } from 'react';
import { FileSearch, Plus, Send } from 'lucide-react';
import { useAppelsOffres } from '@/hooks/useAppelsOffres';
import { useParams } from 'react-router-dom';

export default function ProjectAppelOffres() {
  const { projectId } = useParams<{ projectId: string }>();
  const { appelsLocaux, loading, stats, createAppelOffre, updateStatut } = useAppelsOffres(projectId);
  const [search, setSearch] = useState('');

  const filtered = appelsLocaux.filter(a => a.titre?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileSearch className="w-6 h-6" /> Appels d'offres du projet
        </h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Créer un appel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Soumissions reçues</p>
          <p className="text-2xl font-bold">{stats.soumissionsRecues}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600">En analyse</p>
          <p className="text-2xl font-bold">{stats.enAnalyse}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border divide-y">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun appel d'offres pour ce projet</div>
        ) : (
          filtered.map(appel => (
            <div key={appel.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{appel.titre}</p>
                  <p className="text-sm text-gray-500">{appel.specialite}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  appel.statut === 'gagne' ? 'bg-green-100 text-green-800' :
                  appel.statut === 'envoye' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>{appel.statut}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
