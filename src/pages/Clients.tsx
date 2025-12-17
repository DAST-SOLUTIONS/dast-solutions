/**
 * DAST Solutions - Page Clients CRM
 */
import { useState } from 'react'
import { useClients, Client, CLIENT_CATEGORIES, CLIENT_SOURCES } from '@/hooks/useClients'
import {
  Users, Plus, Search, Edit, Trash2, X, Building2, User,
  Phone, Mail, MapPin, DollarSign, FileText, Calendar,
  Filter, Download, Upload, MoreVertical, Check
} from 'lucide-react'

export default function ClientsPage() {
  const { clients, loading, createClient, updateClient, deleteClient, getStats, searchClients } = useClients()
  
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  // Form state
  const [form, setForm] = useState({
    type: 'entreprise' as 'particulier' | 'entreprise',
    name: '',
    company: '',
    contact_name: '',
    contact_title: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    province: 'QC',
    postal_code: '',
    credit_limit: '',
    payment_terms: '30',
    tax_exempt: false,
    category: '',
    source: '',
    notes: '',
    status: 'actif' as 'actif' | 'inactif' | 'prospect'
  })

  const stats = getStats()

  const filteredClients = clients.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matches = c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      if (!matches) return false
    }
    if (filterStatus && c.status !== filterStatus) return false
    if (filterCategory && c.category !== filterCategory) return false
    return true
  })

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setForm({
        type: client.type,
        name: client.name,
        company: client.company || '',
        contact_name: client.contact_name || '',
        contact_title: client.contact_title || '',
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        address: client.address || '',
        city: client.city || '',
        province: client.province,
        postal_code: client.postal_code || '',
        credit_limit: client.credit_limit?.toString() || '',
        payment_terms: client.payment_terms.toString(),
        tax_exempt: client.tax_exempt,
        category: client.category || '',
        source: client.source || '',
        notes: client.notes || '',
        status: client.status
      })
    } else {
      setEditingClient(null)
      setForm({
        type: 'entreprise',
        name: '',
        company: '',
        contact_name: '',
        contact_title: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        province: 'QC',
        postal_code: '',
        credit_limit: '',
        payment_terms: '30',
        tax_exempt: false,
        category: '',
        source: '',
        notes: '',
        status: 'actif'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const clientData = {
      ...form,
      credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : undefined,
      payment_terms: parseInt(form.payment_terms)
    }

    if (editingClient) {
      await updateClient(editingClient.id, clientData)
    } else {
      await createClient(clientData)
    }
    
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce client?')) {
      await deleteClient(id)
    }
  }

  const exportCSV = () => {
    const headers = ['Nom', 'Entreprise', 'Email', 'Téléphone', 'Ville', 'Statut', 'Catégorie']
    const rows = clients.map(c => [
      c.name, c.company || '', c.email || '', c.phone || '', c.city || '', c.status, c.category || ''
    ])
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clients.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Gestion de la relation client</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-secondary">
            <Download size={16} className="mr-1" /> Exporter
          </button>
          <button onClick={() => openModal()} className="btn btn-primary">
            <Plus size={16} className="mr-1" /> Nouveau client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.actifs}</p>
              <p className="text-sm text-gray-500">Clients actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <User className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.prospects}</p>
              <p className="text-sm text-gray-500">Prospects</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <DollarSign className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.totalRevenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-500">Revenus totaux</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="prospect">Prospect</option>
            <option value="inactif">Inactif</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Toutes catégories</option>
            {CLIENT_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ville</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Catégorie</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Revenus</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Chargement...</td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Aucun client trouvé</td>
              </tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        client.type === 'entreprise' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {client.type === 'entreprise' ? (
                          <Building2 size={18} className="text-blue-600" />
                        ) : (
                          <User size={18} className="text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        {client.company && <p className="text-sm text-gray-500">{client.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {client.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail size={14} /> {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone size={14} /> {client.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{client.city || '-'}</td>
                  <td className="px-4 py-3">
                    {client.category ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {CLIENT_CATEGORIES.find(c => c.value === client.category)?.label || client.category}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      client.status === 'actif' ? 'bg-green-100 text-green-700' :
                      client.status === 'prospect' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {client.total_revenue > 0 ? client.total_revenue.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openModal(client)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:bg-red-50 rounded">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-lg font-bold">
                {editingClient ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.type === 'entreprise'}
                    onChange={() => setForm({ ...form, type: 'entreprise' })}
                  />
                  <Building2 size={16} /> Entreprise
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.type === 'particulier'}
                    onChange={() => setForm({ ...form, type: 'particulier' })}
                  />
                  <User size={16} /> Particulier
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                {form.type === 'entreprise' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Entreprise</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Personne contact</label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Titre</label>
                  <input
                    type="text"
                    value={form.contact_title}
                    onChange={(e) => setForm({ ...form, contact_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code postal</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {CLIENT_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    {CLIENT_SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Limite crédit</label>
                  <input
                    type="number"
                    value={form.credit_limit}
                    onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Termes (jours)</label>
                  <input
                    type="number"
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="actif">Actif</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="tax_exempt"
                    checked={form.tax_exempt}
                    onChange={(e) => setForm({ ...form, tax_exempt: e.target.checked })}
                  />
                  <label htmlFor="tax_exempt">Exempté de taxes</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg">
                  {editingClient ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
