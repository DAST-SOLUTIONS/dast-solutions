/**
 * DAST Solutions - Phase 7A: Module Contrats
 * Gestion complète des contrats clients et sous-traitants
 * Inclut: Contrats, Avenants, Retenues, Templates CCDC/ACC
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, FileText, Building2, Calendar,
  Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Edit2,
  Trash2, Download, Send, DollarSign, Users, Filter,
  ChevronDown, ChevronRight, Printer, Copy, MoreVertical,
  FileSignature, Scale, Percent, TrendingUp, TrendingDown,
  AlertCircle, Lock, Unlock, History, PlusCircle
} from 'lucide-react'

// Types
interface Contract {
  id: string
  project_id?: string
  contract_number: string
  contract_type: 'client' | 'subcontract'
  
  // Parties
  client_name?: string
  client_contact?: string
  contractor_id?: string
  contractor_name?: string
  
  // Description
  title: string
  description?: string
  scope_of_work?: string
  
  // Montants
  original_amount: number
  approved_changes: number
  current_amount: number
  billed_to_date: number
  paid_to_date: number
  
  // Retenues
  holdback_percent: number
  holdback_amount: number
  holdback_released: number
  
  // Dates
  start_date: string
  end_date?: string
  signed_date?: string
  
  // Status
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated' | 'suspended'
  
  // Template
  template_type?: 'ccdc2' | 'ccdc5a' | 'ccdc14' | 'acc' | 'custom'
  
  // Documents
  documents?: string[]
  
  notes?: string
  created_at: string
  updated_at: string
}

interface ChangeOrder {
  id: string
  contract_id: string
  co_number: string
  title: string
  description?: string
  reason: string
  
  // Montants
  amount: number
  days_extension: number
  
  // Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  
  // Approbation
  submitted_date?: string
  approved_date?: string
  approved_by?: string
  
  created_at: string
}

interface HoldbackRelease {
  id: string
  contract_id: string
  release_number: string
  amount: number
  release_date: string
  reason: string
  status: 'pending' | 'approved' | 'released'
  notes?: string
  created_at: string
}

// Templates de contrats
const CONTRACT_TEMPLATES = [
  { value: 'ccdc2', label: 'CCDC 2 - Contrat à forfait', description: 'Contrat type pour travaux à prix fixe' },
  { value: 'ccdc5a', label: 'CCDC 5A - Construction Management', description: 'Gérance de construction' },
  { value: 'ccdc14', label: 'CCDC 14 - Design-Build', description: 'Conception-construction' },
  { value: 'acc', label: 'ACC - Association Construction', description: 'Template Association de la construction' },
  { value: 'custom', label: 'Personnalisé', description: 'Contrat sur mesure' },
]

// Status badges
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-600', label: 'Brouillon' },
    pending_signature: { className: 'bg-amber-100 text-amber-700', label: 'En signature' },
    active: { className: 'bg-green-100 text-green-700', label: 'Actif' },
    completed: { className: 'bg-blue-100 text-blue-700', label: 'Complété' },
    terminated: { className: 'bg-red-100 text-red-700', label: 'Résilié' },
    suspended: { className: 'bg-purple-100 text-purple-700', label: 'Suspendu' },
    submitted: { className: 'bg-blue-100 text-blue-700', label: 'Soumis' },
    approved: { className: 'bg-green-100 text-green-700', label: 'Approuvé' },
    rejected: { className: 'bg-red-100 text-red-700', label: 'Rejeté' },
    pending: { className: 'bg-amber-100 text-amber-700', label: 'En attente' },
    released: { className: 'bg-green-100 text-green-700', label: 'Libéré' },
  }
  const config = configs[status] || configs.draft
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default function Contrats() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<'client' | 'subcontracts' | 'changes' | 'holdbacks'>('client')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [holdbackReleases, setHoldbackReleases] = useState<HoldbackRelease[]>([])
  const [loading, setLoading] = useState(true)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showCOModal, setShowCOModal] = useState(false)
  const [showHoldbackModal, setShowHoldbackModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [contractType, setContractType] = useState<'client' | 'subcontract'>('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [companies, setCompanies] = useState<any[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    totalValue: 0,
    totalHoldback: 0,
    pendingChanges: 0
  })

  // Formulaire contrat
  const [contractForm, setContractForm] = useState({
    contract_type: 'client' as 'client' | 'subcontract',
    title: '',
    client_name: '',
    contractor_id: '',
    description: '',
    scope_of_work: '',
    original_amount: 0,
    holdback_percent: 10,
    start_date: '',
    end_date: '',
    template_type: 'ccdc2'
  })

  // Formulaire avenant
  const [coForm, setCOForm] = useState({
    contract_id: '',
    title: '',
    description: '',
    reason: '',
    amount: 0,
    days_extension: 0
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les contrats
      let query = supabase
        .from('contracts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data: contractsData } = await query
      setContracts(contractsData || [])

      // Charger les avenants
      const contractIds = (contractsData || []).map(c => c.id)
      if (contractIds.length > 0) {
        const { data: cosData } = await supabase
          .from('change_orders_contract')
          .select('*')
          .in('contract_id', contractIds)
          .order('created_at', { ascending: false })
        
        setChangeOrders(cosData || [])

        const { data: holdbacksData } = await supabase
          .from('holdback_releases')
          .select('*')
          .in('contract_id', contractIds)
          .order('created_at', { ascending: false })
        
        setHoldbackReleases(holdbacksData || [])
      }

      // Charger les entreprises pour sous-contrats
      const { data: companiesData } = await supabase
        .from('companies_quebec')
        .select('id, name, email, phone, rbq_license')
        .eq('user_id', user.id)
        .in('company_type', ['subcontractor', 'specialty_contractor'])
        .eq('is_active', true)
        .order('name')

      setCompanies(companiesData || [])

      // Calculer les stats
      if (contractsData) {
        const active = contractsData.filter(c => c.status === 'active')
        setStats({
          totalContracts: contractsData.length,
          activeContracts: active.length,
          totalValue: contractsData.reduce((sum, c) => sum + (c.current_amount || c.original_amount || 0), 0),
          totalHoldback: contractsData.reduce((sum, c) => sum + ((c.holdback_amount || 0) - (c.holdback_released || 0)), 0),
          pendingChanges: (changeOrders || []).filter(co => co.status === 'submitted').length
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateContractNumber = (type: 'client' | 'subcontract') => {
    const prefix = type === 'client' ? 'CTR' : 'SC'
    const year = new Date().getFullYear()
    const count = contracts.filter(c => c.contract_type === type).length + 1
    return `${prefix}-${year}-${String(count).padStart(3, '0')}`
  }

  const handleCreateContract = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const company = companies.find(c => c.id === contractForm.contractor_id)
    const holdbackAmount = contractForm.original_amount * (contractForm.holdback_percent / 100)

    const newContract = {
      user_id: user.id,
      project_id: projectId || null,
      contract_number: generateContractNumber(contractForm.contract_type),
      contract_type: contractForm.contract_type,
      title: contractForm.title,
      client_name: contractForm.contract_type === 'client' ? contractForm.client_name : null,
      contractor_id: contractForm.contract_type === 'subcontract' ? contractForm.contractor_id : null,
      contractor_name: company?.name || null,
      description: contractForm.description,
      scope_of_work: contractForm.scope_of_work,
      original_amount: contractForm.original_amount,
      approved_changes: 0,
      current_amount: contractForm.original_amount,
      billed_to_date: 0,
      paid_to_date: 0,
      holdback_percent: contractForm.holdback_percent,
      holdback_amount: holdbackAmount,
      holdback_released: 0,
      start_date: contractForm.start_date,
      end_date: contractForm.end_date || null,
      template_type: contractForm.template_type,
      status: 'draft'
    }

    const { data, error } = await supabase
      .from('contracts')
      .insert(newContract)
      .select()
      .single()

    if (!error && data) {
      setContracts([data, ...contracts])
      setShowContractModal(false)
      resetContractForm()
    }
  }

  const handleCreateChangeOrder = async () => {
    if (!coForm.contract_id) return

    const contract = contracts.find(c => c.id === coForm.contract_id)
    const coCount = changeOrders.filter(co => co.contract_id === coForm.contract_id).length + 1

    const newCO = {
      contract_id: coForm.contract_id,
      co_number: `CO-${String(coCount).padStart(2, '0')}`,
      title: coForm.title,
      description: coForm.description,
      reason: coForm.reason,
      amount: coForm.amount,
      days_extension: coForm.days_extension,
      status: 'draft',
      submitted_date: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('change_orders_contract')
      .insert(newCO)
      .select()
      .single()

    if (!error && data) {
      setChangeOrders([data, ...changeOrders])
      setShowCOModal(false)
      resetCOForm()
    }
  }

  const handleApproveChangeOrder = async (co: ChangeOrder) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Mettre à jour l'avenant
    await supabase
      .from('change_orders_contract')
      .update({ 
        status: 'approved',
        approved_date: new Date().toISOString(),
        approved_by: user?.email
      })
      .eq('id', co.id)

    // Mettre à jour le contrat
    const contract = contracts.find(c => c.id === co.contract_id)
    if (contract) {
      const newApprovedChanges = (contract.approved_changes || 0) + co.amount
      const newCurrentAmount = contract.original_amount + newApprovedChanges
      const newHoldback = newCurrentAmount * (contract.holdback_percent / 100)
      
      await supabase
        .from('contracts')
        .update({ 
          approved_changes: newApprovedChanges,
          current_amount: newCurrentAmount,
          holdback_amount: newHoldback,
          updated_at: new Date().toISOString()
        })
        .eq('id', co.contract_id)
    }

    loadData()
  }

  const resetContractForm = () => {
    setContractForm({
      contract_type: 'client',
      title: '',
      client_name: '',
      contractor_id: '',
      description: '',
      scope_of_work: '',
      original_amount: 0,
      holdback_percent: 10,
      start_date: '',
      end_date: '',
      template_type: 'ccdc2'
    })
  }

  const resetCOForm = () => {
    setCOForm({
      contract_id: '',
      title: '',
      description: '',
      reason: '',
      amount: 0,
      days_extension: 0
    })
  }

  const clientContracts = contracts.filter(c => c.contract_type === 'client')
  const subContracts = contracts.filter(c => c.contract_type === 'subcontract')

  const filteredContracts = (activeTab === 'client' ? clientContracts : subContracts).filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return c.contract_number.toLowerCase().includes(q) ||
           c.title.toLowerCase().includes(q) ||
           c.client_name?.toLowerCase().includes(q) ||
           c.contractor_name?.toLowerCase().includes(q)
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
            <FileSignature className="text-indigo-600" />
            Contrats
          </h1>
          <p className="text-gray-500">Gestion des contrats clients et sous-traitants</p>
        </div>
        <button
          onClick={() => {
            setContractType(activeTab === 'subcontracts' ? 'subcontract' : 'client')
            setContractForm({...contractForm, contract_type: activeTab === 'subcontracts' ? 'subcontract' : 'client'})
            setShowContractModal(true)
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Nouveau contrat
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalContracts}</p>
              <p className="text-sm text-gray-500">Contrats</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeContracts}</p>
              <p className="text-sm text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{(stats.totalValue / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-gray-500">Valeur totale</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{(stats.totalHoldback / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-500">Retenues</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingChanges}</p>
              <p className="text-sm text-gray-500">Avenants en attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'client', label: 'Contrats clients', icon: Building2, count: clientContracts.length },
          { id: 'subcontracts', label: 'Sous-contrats', icon: Users, count: subContracts.length },
          { id: 'changes', label: 'Avenants', icon: FileText, count: changeOrders.length },
          { id: 'holdbacks', label: 'Retenues', icon: Lock, count: holdbackReleases.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un contrat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Contenu - Contrats */}
      {(activeTab === 'client' || activeTab === 'subcontracts') && (
        <div className="space-y-4">
          {filteredContracts.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <FileSignature className="mx-auto mb-3 text-gray-300" size={48} />
              <p>Aucun {activeTab === 'client' ? 'contrat client' : 'sous-contrat'}</p>
              <button
                onClick={() => {
                  setContractForm({...contractForm, contract_type: activeTab === 'subcontracts' ? 'subcontract' : 'client'})
                  setShowContractModal(true)
                }}
                className="mt-2 text-indigo-600 hover:underline"
              >
                Créer votre premier contrat
              </button>
            </div>
          ) : (
            filteredContracts.map(contract => {
              const progress = contract.current_amount > 0 
                ? ((contract.billed_to_date || 0) / contract.current_amount) * 100 
                : 0
              const contractCOs = changeOrders.filter(co => co.contract_id === contract.id)
              const pendingCOs = contractCOs.filter(co => co.status === 'submitted').length
              
              return (
                <div key={contract.id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        contract.contract_type === 'client' ? 'bg-indigo-100' : 'bg-orange-100'
                      }`}>
                        {contract.contract_type === 'client' 
                          ? <Building2 className="text-indigo-600" size={24} />
                          : <Users className="text-orange-600" size={24} />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-400">{contract.contract_number}</span>
                          <h3 className="font-semibold">{contract.title}</h3>
                          <StatusBadge status={contract.status} />
                          {pendingCOs > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                              {pendingCOs} avenant(s)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {contract.contract_type === 'client' ? contract.client_name : contract.contractor_name} • 
                          {CONTRACT_TEMPLATES.find(t => t.value === contract.template_type)?.label || 'Personnalisé'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold">{contract.current_amount?.toLocaleString('fr-CA')} $</p>
                        <p className="text-xs text-gray-500">
                          {contract.approved_changes !== 0 && (
                            <span className={contract.approved_changes > 0 ? 'text-green-600' : 'text-red-600'}>
                              {contract.approved_changes > 0 ? '+' : ''}{contract.approved_changes?.toLocaleString('fr-CA')} $
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progression</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">
                          {((contract.holdback_amount || 0) - (contract.holdback_released || 0)).toLocaleString('fr-CA')} $
                        </p>
                        <p className="text-xs text-gray-500">Retenue ({contract.holdback_percent}%)</p>
                      </div>
                      
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setSelectedContract(contract)
                            setCOForm({...coForm, contract_id: contract.id})
                            setShowCOModal(true)
                          }}
                          className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600"
                          title="Ajouter un avenant"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voir">
                          <Eye size={18} className="text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Imprimer">
                          <Printer size={18} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Avenants du contrat */}
                  {contractCOs.length > 0 && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Avenants</h4>
                      <div className="space-y-2">
                        {contractCOs.map(co => (
                          <div key={co.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm">{co.co_number}</span>
                              <span className="font-medium">{co.title}</span>
                              <StatusBadge status={co.status} />
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`font-bold ${co.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {co.amount >= 0 ? '+' : ''}{co.amount.toLocaleString('fr-CA')} $
                              </span>
                              {co.days_extension > 0 && (
                                <span className="text-sm text-gray-500">+{co.days_extension} jours</span>
                              )}
                              {co.status === 'submitted' && (
                                <button
                                  onClick={() => handleApproveChangeOrder(co)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Approuver
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

      {/* Contenu - Avenants */}
      {activeTab === 'changes' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">N° Avenant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contrat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Titre</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Montant</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {changeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Aucun avenant
                  </td>
                </tr>
              ) : (
                changeOrders.map(co => {
                  const contract = contracts.find(c => c.id === co.contract_id)
                  return (
                    <tr key={co.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium">{co.co_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-400">{contract?.contract_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{co.title}</p>
                        <p className="text-sm text-gray-500">{co.reason}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={co.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${co.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {co.amount >= 0 ? '+' : ''}{co.amount.toLocaleString('fr-CA')} $
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          {co.status === 'submitted' && (
                            <button 
                              onClick={() => handleApproveChangeOrder(co)}
                              className="p-1.5 hover:bg-green-100 rounded text-green-600"
                              title="Approuver"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-gray-100 rounded" title="Voir">
                            <Eye size={16} className="text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Contenu - Retenues */}
      {activeTab === 'holdbacks' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Libérations de retenues</h3>
            <button
              onClick={() => setShowHoldbackModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1"
            >
              <Unlock size={14} />
              Nouvelle libération
            </button>
          </div>
          
          {holdbackReleases.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune libération de retenue</p>
          ) : (
            <div className="space-y-3">
              {holdbackReleases.map(release => {
                const contract = contracts.find(c => c.id === release.contract_id)
                return (
                  <div key={release.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{release.release_number}</span>
                        <span className="font-medium">{contract?.title}</span>
                        <StatusBadge status={release.status} />
                      </div>
                      <p className="text-sm text-gray-500">{release.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-600">
                        {release.amount.toLocaleString('fr-CA')} $
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(release.release_date).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Nouveau Contrat */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                Nouveau {contractForm.contract_type === 'client' ? 'contrat client' : 'sous-contrat'}
              </h2>
              <button onClick={() => setShowContractModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Type de contrat */}
              <div className="flex gap-4">
                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition ${
                  contractForm.contract_type === 'client' ? 'border-indigo-500 bg-indigo-50' : ''
                }`}>
                  <input
                    type="radio"
                    name="contract_type"
                    value="client"
                    checked={contractForm.contract_type === 'client'}
                    onChange={() => setContractForm({...contractForm, contract_type: 'client'})}
                    className="mr-2"
                  />
                  <span className="font-medium">Contrat client</span>
                </label>
                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition ${
                  contractForm.contract_type === 'subcontract' ? 'border-orange-500 bg-orange-50' : ''
                }`}>
                  <input
                    type="radio"
                    name="contract_type"
                    value="subcontract"
                    checked={contractForm.contract_type === 'subcontract'}
                    onChange={() => setContractForm({...contractForm, contract_type: 'subcontract'})}
                    className="mr-2"
                  />
                  <span className="font-medium">Sous-contrat</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre du contrat *</label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({...contractForm, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Construction Phase 1 - Fondations"
                />
              </div>

              {contractForm.contract_type === 'client' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du client *</label>
                  <input
                    type="text"
                    value={contractForm.client_name}
                    onChange={(e) => setContractForm({...contractForm, client_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Sous-traitant *</label>
                  <select
                    value={contractForm.contractor_id}
                    onChange={(e) => setContractForm({...contractForm, contractor_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner un sous-traitant...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Template de contrat</label>
                <select
                  value={contractForm.template_type}
                  onChange={(e) => setContractForm({...contractForm, template_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CONTRACT_TEMPLATES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Montant du contrat *</label>
                  <input
                    type="number"
                    value={contractForm.original_amount}
                    onChange={(e) => setContractForm({...contractForm, original_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Retenue (%)</label>
                  <input
                    type="number"
                    value={contractForm.holdback_percent}
                    onChange={(e) => setContractForm({...contractForm, holdback_percent: parseFloat(e.target.value) || 10})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <input
                    type="date"
                    value={contractForm.start_date}
                    onChange={(e) => setContractForm({...contractForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={contractForm.end_date}
                    onChange={(e) => setContractForm({...contractForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Portée des travaux</label>
                <textarea
                  value={contractForm.scope_of_work}
                  onChange={(e) => setContractForm({...contractForm, scope_of_work: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              {/* Aperçu de la retenue */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                  <Lock size={16} />
                  Retenue contractuelle
                </div>
                <p className="text-lg font-bold text-amber-800">
                  {(contractForm.original_amount * (contractForm.holdback_percent / 100)).toLocaleString('fr-CA')} $
                </p>
                <p className="text-sm text-amber-600">
                  {contractForm.holdback_percent}% de {contractForm.original_amount.toLocaleString('fr-CA')} $
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowContractModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreateContract}
                disabled={!contractForm.title || contractForm.original_amount <= 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Créer le contrat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvel Avenant */}
      {showCOModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvel avenant</h2>
              <button onClick={() => setShowCOModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedContract && (
                <div>
                  <label className="block text-sm font-medium mb-1">Contrat *</label>
                  <select
                    value={coForm.contract_id}
                    onChange={(e) => setCOForm({...coForm, contract_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner un contrat...</option>
                    {contracts.filter(c => c.status === 'active').map(c => (
                      <option key={c.id} value={c.id}>{c.contract_number} - {c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Titre de l'avenant *</label>
                <input
                  type="text"
                  value={coForm.title}
                  onChange={(e) => setCOForm({...coForm, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Raison</label>
                <select
                  value={coForm.reason}
                  onChange={(e) => setCOForm({...coForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Travaux supplémentaires">Travaux supplémentaires</option>
                  <option value="Modification au design">Modification au design</option>
                  <option value="Conditions imprévues">Conditions imprévues</option>
                  <option value="Demande du client">Demande du client</option>
                  <option value="Erreur aux plans">Erreur aux plans</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Montant ($)</label>
                  <input
                    type="number"
                    value={coForm.amount}
                    onChange={(e) => setCOForm({...coForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Positif ou négatif"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Extension (jours)</label>
                  <input
                    type="number"
                    value={coForm.days_extension}
                    onChange={(e) => setCOForm({...coForm, days_extension: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={coForm.description}
                  onChange={(e) => setCOForm({...coForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowCOModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreateChangeOrder}
                disabled={!coForm.title || (!coForm.contract_id && !selectedContract)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Créer l'avenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
