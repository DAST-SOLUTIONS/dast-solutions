/**
 * DAST Solutions - Phase 7B: Module SEAO
 * Système électronique d'appel d'offres du Québec
 * Recherche, suivi et soumission aux appels d'offres publics
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Search, FileText, Building2, Calendar, MapPin,
  Clock, Eye, Star, StarOff, ExternalLink, Filter, Bell,
  DollarSign, Bookmark, Download, AlertCircle,
  ChevronDown, Tag, RefreshCw, Globe, TrendingUp, Users,
  CheckCircle2, XCircle, Briefcase, Timer, Check
} from 'lucide-react'

// Types
interface SEAOTender {
  id: string
  seao_number: string
  title: string
  description?: string
  
  // Organisme
  organization_name: string
  organization_type: 'municipal' | 'provincial' | 'federal' | 'education' | 'health' | 'societe_etat'
  
  // Classification
  tender_type: 'construction' | 'services' | 'goods' | 'professional'
  category: string
  subcategory?: string
  unspsc_codes?: string[]
  
  // Région
  region: string
  city?: string
  
  // Dates
  publication_date: string
  closing_date: string
  opening_date?: string
  
  // Montant estimé
  estimated_value_min?: number
  estimated_value_max?: number
  
  // Documents
  documents_url?: string
  
  // Status
  status: 'open' | 'closed' | 'cancelled' | 'awarded'
  
  // Tracking utilisateur
  is_bookmarked?: boolean
  is_interested?: boolean
  user_notes?: string
  
  created_at: string
}

interface TenderTracking {
  id: string
  tender_id: string
  user_id: string
  status: 'watching' | 'preparing' | 'submitted' | 'won' | 'lost' | 'no_bid'
  bid_amount?: number
  submission_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Régions du Québec
const QUEBEC_REGIONS = [
  { value: 'montreal', label: 'Montréal' },
  { value: 'laval', label: 'Laval' },
  { value: 'monteregie', label: 'Montérégie' },
  { value: 'laurentides', label: 'Laurentides' },
  { value: 'lanaudiere', label: 'Lanaudière' },
  { value: 'outaouais', label: 'Outaouais' },
  { value: 'capitale_nationale', label: 'Capitale-Nationale' },
  { value: 'chaudiere_appalaches', label: 'Chaudière-Appalaches' },
  { value: 'estrie', label: 'Estrie' },
  { value: 'centre_quebec', label: 'Centre-du-Québec' },
  { value: 'mauricie', label: 'Mauricie' },
  { value: 'saguenay', label: 'Saguenay-Lac-Saint-Jean' },
  { value: 'bas_saint_laurent', label: 'Bas-Saint-Laurent' },
  { value: 'abitibi', label: 'Abitibi-Témiscamingue' },
  { value: 'cote_nord', label: 'Côte-Nord' },
  { value: 'gaspesie', label: 'Gaspésie-Îles-de-la-Madeleine' },
  { value: 'nord_quebec', label: 'Nord-du-Québec' },
]

// Catégories de construction
const CONSTRUCTION_CATEGORIES = [
  { value: 'batiment', label: 'Bâtiment' },
  { value: 'genie_civil', label: 'Génie civil' },
  { value: 'voirie', label: 'Voirie et pavage' },
  { value: 'aqueduc', label: 'Aqueduc et égouts' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'mecanique', label: 'Mécanique du bâtiment' },
  { value: 'demolition', label: 'Démolition' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'paysagement', label: 'Aménagement paysager' },
]

// Types d'organismes
const ORGANIZATION_TYPES = [
  { value: 'municipal', label: 'Municipal', color: 'blue' },
  { value: 'provincial', label: 'Provincial', color: 'purple' },
  { value: 'federal', label: 'Fédéral', color: 'red' },
  { value: 'education', label: 'Éducation', color: 'green' },
  { value: 'health', label: 'Santé', color: 'cyan' },
  { value: 'societe_etat', label: 'Société d\'État', color: 'orange' },
]

// Données de démonstration
const DEMO_TENDERS: SEAOTender[] = [
  {
    id: '1',
    seao_number: 'SEAO-2026-001234',
    title: 'Réfection de la toiture - École secondaire Jean-Baptiste-Meilleur',
    description: 'Travaux de réfection complète de la toiture incluant isolation et membrane',
    organization_name: 'Centre de services scolaire des Affluents',
    organization_type: 'education',
    tender_type: 'construction',
    category: 'batiment',
    region: 'lanaudiere',
    city: 'Repentigny',
    publication_date: '2026-01-05',
    closing_date: '2026-01-25',
    estimated_value_min: 500000,
    estimated_value_max: 750000,
    status: 'open',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    seao_number: 'SEAO-2026-001189',
    title: 'Construction d\'un nouveau poste de pompage',
    description: 'Construction complète incluant génie civil, mécanique et électricité',
    organization_name: 'Ville de Laval',
    organization_type: 'municipal',
    tender_type: 'construction',
    category: 'aqueduc',
    region: 'laval',
    city: 'Laval',
    publication_date: '2026-01-03',
    closing_date: '2026-02-01',
    estimated_value_min: 2000000,
    estimated_value_max: 3000000,
    status: 'open',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    seao_number: 'SEAO-2026-001156',
    title: 'Agrandissement du centre sportif municipal',
    description: 'Ajout d\'un gymnase double et vestiaires',
    organization_name: 'Ville de Terrebonne',
    organization_type: 'municipal',
    tender_type: 'construction',
    category: 'batiment',
    region: 'lanaudiere',
    city: 'Terrebonne',
    publication_date: '2026-01-02',
    closing_date: '2026-01-20',
    estimated_value_min: 4000000,
    estimated_value_max: 5500000,
    status: 'open',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    seao_number: 'SEAO-2026-001098',
    title: 'Réfection du stationnement - CHSLD Saint-Eustache',
    description: 'Travaux de pavage, drainage et éclairage',
    organization_name: 'CISSS des Laurentides',
    organization_type: 'health',
    tender_type: 'construction',
    category: 'voirie',
    region: 'laurentides',
    city: 'Saint-Eustache',
    publication_date: '2025-12-28',
    closing_date: '2026-01-15',
    estimated_value_min: 300000,
    estimated_value_max: 450000,
    status: 'open',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    seao_number: 'SEAO-2025-009876',
    title: 'Travaux de maçonnerie - Édifice patrimonial',
    description: 'Restauration de la façade en pierre et joints de maçonnerie',
    organization_name: 'Ministère de la Culture',
    organization_type: 'provincial',
    tender_type: 'construction',
    category: 'renovation',
    region: 'capitale_nationale',
    city: 'Québec',
    publication_date: '2025-12-20',
    closing_date: '2026-01-12',
    estimated_value_min: 800000,
    estimated_value_max: 1200000,
    status: 'open',
    created_at: new Date().toISOString()
  },
]

// Status badge
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    open: { className: 'bg-green-100 text-green-700', label: 'Ouvert' },
    closed: { className: 'bg-gray-100 text-gray-600', label: 'Fermé' },
    cancelled: { className: 'bg-red-100 text-red-700', label: 'Annulé' },
    awarded: { className: 'bg-blue-100 text-blue-700', label: 'Adjugé' },
    watching: { className: 'bg-amber-100 text-amber-700', label: 'En veille' },
    preparing: { className: 'bg-purple-100 text-purple-700', label: 'En préparation' },
    submitted: { className: 'bg-blue-100 text-blue-700', label: 'Soumis' },
    won: { className: 'bg-green-100 text-green-700', label: 'Gagné' },
    lost: { className: 'bg-red-100 text-red-700', label: 'Perdu' },
    no_bid: { className: 'bg-gray-100 text-gray-600', label: 'Pas soumis' },
  }
  const config = configs[status] || configs.open
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function OrgTypeBadge({ type }: { type: string }) {
  const org = ORGANIZATION_TYPES.find(o => o.value === type)
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colorClasses[org?.color || 'blue']}`}>
      {org?.label || type}
    </span>
  )
}

function getDaysRemaining(closingDate: string): number {
  const today = new Date()
  const closing = new Date(closingDate)
  const diff = closing.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function SEAO() {
  const navigate = useNavigate()
  const [tenders, setTenders] = useState<SEAOTender[]>(DEMO_TENDERS)
  const [tracking, setTracking] = useState<TenderTracking[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'bookmarks' | 'submissions'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  
  // Filtres
  const [filters, setFilters] = useState({
    regions: [] as string[],
    categories: [] as string[],
    orgTypes: [] as string[],
    minValue: '',
    maxValue: '',
    daysRemaining: ''
  })

  // Stats
  const [stats, setStats] = useState({
    totalOpen: 0,
    closingSoon: 0,
    bookmarked: 0,
    submitted: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les appels d'offres suivis
      const { data: trackingData } = await supabase
        .from('seao_tracking')
        .select('*')
        .eq('user_id', user.id)

      setTracking(trackingData || [])

      // Charger les bookmarks
      const { data: bookmarksData } = await supabase
        .from('seao_bookmarks')
        .select('tender_id')
        .eq('user_id', user.id)

      if (bookmarksData) {
        setBookmarkedIds(new Set(bookmarksData.map(b => b.tender_id)))
      }

      // Calculer les stats
      const openTenders = DEMO_TENDERS.filter(t => t.status === 'open')
      const closingSoon = openTenders.filter(t => getDaysRemaining(t.closing_date) <= 7)
      
      setStats({
        totalOpen: openTenders.length,
        closingSoon: closingSoon.length,
        bookmarked: bookmarkedIds.size,
        submitted: (trackingData || []).filter(t => t.status === 'submitted').length
      })
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleBookmark = async (tenderId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isBookmarked = bookmarkedIds.has(tenderId)
    
    if (isBookmarked) {
      await supabase
        .from('seao_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('tender_id', tenderId)
      
      setBookmarkedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(tenderId)
        return newSet
      })
    } else {
      await supabase
        .from('seao_bookmarks')
        .insert({ user_id: user.id, tender_id: tenderId })
      
      setBookmarkedIds(prev => new Set([...prev, tenderId]))
    }
  }

  const filteredTenders = tenders.filter(tender => {
    // Recherche texte
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        tender.title.toLowerCase().includes(q) ||
        tender.seao_number.toLowerCase().includes(q) ||
        tender.organization_name.toLowerCase().includes(q) ||
        tender.city?.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // Filtre régions
    if (filters.regions.length > 0 && !filters.regions.includes(tender.region)) {
      return false
    }

    // Filtre catégories
    if (filters.categories.length > 0 && !filters.categories.includes(tender.category)) {
      return false
    }

    // Filtre types d'organisme
    if (filters.orgTypes.length > 0 && !filters.orgTypes.includes(tender.organization_type)) {
      return false
    }

    // Filtre montant min
    if (filters.minValue && tender.estimated_value_max && tender.estimated_value_max < parseFloat(filters.minValue)) {
      return false
    }

    // Filtre montant max
    if (filters.maxValue && tender.estimated_value_min && tender.estimated_value_min > parseFloat(filters.maxValue)) {
      return false
    }

    // Filtre jours restants
    if (filters.daysRemaining) {
      const days = getDaysRemaining(tender.closing_date)
      if (days > parseInt(filters.daysRemaining)) return false
    }

    // Onglet bookmarks
    if (activeTab === 'bookmarks' && !bookmarkedIds.has(tender.id)) {
      return false
    }

    return true
  })

  const resetFilters = () => {
    setFilters({
      regions: [],
      categories: [],
      orgTypes: [],
      minValue: '',
      maxValue: '',
      daysRemaining: ''
    })
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
            <Globe className="text-emerald-600" />
            SEAO - Appels d'offres publics
          </h1>
          <p className="text-gray-500">Système électronique d'appel d'offres du Québec</p>
        </div>
        <a
          href="https://www.seao.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center gap-2"
        >
          <ExternalLink size={16} />
          Ouvrir SEAO.ca
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalOpen}</p>
              <p className="text-sm text-gray-500">Appels ouverts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Timer className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.closingSoon}</p>
              <p className="text-sm text-gray-500">Ferment bientôt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bookmark className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{bookmarkedIds.size}</p>
              <p className="text-sm text-gray-500">Favoris</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-sm text-gray-500">Soumis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'search', label: 'Recherche', icon: Search },
          { id: 'bookmarks', label: 'Mes favoris', icon: Bookmark },
          { id: 'submissions', label: 'Mes soumissions', icon: Briefcase },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, numéro SEAO, organisme, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''
            }`}
          >
            <Filter size={18} />
            Filtres
            {(filters.regions.length + filters.categories.length + filters.orgTypes.length) > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
                {filters.regions.length + filters.categories.length + filters.orgTypes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Actualiser
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Filtres avancés</h3>
              <button onClick={resetFilters} className="text-sm text-emerald-600 hover:underline">
                Réinitialiser
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Régions */}
              <div>
                <label className="block text-sm font-medium mb-2">Régions</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {QUEBEC_REGIONS.map(region => (
                    <label key={region.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.regions.includes(region.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, regions: [...filters.regions, region.value]})
                          } else {
                            setFilters({...filters, regions: filters.regions.filter(r => r !== region.value)})
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      {region.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Catégories */}
              <div>
                <label className="block text-sm font-medium mb-2">Catégories</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {CONSTRUCTION_CATEGORIES.map(cat => (
                    <label key={cat.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, categories: [...filters.categories, cat.value]})
                          } else {
                            setFilters({...filters, categories: filters.categories.filter(c => c !== cat.value)})
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Types d'organisme */}
              <div>
                <label className="block text-sm font-medium mb-2">Types d'organisme</label>
                <div className="space-y-1">
                  {ORGANIZATION_TYPES.map(org => (
                    <label key={org.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.orgTypes.includes(org.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, orgTypes: [...filters.orgTypes, org.value]})
                          } else {
                            setFilters({...filters, orgTypes: filters.orgTypes.filter(o => o !== org.value)})
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      {org.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">Valeur min ($)</label>
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => setFilters({...filters, minValue: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valeur max ($)</label>
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ferme dans (jours)</label>
                <select
                  value={filters.daysRemaining}
                  onChange={(e) => setFilters({...filters, daysRemaining: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Tous</option>
                  <option value="3">3 jours</option>
                  <option value="7">7 jours</option>
                  <option value="14">14 jours</option>
                  <option value="30">30 jours</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des appels d'offres */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
            <Globe className="mx-auto mb-3 text-gray-300" size={48} />
            <p>Aucun appel d'offres trouvé</p>
            <p className="text-sm mt-1">Modifiez vos critères de recherche</p>
          </div>
        ) : (
          filteredTenders.map(tender => {
            const daysRemaining = getDaysRemaining(tender.closing_date)
            const isBookmarked = bookmarkedIds.has(tender.id)
            const region = QUEBEC_REGIONS.find(r => r.value === tender.region)
            const category = CONSTRUCTION_CATEGORIES.find(c => c.value === tender.category)
            
            return (
              <div key={tender.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-400">{tender.seao_number}</span>
                        <StatusBadge status={tender.status} />
                        <OrgTypeBadge type={tender.organization_type} />
                        {daysRemaining <= 3 && daysRemaining > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                            <AlertCircle size={12} />
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-1">{tender.title}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {tender.organization_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {tender.city || region?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={14} />
                          {category?.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <button
                        onClick={() => toggleBookmark(tender.id)}
                        className={`p-2 rounded-lg transition ${
                          isBookmarked ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isBookmarked ? <Star size={20} className="fill-current" /> : <Bookmark size={20} />}
                      </button>
                      
                      {tender.estimated_value_min && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">
                            {(tender.estimated_value_min / 1000).toFixed(0)}K - {(tender.estimated_value_max! / 1000).toFixed(0)}K $
                          </p>
                          <p className="text-xs text-gray-500">Valeur estimée</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span>Publié: {new Date(tender.publication_date).toLocaleDateString('fr-CA')}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${daysRemaining <= 3 ? 'text-red-600 font-medium' : ''}`}>
                        <Clock size={14} className={daysRemaining <= 3 ? 'text-red-600' : 'text-gray-400'} />
                        <span>
                          Ferme: {new Date(tender.closing_date).toLocaleDateString('fr-CA')}
                          {daysRemaining > 0 && (
                            <span className="ml-1">({daysRemaining} jour{daysRemaining > 1 ? 's' : ''})</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                        <Download size={14} />
                        Documents
                      </button>
                      <a
                        href={`https://www.seao.ca/OpportunityPublication/ConsulterAvis/${tender.seao_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <ExternalLink size={14} />
                        Voir sur SEAO
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Info SEAO */}
      <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-emerald-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-emerald-800">À propos de SEAO</h4>
            <p className="text-sm text-emerald-700 mt-1">
              Le Système électronique d'appel d'offres (SEAO) est la plateforme officielle du gouvernement du Québec 
              pour les appels d'offres publics. Pour soumissionner, vous devez être inscrit sur seao.ca et posséder 
              les licences RBQ appropriées.
            </p>
            <a 
              href="https://www.seao.ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline mt-2"
            >
              Visiter SEAO.ca <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
