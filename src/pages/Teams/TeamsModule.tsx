import React, { useState } from 'react';
import { 
  Users, Clock, Calendar, Plus, Search, Filter, Download, 
  ChevronRight, Check, X, Edit2, Trash2, UserPlus, ClipboardList,
  AlertCircle, TrendingUp, DollarSign
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  trade: string;
  hourlyRate: number;
  hoursThisWeek: number;
  status: 'active' | 'break' | 'off';
}

interface Timesheet {
  id: string;
  employeeName: string;
  date: string;
  project: string;
  hoursRegular: number;
  hoursOvertime: number;
  status: 'draft' | 'submitted' | 'approved';
}

interface Team {
  id: string;
  name: string;
  members: number;
  lead: string;
  color: string;
}

const TeamsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teams' | 'timesheets' | 'reports'>('teams');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'team' | 'member' | 'timesheet'>('team');

  const [teams] = useState<Team[]>([
    { id: '1', name: 'Équipe Fondations', members: 8, lead: 'Jean Tremblay', color: '#3B82F6' },
    { id: '2', name: 'Équipe Charpente', members: 6, lead: 'Marie Dubois', color: '#10B981' },
    { id: '3', name: 'Équipe Électricité', members: 5, lead: 'Pierre Martin', color: '#F59E0B' },
    { id: '4', name: 'Équipe Plomberie', members: 4, lead: 'Sophie Lavoie', color: '#8B5CF6' },
  ]);

  const [members] = useState<TeamMember[]>([
    { id: '1', name: 'Jean Tremblay', role: 'Contremaître', trade: 'Charpentier-menuisier', hourlyRate: 48.50, hoursThisWeek: 42, status: 'active' },
    { id: '2', name: 'Marie Dubois', role: 'Chef d\'équipe', trade: 'Électricien', hourlyRate: 52.00, hoursThisWeek: 38, status: 'active' },
    { id: '3', name: 'Pierre Martin', role: 'Ouvrier', trade: 'Cimentier', hourlyRate: 45.75, hoursThisWeek: 40, status: 'break' },
    { id: '4', name: 'Sophie Lavoie', role: 'Apprenti', trade: 'Plombier', hourlyRate: 32.00, hoursThisWeek: 35, status: 'active' },
    { id: '5', name: 'Luc Bergeron', role: 'Ouvrier', trade: 'Ferblantier', hourlyRate: 47.25, hoursThisWeek: 0, status: 'off' },
  ]);

  const [timesheets] = useState<Timesheet[]>([
    { id: '1', employeeName: 'Jean Tremblay', date: '2026-01-11', project: 'Tour Deloitte', hoursRegular: 8, hoursOvertime: 2, status: 'submitted' },
    { id: '2', employeeName: 'Marie Dubois', date: '2026-01-11', project: 'Centre Bell Rénov.', hoursRegular: 8, hoursOvertime: 0, status: 'approved' },
    { id: '3', employeeName: 'Pierre Martin', date: '2026-01-11', project: 'Tour Deloitte', hoursRegular: 8, hoursOvertime: 1.5, status: 'draft' },
    { id: '4', employeeName: 'Sophie Lavoie', date: '2026-01-10', project: 'Résidence Soleil', hoursRegular: 7, hoursOvertime: 0, status: 'approved' },
  ]);

  const stats = {
    totalMembers: members.length,
    activeNow: members.filter(m => m.status === 'active').length,
    totalHoursWeek: members.reduce((sum, m) => sum + m.hoursThisWeek, 0),
    pendingTimesheets: timesheets.filter(t => t.status === 'submitted').length,
  };

  const openModal = (type: 'team' | 'member' | 'timesheet') => {
    setModalType(type);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      break: 'bg-yellow-100 text-yellow-800',
      off: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      active: 'Actif',
      break: 'Pause',
      off: 'Absent',
      draft: 'Brouillon',
      submitted: 'Soumis',
      approved: 'Approuvé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            Gestion des Équipes
          </h1>
          <p className="text-gray-600">Équipes, personnel et feuilles de temps</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('member')}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <UserPlus size={18} />
            Ajouter membre
          </button>
          <button
            onClick={() => openModal('timesheet')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Clock size={18} />
            Nouvelle feuille
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total membres</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Actifs maintenant</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeNow}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Heures cette semaine</p>
              <p className="text-2xl font-bold">{stats.totalHoursWeek}h</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Feuilles à approuver</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pendingTimesheets}</p>
            </div>
            <ClipboardList className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'teams', label: 'Équipes', icon: Users },
              { id: 'timesheets', label: 'Feuilles de temps', icon: Clock },
              { id: 'reports', label: 'Rapports', icon: TrendingUp },
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

        <div className="p-4">
          {/* Search */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              Filtres
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download size={18} />
              Exporter
            </button>
          </div>

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: team.color + '20' }}
                      >
                        <Users style={{ color: team.color }} size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-500">Chef: {team.lead}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{team.members} membres</span>
                    <button className="text-blue-600 hover:underline">Voir équipe</button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => openModal('team')}
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
              >
                <Plus size={24} />
                <span className="mt-2">Nouvelle équipe</span>
              </button>
            </div>
          )}

          {/* Members List (shown in teams tab too) */}
          {activeTab === 'teams' && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Tous les membres</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Nom</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Rôle</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Métier CCQ</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Taux horaire</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Heures/sem</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{member.name}</td>
                      <td className="p-3 text-gray-600">{member.role}</td>
                      <td className="p-3 text-gray-600">{member.trade}</td>
                      <td className="p-3 text-right">{member.hourlyRate.toFixed(2)} $</td>
                      <td className="p-3 text-right">{member.hoursThisWeek}h</td>
                      <td className="p-3 text-center">{getStatusBadge(member.status)}</td>
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

          {/* Timesheets Tab */}
          {activeTab === 'timesheets' && (
            <div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Employé</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Projet</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Régulières</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Supplémentaires</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((ts) => (
                    <tr key={ts.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{ts.employeeName}</td>
                      <td className="p-3 text-gray-600">{ts.date}</td>
                      <td className="p-3 text-gray-600">{ts.project}</td>
                      <td className="p-3 text-right">{ts.hoursRegular}h</td>
                      <td className="p-3 text-right text-orange-600">{ts.hoursOvertime}h</td>
                      <td className="p-3 text-right font-medium">{ts.hoursRegular + ts.hoursOvertime}h</td>
                      <td className="p-3 text-center">{getStatusBadge(ts.status)}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {ts.status === 'submitted' && (
                            <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approuver">
                              <Check size={16} />
                            </button>
                          )}
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Heures par projet</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tour Deloitte</span>
                    <span className="font-medium">156h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Coût main d'œuvre</h4>
                <p className="text-2xl font-bold text-green-600">24,850 $</p>
                <p className="text-sm text-gray-500">Cette semaine</p>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Heures supplémentaires</h4>
                <p className="text-2xl font-bold text-orange-600">12.5h</p>
                <p className="text-sm text-gray-500">+3.5h vs semaine dernière</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalType === 'team' && 'Nouvelle équipe'}
                {modalType === 'member' && 'Ajouter un membre'}
                {modalType === 'timesheet' && 'Nouvelle feuille de temps'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {modalType === 'team' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de l'équipe</label>
                  <input type="text" className="w-full border rounded-lg p-2" placeholder="Ex: Équipe Fondations" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chef d'équipe</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Sélectionner...</option>
                    {members.map(m => <option key={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Couleur</label>
                  <input type="color" className="w-full h-10 border rounded-lg" defaultValue="#3B82F6" />
                </div>
              </div>
            )}

            {modalType === 'member' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prénom</label>
                    <input type="text" className="w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input type="text" className="w-full border rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Métier CCQ</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Charpentier-menuisier</option>
                    <option>Électricien</option>
                    <option>Plombier</option>
                    <option>Cimentier</option>
                    <option>Ferblantier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taux horaire</label>
                  <input type="number" className="w-full border rounded-lg p-2" placeholder="45.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Équipe</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Aucune équipe</option>
                    {teams.map(t => <option key={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {modalType === 'timesheet' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employé</label>
                  <select className="w-full border rounded-lg p-2">
                    {members.map(m => <option key={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="w-full border rounded-lg p-2" defaultValue="2026-01-11" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projet</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Tour Deloitte</option>
                    <option>Centre Bell Rénov.</option>
                    <option>Résidence Soleil</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heures régulières</label>
                    <input type="number" className="w-full border rounded-lg p-2" placeholder="8" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heures suppl.</label>
                    <input type="number" className="w-full border rounded-lg p-2" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description du travail</label>
                  <textarea className="w-full border rounded-lg p-2" rows={3} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsModule;
