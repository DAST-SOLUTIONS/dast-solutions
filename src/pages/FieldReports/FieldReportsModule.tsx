import React, { useState } from 'react';
import { 
  FileText, Camera, Cloud, Sun, CloudRain, Wind, Plus, Search, 
  Filter, Download, Eye, Edit2, Trash2, Calendar, Users, 
  AlertTriangle, CheckCircle, Clock, MapPin, X, Upload
} from 'lucide-react';

interface FieldReport {
  id: string;
  number: string;
  project: string;
  date: string;
  weather: string;
  temperature: number;
  workersOnSite: number;
  status: 'draft' | 'submitted' | 'approved';
  photosCount: number;
  submittedBy: string;
}

const FieldReportsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'safety' | 'photos'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [reports] = useState<FieldReport[]>([
    { id: '1', number: 'RJ-2026-011', project: 'Tour Deloitte', date: '2026-01-11', weather: 'ensoleillé', temperature: -5, workersOnSite: 24, status: 'submitted', photosCount: 12, submittedBy: 'Jean Tremblay' },
    { id: '2', number: 'RJ-2026-010', project: 'Tour Deloitte', date: '2026-01-10', weather: 'nuageux', temperature: -8, workersOnSite: 22, status: 'approved', photosCount: 8, submittedBy: 'Jean Tremblay' },
    { id: '3', number: 'RJ-2026-009', project: 'Centre Bell Rénov.', date: '2026-01-10', weather: 'neige légère', temperature: -12, workersOnSite: 15, status: 'approved', photosCount: 15, submittedBy: 'Marie Dubois' },
    { id: '4', number: 'RJ-2026-008', project: 'Résidence Soleil', date: '2026-01-09', weather: 'ensoleillé', temperature: -3, workersOnSite: 8, status: 'approved', photosCount: 6, submittedBy: 'Pierre Martin' },
    { id: '5', number: 'RJ-2026-012', project: 'Tour Deloitte', date: '2026-01-11', weather: 'ensoleillé', temperature: -5, workersOnSite: 0, status: 'draft', photosCount: 0, submittedBy: '' },
  ]);

  const getWeatherIcon = (weather: string) => {
    if (weather.includes('soleil') || weather.includes('ensoleillé')) return <Sun className="text-yellow-500" size={18} />;
    if (weather.includes('pluie')) return <CloudRain className="text-blue-500" size={18} />;
    if (weather.includes('neige')) return <Cloud className="text-gray-400" size={18} />;
    return <Cloud className="text-gray-400" size={18} />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
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
            <FileText className="text-blue-600" />
            Rapports de Chantier
          </h1>
          <p className="text-gray-600">Rapports journaliers, photos et inspections SST</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouveau rapport
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rapports ce mois</p>
              <p className="text-2xl font-bold">47</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Photos uploadées</p>
              <p className="text-2xl font-bold">312</p>
            </div>
            <Camera className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inspections SST</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">À approuver</p>
              <p className="text-2xl font-bold text-orange-600">3</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'reports', label: 'Rapports journaliers', icon: FileText },
              { id: 'safety', label: 'Inspections SST', icon: AlertTriangle },
              { id: 'photos', label: 'Galerie photos', icon: Camera },
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
                placeholder="Rechercher un rapport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select className="border rounded-lg px-4 py-2">
              <option value="">Tous les projets</option>
              <option>Tour Deloitte</option>
              <option>Centre Bell Rénov.</option>
              <option>Résidence Soleil</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Download size={18} />
              Exporter
            </button>
          </div>

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Numéro</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Projet</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Météo</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Travailleurs</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Photos</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium text-blue-600">{report.number}</td>
                    <td className="p-3">{report.project}</td>
                    <td className="p-3 text-gray-600">{report.date}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(report.weather)}
                        <span>{report.temperature}°C</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        {report.workersOnSite}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Camera size={14} className="text-gray-400" />
                        {report.photosCount}
                      </div>
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(report.status)}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: 'Inspection Générale', date: '2026-01-10', rating: 'Conforme', color: 'green' },
                  { title: 'Vérification Échafaudages', date: '2026-01-09', rating: 'Conforme', color: 'green' },
                  { title: 'Équipements Protection', date: '2026-01-08', rating: 'Non-conformité mineure', color: 'yellow' },
                ].map((inspection, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{inspection.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inspection.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inspection.rating}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{inspection.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg relative group cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 text-white text-sm">
                      <p className="font-medium">Photo {i}</p>
                      <p className="text-xs opacity-75">Tour Deloitte • 2026-01-{10 + i}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouveau rapport journalier</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Projet</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Tour Deloitte</option>
                    <option>Centre Bell Rénov.</option>
                    <option>Résidence Soleil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="w-full border rounded-lg p-2" defaultValue="2026-01-11" />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Conditions météo</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Conditions</label>
                    <select className="w-full border rounded-lg p-2">
                      <option>Ensoleillé</option>
                      <option>Nuageux</option>
                      <option>Pluie</option>
                      <option>Neige</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Température</label>
                    <input type="number" className="w-full border rounded-lg p-2" placeholder="-5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vent</label>
                    <select className="w-full border rounded-lg p-2">
                      <option>Calme</option>
                      <option>Léger</option>
                      <option>Modéré</option>
                      <option>Fort</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Travailleurs</label>
                    <input type="number" className="w-full border rounded-lg p-2" placeholder="24" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Travaux effectués</label>
                <textarea className="w-full border rounded-lg p-2" rows={3} placeholder="Décrivez les travaux réalisés aujourd'hui..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Retards / Problèmes</label>
                <textarea className="w-full border rounded-lg p-2" rows={2} placeholder="Notez tout retard ou problème rencontré..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Photos</label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-500">Glissez des photos ici ou cliquez pour sélectionner</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                Sauvegarder brouillon
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldReportsModule;
