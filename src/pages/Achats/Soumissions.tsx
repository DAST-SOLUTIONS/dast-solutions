/**
 * DAST Solutions - Phase 6A: Module Soumissions & Appels d'offres
 * Gestion complète des demandes de prix et soumissions aux sous-traitants
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, Send, FileText, Building2, Calendar,
  Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Edit2, Trash2,
  Download, Mail, Phone, DollarSign, Users, Package, Filter,
  ChevronDown, ChevronRight, Copy, ExternalLink, BarChart3,
  Award, TrendingUp, TrendingDown, Minus
} from 'lucide-react'

// Types
interface BidPackage {
  id: string
  project_id: string
  package_number: string
  name: string
  description?: string
  trade_category: string
  scope_of_work: string
  
  // Dates
  issue_date: string
  due_date: string
  site_visit_date?: string
  award_date?: string
  
  // Montants
  budget_estimate?: number
  awarded_amount?: number
  
  // Status
  status: 'draft' | 'issued' | 'closed' | 'evaluating' | 'awarded' | 'cancelled'
  
  // Documents
  documents?: string[]
  drawings?: string[]
  specifications?: string[]
  
  // Stats
  invitations_count: number
  responses_count: number
  
  created_at: string
  updated_at: string
}

interface BidInvitation {
  id: string
  bid_package_id: string
  company_id: string
  company_name?: string
  company_email?: string
  company_phone?: string
  
  // Status
  status: 'pending' | 'sent' | 'viewed' | 'declined' | 'submitted'
  sent_at?: string
  viewed_at?: string
  responded_at?: string
  
  // Response
  bid_amount?: number
  bid_notes?: string
  inclusions?: string
  exclusions?: string
  alternates?: string
  validity_days?: number
  
  // Evaluation
  score?: number
  ranking?: number
  is_selected: boolean
  evaluation_notes?: string
  
  created_at: string
}

// Catégories de métiers
const TRADE_CATEGORIES = [
  { value: 'demolition', label: 'Démolition' },
  { value: 'excavation', label: 'Excavation & Terrassement' },
  { value: 'concrete', label: 'Béton' },
  { value: 'masonry', label: 'Maçonnerie' },
  { value: 'structural_steel', label: 'Acier structural' },
  { value: 'carpentry', label: 'Charpenterie' },
  { value: 'roofing', label: 'Toiture' },
  { value: 'waterproofing', label: 'Imperméabilisation' },
  { value: 'insulation', label: 'Isolation' },
  { value: 'doors_windows', label: 'Portes & Fenêtres' },
  { value: 'drywall', label: 'Gypse & Joints' },
  { value: 'flooring', label: 'Revêtements de sol' },
  { value: 'painting', label: 'Peinture' },
  { value: 'specialties', label: 'Spécialités' },
  { value: 'equipment', label: 'Équipements' },
  { value: 'mechanical', label: 'Mécanique (CVAC)' },
  { value: 'plumbing', label: 'Plomberie' },
  { value: 'electrical', label: 'Électricité' },
  { value: 'fire_protection', label: 'Protection incendie' },
  { value: 'elevator', label: 'Ascenseur' },
  { value: 'landscaping', label: 'Aménagement paysager' },
]

// Status badges
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-600', label: 'Brouillon' },
    issued: { className: 'bg-blue-100 text-blue-700', label: 'Émis' },
    closed: { className: 'bg-amber-100 text-amber-700', label: 'Fermé' },
    evaluating: { className: 'bg-purple-100 text-purple-700', label: 'Évaluation' },
    awarded: { className: 'bg-green-100 text-green-700', label: 'Adjugé' },
    cancelled: { className: 'bg-red-100 text-red-700', label: 'Annulé' },
    pending: { className: 'bg-gray-100 text-gray-600', label: 'En attente' },
    sent: { className: 'bg-blue-100 text-blue-700', label: 'Envoyé' },
    viewed: { className: 'bg-cyan-100 text-cyan-700', label: 'Consulté' },
    declined: { className: 'bg-red-100 text-red-700', label: 'Décliné' },
    submitted: { className: 'bg-green-100 text-green-700', label: 'Soumis' },
  }
  const config = configs[status] || configs.draft
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function Soumissions() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<'packages' | 'invitations' | 'comparison'>('packages')
  const [bidPackages, setBidPackages] = useState<BidPackage[]>([])
  const [invitations, setInvitations] = useState<BidInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<BidPackage | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const [stats, setStats] = useState({
    totalPackages: 0,
    issued: 0,
    awarded: 0,
    totalBudget: 0,
    totalAwarded: 0
  })

  // Formulaire package
  const [packageForm, setPackageForm] = useState({
    name: '',
    trade_category: 'concrete',
    description: '',
    scope_of_work: '',
    budget_estimate: 0,
    due_date: '',
    site_visit_date: ''
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les packages de soumission
      let query = supabase
        .from('bid_packages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: packagesData } = await query
      setBidPackages(packagesData || [])

      // Charger les invitations
      const packageIds = (packagesData || []).map(p => p.id)
      if (packageIds.length > 0) {
        const { data: invitationsData } = await supabase
          .from('bid_invitations')
          .select('*')
          .in('bid_package_id', packageIds)

        setInvitations(invitationsData || [])
      }

      // Charger les entreprises pour les invitations
      const { data: companiesData } = await supabase
        .from('companies_quebec')
        .select('id, name, email, phone, specialties, rbq_license, rbq_status')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      setCompanies(companiesData || [])

      // Calculer les stats
      if (packagesData) {
        setStats({
          totalPackages: packagesData.length,
          issued: packagesData.filter(p => p.status === 'issued').length,
          awarded: packagesData.filter(p => p.status === 'awarded').length,
          totalBudget: packagesData.reduce((sum, p) => sum + (p.budget_estimate || 0), 0),
          totalAwarded: packagesData.reduce((sum, p) => sum + (p.awarded_amount || 0), 0)
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const packageNumber = `PKG-${String(bidPackages.length + 1).padStart(3, '0')}`

    const newPackage = {
      ...packageForm,
      user_id: user.id,
      project_id: projectId || null,
      package_number: packageNumber,
      issue_date: new Date().toISOString(),
      status: 'draft',
      invitations_count: 0,
      responses_count: 0
    }

    const { data, error } = await supabase
      .from('bid_packages')
      .insert(newPackage)
      .select()
      .single()

    if (!error && data) {
      setBidPackages([data, ...bidPackages])
      setShowPackageModal(false)
      resetPackageForm()
    }
  }

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      trade_category: 'concrete',
      description: '',
      scope_of_work: '',
      budget_estimate: 0,
      due_date: '',
      site_visit_date: ''
    })
  }

  const handleSendInvitations = async (selectedCompanyIds: string[]) => {
    if (!selectedPackage) return

    const newInvitations = selectedCompanyIds.map(companyId => {
      const company = companies.find(c => c.id === companyId)
      return {
        bid_package_id: selectedPackage.id,
        company_id: companyId,
        company_name: company?.name,
        company_email: company?.email,
        company_phone: company?.phone,
        status: 'sent',
        sent_at: new Date().toISOString(),
        is_selected: false
      }
    })

    const { data, error } = await supabase
      .from('bid_invitations')
      .insert(newInvitations)
      .select()

    if (!error && data) {
      setInvitations([...invitations, ...data])
      
      // Mettre à jour le compteur d'invitations
      await supabase
        .from('bid_packages')
        .update({ 
          invitations_count: (selectedPackage.invitations_count || 0) + selectedCompanyIds.length,
          status: 'issued'
        })
        .eq('id', selectedPackage.id)

      setShowInviteModal(false)
      loadData()
    }
  }

  const handleAwardBid = async (invitation: BidInvitation) => {
    if (!invitation.bid_amount) return

    // Marquer l'invitation comme sélectionnée
    await supabase
      .from('bid_invitations')
      .update({ is_selected: true })
      .eq('id', invitation.id)

    // Mettre à jour le package
    await supabase
      .from('bid_packages')
      .update({ 
        status: 'awarded',
        awarded_amount: invitation.bid_amount,
        award_date: new Date().toISOString()
      })
      .eq('id', invitation.bid_package_id)

    loadData()
  }

  const getPackageInvitations = (packageId: string) => {
    return invitations.filter(inv => inv.bid_package_id === packageId)
  }

  const filteredPackages = bidPackages.filter(pkg => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return pkg.name.toLowerCase().includes(q) ||
           pkg.package_number.toLowerCase().includes(q) ||
           pkg.trade_category.toLowerCase().includes(q)
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
            <Send className="text-blue-600" />
            Soumissions & Appels d'offres
          </h1>
          <p className="text-gray-500">Gestion des demandes de prix aux sous-traitants</p>
        </div>
        <button
          onClick={() => setShowPackageModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPackages}</p>
              <p className="text-sm text-gray-500">Packages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Send className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.issued}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.awarded}</p>
              <p className="text-sm text-gray-500">Adjugés</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{(stats.totalBudget / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-500">Budget total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <TrendingDown className="text-teal-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats.totalBudget > 0 
                  ? ((1 - stats.totalAwarded / stats.totalBudget) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">Économies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'packages', label: 'Packages', icon: Package },
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'comparison', label: 'Comparaison', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <Package className="mx-auto mb-3 text-gray-300" size={48} />
              <p>Aucun package de soumission</p>
              <button
                onClick={() => setShowPackageModal(true)}
                className="mt-2 text-teal-600 hover:underline"
              >
                Créer votre premier package
              </button>
            </div>
          ) : (
            filteredPackages.map(pkg => {
              const pkgInvitations = getPackageInvitations(pkg.id)
              const submissions = pkgInvitations.filter(inv => inv.status === 'submitted')
              const lowestBid = submissions.length > 0 
                ? Math.min(...submissions.map(s => s.bid_amount || Infinity))
                : null
              
              return (
                <div key={pkg.id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Package className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-400">{pkg.package_number}</span>
                          <h3 className="font-semibold">{pkg.name}</h3>
                          <StatusBadge status={pkg.status} />
                        </div>
                        <p className="text-sm text-gray-500">
                          {TRADE_CATEGORIES.find(t => t.value === pkg.trade_category)?.label} • 
                          Échéance: {new Date(pkg.due_date).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">{pkgInvitations.length}</p>
                        <p className="text-xs text-gray-500">Invités</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{submissions.length}</p>
                        <p className="text-xs text-gray-500">Soumis</p>
                      </div>
                      {pkg.budget_estimate && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-700">
                            {pkg.budget_estimate.toLocaleString('fr-CA')} $
                          </p>
                          <p className="text-xs text-gray-500">Budget</p>
                        </div>
                      )}
                      {lowestBid && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-teal-600">
                            {lowestBid.toLocaleString('fr-CA')} $
                          </p>
                          <p className="text-xs text-gray-500">+ bas</p>
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setSelectedPackage(pkg)
                            setShowInviteModal(true)
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Inviter des entreprises"
                        >
                          <Users size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voir">
                          <Eye size={18} className="text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Modifier">
                          <Edit2 size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Liste des soumissions reçues */}
                  {submissions.length > 0 && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Soumissions reçues</h4>
                      <div className="space-y-2">
                        {submissions
                          .sort((a, b) => (a.bid_amount || 0) - (b.bid_amount || 0))
                          .map((sub, idx) => (
                            <div 
                              key={sub.id} 
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-white border'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {idx === 0 && <Award className="text-green-600" size={18} />}
                                <span className="font-medium">{sub.company_name}</span>
                                {sub.is_selected && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                    Adjugé
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`font-bold ${idx === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                  {sub.bid_amount?.toLocaleString('fr-CA')} $
                                </span>
                                {pkg.budget_estimate && sub.bid_amount && (
                                  <span className={`text-sm ${
                                    sub.bid_amount < pkg.budget_estimate ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {sub.bid_amount < pkg.budget_estimate ? (
                                      <TrendingDown size={14} className="inline" />
                                    ) : (
                                      <TrendingUp size={14} className="inline" />
                                    )}
                                    {' '}
                                    {Math.abs(((sub.bid_amount - pkg.budget_estimate) / pkg.budget_estimate) * 100).toFixed(1)}%
                                  </span>
                                )}
                                {!sub.is_selected && pkg.status !== 'awarded' && (
                                  <button
                                    onClick={() => handleAwardBid(sub)}
                                    className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
                                  >
                                    Adjuger
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Package</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Entreprise</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Montant</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Aucune invitation envoyée
                  </td>
                </tr>
              ) : (
                invitations.map(inv => {
                  const pkg = bidPackages.find(p => p.id === inv.bid_package_id)
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{pkg?.package_number}</span>
                        <p className="text-sm text-gray-500">{pkg?.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{inv.company_name}</p>
                        <p className="text-sm text-gray-500">{inv.company_email}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.bid_amount ? (
                          <span className="font-bold text-teal-600">
                            {inv.bid_amount.toLocaleString('fr-CA')} $
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {inv.sent_at && new Date(inv.sent_at).toLocaleDateString('fr-CA')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4">Tableau comparatif des soumissions</h3>
          {/* Tableau de comparaison à implémenter */}
          <p className="text-gray-500 text-center py-8">
            Sélectionnez un package pour voir la comparaison des soumissions
          </p>
        </div>
      )}

      {/* Modal Nouveau Package */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouveau package de soumission</h2>
              <button onClick={() => setShowPackageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du package *</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Travaux de maçonnerie - Phase 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie de métier</label>
                  <select
                    value={packageForm.trade_category}
                    onChange={(e) => setPackageForm({...packageForm, trade_category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {TRADE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Budget estimé</label>
                  <input
                    type="number"
                    value={packageForm.budget_estimate}
                    onChange={(e) => setPackageForm({...packageForm, budget_estimate: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date limite *</label>
                  <input
                    type="date"
                    value={packageForm.due_date}
                    onChange={(e) => setPackageForm({...packageForm, due_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Visite de chantier</label>
                  <input
                    type="date"
                    value={packageForm.site_visit_date}
                    onChange={(e) => setPackageForm({...packageForm, site_visit_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Portée des travaux</label>
                <textarea
                  value={packageForm.scope_of_work}
                  onChange={(e) => setPackageForm({...packageForm, scope_of_work: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Décrivez en détail les travaux inclus dans ce package..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowPackageModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreatePackage}
                disabled={!packageForm.name || !packageForm.due_date}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Créer le package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inviter des entreprises */}
      {showInviteModal && selectedPackage && (
        <InviteCompaniesModal
          package_={selectedPackage}
          companies={companies}
          existingInvitations={getPackageInvitations(selectedPackage.id)}
          onClose={() => setShowInviteModal(false)}
          onSend={handleSendInvitations}
        />
      )}
    </div>
  )
}

// Composant Modal pour inviter des entreprises
function InviteCompaniesModal({ 
  package_, 
  companies, 
  existingInvitations,
  onClose, 
  onSend 
}: {
  package_: BidPackage
  companies: any[]
  existingInvitations: BidInvitation[]
  onClose: () => void
  onSend: (companyIds: string[]) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const alreadyInvitedIds = existingInvitations.map(inv => inv.company_id)
  
  const availableCompanies = companies.filter(c => !alreadyInvitedIds.includes(c.id))
  
  const filteredCompanies = availableCompanies.filter(c => {
    if (!searchQuery) return true
    return c.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Inviter des entreprises</h2>
          <p className="text-sm text-gray-500 mt-1">
            Package: {package_.package_number} - {package_.name}
          </p>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredCompanies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {availableCompanies.length === 0 
                ? 'Toutes les entreprises ont déjà été invitées'
                : 'Aucune entreprise trouvée'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCompanies.map(company => (
                <label 
                  key={company.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    selectedIds.includes(company.id) 
                      ? 'border-teal-500 bg-teal-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(company.id)}
                    onChange={() => toggleSelect(company.id)}
                    className="rounded text-teal-600"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.email}</p>
                  </div>
                  {company.rbq_status === 'active' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      RBQ ✓
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {selectedIds.length} entreprise(s) sélectionnée(s)
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={() => onSend(selectedIds)}
              disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={16} />
              Envoyer les invitations
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
