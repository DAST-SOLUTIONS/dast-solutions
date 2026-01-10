/**
 * DAST Solutions - Phase 5: Base de données Entreprises Québec
 * Répertoire de 25K+ entreprises construction avec vérification RBQ
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Search, Building2, MapPin, Phone, Mail, Globe,
  Shield, ShieldCheck, ShieldAlert, Star, Filter, Download,
  Plus, Eye, Edit2, ExternalLink, Users, Briefcase, Calendar,
  CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw
} from 'lucide-react'

// Types d'entreprises
const COMPANY_TYPES = [
  { value: 'general_contractor', label: 'Entrepreneur général' },
  { value: 'specialty_contractor', label: 'Entrepreneur spécialisé' },
  { value: 'subcontractor', label: 'Sous-traitant' },
  { value: 'supplier', label: 'Fournisseur' },
  { value: 'professional', label: 'Professionnel (architecte, ingénieur)' },
  { value: 'consultant', label: 'Consultant' },
]

// Spécialités construction
const SPECIALTIES = [
  { value: 'masonry', label: 'Maçonnerie' },
  { value: 'concrete', label: 'Béton' },
  { value: 'structural_steel', label: 'Acier structural' },
  { value: 'carpentry', label: 'Charpenterie' },
  { value: 'roofing', label: 'Toiture' },
  { value: 'electrical', label: 'Électricité' },
  { value: 'plumbing', label: 'Plomberie' },
  { value: 'hvac', label: 'CVAC' },
  { value: 'fire_protection', label: 'Protection incendie' },
  { value: 'insulation', label: 'Isolation' },
  { value: 'drywall', label: 'Gypse et joints' },
  { value: 'painting', label: 'Peinture' },
  { value: 'flooring', label: 'Revêtements de sol' },
  { value: 'glazing', label: 'Vitrage' },
  { value: 'landscaping', label: 'Aménagement paysager' },
  { value: 'demolition', label: 'Démolition' },
  { value: 'excavation', label: 'Excavation' },
  { value: 'paving', label: 'Pavage' },
]

// Régions du Québec
const REGIONS_QC = [
  { value: 'montreal', label: 'Montréal' },
  { value: 'laval', label: 'Laval' },
  { value: 'monteregie', label: 'Montérégie' },
  { value: 'laurentides', label: 'Laurentides' },
  { value: 'lanaudiere', label: 'Lanaudière' },
  { value: 'quebec', label: 'Québec' },
  { value: 'chaudiere_appalaches', label: 'Chaudière-Appalaches' },
  { value: 'estrie', label: 'Estrie' },
  { value: 'outaouais', label: 'Outaouais' },
  { value: 'mauricie', label: 'Mauricie' },
  { value: 'saguenay', label: 'Saguenay-Lac-Saint-Jean' },
  { value: 'abitibi', label: 'Abitibi-Témiscamingue' },
  { value: 'cote_nord', label: 'Côte-Nord' },
  { value: 'gaspesie', label: 'Gaspésie-Îles-de-la-Madeleine' },
  { value: 'bas_st_laurent', label: 'Bas-Saint-Laurent' },
  { value: 'centre_quebec', label: 'Centre-du-Québec' },
]

// Sous-catégories RBQ
const RBQ_SUBCATEGORIES = [
  { code: '1.1.1', name: 'Bâtiments résidentiels neufs' },
  { code: '1.1.2', name: 'Bâtiments résidentiels - rénovation' },
  { code: '1.2', name: 'Petits bâtiments' },
  { code: '1.3', name: 'Grands bâtiments' },
  { code: '1.4', name: 'Génie civil et ouvrages de génie civil' },
  { code: '2.1', name: 'Travaux de fondation et structure' },
  { code: '2.2', name: 'Travaux d\'enveloppe' },
  { code: '2.3', name: 'Travaux de finition' },
  { code: '3', name: 'Travaux d\'électricité' },
  { code: '4.1', name: 'Plomberie' },
  { code: '4.2', name: 'Chauffage' },
  { code: '4.3', name: 'Systèmes de ventilation' },
  { code: '5', name: 'Installations de gaz' },
  { code: '6', name: 'Appareils sous pression' },
  { code: '7', name: 'Systèmes de gicleurs' },
  { code: '8', name: 'Systèmes d\'alarme incendie' },
  { code: '9', name: 'Ascenseurs et autres appareils élévateurs' },
  { code: '10', name: 'Systèmes de protection contre la foudre' },
  { code: '11', name: 'Travaux de forage et d\'installation de puits' },
  { code: '12', name: 'Excavation et terrassement' },
  { code: '13', name: 'Routes et ponts' },
  { code: '14', name: 'Travaux de béton' },
  { code: '15', name: 'Travaux de maçonnerie' },
  { code: '16', name: 'Travaux de charpenterie' },
]

interface Company {
  id: string
  name: string
  legal_name?: string
  neq?: string // Numéro d'entreprise du Québec
  company_type: string
  specialties: string[]
  description?: string
  
  // Coordonnées
  address: string
  city: string
  province: string
  postal_code: string
  region: string
  phone: string
  phone_alt?: string
  fax?: string
  email: string
  website?: string
  
  // RBQ
  rbq_license?: string
  rbq_status?: 'active' | 'suspended' | 'revoked' | 'expired' | 'pending'
  rbq_categories?: string[]
  rbq_expiry_date?: string
  rbq_verified_at?: string
  
  // CCQ
  ccq_registered?: boolean
  ccq_number?: string
  
  // Business info
  year_founded?: number
  employees_count?: string
  annual_revenue?: string
  service_area?: string[]
  
  // Ratings
  rating?: number
  reviews_count?: number
  projects_completed?: number
  
  // Status
  is_verified: boolean
  is_preferred: boolean
  is_active: boolean
  
  // Contact principal
  contact_name?: string
  contact_title?: string
  contact_phone?: string
  contact_email?: string
  
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

// Statut RBQ badge
function RBQStatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-gray-400 text-sm">Non vérifié</span>
  
  const configs: Record<string, { icon: any, className: string, label: string }> = {
    active: { icon: ShieldCheck, className: 'bg-green-100 text-green-700', label: 'Licence active' },
    suspended: { icon: ShieldAlert, className: 'bg-amber-100 text-amber-700', label: 'Suspendue' },
    revoked: { icon: XCircle, className: 'bg-red-100 text-red-700', label: 'Révoquée' },
    expired: { icon: Clock, className: 'bg-gray-100 text-gray-600', label: 'Expirée' },
    pending: { icon: AlertTriangle, className: 'bg-blue-100 text-blue-700', label: 'En attente' },
  }
  
  const config = configs[status] || configs.pending
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

export default function EntreprisesQuebec() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  
  // Filtres
  const [filters, setFilters] = useState({
    company_type: '',
    specialty: '',
    region: '',
    rbq_status: '',
    is_verified: false,
    is_preferred: false
  })
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    rbq_active: 0,
    preferred: 0
  })
  
  // Formulaire nouvelle entreprise
  const [companyForm, setCompanyForm] = useState({
    name: '',
    legal_name: '',
    neq: '',
    company_type: 'subcontractor',
    specialties: [] as string[],
    address: '',
    city: '',
    postal_code: '',
    region: 'montreal',
    phone: '',
    email: '',
    website: '',
    rbq_license: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    notes: ''
  })

  useEffect(() => {
    loadCompanies()
  }, [filters])

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('companies_quebec')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      // Appliquer les filtres
      if (filters.company_type) query = query.eq('company_type', filters.company_type)
      if (filters.region) query = query.eq('region', filters.region)
      if (filters.rbq_status) query = query.eq('rbq_status', filters.rbq_status)
      if (filters.is_verified) query = query.eq('is_verified', true)
      if (filters.is_preferred) query = query.eq('is_preferred', true)

      const { data, error } = await query

      if (data) {
        setCompanies(data)
        
        // Calculer les stats
        setStats({
          total: data.length,
          verified: data.filter(c => c.is_verified).length,
          rbq_active: data.filter(c => c.rbq_status === 'active').length,
          preferred: data.filter(c => c.is_preferred).length
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newCompany = {
      ...companyForm,
      user_id: user.id,
      province: 'QC',
      is_verified: false,
      is_preferred: false,
      is_active: true
    }

    const { data, error } = await supabase
      .from('companies_quebec')
      .insert(newCompany)
      .select()
      .single()

    if (!error && data) {
      setCompanies([...companies, data])
      setShowAddModal(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setCompanyForm({
      name: '',
      legal_name: '',
      neq: '',
      company_type: 'subcontractor',
      specialties: [],
      address: '',
      city: '',
      postal_code: '',
      region: 'montreal',
      phone: '',
      email: '',
      website: '',
      rbq_license: '',
      contact_name: '',
      contact_title: '',
      contact_email: '',
      notes: ''
    })
  }

  const verifyRBQ = async (company: Company) => {
    // Simulation de vérification RBQ
    // En production, ça appellerait l'API RBQ
    alert(`Vérification RBQ pour licence: ${company.rbq_license}\n\nNote: En production, cette fonction interrogera l'API publique de la RBQ pour valider la licence.`)
  }

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return company.name.toLowerCase().includes(q) ||
           company.city?.toLowerCase().includes(q) ||
           company.rbq_license?.toLowerCase().includes(q) ||
           company.specialties?.some(s => s.toLowerCase().includes(q))
  })

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Entreprises Québec
          </h1>
          <p className="text-gray-500">Répertoire des entrepreneurs et fournisseurs avec vérification RBQ</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Ajouter une entreprise
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Entreprises</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheck className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rbq_active}</p>
              <p className="text-sm text-gray-500">Licences RBQ actives</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.verified}</p>
              <p className="text-sm text-gray-500">Vérifiées</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.preferred}</p>
              <p className="text-sm text-gray-500">Préférées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville, licence RBQ, spécialité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${showFilters ? 'bg-teal-50 border-teal-300' : ''}`}
          >
            <Filter size={16} />
            Filtres
          </button>
          <button className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <Download size={16} />
            Exporter
          </button>
        </div>

        {/* Filtres dépliables */}
        {showFilters && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filters.company_type}
                onChange={(e) => setFilters({...filters, company_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous les types</option>
                {COMPANY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Région</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({...filters, region: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Toutes les régions</option>
                {REGIONS_QC.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Statut RBQ</label>
              <select
                value={filters.rbq_status}
                onChange={(e) => setFilters({...filters, rbq_status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Licence active</option>
                <option value="suspended">Suspendue</option>
                <option value="expired">Expirée</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_verified}
                  onChange={(e) => setFilters({...filters, is_verified: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Vérifiées</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_preferred}
                  onChange={(e) => setFilters({...filters, is_preferred: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Préférées</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Liste des entreprises */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Entreprise</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Ville</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Licence RBQ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <Building2 className="mx-auto mb-3 text-gray-300" size={48} />
                  <p>Aucune entreprise trouvée</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-2 text-teal-600 hover:underline"
                  >
                    Ajouter votre première entreprise
                  </button>
                </td>
              </tr>
            ) : (
              filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{company.name}</p>
                          {company.is_preferred && <Star size={14} className="text-amber-500 fill-amber-500" />}
                          {company.is_verified && <CheckCircle2 size={14} className="text-green-500" />}
                        </div>
                        <p className="text-sm text-gray-500">
                          {company.specialties?.slice(0, 2).map(s => 
                            SPECIALTIES.find(sp => sp.value === s)?.label || s
                          ).join(', ')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {COMPANY_TYPES.find(t => t.value === company.company_type)?.label || company.company_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin size={14} className="text-gray-400" />
                      {company.city}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {company.rbq_license ? (
                      <span className="font-mono text-sm">{company.rbq_license}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <RBQStatusBadge status={company.rbq_status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={() => setSelectedCompany(company)}
                        className="p-1.5 hover:bg-gray-100 rounded" 
                        title="Voir"
                      >
                        <Eye size={16} className="text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Modifier">
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      {company.rbq_license && (
                        <button 
                          onClick={() => verifyRBQ(company)}
                          className="p-1.5 hover:bg-gray-100 rounded" 
                          title="Vérifier RBQ"
                        >
                          <RefreshCw size={16} className="text-blue-500" />
                        </button>
                      )}
                      {company.website && (
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded"
                          title="Site web"
                        >
                          <ExternalLink size={16} className="text-gray-500" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter entreprise */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Ajouter une entreprise</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Construction ABC Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Raison sociale</label>
                  <input
                    type="text"
                    value={companyForm.legal_name}
                    onChange={(e) => setCompanyForm({...companyForm, legal_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NEQ</label>
                  <input
                    type="text"
                    value={companyForm.neq}
                    onChange={(e) => setCompanyForm({...companyForm, neq: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type d'entreprise</label>
                  <select
                    value={companyForm.company_type}
                    onChange={(e) => setCompanyForm({...companyForm, company_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {COMPANY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Licence RBQ</label>
                  <input
                    type="text"
                    value={companyForm.rbq_license}
                    onChange={(e) => setCompanyForm({...companyForm, rbq_license: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="1234-5678-90"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Adresse</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Adresse</label>
                    <input
                      type="text"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ville</label>
                    <input
                      type="text"
                      value={companyForm.city}
                      onChange={(e) => setCompanyForm({...companyForm, city: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code postal</label>
                    <input
                      type="text"
                      value={companyForm.postal_code}
                      onChange={(e) => setCompanyForm({...companyForm, postal_code: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="H1A 1A1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Région</label>
                    <select
                      value={companyForm.region}
                      onChange={(e) => setCompanyForm({...companyForm, region: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {REGIONS_QC.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({...companyForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="514-555-1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Courriel</label>
                    <input
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Site web</label>
                    <input
                      type="text"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="www.exemple.com"
                    />
                  </div>
                </div>
              </div>

              {/* Personne contact */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Personne-ressource</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                      type="text"
                      value={companyForm.contact_name}
                      onChange={(e) => setCompanyForm({...companyForm, contact_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titre</label>
                    <input
                      type="text"
                      value={companyForm.contact_title}
                      onChange={(e) => setCompanyForm({...companyForm, contact_title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Président, Estimateur..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Courriel contact</label>
                    <input
                      type="email"
                      value={companyForm.contact_email}
                      onChange={(e) => setCompanyForm({...companyForm, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={companyForm.notes}
                  onChange={(e) => setCompanyForm({...companyForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSaveCompany}
                disabled={!companyForm.name}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Ajouter l'entreprise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails entreprise */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedCompany.name}</h2>
                  <p className="text-sm text-gray-500">
                    {COMPANY_TYPES.find(t => t.value === selectedCompany.company_type)?.label}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Statut RBQ */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield size={24} className="text-gray-400" />
                  <div>
                    <p className="font-medium">Licence RBQ</p>
                    <p className="text-lg font-mono">{selectedCompany.rbq_license || 'Non renseignée'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <RBQStatusBadge status={selectedCompany.rbq_status} />
                  {selectedCompany.rbq_expiry_date && (
                    <p className="text-sm text-gray-500 mt-1">
                      Expire: {new Date(selectedCompany.rbq_expiry_date).toLocaleDateString('fr-CA')}
                    </p>
                  )}
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h3 className="font-medium mb-3">Coordonnées</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p>{selectedCompany.address}</p>
                      <p>{selectedCompany.city}, {selectedCompany.province} {selectedCompany.postal_code}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedCompany.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <a href={`tel:${selectedCompany.phone}`} className="text-teal-600 hover:underline">
                          {selectedCompany.phone}
                        </a>
                      </div>
                    )}
                    {selectedCompany.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <a href={`mailto:${selectedCompany.email}`} className="text-teal-600 hover:underline">
                          {selectedCompany.email}
                        </a>
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-gray-400" />
                        <a 
                          href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          {selectedCompany.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact principal */}
              {selectedCompany.contact_name && (
                <div>
                  <h3 className="font-medium mb-3">Personne-ressource</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedCompany.contact_name}</p>
                      {selectedCompany.contact_title && (
                        <p className="text-sm text-gray-500">{selectedCompany.contact_title}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCompany.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedCompany.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between">
              <button 
                onClick={() => verifyRBQ(selectedCompany)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Vérifier RBQ
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Modifier
                </button>
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
