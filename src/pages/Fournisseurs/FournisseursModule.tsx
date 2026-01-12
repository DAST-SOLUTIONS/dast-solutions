/**
 * DAST Solutions - Module Fournisseurs
 * Gestion des fournisseurs, sous-traitants, matériaux et équipements
 * Amélioration #9
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Factory, Users, Package, Truck, Wrench, Search, Plus, Edit, Trash2,
  Phone, Mail, MapPin, Globe, Star, StarOff, FileText, DollarSign,
  CheckCircle, XCircle, AlertCircle, Clock, Filter, Download, Upload,
  ChevronDown, ChevronRight, Building2, Shield, Award, TrendingUp,
  Calendar, BarChart3, Eye, MoreHorizontal, X, Check, Loader2,
  FileCheck, CreditCard, Percent, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react'

// Types
interface Fournisseur {
  id: string
  name: string
  type: 'sous-traitant' | 'materiaux' | 'equipement' | 'services'
  category: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  website?: string
  license_rbq?: string
  license_verified?: boolean
  neq?: string // Numéro d'entreprise Québec
  tps_number?: string
  tvq_number?: string
  rating: number
  is_favorite: boolean
  is_active: boolean
  payment_terms?: string
  credit_limit?: number
  notes?: string
  specialties: string[]
  created_at: string
  updated_at: string
}

interface Contact {
  id: string
  supplier_id: string
  name: string
  role: string
  email: string
  phone: string
  is_primary: boolean
}

interface Document {
  id: string
  supplier_id: string
  name: string
  type: string
  url: string
  expiry_date?: string
  uploaded_at: string
}

interface PriceList {
  id: string
  supplier_id: string
  item_name: string
  unit: string
  unit_price: number
  min_quantity?: number
  valid_until?: string
}

interface Evaluation {
  id: string
  supplier_id: string
  project_id?: string
  project_name?: string
  date: string
  quality_rating: number
  delivery_rating: number
  price_rating: number
  communication_rating: number
  overall_rating: number
  comments: string
  evaluator: string
}

// Catégories par type
const CATEGORIES = {
  'sous-traitant': [
    'Électricité', 'Plomberie', 'CVAC', 'Maçonnerie', 'Charpente', 'Toiture',
    'Revêtement', 'Peinture', 'Plancher', 'Excavation', 'Béton', 'Acier',
    'Menuiserie', 'Vitrage', 'Isolation', 'Démolition', 'Aménagement paysager'
  ],
  'materiaux': [
    'Bois & Lumber', 'Béton & Ciment', 'Acier & Métaux', 'Électrique',
    'Plomberie', 'CVAC', 'Isolation', 'Toiture', 'Revêtements', 'Quincaillerie',
    'Peinture', 'Portes & Fenêtres', 'Agrégats', 'Asphalte'
  ],
  'equipement': [
    'Location machinerie', 'Échafaudages', 'Grues', 'Excavateurs',
    'Camions', 'Outils spécialisés', 'Équipement de sécurité', 'Génératrices',
    'Compresseurs', 'Pompes', 'Bétonnières'
  ],
  'services': [
    'Arpentage', 'Laboratoire', 'Ingénierie', 'Architecture', 'Inspection',
    'Formation', 'Nettoyage', 'Sécurité', 'Transport', 'Entreposage'
  ]
}

// Termes de paiement
const PAYMENT_TERMS = [
  'Net 15 jours',
  'Net 30 jours',
  'Net 45 jours',
  'Net 60 jours',
  '2/10 Net 30',
  'À réception',
  'COD',
  'Selon contrat'
]

// Données de démo
const DEMO_FOURNISSEURS: Fournisseur[] = [
  {
    id: 'sup-1',
    name: 'Électricité Pro Montréal',
    type: 'sous-traitant',
    category: 'Électricité',
    contact_name: 'Jean-Pierre Lavoie',
    email: 'jp.lavoie@elecpro.ca',
    phone: '514-555-0101',
    address: '1234 rue Industrielle',
    city: 'Montréal',
    province: 'QC',
    postal_code: 'H1A 2B3',
    website: 'www.elecpro.ca',
    license_rbq: '8001-2345-67',
    license_verified: true,
    neq: '1234567890',
    tps_number: '123456789RT0001',
    tvq_number: '1234567890TQ0001',
    rating: 4.5,
    is_favorite: true,
    is_active: true,
    payment_terms: 'Net 30 jours',
    credit_limit: 50000,
    specialties: ['Commercial', 'Industriel', 'Résidentiel haut de gamme'],
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z'
  },
  {
    id: 'sup-2',
    name: 'Matériaux Construction Québec',
    type: 'materiaux',
    category: 'Bois & Lumber',
    contact_name: 'Marie Tremblay',
    email: 'commandes@mcq.ca',
    phone: '418-555-0202',
    address: '5678 boul. des Entreprises',
    city: 'Québec',
    province: 'QC',
    postal_code: 'G1K 3L4',
    website: 'www.mcq.ca',
    neq: '2345678901',
    tps_number: '234567890RT0001',
    tvq_number: '2345678901TQ0001',
    rating: 4.8,
    is_favorite: true,
    is_active: true,
    payment_terms: '2/10 Net 30',
    credit_limit: 100000,
    specialties: ['Bois traité', 'Bois d\'ingénierie', 'Livraison rapide'],
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2025-01-08T00:00:00Z'
  },
  {
    id: 'sup-3',
    name: 'Location Équipement Plus',
    type: 'equipement',
    category: 'Location machinerie',
    contact_name: 'Robert Gagnon',
    email: 'location@eqplus.ca',
    phone: '450-555-0303',
    address: '9012 rue du Parc Industriel',
    city: 'Longueuil',
    province: 'QC',
    postal_code: 'J4G 5K6',
    rating: 4.2,
    is_favorite: false,
    is_active: true,
    payment_terms: 'Net 15 jours',
    specialties: ['Mini-excavateurs', 'Nacelles', 'Compacteurs'],
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z'
  },
  {
    id: 'sup-4',
    name: 'Plomberie Martin & Fils',
    type: 'sous-traitant',
    category: 'Plomberie',
    contact_name: 'Pierre Martin',
    email: 'info@martinplomberie.ca',
    phone: '514-555-0404',
    address: '3456 ave des Métiers',
    city: 'Laval',
    province: 'QC',
    postal_code: 'H7M 8N9',
    license_rbq: '8002-3456-78',
    license_verified: true,
    rating: 4.0,
    is_favorite: false,
    is_active: true,
    payment_terms: 'Net 30 jours',
    credit_limit: 25000,
    specialties: ['Commercial', 'Résidentiel', 'Urgences'],
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z'
  },
  {
    id: 'sup-5',
    name: 'Béton Mixte Laurentides',
    type: 'materiaux',
    category: 'Béton & Ciment',
    contact_name: 'Sylvie Dubois',
    email: 'commandes@betonmixte.ca',
    phone: '450-555-0505',
    address: '7890 chemin des Carrières',
    city: 'Saint-Jérôme',
    province: 'QC',
    postal_code: 'J7Y 0P1',
    rating: 4.6,
    is_favorite: true,
    is_active: true,
    payment_terms: 'Net 30 jours',
    specialties: ['Béton haute performance', 'Béton autoplaçant', 'Livraison 24/7'],
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2025-01-09T00:00:00Z'
  }
]

const DEMO_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-1',
    supplier_id: 'sup-1',
    project_id: 'proj-1',
    project_name: 'Centre commercial Phase 2',
    date: '2025-01-05',
    quality_rating: 5,
    delivery_rating: 4,
    price_rating: 4,
    communication_rating: 5,
    overall_rating: 4.5,
    comments: 'Excellent travail, équipe professionnelle. Léger retard sur la livraison du matériel.',
    evaluator: 'Jean Tremblay'
  },
  {
    id: 'eval-2',
    supplier_id: 'sup-1',
    project_id: 'proj-2',
    project_name: 'Rénovation bureaux ABC',
    date: '2024-11-20',
    quality_rating: 5,
    delivery_rating: 5,
    price_rating: 4,
    communication_rating: 5,
    overall_rating: 4.75,
    comments: 'Parfait du début à la fin. Recommandé.',
    evaluator: 'Marie Dubois'
  }
]

export default function FournisseursModule() {
  const navigate = useNavigate()
  const { type } = useParams<{ type?: string }>()
  
  // États
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(DEMO_FOURNISSEURS)
  const [evaluations, setEvaluations] = useState<Evaluation[]>(DEMO_EVALUATIONS)
  const [activeTab, setActiveTab] = useState<'liste' | 'evaluations' | 'stats'>('liste')
  const [selectedType, setSelectedType] = useState<string>(type || 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null)
  const [showEvalModal, setShowEvalModal] = useState(false)

  // Sync type from URL
  useEffect(() => {
    if (type) {
      setSelectedType(type === 'sous-traitants' ? 'sous-traitant' : type)
    }
  }, [type])

  // Filtrage
  const filteredFournisseurs = fournisseurs.filter(f => {
    const matchesType = selectedType === 'all' || f.type === selectedType
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorite = !showFavoritesOnly || f.is_favorite
    return matchesType && matchesCategory && matchesSearch && matchesFavorite && f.is_active
  })

  // Catégories disponibles selon le type sélectionné
  const availableCategories = selectedType === 'all' 
    ? Object.values(CATEGORIES).flat()
    : CATEGORIES[selectedType as keyof typeof CATEGORIES] || []

  // Stats
  const stats = {
    total: fournisseurs.length,
    actifs: fournisseurs.filter(f => f.is_active).length,
    favoris: fournisseurs.filter(f => f.is_favorite).length,
    sousTraitants: fournisseurs.filter(f => f.type === 'sous-traitant').length,
    materiaux: fournisseurs.filter(f => f.type === 'materiaux').length,
    equipement: fournisseurs.filter(f => f.type === 'equipement').length,
    avgRating: fournisseurs.length > 0 
      ? (fournisseurs.reduce((sum, f) => sum + f.rating, 0) / fournisseurs.length).toFixed(1)
      : '0'
  }

  // Handlers
  const toggleFavorite = (id: string) => {
    setFournisseurs(prev => prev.map(f => 
      f.id === id ? { ...f, is_favorite: !f.is_favorite } : f
    ))
  }

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce fournisseur?')) {
      setFournisseurs(prev => prev.filter(f => f.id !== id))
      if (selectedFournisseur?.id === id) {
        setSelectedFournisseur(null)
      }
    }
  }

  const handleSave = (data: Partial<Fournisseur>) => {
    if (editingFournisseur) {
      setFournisseurs(prev => prev.map(f => 
        f.id === editingFournisseur.id ? { ...f, ...data, updated_at: new Date().toISOString() } : f
      ))
    } else {
      const newFournisseur: Fournisseur = {
        id: `sup-${Date.now()}`,
        name: data.name || '',
        type: data.type || 'sous-traitant',
        category: data.category || '',
        contact_name: data.contact_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        province: data.province || 'QC',
        postal_code: data.postal_code || '',
        rating: 0,
        is_favorite: false,
        is_active: true,
        specialties: data.specialties || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data
      }
      setFournisseurs(prev => [...prev, newFournisseur])
    }
    setShowModal(false)
    setEditingFournisseur(null)
  }

  const getTypeIcon = (fType: string) => {
    switch (fType) {
      case 'sous-traitant': return <Wrench size={16} className="text-blue-500" />
      case 'materiaux': return <Package size={16} className="text-emerald-500" />
      case 'equipement': return <Truck size={16} className="text-amber-500" />
      case 'services': return <Users size={16} className="text-purple-500" />
      default: return <Factory size={16} className="text-gray-500" />
    }
  }

  const getTypeBadge = (fType: string) => {
    const styles: Record<string, string> = {
      'sous-traitant': 'bg-blue-100 text-blue-700',
      'materiaux': 'bg-emerald-100 text-emerald-700',
      'equipement': 'bg-amber-100 text-amber-700',
      'services': 'bg-purple-100 text-purple-700'
    }
    const labels: Record<string, string> = {
      'sous-traitant': 'Sous-traitant',
      'materiaux': 'Matériaux',
      'equipement': 'Équipement',
      'services': 'Services'
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${styles[fType] || 'bg-gray-100 text-gray-700'}`}>
        {labels[fType] || fType}
      </span>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const getFournisseurEvaluations = (supplierId: string) => {
    return evaluations.filter(e => e.supplier_id === supplierId)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Factory className="text-teal-600" />
            Gestion des Fournisseurs
          </h1>
          <p className="text-gray-500">Sous-traitants, matériaux, équipements et services</p>
        </div>
        <button
          onClick={() => {
            setEditingFournisseur(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau fournisseur
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Actifs</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.actifs}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Favoris</p>
          <p className="text-2xl font-bold text-amber-600">{stats.favoris}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Sous-traitants</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sousTraitants}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Matériaux</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.materiaux}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Équipement</p>
          <p className="text-2xl font-bold text-amber-600">{stats.equipement}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Note moy.</p>
          <p className="text-2xl font-bold text-purple-600">{stats.avgRating}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('liste')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'liste' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          Liste des fournisseurs
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'evaluations' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          Évaluations
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 px-1 border-b-2 transition ${
            activeTab === 'stats' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500'
          }`}
        >
          Statistiques
        </button>
      </div>

      {/* Tab: Liste */}
      {activeTab === 'liste' && (
        <div className="flex gap-6">
          {/* Left: Liste */}
          <div className="flex-1">
            {/* Filtres */}
            <div className="bg-white rounded-xl border p-4 mb-4">
              <div className="flex flex-wrap gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setSelectedCategory('all')
                  }}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="all">Tous les types</option>
                  <option value="sous-traitant">Sous-traitants</option>
                  <option value="materiaux">Matériaux</option>
                  <option value="equipement">Équipement</option>
                  <option value="services">Services</option>
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="all">Toutes catégories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Favorites Toggle */}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                    showFavoritesOnly ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Star size={16} className={showFavoritesOnly ? 'fill-amber-400' : ''} />
                  Favoris
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="space-y-3">
              {filteredFournisseurs.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <Factory size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Aucun fournisseur trouvé</p>
                </div>
              ) : (
                filteredFournisseurs.map(fournisseur => (
                  <div
                    key={fournisseur.id}
                    onClick={() => setSelectedFournisseur(fournisseur)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${
                      selectedFournisseur?.id === fournisseur.id ? 'ring-2 ring-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getTypeIcon(fournisseur.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{fournisseur.name}</h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(fournisseur.id)
                              }}
                              className="text-amber-400 hover:scale-110 transition"
                            >
                              <Star
                                size={16}
                                className={fournisseur.is_favorite ? 'fill-amber-400' : ''}
                              />
                            </button>
                            {fournisseur.license_verified && (
                              <span title="RBQ vérifié">
                                <Shield size={14} className="text-emerald-500" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{fournisseur.category}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {fournisseur.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {fournisseur.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getTypeBadge(fournisseur.type)}
                        <div className="mt-2">
                          {renderStars(fournisseur.rating)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Detail Panel */}
          {selectedFournisseur && (
            <div className="w-96 bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Détails</h3>
                  <button
                    onClick={() => setSelectedFournisseur(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Header */}
                <div className="text-center pb-4 border-b">
                  <div className="w-16 h-16 mx-auto mb-3 bg-teal-100 rounded-full flex items-center justify-center">
                    <Factory size={32} className="text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold">{selectedFournisseur.name}</h2>
                  <p className="text-gray-500">{selectedFournisseur.category}</p>
                  {getTypeBadge(selectedFournisseur.type)}
                  <div className="mt-2">{renderStars(selectedFournisseur.rating)}</div>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span>{selectedFournisseur.contact_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <a href={`mailto:${selectedFournisseur.email}`} className="text-teal-600 hover:underline">
                        {selectedFournisseur.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <a href={`tel:${selectedFournisseur.phone}`} className="text-teal-600 hover:underline">
                        {selectedFournisseur.phone}
                      </a>
                    </div>
                    {selectedFournisseur.website && (
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" />
                        <a href={`https://${selectedFournisseur.website}`} target="_blank" rel="noopener" className="text-teal-600 hover:underline">
                          {selectedFournisseur.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Adresse</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedFournisseur.address}</p>
                    <p>{selectedFournisseur.city}, {selectedFournisseur.province} {selectedFournisseur.postal_code}</p>
                  </div>
                </div>

                {/* RBQ */}
                {selectedFournisseur.license_rbq && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Licence RBQ</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{selectedFournisseur.license_rbq}</span>
                      {selectedFournisseur.license_verified ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded flex items-center gap-1">
                          <CheckCircle size={12} /> Vérifié
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded flex items-center gap-1">
                          <Clock size={12} /> Non vérifié
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Terms */}
                {selectedFournisseur.payment_terms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Termes de paiement</h4>
                    <p className="text-sm">{selectedFournisseur.payment_terms}</p>
                    {selectedFournisseur.credit_limit && (
                      <p className="text-sm text-gray-500">
                        Limite de crédit: {selectedFournisseur.credit_limit.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Spécialités */}
                {selectedFournisseur.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Spécialités</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedFournisseur.specialties.map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Évaluations récentes */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Évaluations récentes</h4>
                  {getFournisseurEvaluations(selectedFournisseur.id).slice(0, 2).map(evalItem => (
                    <div key={evalItem.id} className="p-2 bg-gray-50 rounded-lg mb-2 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{evalItem.project_name}</span>
                        {renderStars(evalItem.overall_rating)}
                      </div>
                      <p className="text-gray-500 text-xs">{evalItem.comments}</p>
                    </div>
                  ))}
                  {getFournisseurEvaluations(selectedFournisseur.id).length === 0 && (
                    <p className="text-sm text-gray-400">Aucune évaluation</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFournisseur(selectedFournisseur)
                      setShowModal(true)
                    }}
                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit size={14} />
                    Modifier
                  </button>
                  <button
                    onClick={() => setShowEvalModal(true)}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-1 text-sm"
                  >
                    <Star size={14} />
                    Évaluer
                  </button>
                  <button
                    onClick={() => handleDelete(selectedFournisseur.id)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Évaluations */}
      {activeTab === 'evaluations' && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Historique des évaluations</h3>
          </div>
          <div className="divide-y">
            {evaluations.map(evalItem => {
              const supplier = fournisseurs.find(f => f.id === evalItem.supplier_id)
              return (
                <div key={evalItem.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{supplier?.name || 'Fournisseur inconnu'}</h4>
                      <p className="text-sm text-gray-500">{evalItem.project_name}</p>
                    </div>
                    <div className="text-right">
                      {renderStars(evalItem.overall_rating)}
                      <p className="text-xs text-gray-400 mt-1">{evalItem.date}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Qualité:</span>
                      <span className="ml-1 font-medium">{evalItem.quality_rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Livraison:</span>
                      <span className="ml-1 font-medium">{evalItem.delivery_rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Prix:</span>
                      <span className="ml-1 font-medium">{evalItem.price_rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Communication:</span>
                      <span className="ml-1 font-medium">{evalItem.communication_rating}/5</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 italic">"{evalItem.comments}"</p>
                  <p className="mt-1 text-xs text-gray-400">Par {evalItem.evaluator}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Répartition par type</h3>
            <div className="space-y-3">
              {[
                { type: 'sous-traitant', label: 'Sous-traitants', count: stats.sousTraitants, color: 'bg-blue-500' },
                { type: 'materiaux', label: 'Matériaux', count: stats.materiaux, color: 'bg-emerald-500' },
                { type: 'equipement', label: 'Équipement', count: stats.equipement, color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${(item.count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Top fournisseurs</h3>
            <div className="space-y-3">
              {[...fournisseurs]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5)
                .map((f, i) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-gray-500">{f.category}</p>
                      </div>
                    </div>
                    {renderStars(f.rating)}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Fournisseur */}
      {showModal && (
        <FournisseurModal
          fournisseur={editingFournisseur}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingFournisseur(null)
          }}
        />
      )}

      {/* Modal Évaluation */}
      {showEvalModal && selectedFournisseur && (
        <EvaluationModal
          supplier={selectedFournisseur}
          onSave={(evalData) => {
            const newEval: Evaluation = {
              id: `eval-${Date.now()}`,
              supplier_id: selectedFournisseur.id,
              date: new Date().toISOString().split('T')[0],
              evaluator: 'Utilisateur actuel',
              ...evalData
            }
            setEvaluations(prev => [...prev, newEval])
            // Update supplier rating
            const allEvals = [...evaluations, newEval].filter(e => e.supplier_id === selectedFournisseur.id)
            const avgRating = allEvals.reduce((sum, e) => sum + e.overall_rating, 0) / allEvals.length
            setFournisseurs(prev => prev.map(f =>
              f.id === selectedFournisseur.id ? { ...f, rating: avgRating } : f
            ))
            setShowEvalModal(false)
          }}
          onClose={() => setShowEvalModal(false)}
        />
      )}
    </div>
  )
}

// Modal Fournisseur
function FournisseurModal({
  fournisseur,
  onSave,
  onClose
}: {
  fournisseur: Fournisseur | null
  onSave: (data: Partial<Fournisseur>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Fournisseur>>(fournisseur || {
    type: 'sous-traitant',
    province: 'QC',
    specialties: []
  })
  const [newSpecialty, setNewSpecialty] = useState('')

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setForm(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (index: number) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nom de l'entreprise *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any, category: '' })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="sous-traitant">Sous-traitant</option>
                <option value="materiaux">Matériaux</option>
                <option value="equipement">Équipement</option>
                <option value="services">Services</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Catégorie *</label>
              <select
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sélectionner...</option>
                {(CATEGORIES[form.type as keyof typeof CATEGORIES] || []).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact principal *</label>
              <input
                type="text"
                value={form.contact_name || ''}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone *</label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Courriel *</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Site web</label>
              <input
                type="text"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="www.example.com"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Code postal</label>
              <input
                type="text"
                value={form.postal_code || ''}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Licence RBQ</label>
              <input
                type="text"
                value={form.license_rbq || ''}
                onChange={(e) => setForm({ ...form, license_rbq: e.target.value })}
                placeholder="8001-2345-67"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Termes de paiement</label>
              <select
                value={form.payment_terms || ''}
                onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sélectionner...</option>
                {PAYMENT_TERMS.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Spécialités</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Ajouter une spécialité..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.specialties?.map((spec, i) => (
                  <span key={i} className="px-2 py-1 bg-teal-100 text-teal-700 text-sm rounded flex items-center gap-1">
                    {spec}
                    <button onClick={() => removeSpecialty(i)} className="hover:text-red-600">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            {fournisseur ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal Évaluation
function EvaluationModal({
  supplier,
  onSave,
  onClose
}: {
  supplier: Fournisseur
  onSave: (data: Omit<Evaluation, 'id' | 'supplier_id' | 'date' | 'evaluator'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    project_name: '',
    quality_rating: 4,
    delivery_rating: 4,
    price_rating: 4,
    communication_rating: 4,
    comments: ''
  })

  const overall = (form.quality_rating + form.delivery_rating + form.price_rating + form.communication_rating) / 4

  const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star
              size={24}
              className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Évaluer {supplier.name}</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Projet (optionnel)</label>
            <input
              type="text"
              value={form.project_name}
              onChange={(e) => setForm({ ...form, project_name: e.target.value })}
              placeholder="Nom du projet..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <RatingInput
              label="Qualité du travail"
              value={form.quality_rating}
              onChange={(v) => setForm({ ...form, quality_rating: v })}
            />
            <RatingInput
              label="Respect des délais"
              value={form.delivery_rating}
              onChange={(v) => setForm({ ...form, delivery_rating: v })}
            />
            <RatingInput
              label="Prix / Valeur"
              value={form.price_rating}
              onChange={(v) => setForm({ ...form, price_rating: v })}
            />
            <RatingInput
              label="Communication"
              value={form.communication_rating}
              onChange={(v) => setForm({ ...form, communication_rating: v })}
            />
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Note globale</p>
            <p className="text-3xl font-bold text-teal-600">{overall.toFixed(1)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Commentaires</label>
            <textarea
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Vos commentaires sur cette collaboration..."
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onSave({ ...form, overall_rating: overall })}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
