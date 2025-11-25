import { useState } from 'react'
import { PageTitle } from '@/components/PageTitle'
import { useEntrepreneurs } from '@/hooks/useEntrepreneurs'
import { 
  Plus, Search, Building, User, Phone, Mail, MapPin, 
  Edit2, Trash2, X, Check, Star, Shield, FileText,
  Filter, Download, Upload, ExternalLink
} from 'lucide-react'
import type { 
  Entrepreneur, 
  CreateEntrepreneurParams, 
  SpecialiteCode,
  EntrepreneurStatus 
} from '@/types/entrepreneur-types'
import { 
  SPECIALITES, 
  ENTREPRENEUR_STATUS_LABELS,
  formatRBQLicense,
  isValidRBQLicense,
  getSpecialiteName 
} from '@/types/entrepreneur-types'

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

const StatusBadge = ({ status }: { status: EntrepreneurStatus }) => {
  const colors: Record<EntrepreneurStatus, string> = {
    actif: 'bg-green-100 text-green-700',
    inactif: 'bg-gray-100 text-gray-700',
    bloque: 'bg-red-100 text-red-700'
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {ENTREPRENEUR_STATUS_LABELS[status]}
    </span>
  )
}

const RBQBadge = ({ license, status }: { license?: string; status?: string }) => {
  if (!license) return null
  
  const statusColors: Record<string, string> = {
    valide: 'bg-green-100 text-green-700 border-green-300',
    invalide: 'bg-red-100 text-red-700 border-red-300',
    suspendu: 'bg-orange-100 text-orange-700 border-orange-300',
    inconnu: 'bg-gray-100 text-gray-600 border-gray-300'
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono ${statusColors[status || 'inconnu']}`}>
      <Shield size={12} />
      {formatRBQLicense(license)}
    </span>
  )
}

const RatingStars = ({ rating }: { rating?: number }) => {
  if (!rating) return <span className="text-gray-400 text-sm">Non évalué</span>
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          size={14} 
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} 
        />
      ))}
    </div>
  )
}

// ============================================================================
// MODAL CRÉATION/ÉDITION
// ============================================================================

function EntrepreneurModal({
  isOpen,
  onClose,
  onSave,
  entrepreneur
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateEntrepreneurParams) => Promise<void>
  entrepreneur?: Entrepreneur | null
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateEntrepreneurParams>({
    company_name: entrepreneur?.company_name || '',
    contact_name: entrepreneur?.contact_name || '',
    email: entrepreneur?.email || '',
    phone: entrepreneur?.phone || '',
    cell: entrepreneur?.cell || '',
    address: entrepreneur?.address || '',
    city: entrepreneur?.city || '',
    province: entrepreneur?.province || 'QC',
    postal_code: entrepreneur?.postal_code || '',
    rbq_license: entrepreneur?.rbq_license || '',
    specialites: entrepreneur?.specialites || [],
    notes: entrepreneur?.notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.company_name.trim()) {
      alert('Le nom de l\'entreprise est requis')
      return
    }

    // Valider le format RBQ si fourni
    if (form.rbq_license && !isValidRBQLicense(form.rbq_license)) {
      alert('Le format du numéro RBQ est invalide (10 chiffres requis)')
      return
    }

    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const toggleSpecialite = (code: SpecialiteCode) => {
    setForm(prev => ({
      ...prev,
      specialites: prev.specialites?.includes(code)
        ? prev.specialites.filter(s => s !== code)
        : [...(prev.specialites || []), code]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {entrepreneur ? 'Modifier l\'entrepreneur' : 'Nouvel entrepreneur'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-teal-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Informations de base */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Building size={18} /> Informations de l'entreprise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => setForm({...form, company_name: e.target.value})}
                    placeholder="Ex: Plomberie ABC Inc."
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personne contact
                  </label>
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => setForm({...form, contact_name: e.target.value})}
                    placeholder="Ex: Jean Tremblay"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Licence RBQ
                  </label>
                  <input
                    type="text"
                    value={form.rbq_license}
                    onChange={(e) => setForm({...form, rbq_license: e.target.value})}
                    placeholder="XXXX-XXXX-XX"
                    maxLength={12}
                    className="input-field font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Phone size={18} /> Coordonnées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Courriel
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="contact@entreprise.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="514-555-1234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cellulaire
                  </label>
                  <input
                    type="tel"
                    value={form.cell}
                    onChange={(e) => setForm({...form, cell: e.target.value})}
                    placeholder="514-555-5678"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} /> Adresse
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    placeholder="123 Rue Principale"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({...form, city: e.target.value})}
                    placeholder="Montréal"
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => setForm({...form, province: e.target.value})}
                      className="input-field"
                    >
                      <option value="QC">Québec</option>
                      <option value="ON">Ontario</option>
                      <option value="NB">Nouveau-Brunswick</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => setForm({...form, postal_code: e.target.value.toUpperCase()})}
                      placeholder="H2X 1Y4"
                      maxLength={7}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Spécialités */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Spécialités</h3>
              <div className="flex flex-wrap gap-2">
                {SPECIALITES.map(spec => (
                  <button
                    key={spec.code}
                    type="button"
                    onClick={() => toggleSpecialite(spec.code)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      form.specialites?.includes(spec.code)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {spec.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes internes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="Notes personnelles sur cet entrepreneur..."
                rows={3}
                className="input-field"
              />
            </div>
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
            {loading ? 'Enregistrement...' : (entrepreneur ? 'Mettre à jour' : 'Créer')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL DÉTAILS
// ============================================================================

function EntrepreneurDetailModal({
  entrepreneur,
  onClose,
  onEdit,
  onDelete
}: {
  entrepreneur: Entrepreneur | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  if (!entrepreneur) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{entrepreneur.company_name}</h2>
            <StatusBadge status={entrepreneur.status} />
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info de base */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} /> Contact
                </h3>
                <p className="text-gray-900">{entrepreneur.contact_name || '-'}</p>
              </div>

              {entrepreneur.rbq_license && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Shield size={16} /> Licence RBQ
                  </h3>
                  <RBQBadge license={entrepreneur.rbq_license} status={entrepreneur.rbq_status} />
                  {entrepreneur.rbq_last_verified && (
                    <p className="text-xs text-gray-500 mt-1">
                      Vérifié le {new Date(entrepreneur.rbq_last_verified).toLocaleDateString('fr-CA')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-700 mb-2">Évaluation</h3>
                <RatingStars rating={entrepreneur.rating} />
              </div>
            </div>

            {/* Coordonnées */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={16} /> Coordonnées
                </h3>
                <div className="space-y-1 text-sm">
                  {entrepreneur.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <a href={`tel:${entrepreneur.phone}`} className="text-teal-600 hover:underline">
                        {entrepreneur.phone}
                      </a>
                    </p>
                  )}
                  {entrepreneur.cell && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <a href={`tel:${entrepreneur.cell}`} className="text-teal-600 hover:underline">
                        {entrepreneur.cell} (cell)
                      </a>
                    </p>
                  )}
                  {entrepreneur.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <a href={`mailto:${entrepreneur.email}`} className="text-teal-600 hover:underline">
                        {entrepreneur.email}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {entrepreneur.address && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} /> Adresse
                  </h3>
                  <p className="text-sm text-gray-600">
                    {entrepreneur.address}<br />
                    {entrepreneur.city}, {entrepreneur.province} {entrepreneur.postal_code}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Spécialités */}
          {entrepreneur.specialites && entrepreneur.specialites.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-700 mb-2">Spécialités</h3>
              <div className="flex flex-wrap gap-2">
                {entrepreneur.specialites.map(code => (
                  <span key={code} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                    {getSpecialiteName(code)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {entrepreneur.notes && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {entrepreneur.notes}
              </p>
            </div>
          )}

          {/* Statistiques */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{entrepreneur.total_invitations || 0}</p>
              <p className="text-xs text-gray-500">Invitations</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{entrepreneur.total_soumissions || 0}</p>
              <p className="text-xs text-gray-500">Soumissions</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{entrepreneur.total_contrats || 0}</p>
              <p className="text-xs text-gray-500">Contrats</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between">
          <button
            onClick={onDelete}
            className="btn bg-red-100 text-red-700 hover:bg-red-200"
          >
            <Trash2 size={16} className="mr-2" /> Supprimer
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Fermer
            </button>
            <button onClick={onEdit} className="btn btn-primary">
              <Edit2 size={16} className="mr-2" /> Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export function EntrepreneursPersonnel() {
  const { 
    entrepreneurs, 
    loading, 
    createEntrepreneur, 
    updateEntrepreneur, 
    deleteEntrepreneur,
    getStats 
  } = useEntrepreneurs()

  const [showCreate, setShowCreate] = useState(false)
  const [editingEntrepreneur, setEditingEntrepreneur] = useState<Entrepreneur | null>(null)
  const [viewingEntrepreneur, setViewingEntrepreneur] = useState<Entrepreneur | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSpecialite, setFilterSpecialite] = useState<string>('')

  const stats = getStats()

  // Filtrer les entrepreneurs
  const filteredEntrepreneurs = entrepreneurs.filter(e => {
    const matchSearch = !searchQuery || 
      e.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.rbq_license?.includes(searchQuery)

    const matchSpecialite = !filterSpecialite || 
      e.specialites?.includes(filterSpecialite as SpecialiteCode)

    return matchSearch && matchSpecialite
  })

  const handleCreate = async (data: CreateEntrepreneurParams) => {
    await createEntrepreneur(data)
  }

  const handleUpdate = async (data: CreateEntrepreneurParams) => {
    if (editingEntrepreneur) {
      await updateEntrepreneur(editingEntrepreneur.id, data)
    }
    setEditingEntrepreneur(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cet entrepreneur du bottin?')) {
      await deleteEntrepreneur(id)
      setViewingEntrepreneur(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageTitle 
        title="Bottin personnel" 
        subtitle="Vos contacts d'entrepreneurs et sous-traitants" 
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
          <p className="text-sm text-gray-500">Actifs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.inactifs}</p>
          <p className="text-sm text-gray-500">Inactifs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.bloques}</p>
          <p className="text-sm text-gray-500">Bloqués</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{stats.avecRBQ}</p>
          <p className="text-sm text-gray-500">Avec RBQ</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, contact ou licence RBQ..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterSpecialite}
              onChange={(e) => setFilterSpecialite(e.target.value)}
              className="input-field"
            >
              <option value="">Toutes les spécialités</option>
              {SPECIALITES.map(spec => (
                <option key={spec.code} value={spec.code}>{spec.name}</option>
              ))}
            </select>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary whitespace-nowrap">
              <Plus size={16} className="mr-2" /> Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Liste des entrepreneurs */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : filteredEntrepreneurs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchQuery || filterSpecialite ? 'Aucun résultat' : 'Bottin vide'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterSpecialite 
              ? 'Essayez d\'autres critères de recherche'
              : 'Ajoutez votre premier entrepreneur ou importez depuis le bottin RBQ'
            }
          </p>
          {!searchQuery && !filterSpecialite && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              <Plus size={16} className="mr-2" /> Ajouter un entrepreneur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spécialités</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RBQ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntrepreneurs.map(entrepreneur => (
                <tr 
                  key={entrepreneur.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setViewingEntrepreneur(entrepreneur)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <Building size={18} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{entrepreneur.company_name}</p>
                        {entrepreneur.city && (
                          <p className="text-sm text-gray-500">{entrepreneur.city}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{entrepreneur.contact_name || '-'}</p>
                    {entrepreneur.email && (
                      <p className="text-sm text-gray-500">{entrepreneur.email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {entrepreneur.specialites?.slice(0, 2).map(code => (
                        <span key={code} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {getSpecialiteName(code)}
                        </span>
                      ))}
                      {entrepreneur.specialites && entrepreneur.specialites.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{entrepreneur.specialites.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RBQBadge license={entrepreneur.rbq_license} status={entrepreneur.rbq_status} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={entrepreneur.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingEntrepreneur(entrepreneur)
                      }}
                      className="text-teal-600 hover:text-teal-800 p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <EntrepreneurModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      <EntrepreneurModal
        isOpen={!!editingEntrepreneur}
        onClose={() => setEditingEntrepreneur(null)}
        onSave={handleUpdate}
        entrepreneur={editingEntrepreneur}
      />

      <EntrepreneurDetailModal
        entrepreneur={viewingEntrepreneur}
        onClose={() => setViewingEntrepreneur(null)}
        onEdit={() => {
          setEditingEntrepreneur(viewingEntrepreneur)
          setViewingEntrepreneur(null)
        }}
        onDelete={() => viewingEntrepreneur && handleDelete(viewingEntrepreneur.id)}
      />
    </div>
  )
}