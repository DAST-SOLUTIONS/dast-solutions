import React, { useState } from 'react';
import { 
  Gavel, FileText, Calendar, AlertTriangle, CheckCircle, Clock,
  Building2, Upload, Download, Search, Filter, Plus, Eye,
  MessageSquare, DollarSign, X, ChevronRight, User, Paperclip
} from 'lucide-react';

interface Reclamation {
  id: string;
  numero: string;
  titre: string;
  projet: string;
  type: 'retard' | 'defaut' | 'changement' | 'accident' | 'autre';
  contre: string;
  montantReclame: number;
  montantAccorde?: number;
  dateOuverture: string;
  dateCloture?: string;
  statut: 'ouverte' | 'negociation' | 'litige' | 'resolue' | 'rejetee';
  description: string;
  documents: number;
}

const ReclamationsModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReclamation, setSelectedReclamation] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatut, setFilterStatut] = useState('all');

  const [reclamations] = useState<Reclamation[]>([
    { id: '1', numero: 'REC-2026-001', titre: 'Retard livraison acier structure', projet: 'Tour Deloitte', type: 'retard', contre: 'Acier MTL Inc.', montantReclame: 125000, dateOuverture: '2026-01-05', statut: 'negociation', description: 'Retard de 3 semaines sur la livraison des poutrelles principales causant un décalage du calendrier.', documents: 8 },
    { id: '2', numero: 'REC-2025-045', titre: 'Défaut étanchéité membrane', projet: 'Centre Bell', type: 'defaut', contre: 'Toitures Pro', montantReclame: 85000, montantAccorde: 72000, dateOuverture: '2025-11-15', dateCloture: '2026-01-02', statut: 'resolue', description: 'Infiltration d\'eau détectée suite à mauvaise installation de la membrane.', documents: 12 },
    { id: '3', numero: 'REC-2025-038', titre: 'Travaux supplémentaires non autorisés', projet: 'École Primaire', type: 'changement', contre: 'Client - CSDM', montantReclame: 45000, dateOuverture: '2025-10-20', statut: 'litige', description: 'Demandes verbales de modifications non formalisées par avenant.', documents: 15 },
    { id: '4', numero: 'REC-2025-022', titre: 'Accident équipement sur site', projet: 'Résidence Soleil', type: 'accident', contre: 'Assurances XYZ', montantReclame: 35000, montantAccorde: 35000, dateOuverture: '2025-08-10', dateCloture: '2025-12-01', statut: 'resolue', description: 'Bris de fenêtres suite à chute de matériel.', documents: 6 },
    { id: '5', numero: 'REC-2026-002', titre: 'Non-conformité béton livré', projet: 'Tour Deloitte', type: 'defaut', contre: 'Béton Québec', montantReclame: 28000, dateOuverture: '2026-01-10', statut: 'ouverte', description: 'Tests de résistance non conformes sur coulée du 8 janvier.', documents: 4 },
  ]);

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ouverte: 'bg-blue-100 text-blue-700',
      negociation: 'bg-yellow-100 text-yellow-700',
      litige: 'bg-red-100 text-red-700',
      resolue: 'bg-green-100 text-green-700',
      rejetee: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      ouverte: 'Ouverte',
      negociation: 'Négociation',
      litige: 'Litige',
      resolue: 'Résolue',
      rejetee: 'Rejetée',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[statut]}`}>{labels[statut]}</span>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      retard: 'Retard',
      defaut: 'Défaut/Malfaçon',
      changement: 'Changement portée',
      accident: 'Accident',
      autre: 'Autre',
    };
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{labels[type]}</span>;
  };

  const stats = {
    ouvertes: reclamations.filter(r => r.statut === 'ouverte' || r.statut === 'negociation').length,
    enLitige: reclamations.filter(r => r.statut === 'litige').length,
    resolues: reclamations.filter(r => r.statut === 'resolue').length,
    montantTotal: reclamations.filter(r => r.statut !== 'resolue' && r.statut !== 'rejetee').reduce((sum, r) => sum + r.montantReclame, 0),
  };

  const filteredReclamations = reclamations.filter(r => {
    const matchSearch = r.titre.toLowerCase().includes(searchQuery.toLowerCase()) || r.numero.includes(searchQuery);
    const matchStatut = filterStatut === 'all' || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const currentReclamation = reclamations.find(r => r.id === selectedReclamation);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="text-red-600" />
            Réclamations
          </h1>
          <p className="text-gray-600">Gestion des claims et litiges</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus size={18} />
          Nouvelle réclamation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">En cours</p>
            <Clock size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.ouvertes}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">En litige</p>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-red-600">{stats.enLitige}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Résolues</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-green-600">{stats.resolues}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Montant en jeu</p>
            <DollarSign size={20} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-600">{(stats.montantTotal / 1000).toFixed(0)}K$</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des réclamations */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
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
            <select 
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="ouverte">Ouvertes</option>
              <option value="negociation">Négociation</option>
              <option value="litige">Litige</option>
              <option value="resolue">Résolues</option>
            </select>
          </div>
          <div className="divide-y">
            {filteredReclamations.map((rec) => (
              <div 
                key={rec.id}
                onClick={() => setSelectedReclamation(rec.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedReclamation === rec.id ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{rec.numero}</span>
                      {getTypeBadge(rec.type)}
                    </div>
                    <h4 className="font-medium">{rec.titre}</h4>
                    <p className="text-sm text-gray-500">{rec.projet} • vs {rec.contre}</p>
                  </div>
                  <div className="text-right">
                    {getStatutBadge(rec.statut)}
                    <p className="text-lg font-bold mt-2">{(rec.montantReclame / 1000).toFixed(0)}K$</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {rec.dateOuverture}</span>
                  <span className="flex items-center gap-1"><Paperclip size={12} /> {rec.documents} docs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Détail */}
        <div className="space-y-4">
          {currentReclamation ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm text-gray-500">{currentReclamation.numero}</p>
                    <h3 className="text-lg font-bold">{currentReclamation.titre}</h3>
                  </div>
                  {getStatutBadge(currentReclamation.statut)}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Projet</span>
                    <span className="font-medium">{currentReclamation.projet}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contre</span>
                    <span className="font-medium">{currentReclamation.contre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant réclamé</span>
                    <span className="font-bold text-red-600">{currentReclamation.montantReclame.toLocaleString()}$</span>
                  </div>
                  {currentReclamation.montantAccorde && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Montant accordé</span>
                      <span className="font-bold text-green-600">{currentReclamation.montantAccorde.toLocaleString()}$</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date ouverture</span>
                    <span>{currentReclamation.dateOuverture}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600">{currentReclamation.description}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold mb-3 flex items-center justify-between">
                  <span>Documents ({currentReclamation.documents})</span>
                  <button className="text-blue-600 text-sm hover:underline">+ Ajouter</button>
                </h4>
                <div className="space-y-2">
                  {['Mise en demeure.pdf', 'Photos dommages.zip', 'Correspondance.pdf'].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        {doc}
                      </span>
                      <Download size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Modifier</button>
                <button className="flex-1 py-2 border rounded-lg text-sm">Historique</button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Gavel size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sélectionnez une réclamation</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvelle réclamation</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Tour Deloitte</option>
                    <option>Centre Bell</option>
                    <option>École Primaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="retard">Retard</option>
                    <option value="defaut">Défaut/Malfaçon</option>
                    <option value="changement">Changement portée</option>
                    <option value="accident">Accident</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contre (partie adverse)</label>
                <input type="text" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant réclamé</label>
                <input type="number" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-4 py-2 border rounded-lg" rows={3}></textarea>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReclamationsModule;
