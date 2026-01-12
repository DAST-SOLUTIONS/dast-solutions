import React, { useState } from 'react';
import { 
  MapPin, Navigation, Clock, Users, Plus, Search, Filter,
  ChevronRight, CheckCircle, LogIn, LogOut, AlertCircle,
  Building, Truck, Settings, Eye, Calendar
} from 'lucide-react';

interface ProjectLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  activeWorkers: number;
  status: 'active' | 'inactive';
}

interface Checkin {
  id: string;
  employee: string;
  project: string;
  type: 'in' | 'out';
  time: string;
  location: string;
}

const GeolocationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'checkins' | 'geofences'>('map');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [projects] = useState<ProjectLocation[]>([
    { id: '1', name: 'Tour Deloitte', address: '1190 Avenue des Canadiens-de-Montréal', city: 'Montréal', lat: 45.4962, lng: -73.5698, activeWorkers: 24, status: 'active' },
    { id: '2', name: 'Centre Bell Rénov.', address: '1909 Avenue des Canadiens-de-Montréal', city: 'Montréal', lat: 45.4961, lng: -73.5693, activeWorkers: 15, status: 'active' },
    { id: '3', name: 'Résidence Soleil', address: '4500 Boul. Henri-Bourassa', city: 'Montréal-Nord', lat: 45.6012, lng: -73.6345, activeWorkers: 8, status: 'active' },
    { id: '4', name: 'Complexe Industriel', address: '8800 Rue Pascal-Gagnon', city: 'Saint-Léonard', lat: 45.5892, lng: -73.5934, activeWorkers: 0, status: 'inactive' },
  ]);

  const [checkins] = useState<Checkin[]>([
    { id: '1', employee: 'Jean Tremblay', project: 'Tour Deloitte', type: 'in', time: '07:02', location: 'Entrée principale' },
    { id: '2', employee: 'Marie Dubois', project: 'Tour Deloitte', type: 'in', time: '07:15', location: 'Entrée principale' },
    { id: '3', employee: 'Pierre Martin', project: 'Centre Bell', type: 'in', time: '07:30', location: 'Entrée nord' },
    { id: '4', employee: 'Sophie Lavoie', project: 'Tour Deloitte', type: 'out', time: '12:00', location: 'Sortie est' },
    { id: '5', employee: 'Luc Bergeron', project: 'Résidence Soleil', type: 'in', time: '08:00', location: 'Entrée chantier' },
  ]);

  const stats = {
    totalWorkers: projects.reduce((sum, p) => sum + p.activeWorkers, 0),
    activeProjects: projects.filter(p => p.status === 'active').length,
    checkinsToday: checkins.length,
    avgArrivalTime: '07:22',
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" />
            Géolocalisation
          </h1>
          <p className="text-gray-600">Carte des projets, pointages et géofencing</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
            <Settings size={18} />
            Paramètres
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={18} />
            Ajouter lieu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Travailleurs sur site</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalWorkers}</p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Projets actifs</p>
              <p className="text-2xl font-bold">{stats.activeProjects}</p>
            </div>
            <Building className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pointages aujourd'hui</p>
              <p className="text-2xl font-bold">{stats.checkinsToday}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Arrivée moyenne</p>
              <p className="text-2xl font-bold">{stats.avgArrivalTime}</p>
            </div>
            <Navigation className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Carte des chantiers</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">Satellite</button>
              <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded">Plan</button>
            </div>
          </div>
          {/* Map Placeholder */}
          <div className="h-96 bg-gray-100 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Carte interactive</p>
                <p className="text-sm text-gray-400">Intégration Google Maps / Mapbox</p>
              </div>
            </div>
            {/* Project markers */}
            {projects.map((project, i) => (
              <div
                key={project.id}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-full"
                style={{ left: `${20 + i * 20}%`, top: `${30 + i * 15}%` }}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className={`relative ${selectedProject === project.id ? 'scale-125' : ''} transition-transform`}>
                  <MapPin 
                    size={32} 
                    className={project.status === 'active' ? 'text-blue-600 fill-blue-600' : 'text-gray-400 fill-gray-400'}
                  />
                  {project.activeWorkers > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {project.activeWorkers}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Chantiers</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedProject === project.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.address}</p>
                    <p className="text-sm text-gray-500">{project.city}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Users size={14} />
                    {project.activeWorkers} sur site
                  </span>
                  <button className="text-blue-600 hover:underline flex items-center gap-1">
                    <Eye size={14} />
                    Détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Checkins */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Pointages récents</h3>
          <button className="text-sm text-blue-600 hover:underline">Voir tous</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Employé</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Projet</th>
                <th className="text-center p-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Heure</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Lieu</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((checkin) => (
                <tr key={checkin.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                        {checkin.employee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{checkin.employee}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{checkin.project}</td>
                  <td className="p-3 text-center">
                    {checkin.type === 'in' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <LogIn size={12} />
                        Entrée
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <LogOut size={12} />
                        Sortie
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-medium">{checkin.time}</td>
                  <td className="p-3 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {checkin.location}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeolocationModule;
