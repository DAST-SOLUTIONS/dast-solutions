import React, { useState } from 'react';
import { 
  HardHat, AlertTriangle, CheckCircle, Clock, FileText,
  Calendar, Users, Shield, Plus, Search, Eye, Download,
  AlertOctagon, Activity, TrendingDown, Award, X, Camera
} from 'lucide-react';

interface Incident {
  id: string;
  date: string;
  projet: string;
  type: 'accident' | 'presque_accident' | 'danger' | 'observation';
  gravite: 'mineure' | 'moderee' | 'grave' | 'critique';
  description: string;
  blesse?: string;
  temoin?: string;
  actionsCorrectives: string;
  statut: 'ouvert' | 'enquete' | 'clos';
}

interface Formation {
  id: string;
  nom: string;
  organisme: string;
  dateExpiration: string;
  employes: number;
  statut: 'valide' | 'expire_bientot' | 'expiree';
}

const SSTModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'formations' | 'inspections'>('incidents');
  const [showAddModal, setShowAddModal] = useState(false);

  const [incidents] = useState<Incident[]>([
    { id: '1', date: '2026-01-12', projet: 'Tour Deloitte', type: 'presque_accident', gravite: 'moderee', description: 'Chute d\'outil du 5e étage, zone sécurisée, aucun blessé', actionsCorrectives: 'Renforcement des filets de protection, rappel des consignes', statut: 'enquete' },
    { id: '2', date: '2026-01-10', projet: 'Centre Bell', type: 'observation', gravite: 'mineure', description: 'EPI non porté par sous-traitant électricien', actionsCorrectives: 'Avertissement verbal, rappel des règles', statut: 'clos' },
    { id: '3', date: '2026-01-08', projet: 'Tour Deloitte', type: 'accident', gravite: 'moderee', description: 'Coupure à la main lors manipulation de tôle', blesse: 'Jean Tremblay', temoin: 'Marc Gagnon', actionsCorrectives: 'Premiers soins administrés, gants anti-coupure fournis', statut: 'clos' },
    { id: '4', date: '2026-01-05', projet: 'École Primaire', type: 'danger', gravite: 'grave', description: 'Échafaudage mal ancré détecté lors inspection', actionsCorrectives: 'Arrêt travaux immédiat, correction effectuée, reprise autorisée', statut: 'clos' },
  ]);

  const [formations] = useState<Formation[]>([
    { id: '1', nom: 'ASP Construction', organisme: 'ASP Construction', dateExpiration: '2026-06-15', employes: 45, statut: 'valide' },
    { id: '2', nom: 'Secourisme en milieu de travail', organisme: 'Croix-Rouge', dateExpiration: '2026-02-28', employes: 12, statut: 'expire_bientot' },
    { id: '3', nom: 'Travail en hauteur', organisme: 'Formation Plus', dateExpiration: '2026-08-01', employes: 28, statut: 'valide' },
    { id: '4', nom: 'Espace clos', organisme: 'CNESST', dateExpiration: '2025-12-31', employes: 8, statut: 'expiree' },
    { id: '5', nom: 'SIMDUT 2015', organisme: 'ASP Construction', dateExpiration: '2026-09-15', employes: 45, statut: 'valide' },
  ]);

  const getGraviteBadge = (gravite: string) => {
    const styles: Record<string, string> = {
      mineure: 'bg-green-100 text-green-700',
      moderee: 'bg-yellow-100 text-yellow-700',
      grave: 'bg-orange-100 text-orange-700',
      critique: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[gravite]}`}>{gravite}</span>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      accident: { label: 'Accident', color: 'bg-red-100 text-red-700' },
      presque_accident: { label: 'Presque accident', color: 'bg-orange-100 text-orange-700' },
      danger: { label: 'Situation dangereuse', color: 'bg-yellow-100 text-yellow-700' },
      observation: { label: 'Observation', color: 'bg-blue-100 text-blue-700' },
    };
    const { label, color } = labels[type];
    return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{label}</span>;
  };

  const stats = {
    joursAccident: 45,
    incidentsAnnee: 12,
    formationsValides: formations.filter(f => f.statut === 'valide').length,
    formationsExpirent: formations.filter(f => f.statut === 'expire_bientot' || f.statut === 'expiree').length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HardHat className="text-orange-600" />
            Sécurité Chantier (SST)
          </h1>
          <p className="text-gray-600">Incidents, formations et conformité CNESST</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus size={18} />
          Déclarer incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <p className="text-green-100">Jours sans accident</p>
            <Award size={24} />
          </div>
          <p className="text-4xl font-bold mt-2">{stats.joursAccident}</p>
          <p className="text-sm text-green-100 mt-1">Objectif: 100 jours</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Incidents 2026</p>
            <Activity size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.incidentsAnnee}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingDown size={12} /> -25% vs 2025
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Formations valides</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.formationsValides}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">À renouveler</p>
            <AlertTriangle size={20} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.formationsExpirent}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {[
          { id: 'incidents', label: 'Incidents', count: incidents.length },
          { id: 'formations', label: 'Formations', count: formations.length },
          { id: 'inspections', label: 'Inspections', count: 8 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <select className="px-4 py-2 border rounded-lg">
                <option>Tous les types</option>
                <option>Accidents</option>
                <option>Presque accidents</option>
                <option>Dangers</option>
              </select>
            </div>
          </div>
          <div className="divide-y">
            {incidents.map(inc => (
              <div key={inc.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeBadge(inc.type)}
                      {getGraviteBadge(inc.gravite)}
                    </div>
                    <p className="font-medium">{inc.description}</p>
                    <p className="text-sm text-gray-500">{inc.projet} • {inc.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${inc.statut === 'clos' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                    {inc.statut === 'clos' ? 'Clos' : inc.statut === 'enquete' ? 'En enquête' : 'Ouvert'}
                  </span>
                </div>
                {inc.blesse && (
                  <p className="text-sm text-red-600">👤 Blessé: {inc.blesse}</p>
                )}
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Actions correctives:</strong> {inc.actionsCorrectives}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'formations' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-500">Formation</th>
                <th className="text-left p-4 font-medium text-gray-500">Organisme</th>
                <th className="text-center p-4 font-medium text-gray-500">Employés</th>
                <th className="text-left p-4 font-medium text-gray-500">Expiration</th>
                <th className="text-center p-4 font-medium text-gray-500">Statut</th>
                <th className="text-center p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {formations.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{f.nom}</td>
                  <td className="p-4 text-gray-600">{f.organisme}</td>
                  <td className="p-4 text-center">{f.employes}</td>
                  <td className="p-4">{f.dateExpiration}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      f.statut === 'valide' ? 'bg-green-100 text-green-700' :
                      f.statut === 'expire_bientot' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {f.statut === 'valide' ? 'Valide' : f.statut === 'expire_bientot' ? 'Expire bientôt' : 'Expirée'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-blue-600 hover:underline text-sm">Voir liste</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'inspections' && (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Module d'inspections SST</p>
          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg">Planifier inspection</button>
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Déclarer un incident</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Accident</option>
                    <option>Presque accident</option>
                    <option>Situation dangereuse</option>
                    <option>Observation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gravité</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Mineure</option>
                    <option>Modérée</option>
                    <option>Grave</option>
                    <option>Critique</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Projet</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Tour Deloitte</option>
                  <option>Centre Bell</option>
                  <option>École Primaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full px-4 py-2 border rounded-lg" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photos</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Camera size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Ajouter des photos</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg">Déclarer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSTModule;
