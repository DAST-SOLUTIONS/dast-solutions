/**
 * DAST Solutions - Phase 6B: Module Achats & Bons de commande
 * Gestion complète des réquisitions, PO, réceptions
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, Plus, Search, ShoppingCart, Package, Truck, CheckCircle2,
  Clock, FileText, Building2, Calendar, DollarSign, Eye, Edit2,
  Trash2, Download, Send, AlertTriangle, XCircle, Filter,
  ChevronDown, ChevronRight, Printer, Copy, MoreVertical,
  ClipboardList, Box, Receipt, TrendingUp
} from 'lucide-react'

// Types
interface PurchaseOrder {
  id: string
  project_id?: string
  po_number: string
  vendor_id: string
  vendor_name?: string
  
  // Dates
  order_date: string
  required_date?: string
  delivery_date?: string
  
  // Montants
  subtotal: number
  tax_gst: number
  tax_qst: number
  total: number
  
  // Status
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partial' | 'received' | 'closed' | 'cancelled'
  
  // Référence
  requisition_id?: string
  budget_code?: string
  cost_code?: string
  
  // Livraison
  delivery_address?: string
  delivery_instructions?: string
  
  // Approbation
  requested_by?: string
  approved_by?: string
  approved_at?: string
  
  notes?: string
  terms?: string
  
  created_at: string
  updated_at: string
}

interface POLineItem {
  id: string
  purchase_order_id: string
  line_number: number
  item_code?: string
  description: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  quantity_received: number
  budget_code?: string
  notes?: string
}

interface Requisition {
  id: string
  project_id?: string
  req_number: string
  requested_by: string
  department?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'converted'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  required_date?: string
  justification?: string
  total_estimated: number
  approved_by?: string
  approved_at?: string
  created_at: string
}

interface GoodsReceipt {
  id: string
  purchase_order_id: string
  receipt_number: string
  receipt_date: string
  received_by: string
  status: 'partial' | 'complete'
  notes?: string
  created_at: string
}

// Status badges
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-600', label: 'Brouillon' },
    pending_approval: { className: 'bg-amber-100 text-amber-700', label: 'En approbation' },
    pending: { className: 'bg-amber-100 text-amber-700', label: 'En attente' },
    approved: { className: 'bg-blue-100 text-blue-700', label: 'Approuvé' },
    sent: { className: 'bg-purple-100 text-purple-700', label: 'Envoyé' },
    partial: { className: 'bg-cyan-100 text-cyan-700', label: 'Partiel' },
    received: { className: 'bg-green-100 text-green-700', label: 'Reçu' },
    closed: { className: 'bg-gray-100 text-gray-600', label: 'Fermé' },
    cancelled: { className: 'bg-red-100 text-red-700', label: 'Annulé' },
    rejected: { className: 'bg-red-100 text-red-700', label: 'Rejeté' },
    converted: { className: 'bg-green-100 text-green-700', label: 'Converti' },
  }
  const config = configs[status] || configs.draft
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const configs: Record<string, { className: string, label: string }> = {
    low: { className: 'bg-gray-100 text-gray-600', label: 'Basse' },
    medium: { className: 'bg-blue-100 text-blue-700', label: 'Moyenne' },
    high: { className: 'bg-amber-100 text-amber-700', label: 'Haute' },
    urgent: { className: 'bg-red-100 text-red-700', label: 'Urgente' },
  }
  const config = configs[priority] || configs.medium
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

// Unités de mesure
const UNITS = [
  { value: 'ea', label: 'Unité (ea)' },
  { value: 'pcs', label: 'Pièces' },
  { value: 'm', label: 'Mètre (m)' },
  { value: 'm2', label: 'Mètre carré (m²)' },
  { value: 'm3', label: 'Mètre cube (m³)' },
  { value: 'lm', label: 'Mètre linéaire (ml)' },
  { value: 'kg', label: 'Kilogramme (kg)' },
  { value: 'tonne', label: 'Tonne' },
  { value: 'l', label: 'Litre (L)' },
  { value: 'bag', label: 'Sac' },
  { value: 'box', label: 'Boîte' },
  { value: 'pallet', label: 'Palette' },
  { value: 'roll', label: 'Rouleau' },
  { value: 'sheet', label: 'Feuille' },
  { value: 'bundle', label: 'Paquet' },
  { value: 'lot', label: 'Lot' },
  { value: 'hr', label: 'Heure' },
  { value: 'day', label: 'Jour' },
]

export default function BonsCommande() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<'orders' | 'requisitions' | 'receipts'>('orders')
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [lineItems, setLineItems] = useState<POLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPOModal, setShowPOModal] = useState(false)
  const [showReqModal, setShowReqModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [vendors, setVendors] = useState<any[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalPOs: 0,
    pending: 0,
    totalValue: 0,
    received: 0,
    openReqs: 0
  })

  // Formulaire PO
  const [poForm, setPoForm] = useState({
    vendor_id: '',
    required_date: '',
    delivery_address: '',
    notes: '',
    items: [{ description: '', unit: 'ea', quantity: 1, unit_price: 0 }] as any[]
  })

  // Formulaire Réquisition
  const [reqForm, setReqForm] = useState({
    department: '',
    priority: 'medium',
    required_date: '',
    justification: '',
    items: [{ description: '', quantity: 1, estimated_price: 0 }] as any[]
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger les POs
      let poQuery = supabase
        .from('purchase_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        poQuery = poQuery.eq('project_id', projectId)
      }

      const { data: posData } = await poQuery
      setPurchaseOrders(posData || [])

      // Charger les réquisitions
      let reqQuery = supabase
        .from('requisitions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectId) {
        reqQuery = reqQuery.eq('project_id', projectId)
      }

      const { data: reqsData } = await reqQuery
      setRequisitions(reqsData || [])

      // Charger les fournisseurs (entreprises de type supplier)
      const { data: vendorsData } = await supabase
        .from('companies_quebec')
        .select('id, name, email, phone')
        .eq('user_id', user.id)
        .in('company_type', ['supplier', 'subcontractor'])
        .eq('is_active', true)
        .order('name')

      setVendors(vendorsData || [])

      // Calculer les stats
      if (posData) {
        setStats({
          totalPOs: posData.length,
          pending: posData.filter(p => ['pending_approval', 'approved', 'sent'].includes(p.status)).length,
          totalValue: posData.reduce((sum, p) => sum + (p.total || 0), 0),
          received: posData.filter(p => p.status === 'received' || p.status === 'closed').length,
          openReqs: (reqsData || []).filter(r => r.status === 'pending' || r.status === 'approved').length
        })
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePONumber = () => {
    const year = new Date().getFullYear()
    const num = String(purchaseOrders.length + 1).padStart(4, '0')
    return `PO-${year}-${num}`
  }

  const generateReqNumber = () => {
    const year = new Date().getFullYear()
    const num = String(requisitions.length + 1).padStart(4, '0')
    return `REQ-${year}-${num}`
  }

  const calculatePOTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_gst = subtotal * 0.05  // TPS 5%
    const tax_qst = subtotal * 0.09975  // TVQ 9.975%
    const total = subtotal + tax_gst + tax_qst
    return { subtotal, tax_gst, tax_qst, total }
  }

  const handleCreatePO = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const vendor = vendors.find(v => v.id === poForm.vendor_id)
    const totals = calculatePOTotals(poForm.items)

    const newPO = {
      user_id: user.id,
      project_id: projectId || null,
      po_number: generatePONumber(),
      vendor_id: poForm.vendor_id,
      vendor_name: vendor?.name,
      order_date: new Date().toISOString(),
      required_date: poForm.required_date || null,
      delivery_address: poForm.delivery_address,
      notes: poForm.notes,
      ...totals,
      status: 'draft',
      requested_by: user.email
    }

    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .insert(newPO)
      .select()
      .single()

    if (!poError && poData) {
      // Créer les lignes
      const lines = poForm.items.map((item, idx) => ({
        purchase_order_id: poData.id,
        line_number: idx + 1,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        quantity_received: 0
      }))

      await supabase.from('po_line_items').insert(lines)

      setPurchaseOrders([poData, ...purchaseOrders])
      setShowPOModal(false)
      resetPOForm()
    }
  }

  const handleCreateRequisition = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const totalEstimated = reqForm.items.reduce((sum, item) => sum + (item.quantity * item.estimated_price), 0)

    const newReq = {
      user_id: user.id,
      project_id: projectId || null,
      req_number: generateReqNumber(),
      requested_by: user.email || 'Utilisateur',
      department: reqForm.department,
      priority: reqForm.priority,
      required_date: reqForm.required_date || null,
      justification: reqForm.justification,
      total_estimated: totalEstimated,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('requisitions')
      .insert(newReq)
      .select()
      .single()

    if (!error && data) {
      // Créer les lignes de réquisition
      const lines = reqForm.items.map((item, idx) => ({
        requisition_id: data.id,
        line_number: idx + 1,
        description: item.description,
        quantity: item.quantity,
        estimated_price: item.estimated_price
      }))

      await supabase.from('requisition_items').insert(lines)

      setRequisitions([data, ...requisitions])
      setShowReqModal(false)
      resetReqForm()
    }
  }

  const resetPOForm = () => {
    setPoForm({
      vendor_id: '',
      required_date: '',
      delivery_address: '',
      notes: '',
      items: [{ description: '', unit: 'ea', quantity: 1, unit_price: 0 }]
    })
  }

  const resetReqForm = () => {
    setReqForm({
      department: '',
      priority: 'medium',
      required_date: '',
      justification: '',
      items: [{ description: '', quantity: 1, estimated_price: 0 }]
    })
  }

  const addPOItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { description: '', unit: 'ea', quantity: 1, unit_price: 0 }]
    })
  }

  const updatePOItem = (index: number, field: string, value: any) => {
    const newItems = [...poForm.items]
    newItems[index][field] = value
    setPoForm({ ...poForm, items: newItems })
  }

  const removePOItem = (index: number) => {
    if (poForm.items.length > 1) {
      const newItems = poForm.items.filter((_, i) => i !== index)
      setPoForm({ ...poForm, items: newItems })
    }
  }

  const addReqItem = () => {
    setReqForm({
      ...reqForm,
      items: [...reqForm.items, { description: '', quantity: 1, estimated_price: 0 }]
    })
  }

  const updateReqItem = (index: number, field: string, value: any) => {
    const newItems = [...reqForm.items]
    newItems[index][field] = value
    setReqForm({ ...reqForm, items: newItems })
  }

  const handleApprovePO = async (po: PurchaseOrder) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('purchase_orders')
      .update({ 
        status: 'approved',
        approved_by: user?.email,
        approved_at: new Date().toISOString()
      })
      .eq('id', po.id)

    loadData()
  }

  const handleSendPO = async (po: PurchaseOrder) => {
    await supabase
      .from('purchase_orders')
      .update({ status: 'sent' })
      .eq('id', po.id)

    loadData()
  }

  const filteredPOs = purchaseOrders.filter(po => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return po.po_number.toLowerCase().includes(q) ||
           po.vendor_name?.toLowerCase().includes(q)
  })

  const filteredReqs = requisitions.filter(req => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return req.req_number.toLowerCase().includes(q) ||
           req.requested_by?.toLowerCase().includes(q)
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
            <ShoppingCart className="text-purple-600" />
            Achats & Bons de commande
          </h1>
          <p className="text-gray-500">Réquisitions, commandes et réceptions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReqModal(true)}
            className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2"
          >
            <ClipboardList size={16} />
            Réquisition
          </button>
          <button
            onClick={() => setShowPOModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Bon de commande
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPOs}</p>
              <p className="text-sm text-gray-500">Commandes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.received}</p>
              <p className="text-sm text-gray-500">Reçues</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{(stats.totalValue / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-500">Valeur totale</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <ClipboardList className="text-cyan-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.openReqs}</p>
              <p className="text-sm text-gray-500">Réquisitions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'orders', label: 'Bons de commande', icon: FileText, count: purchaseOrders.length },
          { id: 'requisitions', label: 'Réquisitions', icon: ClipboardList, count: requisitions.length },
          { id: 'receipts', label: 'Réceptions', icon: Box, count: receipts.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
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
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Contenu - Bons de commande */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">N° PO</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Fournisseur</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Montant</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Date requise</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ShoppingCart className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>Aucun bon de commande</p>
                    <button
                      onClick={() => setShowPOModal(true)}
                      className="mt-2 text-purple-600 hover:underline"
                    >
                      Créer votre premier bon de commande
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium">{po.po_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <span>{po.vendor_name || 'Non spécifié'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold">{po.total?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {po.required_date ? new Date(po.required_date).toLocaleDateString('fr-CA') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Voir">
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        {po.status === 'draft' && (
                          <button 
                            onClick={() => handleApprovePO(po)}
                            className="p-1.5 hover:bg-green-100 rounded" 
                            title="Approuver"
                          >
                            <CheckCircle2 size={16} className="text-green-600" />
                          </button>
                        )}
                        {po.status === 'approved' && (
                          <button 
                            onClick={() => handleSendPO(po)}
                            className="p-1.5 hover:bg-blue-100 rounded" 
                            title="Envoyer"
                          >
                            <Send size={16} className="text-blue-600" />
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Imprimer">
                          <Printer size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Contenu - Réquisitions */}
      {activeTab === 'requisitions' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">N° Réq.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Demandeur</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Priorité</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Estimé</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <ClipboardList className="mx-auto mb-3 text-gray-300" size={48} />
                    <p>Aucune réquisition</p>
                  </td>
                </tr>
              ) : (
                filteredReqs.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium">{req.req_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p>{req.requested_by}</p>
                      {req.department && (
                        <p className="text-sm text-gray-500">{req.department}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium">
                        {req.total_estimated?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Voir">
                          <Eye size={16} className="text-gray-500" />
                        </button>
                        {req.status === 'approved' && (
                          <button className="p-1.5 hover:bg-purple-100 rounded" title="Convertir en PO">
                            <ShoppingCart size={16} className="text-purple-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Contenu - Réceptions */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Box className="mx-auto mb-3 text-gray-300" size={48} />
          <p>Module de réception en développement</p>
          <p className="text-sm mt-1">Les réceptions seront liées aux bons de commande</p>
        </div>
      )}

      {/* Modal Nouveau PO */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Nouveau bon de commande</h2>
              <button onClick={() => setShowPOModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fournisseur *</label>
                  <select
                    value={poForm.vendor_id}
                    onChange={(e) => setPoForm({...poForm, vendor_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date requise</label>
                  <input
                    type="date"
                    value={poForm.required_date}
                    onChange={(e) => setPoForm({...poForm, required_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse de livraison</label>
                <input
                  type="text"
                  value={poForm.delivery_address}
                  onChange={(e) => setPoForm({...poForm, delivery_address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Adresse du chantier ou de livraison"
                />
              </div>

              {/* Lignes de commande */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium">Articles</label>
                  <button
                    onClick={addPOItem}
                    className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Ajouter une ligne
                  </button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium">Description</th>
                        <th className="text-center py-2 px-3 text-sm font-medium w-24">Unité</th>
                        <th className="text-center py-2 px-3 text-sm font-medium w-20">Qté</th>
                        <th className="text-right py-2 px-3 text-sm font-medium w-28">Prix unit.</th>
                        <th className="text-right py-2 px-3 text-sm font-medium w-28">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {poForm.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updatePOItem(idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Description de l'article"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.unit}
                              onChange={(e) => updatePOItem(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              {UNITS.map(u => (
                                <option key={u.value} value={u.value}>{u.value}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updatePOItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updatePOItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border rounded text-right"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {(item.quantity * item.unit_price).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </td>
                          <td className="py-2 px-3">
                            {poForm.items.length > 1 && (
                              <button
                                onClick={() => removePOItem(idx)}
                                className="p-1 hover:bg-red-100 rounded text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totaux */}
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sous-total:</span>
                      <span>{calculatePOTotals(poForm.items).subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TPS (5%):</span>
                      <span>{calculatePOTotals(poForm.items).tax_gst.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TVQ (9.975%):</span>
                      <span>{calculatePOTotals(poForm.items).tax_qst.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-purple-600">{calculatePOTotals(poForm.items).total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) => setPoForm({...poForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowPOModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreatePO}
                disabled={!poForm.vendor_id || poForm.items.every(i => !i.description)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Créer le bon de commande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Réquisition */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvelle réquisition</h2>
              <button onClick={() => setShowReqModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Département</label>
                  <input
                    type="text"
                    value={reqForm.department}
                    onChange={(e) => setReqForm({...reqForm, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select
                    value={reqForm.priority}
                    onChange={(e) => setReqForm({...reqForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date requise</label>
                <input
                  type="date"
                  value={reqForm.required_date}
                  onChange={(e) => setReqForm({...reqForm, required_date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Justification</label>
                <textarea
                  value={reqForm.justification}
                  onChange={(e) => setReqForm({...reqForm, justification: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Raison de la demande..."
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Articles demandés</label>
                  <button
                    onClick={addReqItem}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {reqForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateReqItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateReqItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border rounded-lg text-center"
                        placeholder="Qté"
                      />
                      <input
                        type="number"
                        value={item.estimated_price}
                        onChange={(e) => updateReqItem(idx, 'estimated_price', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 border rounded-lg text-right"
                        placeholder="Prix est."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowReqModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleCreateRequisition}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Soumettre la réquisition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
