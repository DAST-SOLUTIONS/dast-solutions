import React, { useState } from 'react';
import { 
  HelpCircle, Plus, Search, Filter, Download, Send, Clock,
  CheckCircle, AlertTriangle, MessageSquare, User, Calendar,
  FileText, Paperclip, ArrowRight, Eye, Edit, MoreVertical,
  Building2, X, ChevronDown
} from 'lucide-react';

interface RFI {
  id: string;
  numero: string;
  titre: string;
  projet: string;
  discipline: string;
  priorite: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'in_review' | 'answered' | 'closed';
  dateCreation: string;
  dateReponse?: string;
  creePar: string;
  assigneA: string;
  reponses: number;
  pieces: number;
}

const RFIModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedRFI, setSelectedRFI] = useState<string | null>(null);
  const [showNewRFI, setShowNewRFI] = useState(false);

  const [rfis] = useState<RFI[]>([
    { id: '1', numero: 'RFI-2026-0028', titre: 'Clarification hauteur sous plafond niveau 3', projet: 'Tour Deloitte', discipline: 'Architecture', priorite: 'high', status: 'in_review', dateCreation: '2026-01-10', creePar: 'Jean Tremblay', assigneA: 'Cabinet XYZ Architectes', reponses: 2, pieces: 3 },
    { id: '2', numero: 'RFI-2026-0027', titre: 'Spécifications béton autoplaçant fondations', projet: 'Tour Deloitte', discipline: 'Structure', priorite: 'critical', status: 'submitted', dateCreation: '2026-01-09', creePar: 'Marie Dubois', assigneA: 'Ingénieurs ABC', reponses: 0, pieces: 2 },
    { id: '3', numero: 'RFI-2026-0026', titre: 'Emplacement prises électriques cuisine', projet: 'Centre Bell', discipline: 'Électricité', priorite: 'medium', status: 'answered', dateCreation: '2026-01-08', dateReponse: '2026-01-10', creePar: 'Pierre Martin', assigneA: 'Électro Design', reponses: 3, pieces: 1 },
    { id: '4', numero: 'RFI-2026-0025', titre: 'Type de membrane toiture terrasse', projet: 'Résidence Soleil', discipline: 'Architecture', priorite: 'low', status: 'closed', dateCreation: '2026-01-05', dateReponse: '2026-01-08', creePar: 'Sophie Lavoie', assigneA: 'Cabinet XYZ Architectes', reponses: 2, pieces: 4 },
    { id: '5', numero: 'RFI-2026-0024', titre: 'Diamètre conduits CVAC niveau 2', projet: 'Tour Deloitte', discipline: 'Mécanique', priorite: 'high', status: 'in_review', dateCreation: '2026-01-04', creePar: 'Luc Gagnon', assigneA: 'Mécanique Pro', reponses: 1, pieces: 2 },
  ]);

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      critical: 'Critique',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>{labels[priority]}</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-yellow-100 text-yellow-700',
      in_review: 'bg-blue-100 text-blue-700',
      answered: 'bg-green-100 text-green-700',
      closed: 'bg-purple-100 text-purple-700',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      submitted: 'Soumis',
      in_review: 'En révision',
      answered: 'Répondu',
      closed: 'Fermé',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const filteredRFIs = rfis.filter(rfi => {
    const matchSearch = rfi.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rfi.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       rfi.projet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || rfi.status === filterStatus;
    const matchPriority = filterPriority === 'all' || rfi.priorite === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total: rfis.length,
    enAttente: rfis.filter(r => ['submitted', 'in_review'].includes(r.status)).length,
    repondu: rfis.filter(r => r.status === 'answered').length,
    critique: rfis.filter(r => r.priorite === 'critical' && r.status !== 'closed').length,
  };

  const currentRFI = rfis.find(r => r.id === selectedRFI);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="text-blue-600" />
            Gestion des RFI
          </h1>
          <p className="text-gray-600">Demandes d'information et clarifications techniques</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
          <button 
            onClick={() => setShowNewRFI(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouvelle RFI
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total RFI</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Répondues</p>
          <p className="text-2xl font-bold text-green-600">{stats.repondu}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Critiques ouvertes</p>
          <p className="text-2xl font-bold text-red-600">{stats.critique}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des RFI */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Filters */}
          <div className="p-4 border-b flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par numéro, titre, projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="submitted">Soumis</option>
              <option value="in_review">En révision</option>
              <option value="answered">Répondu</option>
              <option value="closed">Fermé</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Toutes priorités</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>

          {/* Table */}
          <div className="divide-y">
            {filteredRFIs.map((rfi) => (
              <div 
                key={rfi.id}
                onClick={() => setSelectedRFI(rfi.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedRFI === rfi.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-blue-600">{rfi.numero}</span>
                      {getPriorityBadge(rfi.priorite)}
                      {getStatusBadge(rfi.status)}
                    </div>
                    <h4 className="font-medium">{rfi.titre}</h4>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {rfi.projet}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {rfi.discipline}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {rfi.dateCreation}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    {rfi.reponses} réponses
                  </span>
                  <span className="flex items-center gap-1">
                    <Paperclip size={14} />
                    {rfi.pieces} pièces
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail RFI */}
        <div className="space-y-4">
          {currentRFI ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-sm text-blue-600">{currentRFI.numero}</span>
                    <h3 className="font-semibold text-lg mt-1">{currentRFI.titre}</h3>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Statut</p>
                    <div className="mt-1">{getStatusBadge(currentRFI.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Priorité</p>
                    <div className="mt-1">{getPriorityBadge(currentRFI.priorite)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Projet</p>
                    <p className="font-medium">{currentRFI.projet}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Discipline</p>
                    <p className="font-medium">{currentRFI.discipline}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Créé par</p>
                    <p className="font-medium">{currentRFI.creePar}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Assigné à</p>
                    <p className="font-medium">{currentRFI.assigneA}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Question</h4>
                  <p className="text-sm text-gray-600">
                    Pourriez-vous clarifier la hauteur exacte sous plafond requise au niveau 3, 
                    particulièrement dans la zone des bureaux où les conduits CVAC semblent 
                    entrer en conflit avec la hauteur indiquée sur les plans architecturaux?
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip size={16} />
                    Pièces jointes ({currentRFI.pieces})
                  </h4>
                  <div className="space-y-2">
                    {['Plan-Niveau3-Coupe-AA.pdf', 'Photo-Conflit-CVAC.jpg', 'Notes-Reunion.docx'].slice(0, currentRFI.pieces).map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        <FileText size={14} className="text-gray-400" />
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Historique des réponses */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
                  Historique ({currentRFI.reponses})
                </h4>
                <div className="space-y-4">
                  {currentRFI.reponses > 0 && (
                    <>
                      <div className="border-l-2 border-blue-200 pl-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Cabinet XYZ Architectes</span>
                          <span className="text-xs text-gray-400">Il y a 2 heures</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Nous confirmons que la hauteur sous plafond au niveau 3 doit être de 2.7m. 
                          Une révision des plans sera émise pour ajuster le parcours des conduits CVAC.
                        </p>
                      </div>
                      {currentRFI.reponses > 1 && (
                        <div className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Jean Tremblay</span>
                            <span className="text-xs text-gray-400">Hier</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Merci pour la clarification. Pouvez-vous confirmer la date prévue pour la révision?
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <textarea 
                    placeholder="Ajouter une réponse..."
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                      <Paperclip size={14} />
                      Joindre fichier
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
              <HelpCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Sélectionnez une RFI pour voir les détails</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle RFI */}
      {showNewRFI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvelle demande d'information (RFI)</h2>
              <button onClick={() => setShowNewRFI(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la demande</label>
                <input type="text" placeholder="Ex: Clarification spécifications béton" className="w-full px-4 py-2 border rounded-lg" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner...</option>
                    <option>Architecture</option>
                    <option>Structure</option>
                    <option>Mécanique</option>
                    <option>Électricité</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigner à</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner...</option>
                    <option>Cabinet XYZ Architectes</option>
                    <option>Ingénieurs ABC</option>
                    <option>Électro Design</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description de la demande</label>
                <textarea rows={4} placeholder="Décrivez votre question en détail..." className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pièces jointes</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Paperclip size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Glissez des fichiers ici ou cliquez pour sélectionner</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowNewRFI(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Sauvegarder brouillon
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Soumettre RFI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIModule;
