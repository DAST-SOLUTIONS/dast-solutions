import React, { useState } from 'react';
import { 
  Users, Building2, TrendingUp, Phone, Mail, MapPin, Plus, Search, 
  Filter, ChevronRight, Star, Calendar, DollarSign, Target, X,
  MoreVertical, Edit2, Trash2, UserPlus, Briefcase
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: 'prospect' | 'client' | 'partner';
  status: 'active' | 'inactive';
  lastContact: string;
  score: number;
}

interface Opportunity {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string;
  owner: string;
}

const CRMModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'opportunities' | 'pipeline'>('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const stages = [
    { id: 'qualification', name: 'Qualification', color: '#6B7280', count: 3 },
    { id: 'meeting', name: 'Rencontre', color: '#3B82F6', count: 2 },
    { id: 'proposal', name: 'Proposition', color: '#F59E0B', count: 4 },
    { id: 'negotiation', name: 'Négociation', color: '#8B5CF6', count: 2 },
    { id: 'won', name: 'Gagné', color: '#10B981', count: 5 },
  ];

  const [opportunities] = useState<Opportunity[]>([
    { id: '1', name: 'Rénovation Tour A', company: 'Immeubles ABC', value: 850000, stage: 'proposal', probability: 60, expectedClose: '2026-02-15', owner: 'Jean T.' },
    { id: '2', name: 'Construction Entrepôt', company: 'Logistique XYZ', value: 1200000, stage: 'negotiation', probability: 75, expectedClose: '2026-01-30', owner: 'Marie D.' },
    { id: '3', name: 'Agrandissement Bureau', company: 'Tech Montréal', value: 450000, stage: 'meeting', probability: 30, expectedClose: '2026-03-20', owner: 'Jean T.' },
    { id: '4', name: 'Réfection Stationnement', company: 'Centre Commercial', value: 320000, stage: 'qualification', probability: 20, expectedClose: '2026-04-01', owner: 'Pierre M.' },
    { id: '5', name: 'Nouvelle Succursale', company: 'Banque Nationale', value: 2100000, stage: 'proposal', probability: 50, expectedClose: '2026-02-28', owner: 'Marie D.' },
  ]);

  const [contacts] = useState<Contact[]>([
    { id: '1', name: 'Robert Lafleur', company: 'Immeubles ABC', email: 'r.lafleur@abc.ca', phone: '514-555-0101', type: 'client', status: 'active', lastContact: '2026-01-10', score: 85 },
    { id: '2', name: 'Sophie Martin', company: 'Tech Montréal', email: 's.martin@techmtl.ca', phone: '514-555-0202', type: 'prospect', status: 'active', lastContact: '2026-01-08', score: 65 },
    { id: '3', name: 'Marc Tremblay', company: 'Logistique XYZ', email: 'm.tremblay@xyz.ca', phone: '514-555-0303', type: 'client', status: 'active', lastContact: '2026-01-11', score: 92 },
    { id: '4', name: 'Julie Bergeron', company: 'Centre Commercial', email: 'j.bergeron@cc.ca', phone: '514-555-0404', type: 'prospect', status: 'active', lastContact: '2026-01-05', score: 45 },
  ]);

  const stats = {
    totalContacts: contacts.length,
    totalOpportunities: opportunities.length,
    pipelineValue: opportunities.reduce((sum, o) => sum + o.value, 0),
    weightedValue: opportunities.reduce((sum, o) => sum + (o.value * o.probability / 100), 0),
  };

  const getOpportunitiesByStage = (stageId: string) => 
    opportunities.filter(o => o.stage === stageId);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      prospect: 'bg-yellow-100 text-yellow-800',
      client: 'bg-green-100 text-green-800',
      partner: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {type === 'prospect' ? 'Prospect' : type === 'client' ? 'Client' : 'Partenaire'}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="text-blue-600" />
            CRM - Gestion des Relations
          </h1>
          <p className="text-gray-600">Contacts, entreprises et opportunités</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouvelle opportunité
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contacts</p>
              <p className="text-2xl font-bold">{stats.totalContacts}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Opportunités</p>
              <p className="text-2xl font-bold">{stats.totalOpportunities}</p>
            </div>
            <Briefcase className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valeur pipeline</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.pipelineValue)}</p>
            </div>
            <DollarSign className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valeur pondérée</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.weightedValue)}</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'pipeline', label: 'Pipeline', icon: Target },
              { id: 'contacts', label: 'Contacts', icon: Users },
              { id: 'companies', label: 'Entreprises', icon: Building2 },
              { id: 'opportunities', label: 'Opportunités', icon: Briefcase },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline View */}
        {activeTab === 'pipeline' && (
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => (
                <div key={stage.id} className="w-72 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="font-semibold">{stage.name}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{stage.count}</span>
                  </div>
                  <div className="space-y-3">
                    {getOpportunitiesByStage(stage.id).map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-gray-50 border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{opp.name}</h4>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{opp.company}</p>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-600">{formatCurrency(opp.value)}</span>
                          <span className="text-xs text-gray-500">{opp.probability}%</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={12} />
                          <span>{opp.expectedClose}</span>
                        </div>
                      </div>
                    ))}
                    <button className="w-full border-2 border-dashed rounded-lg p-3 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors text-sm">
                      + Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts View */}
        {activeTab === 'contacts' && (
          <div className="p-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <Filter size={18} />
                Filtres
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <UserPlus size={18} />
                Nouveau contact
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Nom</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Entreprise</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Contact</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Score</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Dernier contact</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{contact.company}</td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} />
                          {contact.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">{getTypeBadge(contact.type)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{contact.score}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">{contact.lastContact}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Companies & Opportunities tabs would follow similar patterns */}
        {(activeTab === 'companies' || activeTab === 'opportunities') && (
          <div className="p-8 text-center text-gray-500">
            <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Vue {activeTab === 'companies' ? 'Entreprises' : 'Opportunités'} - Similaire aux contacts</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle opportunité</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de l'opportunité</label>
                <input type="text" className="w-full border rounded-lg p-2" placeholder="Ex: Rénovation Tour A" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <select className="w-full border rounded-lg p-2">
                  <option>Sélectionner...</option>
                  <option>Immeubles ABC</option>
                  <option>Tech Montréal</option>
                  <option>Logistique XYZ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valeur ($)</label>
                  <input type="number" className="w-full border rounded-lg p-2" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Probabilité (%)</label>
                  <input type="number" className="w-full border rounded-lg p-2" placeholder="50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Étape</label>
                <select className="w-full border rounded-lg p-2">
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de clôture prévue</label>
                <input type="date" className="w-full border rounded-lg p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMModule;
