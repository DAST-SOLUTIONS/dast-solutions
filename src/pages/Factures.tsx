import React, { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { useFactures } from '@/hooks/useFactures';

export default function Factures() {
  const { factures, loading, stats, createFacture, updateStatus } = useFactures();
  const [search, setSearch] = useState('');

  const filtered = factures.filter(f => 
    f.numero?.toLowerCase().includes(search.toLowerCase()) ||
    f.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7" /> Factures
        </h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Payées</p>
          <p className="text-2xl font-bold text-green-600">{stats.payees}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Montant total</p>
          <p className="text-2xl font-bold">{stats.montantTotal.toLocaleString()} $</p>
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
              <th className="text-left p-4">Numéro</th>
              <th className="text-left p-4">Client</th>
              <th className="text-left p-4">Date</th>
              <th className="text-right p-4">Montant</th>
              <th className="text-left p-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(facture => (
              <tr key={facture.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{facture.numero}</td>
                <td className="p-4">{facture.client_name}</td>
                <td className="p-4">{new Date(facture.date_facture).toLocaleDateString('fr-CA')}</td>
                <td className="p-4 text-right">{facture.montant_total?.toLocaleString()} $</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    facture.statut === 'payee' ? 'bg-green-100 text-green-800' :
                    facture.statut === 'envoyee' ? 'bg-blue-100 text-blue-800' :
                    facture.statut === 'en_retard' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>{facture.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
