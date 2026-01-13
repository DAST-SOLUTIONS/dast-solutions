import React, { useState } from 'react';
import { 
  Shield, FileText, Calendar, AlertTriangle, CheckCircle, Clock,
  Building2, Upload, Download, Search, Filter, Plus, Eye,
  Bell, RefreshCw, X, ChevronRight, AlertCircle, FileCheck
} from 'lucide-react';

interface Garantie {
  id: string;
  type: 'garantie' | 'assurance';
  nom: string;
  fournisseur: string;
  projet?: string;
  numeroPolice: string;
  dateDebut: string;
  dateFin: string;
  montantCouverture: number;
  statut: 'active' | 'expiring' | 'expired';
  documentUrl?: string;
}

const GarantiesModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'garanties' | 'assurances'>('garanties');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [garanties] = useState<Garantie[]>([
    { id: '1', type: 'garantie', nom: 'Garantie décennale structure', fournisseur: 'Garantie Construction Québec', projet: 'Tour Deloitte', numeroPolice: 'GCQ-2025-4521', dateDebut: '2025-01-15', dateFin: '2035-01-15', montantCouverture: 5000000, statut: 'active' },
    { id: '2', type: 'garantie', nom: 'Garantie étanchéité toiture', fournisseur: 'Soprema', projet: 'Tour Deloitte', numeroPolice: 'SOP-2025-789', dateDebut: '2025-06-01', dateFin: '2030-06-01', montantCouverture: 500000, statut: 'active' },
    { id: '3', type: 'garantie', nom: 'Garantie équipements mécaniques', fournisseur: 'Carrier', projet: 'Centre Bell', numeroPolice: 'CAR-2024-156', dateDebut: '2024-03-01', dateFin: '2026-03-01', montantCouverture: 250000, statut: 'expiring' },
    { id: '4', type: 'garantie', nom: 'Garantie électrique', fournisseur: 'Schneider Electric', projet: 'École Primaire', numeroPolice: 'SCH-2023-445', dateDebut: '2023-09-01', dateFin: '2025-09-01', montantCouverture: 150000, statut: 'expired' },
  ]);

  const [assurances] = useState<Garantie[]>([
    { id: '5', type: 'assurance', nom: 'Responsabilité civile générale', fournisseur: 'Intact Assurance', numeroPolice: 'INT-RCG-2025-001', dateDebut: '2025-01-01', dateFin: '2026-01-01', montantCouverture: 10000000, statut: 'active' },
    { id: '6', type: 'assurance', nom: 'Assurance chantier (Wrap-up)', fournisseur: 'Desjardins Assurances', projet: 'Tour Deloitte', numeroPolice: 'DES-WU-2025-458', dateDebut: '2025-01-15', dateFin: '2027-06-30', montantCouverture: 15000000, statut: 'active' },
    { id: '7', type: 'assurance', nom: 'Erreurs & Omissions', fournisseur: 'Lloyds', numeroPolice: 'LLO-EO-2025-112', dateDebut: '2025-01-01', dateFin: '2026-01-01', montantCouverture: 5000000, statut: 'active' },
    { id: '8', type: 'assurance', nom: 'Cautionnement soumission', fournisseur: 'Travelers', projet: 'Hôpital Ste-Justine', numeroPolice: 'TRV-CS-2025-89', dateDebut: '2025-01-10', dateFin: '2025-04-10', montantCouverture: 500000, statut: 'expiring' },
  ]);

  const currentData = activeTab === 'garanties' ? garanties : assurances;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
      case 'expiring': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Expire bientôt</span>;
      case 'expired': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expirée</span>;
      default: return null;
    }
  };

  const stats = {
    actives: currentData.filter(g => g.statut === 'active').length,
    expirant: currentData.filter(g => g.statut === 'expiring').length,
    expirees: currentData.filter(g => g.statut === 'expired').length,
    couvertureTotal: currentData.filter(g => g.statut === 'active').reduce((sum, g) => sum + g.montantCouverture, 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-blue-600" />
            Garanties & Assurances
          </h1>
          <p className="text-gray-600">Suivi des garanties et certificats d'assurance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Bell size={18} />
            Alertes
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Alertes */}
      {stats.expirant > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="text-yellow-600" size={24} />
          <div>
            <p className="font-medium text-yellow-800">{stats.expirant} {activeTab === 'garanties' ? 'garantie(s)' : 'assurance(s)'} expire(nt) dans les 90 prochains jours</p>
            <p className="text-sm text-yellow-700">Pensez à renouveler avant expiration</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Actives</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.actives}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Expirent bientôt</p>
            <Clock size={20} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.expirant}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Expirées</p>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600">{stats.expirees}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Couverture totale</p>
            <Shield size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{(stats.couvertureTotal / 1000000).toFixed(1)}M$</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('garanties')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'garanties' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
        >
          Garanties ({garanties.length})
        </button>
        <button
          onClick={() => setActiveTab('assurances')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'assurances' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
        >
          Assurances ({assurances.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select className="px-4 py-2 border rounded-lg">
            <option>Tous les statuts</option>
            <option>Actives</option>
            <option>Expirent bientôt</option>
            <option>Expirées</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                <th className="text-left p-4 font-medium text-gray-500">Fournisseur</th>
                <th className="text-left p-4 font-medium text-gray-500">Projet</th>
                <th className="text-left p-4 font-medium text-gray-500">N° Police</th>
                <th className="text-left p-4 font-medium text-gray-500">Validité</th>
                <th className="text-right p-4 font-medium text-gray-500">Couverture</th>
                <th className="text-center p-4 font-medium text-gray-500">Statut</th>
                <th className="text-center p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.nom}</td>
                  <td className="p-4 text-gray-600">{item.fournisseur}</td>
                  <td className="p-4 text-gray-600">{item.projet || '-'}</td>
                  <td className="p-4 font-mono text-sm">{item.numeroPolice}</td>
                  <td className="p-4 text-sm">
                    <p>{item.dateDebut}</p>
                    <p className="text-gray-500">au {item.dateFin}</p>
                  </td>
                  <td className="p-4 text-right font-bold">{(item.montantCouverture / 1000000).toFixed(1)}M$</td>
                  <td className="p-4 text-center">{getStatutBadge(item.statut)}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded"><Eye size={16} /></button>
                      <button className="p-2 hover:bg-gray-100 rounded"><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Ajouter {activeTab === 'garanties' ? 'une garantie' : 'une assurance'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Garantie décennale" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Police</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant couverture</label>
                <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="5000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Glissez le certificat ici</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GarantiesModule;
