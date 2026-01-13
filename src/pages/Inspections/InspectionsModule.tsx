import React, { useState } from 'react';
import { 
  ClipboardCheck, Plus, Search, Filter, Download, Camera, CheckCircle,
  XCircle, AlertTriangle, Clock, Calendar, User, MapPin, FileText,
  Eye, Edit, MoreVertical, ChevronDown, ChevronRight, Image,
  Building2, X, Upload, Trash2
} from 'lucide-react';

interface Inspection {
  id: string;
  numero: string;
  titre: string;
  projet: string;
  zone: string;
  type: 'qualite' | 'securite' | 'environnement' | 'conformite';
  status: 'planned' | 'in_progress' | 'completed' | 'requires_action';
  date: string;
  inspecteur: string;
  itemsTotal: number;
  itemsConformes: number;
  itemsNonConformes: number;
  photos: number;
}

interface ChecklistItem {
  id: string;
  description: string;
  status: 'pending' | 'conforme' | 'non_conforme' | 'na';
  notes?: string;
  photo?: boolean;
}

const InspectionsModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [showNewInspection, setShowNewInspection] = useState(false);

  const [inspections] = useState<Inspection[]>([
    { id: '1', numero: 'INS-2026-0042', titre: 'Inspection béton niveau 3', projet: 'Tour Deloitte', zone: 'Niveau 3 - Section A', type: 'qualite', status: 'completed', date: '2026-01-10', inspecteur: 'Jean Tremblay', itemsTotal: 15, itemsConformes: 13, itemsNonConformes: 2, photos: 8 },
    { id: '2', numero: 'INS-2026-0041', titre: 'Contrôle soudures structure', projet: 'Tour Deloitte', zone: 'Niveau 4 - Charpente', type: 'qualite', status: 'requires_action', date: '2026-01-09', inspecteur: 'Marie Dubois', itemsTotal: 12, itemsConformes: 9, itemsNonConformes: 3, photos: 12 },
    { id: '3', numero: 'INS-2026-0040', titre: 'Inspection sécurité hebdomadaire', projet: 'Centre Bell', zone: 'Ensemble du chantier', type: 'securite', status: 'completed', date: '2026-01-08', inspecteur: 'Pierre Martin', itemsTotal: 25, itemsConformes: 24, itemsNonConformes: 1, photos: 5 },
    { id: '4', numero: 'INS-2026-0039', titre: 'Vérification étanchéité toiture', projet: 'Résidence Soleil', zone: 'Toiture - Section nord', type: 'qualite', status: 'in_progress', date: '2026-01-12', inspecteur: 'Sophie Lavoie', itemsTotal: 10, itemsConformes: 6, itemsNonConformes: 0, photos: 3 },
    { id: '5', numero: 'INS-2026-0038', titre: 'Audit environnemental mensuel', projet: 'Tour Deloitte', zone: 'Ensemble du site', type: 'environnement', status: 'planned', date: '2026-01-15', inspecteur: 'Luc Gagnon', itemsTotal: 20, itemsConformes: 0, itemsNonConformes: 0, photos: 0 },
  ]);

  const [checklistItems] = useState<ChecklistItem[]>([
    { id: '1', description: 'Vérification de l\'alignement des coffrages', status: 'conforme', notes: 'Alignement parfait' },
    { id: '2', description: 'Contrôle de la propreté des armatures', status: 'conforme' },
    { id: '3', description: 'Vérification des espaceurs et cales', status: 'non_conforme', notes: 'Espaceurs manquants section B-3', photo: true },
    { id: '4', description: 'Contrôle du positionnement des inserts', status: 'conforme' },
    { id: '5', description: 'Vérification de l\'étanchéité des coffrages', status: 'conforme' },
    { id: '6', description: 'Contrôle des ancrages de sécurité', status: 'non_conforme', notes: 'Ancrage #4 à repositionner', photo: true },
    { id: '7', description: 'Vérification du niveau', status: 'conforme' },
    { id: '8', description: 'Test slump du béton', status: 'conforme', notes: 'Slump: 120mm - Conforme' },
  ]);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      qualite: 'bg-blue-100 text-blue-700',
      securite: 'bg-orange-100 text-orange-700',
      environnement: 'bg-green-100 text-green-700',
      conformite: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      qualite: 'Qualité',
      securite: 'Sécurité',
      environnement: 'Environnement',
      conformite: 'Conformité',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[type]}`}>{labels[type]}</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planned: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      requires_action: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      planned: 'Planifiée',
      in_progress: 'En cours',
      completed: 'Terminée',
      requires_action: 'Action requise',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'conforme':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'non_conforme':
        return <XCircle size={18} className="text-red-500" />;
      case 'na':
        return <span className="text-gray-400 text-sm">N/A</span>;
      default:
        return <Clock size={18} className="text-gray-400" />;
    }
  };

  const currentInspection = inspections.find(i => i.id === selectedInspection);

  const stats = {
    total: inspections.length,
    enCours: inspections.filter(i => i.status === 'in_progress').length,
    actionsRequises: inspections.filter(i => i.status === 'requires_action').length,
    tauxConformite: Math.round(
      (inspections.reduce((sum, i) => sum + i.itemsConformes, 0) / 
       inspections.reduce((sum, i) => sum + i.itemsTotal, 0)) * 100
    ),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="text-blue-600" />
            Inspection Qualité
          </h1>
          <p className="text-gray-600">Checklists d'inspection et suivi des non-conformités</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Rapports
          </button>
          <button 
            onClick={() => setShowNewInspection(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouvelle inspection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total inspections</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">En cours</p>
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Actions requises</p>
          <p className="text-2xl font-bold text-red-600">{stats.actionsRequises}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Taux conformité</p>
          <p className={`text-2xl font-bold ${stats.tauxConformite >= 90 ? 'text-green-600' : stats.tauxConformite >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.tauxConformite}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des inspections */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Filters */}
          <div className="p-4 border-b flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher une inspection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous les types</option>
              <option value="qualite">Qualité</option>
              <option value="securite">Sécurité</option>
              <option value="environnement">Environnement</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="planned">Planifiée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
              <option value="requires_action">Action requise</option>
            </select>
          </div>

          {/* Liste */}
          <div className="divide-y">
            {inspections.map((inspection) => (
              <div 
                key={inspection.id}
                onClick={() => setSelectedInspection(inspection.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedInspection === inspection.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-blue-600">{inspection.numero}</span>
                      {getTypeBadge(inspection.type)}
                      {getStatusBadge(inspection.status)}
                    </div>
                    <h4 className="font-medium">{inspection.titre}</h4>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm text-green-600">{inspection.itemsConformes}</span>
                      <span className="text-gray-300 mx-1">|</span>
                      <XCircle size={14} className="text-red-500" />
                      <span className="text-sm text-red-600">{inspection.itemsNonConformes}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {inspection.projet}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {inspection.zone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {inspection.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Camera size={14} />
                    {inspection.photos}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail inspection */}
        <div className="space-y-4">
          {currentInspection ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-sm text-blue-600">{currentInspection.numero}</span>
                    <h3 className="font-semibold text-lg mt-1">{currentInspection.titre}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Statut</p>
                    <div className="mt-1">{getStatusBadge(currentInspection.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <div className="mt-1">{getTypeBadge(currentInspection.type)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Projet</p>
                    <p className="font-medium">{currentInspection.projet}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Zone</p>
                    <p className="font-medium">{currentInspection.zone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{currentInspection.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Inspecteur</p>
                    <p className="font-medium">{currentInspection.inspecteur}</p>
                  </div>
                </div>

                {/* Résumé conformité */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Taux de conformité</span>
                    <span className="font-bold">
                      {Math.round((currentInspection.itemsConformes / currentInspection.itemsTotal) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(currentInspection.itemsConformes / currentInspection.itemsTotal) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-600">{currentInspection.itemsConformes} conformes</span>
                    <span className="text-red-600">{currentInspection.itemsNonConformes} non-conformes</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-blue-600" />
                  Points de contrôle
                </h4>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border ${
                        item.status === 'non_conforme' ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getItemStatusIcon(item.status)}
                        <div className="flex-1">
                          <p className="text-sm">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        {item.photo && (
                          <Camera size={14} className="text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Image size={18} className="text-green-600" />
                  Photos ({currentInspection.photos})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: Math.min(currentInspection.photos, 6) }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera size={24} className="text-gray-400" />
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 py-2 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Upload size={18} />
                  Ajouter des photos
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
              <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Sélectionnez une inspection</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Inspection */}
      {showNewInspection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvelle inspection</h2>
              <button onClick={() => setShowNewInspection(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'inspection</label>
                <input type="text" placeholder="Ex: Inspection béton niveau 4" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner...</option>
                    <option>Tour Deloitte</option>
                    <option>Centre Bell</option>
                    <option>Résidence Soleil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'inspection</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="qualite">Qualité</option>
                    <option value="securite">Sécurité</option>
                    <option value="environnement">Environnement</option>
                    <option value="conformite">Conformité</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone / Localisation</label>
                  <input type="text" placeholder="Ex: Niveau 3 - Section A" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date prévue</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle de checklist</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Sélectionner un modèle...</option>
                  <option>Inspection béton - Standard</option>
                  <option>Inspection soudures</option>
                  <option>Sécurité chantier - Hebdomadaire</option>
                  <option>Audit environnemental</option>
                  <option>Créer une checklist personnalisée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} placeholder="Instructions ou notes supplémentaires..." className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowNewInspection(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionsModule;
