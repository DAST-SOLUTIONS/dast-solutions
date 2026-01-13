import React, { useState } from 'react';
import { 
  Users, Building2, Eye, FileText, DollarSign, Calendar, MessageSquare,
  CheckCircle, Clock, AlertTriangle, Camera, Download, Send, Bell,
  TrendingUp, PieChart, BarChart3, ExternalLink, Shield, Lock
} from 'lucide-react';

interface ClientProject {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  lastUpdate: string;
}

interface PendingApproval {
  id: string;
  type: 'change_order' | 'payment' | 'document';
  title: string;
  amount?: number;
  date: string;
  urgent: boolean;
}

const PortailClientModule: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'approvals' | 'messages'>('overview');

  const [projects] = useState<ClientProject[]>([
    { id: '1', name: 'Tour Deloitte - Phase 2', client: 'Deloitte Canada', progress: 45, status: 'active', budget: 12500000, spent: 5625000, startDate: '2025-09-01', endDate: '2026-08-31', lastUpdate: '2026-01-10' },
    { id: '2', name: 'Centre Commercial Laval', client: 'Groupe Laval Inc.', progress: 72, status: 'active', budget: 8500000, spent: 6120000, startDate: '2025-06-15', endDate: '2026-04-30', lastUpdate: '2026-01-09' },
    { id: '3', name: 'Résidence Soleil', client: 'Développements Soleil', progress: 100, status: 'completed', budget: 3200000, spent: 3180000, startDate: '2025-01-10', endDate: '2025-12-15', lastUpdate: '2025-12-15' },
  ]);

  const [pendingApprovals] = useState<PendingApproval[]>([
    { id: '1', type: 'change_order', title: 'Modification système CVAC - Niveau 3', amount: 45000, date: '2026-01-08', urgent: true },
    { id: '2', type: 'payment', title: 'Demande de paiement #12 - Janvier', amount: 285000, date: '2026-01-05', urgent: false },
    { id: '3', type: 'document', title: 'Plans révisés - Structure niveau 4', date: '2026-01-03', urgent: false },
  ]);

  const [recentPhotos] = useState([
    { id: '1', url: '/photos/chantier-1.jpg', caption: 'Coulée béton niveau 2', date: '2026-01-10' },
    { id: '2', url: '/photos/chantier-2.jpg', caption: 'Installation acier', date: '2026-01-09' },
    { id: '3', url: '/photos/chantier-3.jpg', caption: 'Vue aérienne', date: '2026-01-08' },
    { id: '4', url: '/photos/chantier-4.jpg', caption: 'Équipe au travail', date: '2026-01-07' },
  ]);

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            Portail Client
          </h1>
          <p className="text-gray-600">Accès client pour le suivi de projet en temps réel</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Bell size={18} />
            Notifications
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Shield size={18} />
            Gérer accès
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">Projet:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} - {p.client}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <span className={`px-3 py-1 rounded-full text-sm ${
              currentProject?.status === 'active' ? 'bg-green-100 text-green-700' :
              currentProject?.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {currentProject?.status === 'active' ? 'En cours' : 
               currentProject?.status === 'completed' ? 'Terminé' : 'En pause'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b flex">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'approvals', label: 'Approbations', icon: CheckCircle },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 -mb-px ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'approvals' && pendingApprovals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Avancement</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-blue-600">{currentProject?.progress}%</p>
                    <TrendingUp size={20} className="text-green-500 mb-1" />
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${currentProject?.progress}%` }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-3xl font-bold">{((currentProject?.budget || 0) / 1000000).toFixed(1)}M$</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Dépensé: {((currentProject?.spent || 0) / 1000000).toFixed(2)}M$
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Échéance</p>
                  <p className="text-3xl font-bold">
                    {currentProject?.endDate ? new Date(currentProject.endDate).toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' }) : '-'}
                  </p>
                  <p className="text-sm text-green-600 mt-1">Dans les délais</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Dernière mise à jour</p>
                  <p className="text-3xl font-bold">
                    {currentProject?.lastUpdate ? new Date(currentProject.lastUpdate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '-'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Rapport hebdomadaire</p>
                </div>
              </div>

              {/* Pending Approvals */}
              {pendingApprovals.length > 0 && (
                <div className="border rounded-xl p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={20} />
                    Approbations en attente ({pendingApprovals.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingApprovals.map(approval => (
                      <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {approval.urgent && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">URGENT</span>
                          )}
                          <div>
                            <p className="font-medium">{approval.title}</p>
                            <p className="text-sm text-gray-500">{approval.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {approval.amount && (
                            <span className="font-medium">{approval.amount.toLocaleString()}$</span>
                          )}
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Examiner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Photos */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Camera className="text-blue-600" size={20} />
                  Photos récentes du chantier
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {recentPhotos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <Camera size={32} className="text-gray-500" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button className="p-2 bg-white rounded-full">
                          <Eye size={20} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{photo.caption}</p>
                      <p className="text-xs text-gray-400">{photo.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Documents du projet</h3>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Download size={18} />
                  Tout télécharger
                </button>
              </div>
              <div className="divide-y border rounded-lg">
                {[
                  { name: 'Plans architecturaux - Révision C', type: 'PDF', size: '24.5 MB', date: '2026-01-08' },
                  { name: 'Rapport mensuel - Décembre 2025', type: 'PDF', size: '2.1 MB', date: '2026-01-05' },
                  { name: 'Calendrier de projet mis à jour', type: 'PDF', size: '890 KB', date: '2026-01-03' },
                  { name: 'Photos de progression - Semaine 52', type: 'ZIP', size: '156 MB', date: '2025-12-30' },
                  { name: 'Devis approuvé - Électricité', type: 'PDF', size: '1.4 MB', date: '2025-12-20' },
                ].map((doc, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Download size={18} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Demandes d'approbation</h3>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle size={48} className="mx-auto text-green-300 mb-3" />
                  <p>Aucune approbation en attente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map(approval => (
                    <div key={approval.id} className="border rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {approval.urgent && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">URGENT</span>
                            )}
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {approval.type === 'change_order' ? 'Ordre de changement' : 
                               approval.type === 'payment' ? 'Paiement' : 'Document'}
                            </span>
                          </div>
                          <h4 className="text-lg font-medium">{approval.title}</h4>
                          <p className="text-sm text-gray-500">Soumis le {approval.date}</p>
                        </div>
                        {approval.amount && (
                          <p className="text-2xl font-bold">{approval.amount.toLocaleString()}$</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Approuver
                        </button>
                        <button className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                          Refuser
                        </button>
                        <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                          Demander plus d'infos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Messages</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Send size={18} />
                  Nouveau message
                </button>
              </div>
              <div className="border rounded-xl divide-y">
                {[
                  { from: 'Pierre Martin (Chef de projet)', subject: 'Mise à jour hebdomadaire - Semaine 2', date: '2026-01-10 14:30', unread: true },
                  { from: 'Marie Dubois (Architecte)', subject: 'Plans révisés disponibles', date: '2026-01-08 09:15', unread: true },
                  { from: 'Jean Tremblay (Surintendant)', subject: 'Retard livraison matériaux résolu', date: '2026-01-06 16:45', unread: false },
                  { from: 'Sophie Lavoie (Comptabilité)', subject: 'Confirmation paiement #11 reçu', date: '2026-01-03 11:20', unread: false },
                ].map((msg, i) => (
                  <div key={i} className={`p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer ${msg.unread ? 'bg-blue-50/50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${msg.unread ? 'bg-blue-600' : 'bg-transparent'}`} />
                    <div className="flex-1">
                      <p className={`${msg.unread ? 'font-semibold' : 'font-medium'}`}>{msg.subject}</p>
                      <p className="text-sm text-gray-500">{msg.from}</p>
                    </div>
                    <p className="text-sm text-gray-400">{msg.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Access Management */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Lock className="text-gray-600" size={20} />
          Gestion des accès client
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Michel Tremblay', email: 'michel.t@deloitte.ca', role: 'Propriétaire', lastAccess: '2026-01-10' },
            { name: 'Julie Côté', email: 'julie.c@deloitte.ca', role: 'Gestionnaire', lastAccess: '2026-01-09' },
            { name: 'Robert Martin', email: 'robert.m@deloitte.ca', role: 'Observateur', lastAccess: '2026-01-05' },
          ].map((user, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="px-2 py-1 bg-gray-100 rounded">{user.role}</span>
                <span className="text-gray-400">Dernier accès: {user.lastAccess}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortailClientModule;
