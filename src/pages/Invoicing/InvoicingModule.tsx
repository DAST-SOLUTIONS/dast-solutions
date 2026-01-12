import React, { useState } from 'react';
import { 
  FileText, DollarSign, Plus, Search, Filter, Download, Send,
  CheckCircle, Clock, AlertTriangle, Eye, Edit2, Trash2, Printer,
  CreditCard, TrendingUp, Calendar, X
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  client: string;
  project: string;
  date: string;
  dueDate: string;
  subtotal: number;
  taxes: number;
  total: number;
  paid: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial';
}

const InvoicingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'reports'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [invoices] = useState<Invoice[]>([
    { id: '1', number: 'FACT-2026-001', client: 'Immeubles ABC', project: 'Tour Deloitte', date: '2026-01-05', dueDate: '2026-02-04', subtotal: 125000, taxes: 18687.50, total: 143687.50, paid: 143687.50, status: 'paid' },
    { id: '2', number: 'FACT-2026-002', client: 'Tech Montréal', project: 'Agrandissement Bureau', date: '2026-01-08', dueDate: '2026-02-07', subtotal: 45000, taxes: 6727.50, total: 51727.50, paid: 0, status: 'sent' },
    { id: '3', number: 'FACT-2026-003', client: 'Logistique XYZ', project: 'Construction Entrepôt', date: '2026-01-10', dueDate: '2026-02-09', subtotal: 280000, taxes: 41860, total: 321860, paid: 160930, status: 'partial' },
    { id: '4', number: 'FACT-2025-089', client: 'Centre Commercial', project: 'Réfection Parking', date: '2025-12-15', dueDate: '2026-01-14', subtotal: 68000, taxes: 10166, total: 78166, paid: 0, status: 'overdue' },
    { id: '5', number: 'FACT-2026-004', client: 'Banque Nationale', project: 'Nouvelle Succursale', date: '2026-01-11', dueDate: '2026-02-10', subtotal: 95000, taxes: 14202.50, total: 109202.50, paid: 0, status: 'draft' },
  ]);

  const stats = {
    totalInvoiced: invoices.reduce((sum, i) => sum + i.total, 0),
    totalPaid: invoices.reduce((sum, i) => sum + i.paid, 0),
    outstanding: invoices.reduce((sum, i) => sum + (i.total - i.paid), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0),
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FileText },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
      partial: 'Partiel',
      overdue: 'En retard',
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon size={12} />
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
            Facturation
          </h1>
          <p className="text-gray-600">Factures, paiements et comptes recevables</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
            <Download size={18} />
            Exporter
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total facturé</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalInvoiced)}</p>
            </div>
            <FileText className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total payé</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">À recevoir</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.outstanding)}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {[
              { id: 'invoices', label: 'Factures', icon: FileText },
              { id: 'payments', label: 'Paiements', icon: CreditCard },
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
          {/* Search & Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select className="border rounded-lg px-4 py-2">
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Filter size={18} />
              Plus de filtres
            </button>
          </div>

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Numéro</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Projet</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Échéance</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Total</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Payé</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Statut</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium text-blue-600">{invoice.number}</td>
                    <td className="p-3">{invoice.client}</td>
                    <td className="p-3 text-gray-600">{invoice.project}</td>
                    <td className="p-3 text-gray-600">{invoice.date}</td>
                    <td className="p-3 text-gray-600">{invoice.dueDate}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(invoice.total)}</td>
                    <td className="p-3 text-right text-green-600">{formatCurrency(invoice.paid)}</td>
                    <td className="p-3 text-center">{getStatusBadge(invoice.status)}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Voir">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Imprimer">
                          <Printer size={16} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Envoyer">
                            <Send size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus size={18} />
                  Enregistrer paiement
                </button>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Facture</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Client</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Méthode</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-500">Référence</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-500">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="p-3">2026-01-10</td>
                    <td className="p-3 text-blue-600">FACT-2026-001</td>
                    <td className="p-3">Immeubles ABC</td>
                    <td className="p-3">Virement</td>
                    <td className="p-3 text-gray-600">VIR-2026-0045</td>
                    <td className="p-3 text-right font-medium text-green-600">{formatCurrency(143687.50)}</td>
                  </tr>
                  <tr className="border-t hover:bg-gray-50">
                    <td className="p-3">2026-01-08</td>
                    <td className="p-3 text-blue-600">FACT-2026-003</td>
                    <td className="p-3">Logistique XYZ</td>
                    <td className="p-3">Chèque</td>
                    <td className="p-3 text-gray-600">CHQ-78542</td>
                    <td className="p-3 text-right font-medium text-green-600">{formatCurrency(160930)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Revenus par mois</h4>
                <div className="h-48 flex items-end gap-2">
                  {[65, 80, 45, 90, 70, 85].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-xs mt-1 text-gray-500">
                        {['Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Jan'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Répartition par statut</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Payées
                    </span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Envoyées
                    </span>
                    <span className="font-medium">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      En retard
                    </span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      Brouillons
                    </span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle facture</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Sélectionner...</option>
                    <option>Immeubles ABC</option>
                    <option>Tech Montréal</option>
                    <option>Logistique XYZ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Projet</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Sélectionner...</option>
                    <option>Tour Deloitte</option>
                    <option>Agrandissement Bureau</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de facture</label>
                  <input type="date" className="w-full border rounded-lg p-2" defaultValue="2026-01-11" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Termes de paiement</label>
                  <select className="w-full border rounded-lg p-2">
                    <option>Net 30</option>
                    <option>Net 15</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lignes de facture</label>
                <table className="w-full border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 text-sm">Description</th>
                      <th className="text-right p-2 text-sm w-20">Qté</th>
                      <th className="text-right p-2 text-sm w-24">Prix unit.</th>
                      <th className="text-right p-2 text-sm w-24">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2">
                        <input type="text" className="w-full border rounded p-1" placeholder="Description..." />
                      </td>
                      <td className="p-2">
                        <input type="number" className="w-full border rounded p-1 text-right" defaultValue="1" />
                      </td>
                      <td className="p-2">
                        <input type="number" className="w-full border rounded p-1 text-right" placeholder="0.00" />
                      </td>
                      <td className="p-2 text-right">0.00 $</td>
                      <td className="p-2">
                        <button className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button className="mt-2 text-sm text-blue-600 hover:underline">+ Ajouter une ligne</button>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>0.00 $</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>TPS (5%)</span>
                      <span>0.00 $</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>TVQ (9.975%)</span>
                      <span>0.00 $</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>0.00 $</span>
                    </div>
                  </div>
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
                Créer et envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicingModule;
