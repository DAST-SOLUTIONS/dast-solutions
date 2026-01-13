import React, { useState } from 'react';
import { 
  ShoppingCart, Plus, Search, Filter, Download, Send, Check, X,
  Clock, Truck, Package, AlertTriangle, FileText, Building2,
  Calendar, DollarSign, Eye, Edit, MoreVertical, CheckCircle,
  XCircle, ArrowRight, RefreshCw, MapPin
} from 'lucide-react';

interface BonCommande {
  id: string;
  numero: string;
  fournisseur: string;
  projet: string;
  date: string;
  dateLivraison: string;
  montant: number;
  status: 'brouillon' | 'en_attente' | 'approuve' | 'commande' | 'expedie' | 'livre' | 'partiel' | 'annule';
  items: number;
  urgent: boolean;
}

interface WorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  user?: string;
}

const BonsCommandeModule: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBC, setSelectedBC] = useState<string | null>(null);
  const [showNewBC, setShowNewBC] = useState(false);

  const [bonsCommande] = useState<BonCommande[]>([
    { id: '1', numero: 'BC-2026-0042', fournisseur: 'Béton Québec', projet: 'Tour Deloitte', date: '2026-01-10', dateLivraison: '2026-01-15', montant: 45000, status: 'approuve', items: 5, urgent: false },
    { id: '2', numero: 'BC-2026-0041', fournisseur: 'Acier MTL', projet: 'Tour Deloitte', date: '2026-01-09', dateLivraison: '2026-01-20', montant: 128500, status: 'en_attente', items: 12, urgent: true },
    { id: '3', numero: 'BC-2026-0040', fournisseur: 'Électro Plus', projet: 'Centre Bell', date: '2026-01-08', dateLivraison: '2026-01-12', montant: 32000, status: 'expedie', items: 8, urgent: false },
    { id: '4', numero: 'BC-2026-0039', fournisseur: 'Plomberie Pro', projet: 'Tour Deloitte', date: '2026-01-07', dateLivraison: '2026-01-10', montant: 18500, status: 'livre', items: 4, urgent: false },
    { id: '5', numero: 'BC-2026-0038', fournisseur: 'Bois Select', projet: 'Résidence Soleil', date: '2026-01-05', dateLivraison: '2026-01-11', montant: 24000, status: 'partiel', items: 6, urgent: true },
    { id: '6', numero: 'BC-2026-0037', fournisseur: 'Isolation Experts', projet: 'Centre Bell', date: '2026-01-03', dateLivraison: '2026-01-08', montant: 15000, status: 'livre', items: 3, urgent: false },
  ]);

  const [workflowSteps] = useState<WorkflowStep[]>([
    { id: '1', label: 'Création', status: 'completed', date: '2026-01-10', user: 'Jean T.' },
    { id: '2', label: 'Approbation Chef', status: 'completed', date: '2026-01-10', user: 'Marie D.' },
    { id: '3', label: 'Approbation Direction', status: 'current' },
    { id: '4', label: 'Envoi fournisseur', status: 'pending' },
    { id: '5', label: 'Confirmation', status: 'pending' },
  ]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      brouillon: 'bg-gray-100 text-gray-600',
      en_attente: 'bg-yellow-100 text-yellow-700',
      approuve: 'bg-green-100 text-green-700',
      commande: 'bg-blue-100 text-blue-700',
      expedie: 'bg-purple-100 text-purple-700',
      livre: 'bg-green-100 text-green-700',
      partiel: 'bg-orange-100 text-orange-700',
      annule: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      brouillon: 'Brouillon',
      en_attente: 'En attente',
      approuve: 'Approuvé',
      commande: 'Commandé',
      expedie: 'Expédié',
      livre: 'Livré',
      partiel: 'Livraison partielle',
      annule: 'Annulé',
    };
    return <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>{labels[status]}</span>;
  };

  const filteredBC = bonsCommande.filter(bc => {
    const matchSearch = bc.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       bc.fournisseur.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       bc.projet.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || bc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: bonsCommande.length,
    enAttente: bonsCommande.filter(bc => bc.status === 'en_attente').length,
    enCours: bonsCommande.filter(bc => ['approuve', 'commande', 'expedie'].includes(bc.status)).length,
    montantTotal: bonsCommande.reduce((sum, bc) => sum + bc.montant, 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            Bons de Commande
          </h1>
          <p className="text-gray-600">Gestion des achats avec workflow d'approbation</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
          <button 
            onClick={() => setShowNewBC(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouveau BC
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total BC</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">En attente d'approbation</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">En cours</p>
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Montant total</p>
          <p className="text-2xl font-bold text-green-600">{(stats.montantTotal / 1000).toFixed(0)}K$</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des BC */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border">
          {/* Filters */}
          <div className="p-4 border-b flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher par numéro, fournisseur, projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="en_attente">En attente</option>
              <option value="approuve">Approuvé</option>
              <option value="commande">Commandé</option>
              <option value="expedie">Expédié</option>
              <option value="livre">Livré</option>
              <option value="partiel">Livraison partielle</option>
            </select>
          </div>

          {/* Table */}
          <div className="divide-y">
            {filteredBC.map((bc) => (
              <div 
                key={bc.id}
                onClick={() => setSelectedBC(bc.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedBC === bc.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-blue-600">{bc.numero}</span>
                    {bc.urgent && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">URGENT</span>
                    )}
                    {getStatusBadge(bc.status)}
                  </div>
                  <span className="font-bold">{bc.montant.toLocaleString()}$</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} />
                      {bc.fournisseur}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {bc.projet}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={14} />
                      {bc.items} items
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {bc.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck size={14} />
                      Livraison: {bc.dateLivraison}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Workflow d'approbation */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-blue-600" />
              Workflow d'approbation
            </h3>
            <div className="space-y-4">
              {workflowSteps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'current' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {step.status === 'completed' ? (
                      <Check size={16} className="text-green-600" />
                    ) : step.status === 'current' ? (
                      <Clock size={16} className="text-blue-600" />
                    ) : (
                      <span className="text-gray-400 text-sm">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.status === 'pending' ? 'text-gray-400' : ''}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-sm text-gray-500">{step.date} par {step.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 text-left">
                <Check size={18} className="text-green-600" />
                <span>Approuver sélection</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 text-left">
                <Send size={18} className="text-blue-600" />
                <span>Envoyer au fournisseur</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 text-left">
                <Truck size={18} className="text-purple-600" />
                <span>Confirmer réception</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 text-left">
                <FileText size={18} className="text-gray-600" />
                <span>Générer PDF</span>
              </button>
            </div>
          </div>

          {/* Livraisons à venir */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Truck size={18} className="text-orange-600" />
              Livraisons à venir
            </h3>
            <div className="space-y-3">
              {bonsCommande
                .filter(bc => ['approuve', 'commande', 'expedie'].includes(bc.status))
                .slice(0, 3)
                .map(bc => (
                  <div key={bc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{bc.fournisseur}</p>
                      <p className="text-xs text-gray-500">{bc.numero}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{bc.dateLivraison}</p>
                      {getStatusBadge(bc.status)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nouveau BC */}
      {showNewBC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Nouveau bon de commande</h2>
              <button onClick={() => setShowNewBC(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner un fournisseur...</option>
                    <option>Béton Québec</option>
                    <option>Acier MTL</option>
                    <option>Électro Plus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Sélectionner un projet...</option>
                    <option>Tour Deloitte</option>
                    <option>Centre Bell</option>
                    <option>Résidence Soleil</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison souhaitée</label>
                  <input type="date" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option>Normale</option>
                    <option>Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
                <input type="text" placeholder="Adresse du chantier" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} placeholder="Instructions spéciales..." className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button 
                onClick={() => setShowNewBC(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Sauvegarder brouillon
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer et soumettre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonsCommandeModule;
