/**
 * DAST Solutions - Page Factures
 * Gestion complète des factures et paiements
 */
import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { 
  useFactures, 
  Facture, 
  FACTURE_STATUS_LABELS, 
  FACTURE_STATUS_COLORS,
  PAYMENT_METHODS,
  calculateFactureTotals
} from '@/hooks/useFactures'
import { useSoumissions } from '@/hooks/useSoumissions'
import {
  Plus, FileText, Download, Send, Eye, Trash2, X, Check,
  Building, User, Phone, Mail, Calendar, DollarSign, 
  CreditCard, Clock, AlertCircle, CheckCircle, Loader2,
  ChevronDown, Filter, Search, Receipt
} from 'lucide-react'

// Badge de statut
const StatusBadge = ({ status }: { status: Facture['status'] }) => (
  <span 
    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
    style={{ 
      backgroundColor: `${FACTURE_STATUS_COLORS[status]}20`,
      color: FACTURE_STATUS_COLORS[status]
    }}
  >
    {status === 'payee' && <CheckCircle size={12} />}
    {status === 'en_retard' && <AlertCircle size={12} />}
    {status === 'partielle' && <Clock size={12} />}
    {FACTURE_STATUS_LABELS[status]}
  </span>
)

// Modal création facture
function CreateFactureModal({ 
  isOpen, 
  onClose, 
  onCreated 
}: { 
  isOpen: boolean
  onClose: () => void
  onCreated: () => void 
}) {
  const { createFacture, createFromSoumission } = useFactures()
  const { soumissions } = useSoumissions()
  
  const [mode, setMode] = useState<'new' | 'from_soumission'>('new')
  const [selectedSoumission, setSelectedSoumission] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Données client
  const [client, setClient] = useState({
    name: '',
    company: '',
    address: '',
    city: '',
    province: 'QC',
    postal_code: '',
    phone: '',
    email: ''
  })
  
  // Items
  const [items, setItems] = useState<Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
  }>>([{ description: '', quantity: 1, unit: 'unité', unit_price: 0 }])

  const [dateEcheance, setDateEcheance] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  if (!isOpen) return null

  const acceptedSoumissions = soumissions.filter(s => s.status === 'acceptee')

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (mode === 'from_soumission' && selectedSoumission) {
        await createFromSoumission(selectedSoumission)
      } else {
        const validItems = items.filter(i => i.description && i.unit_price > 0)
        if (validItems.length === 0 || !client.name) {
          alert('Veuillez remplir le nom du client et au moins un item')
          return
        }
        
        await createFacture({
          client,
          items: validItems.map(i => ({
            ...i,
            total_price: i.quantity * i.unit_price
          })),
          date_echeance: dateEcheance
        })
      }
      onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'unité', unit_price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const totals = calculateFactureTotals(items.map(i => ({
    ...i,
    total_price: i.quantity * i.unit_price
  })))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Nouvelle facture</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Mode sélection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                mode === 'new' 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="mx-auto mb-2 text-teal-600" size={24} />
              <p className="font-medium">Nouvelle facture</p>
              <p className="text-xs text-gray-500">Créer manuellement</p>
            </button>
            <button
              onClick={() => setMode('from_soumission')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                mode === 'from_soumission' 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Receipt className="mx-auto mb-2 text-teal-600" size={24} />
              <p className="font-medium">Depuis soumission</p>
              <p className="text-xs text-gray-500">{acceptedSoumissions.length} acceptée(s)</p>
            </button>
          </div>

          {mode === 'from_soumission' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner une soumission acceptée
              </label>
              <select
                value={selectedSoumission}
                onChange={(e) => setSelectedSoumission(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choisir --</option>
                {acceptedSoumissions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.soumission_number} - {s.client_name} ({s.total?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })})
                  </option>
                ))}
              </select>
              {acceptedSoumissions.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  Aucune soumission acceptée. Créez une facture manuellement.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Client */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={18} /> Client
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={client.name}
                      onChange={(e) => setClient({...client, name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={client.company}
                      onChange={(e) => setClient({...client, company: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={client.phone}
                      onChange={(e) => setClient({...client, phone: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courriel</label>
                    <input
                      type="email"
                      value={client.email}
                      onChange={(e) => setClient({...client, email: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={18} /> Items
                </h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="input-field flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Qté"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="input-field w-20"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="text"
                        placeholder="Unité"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="input-field w-20"
                      />
                      <input
                        type="number"
                        placeholder="Prix"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="input-field w-28"
                        min="0"
                        step="0.01"
                      />
                      <span className="py-2 px-2 text-gray-700 font-medium w-28 text-right">
                        {(item.quantity * item.unit_price).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </span>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        disabled={items.length === 1}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addItem}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Ajouter un item
                  </button>
                </div>

                {/* Totaux */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total:</span>
                    <span>{totals.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TPS (5%):</span>
                    <span>{totals.tps_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVQ (9.975%):</span>
                    <span>{totals.tvq_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-teal-600">{totals.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                </div>
              </div>

              {/* Date échéance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={16} className="inline mr-1" /> Date d'échéance
                </label>
                <input
                  type="date"
                  value={dateEcheance}
                  onChange={(e) => setDateEcheance(e.target.value)}
                  className="input-field w-48"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || (mode === 'from_soumission' && !selectedSoumission)}
            className="btn btn-primary"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Plus size={18} className="mr-2" />}
            Créer la facture
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal paiement
function AddPaiementModal({
  isOpen,
  facture,
  onClose,
  onAdded
}: {
  isOpen: boolean
  facture: Facture | null
  onClose: () => void
  onAdded: () => void
}) {
  const { addPaiement } = useFactures()
  const [montant, setMontant] = useState('')
  const [methode, setMethode] = useState<'virement' | 'cheque' | 'comptant' | 'carte' | 'autre'>('virement')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !facture) return null

  const handleSubmit = async () => {
    const montantNum = parseFloat(montant)
    if (!montantNum || montantNum <= 0) {
      alert('Montant invalide')
      return
    }

    setLoading(true)
    try {
      await addPaiement(facture.id, {
        montant: montantNum,
        methode,
        reference
      })
      onAdded()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Enregistrer un paiement</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Facture: <strong>{facture.facture_number}</strong></p>
            <p className="text-sm text-gray-600">Solde dû: <strong className="text-red-600">{facture.balance_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</strong></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder={facture.balance_due.toString()}
              className="input-field"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
            <select
              value={methode}
              onChange={(e) => setMethode(e.target.value as any)}
              className="input-field"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° chèque, confirmation, etc."
              className="input-field"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check size={18} className="mr-2" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// Page principale
export default function FacturesPage() {
  const { factures, loading, getStats, updateStatus, deleteFacture, refetch } = useFactures()
  const [showCreate, setShowCreate] = useState(false)
  const [paiementModal, setPaiementModal] = useState<Facture | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const stats = getStats()

  const filteredFactures = factures.filter(f => {
    if (filter !== 'all' && f.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return f.facture_number.toLowerCase().includes(s) ||
             f.client_name.toLowerCase().includes(s)
    }
    return true
  })

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette facture?')) {
      await deleteFacture(id)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="Factures" 
        subtitle="Gestion des factures et paiements" 
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total facturé</p>
              <p className="text-xl font-bold">{stats.totalFacture.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Encaissé</p>
              <p className="text-xl font-bold text-green-600">{stats.totalPaye.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">À recevoir</p>
              <p className="text-xl font-bold text-amber-600">{stats.totalDu.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-xl font-bold text-red-600">{stats.enRetard}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="envoyee">Envoyée</option>
            <option value="partielle">Paiement partiel</option>
            <option value="payee">Payée</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={18} className="mr-2" /> Nouvelle facture
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : filteredFactures.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Receipt size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune facture</h3>
          <p className="text-gray-600 mb-6">Créez votre première facture ou importez depuis une soumission acceptée.</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus size={18} className="mr-2" /> Créer une facture
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Numéro</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Solde</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Statut</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredFactures.map(facture => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{facture.facture_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{facture.client_name}</p>
                    {facture.client_company && (
                      <p className="text-sm text-gray-500">{facture.client_company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(facture.date_facture).toLocaleDateString('fr-CA')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {facture.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={facture.balance_due > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {facture.balance_due.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={facture.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {facture.balance_due > 0 && facture.status !== 'annulee' && (
                        <button
                          onClick={() => setPaiementModal(facture)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Ajouter paiement"
                        >
                          <CreditCard size={18} />
                        </button>
                      )}
                      {facture.status === 'brouillon' && (
                        <button
                          onClick={() => updateStatus(facture.id, 'envoyee')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Marquer envoyée"
                        >
                          <Send size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(facture.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateFactureModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetch}
      />
      <AddPaiementModal
        isOpen={!!paiementModal}
        facture={paiementModal}
        onClose={() => setPaiementModal(null)}
        onAdded={refetch}
      />
    </div>
  )
}
