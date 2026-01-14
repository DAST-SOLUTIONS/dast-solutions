import React, { useState } from 'react';
import { Users, Plus, Search, Building2, User } from 'lucide-react';
import { useClients, type Client } from '@/hooks/useClients';

export default function Clients() {
  const { clients, loading, stats, createClient, updateClient, deleteClient } = useClients();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({ type: 'entreprise', status: 'actif' });

  const filtered = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClient(formData);
    setShowForm(false);
    setFormData({ type: 'entreprise', status: 'actif' });
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" /> Clients
        </h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nouveau client
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
          <p className="text-sm text-gray-500">Prospects</p>
          <p className="text-2xl font-bold text-blue-600">{stats.prospects}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Revenus</p>
          <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} $</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="divide-y">
          {filtered.map(client => (
            <div key={client.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {client.type === 'entreprise' ? <Building2 className="w-5 h-5 text-gray-400" /> : <User className="w-5 h-5 text-gray-400" />}
                <div>
                  <p className="font-medium">{client.name || client.company_name}</p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${client.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {client.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nom" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="email" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="tel" placeholder="Téléphone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
