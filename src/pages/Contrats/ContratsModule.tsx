import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Filter, Download, Send, CheckCircle,
  Clock, AlertTriangle, DollarSign, Calendar, Eye, Edit, Trash2,
  MoreVertical, ArrowUpRight, ArrowDownRight, Link2, Building2,
  X, History, Lock, Unlock
} from 'lucide-react';

interface Contrat {
  id: string;
  numero: string;
  titre: string;
  projet: string;
  client: string;
  type: 'forfait' | 'prix_unitaire' | 'cout_majore';
  montantOriginal: number;
  montantActuel: number;
  avenants: number;
  dateDebut: string;
  dateFin: string;
  status: 'draft' | 'active' | 'completed' | 'suspended';
}

interface Avenant {
  id: string;
  numero: string;
  contratId: string;
  titre: string;
  type: 'ajout' | 'retrait' | 'modification';
  montant: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  dateCreation: string;
  dateApprobation?: string;
  creePar: string;
}

const ContratsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contrats' | 'avenants'>('contrats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContrat, setSelectedContrat] = useState<string | null>(null);
  const [showNewContrat, setShowNewContrat] = useState(false);
  const [showNewAvenant, setShowNewAvenant] = useState(false);

  const [contrats] = useState<Contrat[]>([
    { id: '1', numero: 'CTR-2025-001', titre: 'Construction Tour Deloitte - Phase 2', projet: 'Tour Deloitte', client: 'Deloitte Canada', type: 'forfait', montantOriginal: 12500000, montantActuel: 13250000, avenants: 3, dateDebut: '2025-09-01', dateFin: '2026-08-31', status: 'active' },
    { id: '2', numero: 'CTR-2025-002', titre: 'Rénovation Centre Bell - Loges VIP', projet: 'Centre Bell', client: 'Groupe CH', type: 'prix_unitaire', montantOriginal: 4500000, montantActuel: 4650000, avenants: 1, dateDebut: '2025-10-15', dateFin: '2026-04-30', status: 'active' },
    { id: '3', numero: 'CTR-2025-003', titre: 'Construction Résidence Soleil', projet: 'Résidence Soleil', client: 'Développements Soleil', type: 'forfait', montantOriginal: 3200000, montantActuel: 3180000, avenants: 2, dateDebut: '2025-01-10', dateFin: '2025-12-15', status: 'completed' },
    { id: '4', numero: 'CTR-2026-001', titre: 'Agrandissement Hôpital Ste-Justine', projet: 'Hôpital Ste-Justine', client: 'CHU Ste-Justine', type: 'cout_majore', montantOriginal: 15000000, montantActuel: 15000000, avenants: 0, dateDebut: '2026-02-01', dateFin: '2027-06-30', status: 'draft' },
  ]);

  const [avenants] = useState<Avenant[]>([
    { id: '1', numero: 'AV-001-01', contratId: '1', titre: 'Ajout système domotique niveau 5', type: 'ajout', montant: 450000, status: 'approved', dateCreation: '2025-11-15', dateApprobation: '2025-11-20', creePar: 'Jean Tremblay' },
    { id: '2', numero: 'AV-001-02', contratId: '1', titre: 'Modification revêtement façade ouest', type: 'modification', montant: 180000, status: 'approved', dateCreation: '2025-12-01', dateApprobation: '2025-12-10', creePar: 'Marie Dubois' },
    { id: '3', numero: 'AV-001-03', contratId: '1', titre: 'Ajout terrasse niveau 8', type: 'ajout', montant: 120000, status: 'pending', dateCreation: '2026-01-08', creePar: 'Pierre Martin' },
    { id: '4', numero: 'AV-002-01', contratId: '2', titre: 'Extension zone loges secteur B', type: 'ajout', montant: 150000, status: 'approved', dateCreation: '2025-12-15', dateApprobation: '2025-12-22', creePar: 'Sophie Lavoie' },
    { id: '5', numero: 'AV-003-01', contratId: '3', titre: 'Retrait piscine extérieure', type: 'retrait', montant: -85000, status: 'approved', dateCreation: '2025-06-10', dateApprobation: '2025-06-15', creePar: 'Luc Gagnon' },
  ]);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      forfait: 'bg-blue-100 text-blue-700',
      prix_unitaire: 'bg-purple-100 text-purple-700',
      cout_majore: 'bg-orange-100 text-orange-700',
    };
    const labels: Record<string, string> = {
      forfait: 'Forfaitaire',
      prix_unitaire: 'Prix unitaire',
      cout_majore: 'Coût majoré',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[type]}`}>{labels[type]}</span>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      suspended: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      active: 'Actif',
      completed: 'Terminé',
      suspended: 'Suspendu',
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const getAvenantTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      ajout: 'bg-green-100 text-green-700',
      retrait: 'bg-red-100 text-red-700',
      modification: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      ajout: 'Ajout',
      retrait: 'Retrait',
      modification: 'Modification',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[type]}`}>{labels[type]}</span>;
  };

  const currentContrat = contrats.find(c => c.id === selectedContrat);
  const contratAvenants = avenants.filter(a => a.contratId === selectedContrat);

  const stats = {
    contratsActifs: contrats.filter(c => c.status === 'active').length,
    montantTotal: contrats.filter(c => c.status === 'active').reduce((sum, c) => sum + c.montantActuel, 0),
    avenantsEnAttente: avenants.filter(a => a.status === 'pending').length,
    variationTotale: contrats.reduce((sum, c) => sum + (c.montantActuel - c.montantOriginal), 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Contrats & Avenants
          </h1>
          <p className="text-gray-600">Gestion des contrats et ordres de changement</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
          <button 
            onClick={() => activeTab === 'contrats' ? setShowNewContrat(true) : setShowNewAvenant(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            {activeTab === 'contrats' ? 'Nouveau contrat' : 'Nouvel avenant'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Contrats actifs</p>
          <p className="text-2xl font-bold">{stats.contratsActifs}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-green-600">{(stats.montantTotal / 1000000).toFixed(1)}M$</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Avenants en attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.avenantsEnAttente}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Variation totale</p>
          <p className={`text-2xl font-bold ${stats.variationTotale >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.variationTotale >= 0 ? '+' : ''}{(stats.variationTotale / 1000).toFixed(0)}K$
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('contrats')}
            className={`px-6 py-4 font-medium border-b-2 -mb-px ${
              activeTab === 'contrats' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Contrats ({contrats.length})
          </button>
          <button
            onClick={() => setActiveTab('avenants')}
            className={`px-6 py-4 font-medium border-b-2 -mb-px ${
              activeTab === 'avenants' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
          >
            Avenants ({avenants.length})
            {stats.avenantsEnAttente > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                {stats.avenantsEnAttente}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {activeTab === 'contrats' ? (
            <div className="divide-y">
              {contrats.map((contrat) => (
                <div 
                  key={contrat.id}
                  onClick={() => setSelectedContrat(contrat.id)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedContrat === contrat.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-blue-600">{contrat.numero}</span>
                        {getTypeBadge(contrat.type)}
                        {getStatusBadge(contrat.status)}
                      </div>
                      <h4 className="font-medium">{contrat.titre}</h4>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{(contrat.montantActuel / 1000000).toFixed(2)}M$</p>
                      {contrat.montantActuel !== contrat.montantOriginal && (
                        <p className={`text-sm ${contrat.montantActuel > contrat.montantOriginal ? 'text-green-600' : 'text-red-600'}`}>
                          {contrat.montantActuel > contrat.montantOriginal ? '+' : ''}
                          {((contrat.montantActuel - contrat.montantOriginal) / 1000).toFixed(0)}K$
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} />
                      {contrat.client}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {contrat.dateDebut} → {contrat.dateFin}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {contrat.avenants} avenants
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {avenants.map((avenant) => {
                const contrat = contrats.find(c => c.id === avenant.contratId);
                return (
                  <div key={avenant.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-blue-600">{avenant.numero}</span>
                          {getAvenantTypeBadge(avenant.type)}
                          {getStatusBadge(avenant.status)}
                        </div>
                        <h4 className="font-medium">{avenant.titre}</h4>
                        <p className="text-sm text-gray-500">{contrat?.titre}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${avenant.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {avenant.montant >= 0 ? '+' : ''}{(avenant.montant / 1000).toFixed(0)}K$
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {avenant.dateCreation}
                      </span>
                      <span>Par {avenant.creePar}</span>
                      {avenant.status === 'pending' && (
                        <div className="ml-auto flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                            Approuver
                          </button>
                          <button className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200">
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Détail contrat */}
        <div className="space-y-4">
          {currentContrat ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-sm text-blue-600">{currentContrat.numero}</span>
                    <h3 className="font-semibold text-lg mt-1">{currentContrat.titre}</h3>
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
                    <div className="mt-1">{getStatusBadge(currentContrat.status)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <div className="mt-1">{getTypeBadge(currentContrat.type)}</div>
                  </div>
                  <div>
                    <p className="text-gray-500">Client</p>
                    <p className="font-medium">{currentContrat.client}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Projet</p>
                    <p className="font-medium">{currentContrat.projet}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant original</span>
                    <span className="font-medium">{(currentContrat.montantOriginal / 1000000).toFixed(2)}M$</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avenants ({currentContrat.avenants})</span>
                    <span className={`font-medium ${currentContrat.montantActuel - currentContrat.montantOriginal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentContrat.montantActuel - currentContrat.montantOriginal >= 0 ? '+' : ''}
                      {((currentContrat.montantActuel - currentContrat.montantOriginal) / 1000).toFixed(0)}K$
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Montant actuel</span>
                    <span className="text-green-600">{(currentContrat.montantActuel / 1000000).toFixed(2)}M$</span>
                  </div>
                </div>
              </div>

              {/* Historique avenants */}
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <History size={18} className="text-blue-600" />
                  Historique des avenants
                </h4>
                {contratAvenants.length > 0 ? (
                  <div className="space-y-3">
                    {contratAvenants.map((av) => (
                      <div key={av.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{av.titre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{av.numero}</span>
                            {getStatusBadge(av.status)}
                          </div>
                        </div>
                        <span className={`font-medium ${av.montant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {av.montant >= 0 ? '+' : ''}{(av.montant / 1000).toFixed(0)}K$
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucun avenant</p>
                )}
                <button 
                  onClick={() => setShowNewAvenant(true)}
                  className="w-full mt-4 py-2 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter un avenant
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p>Sélectionnez un contrat</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouveau Contrat */}
      {showNewContrat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouveau contrat</h2>
              <button onClick={() => setShowNewContrat(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du contrat</label>
                <input type="text" placeholder="Ex: Construction Phase 2" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner...</option>
                    <option>Deloitte Canada</option>
                    <option>Groupe CH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner...</option>
                    <option>Tour Deloitte</option>
                    <option>Centre Bell</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="forfait">Forfaitaire</option>
                    <option value="prix_unitaire">Prix unitaire</option>
                    <option value="cout_majore">Coût majoré</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-2 border rounded-lg" />
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
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowNewContrat(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer contrat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvel Avenant */}
      {showNewAvenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouvel avenant</h2>
              <button onClick={() => setShowNewAvenant(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrat</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>Sélectionner un contrat...</option>
                  {contrats.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.numero} - {c.titre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'avenant</label>
                <input type="text" placeholder="Ex: Ajout système de climatisation" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="ajout">Ajout de travaux</option>
                    <option value="retrait">Retrait de travaux</option>
                    <option value="modification">Modification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (+/-)</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea rows={4} placeholder="Décrivez la raison de cet avenant..." className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowNewAvenant(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Soumettre avenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratsModule;
