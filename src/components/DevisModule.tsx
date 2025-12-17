/**
 * DAST Solutions - Module Devis/Soumissions Amélioré
 * Génération professionnelle avec marges, PDF, et gestion complète
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  FileText, Plus, Download, Send, Eye, Edit2, Trash2, Copy,
  DollarSign, Calculator, Percent, Save, X, Check, AlertCircle,
  Building, User, Calendar, Clock, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, Printer, FileSpreadsheet, File
} from 'lucide-react'
import { exportSoumissionToExcel } from '@/services/excelService'

// ============================================================================
// TYPES
// ============================================================================

interface SoumissionItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  category?: string
  notes?: string
}

interface SoumissionData {
  id?: string
  soumission_number: string
  project_id?: string
  project_name?: string
  client_id?: string
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  items: SoumissionItem[]
  subtotal: number
  margin_percent: number
  margin_amount: number
  total_before_tax: number
  tps: number
  tvq: number
  total: number
  validity_days: number
  conditions: string[]
  notes?: string
  created_at?: string
  sent_at?: string
  deadline?: string
}

interface DevisModuleProps {
  projectId?: string
  projectName?: string
  initialItems?: SoumissionItem[]
  onSave?: (soumission: SoumissionData) => void
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TAX_RATES = {
  TPS: 0.05,
  TVQ: 0.09975
}

const DEFAULT_CONDITIONS = [
  'Cette soumission est valide pour 30 jours à compter de la date d\'émission.',
  'Paiement: 50% à la signature du contrat, 50% à la fin des travaux.',
  'Tout travail supplémentaire non inclus dans cette soumission fera l\'objet d\'un avenant.',
  'Les prix sont sujets à changement en cas de modification des coûts des matériaux.',
  'Délai de réalisation: à confirmer selon disponibilité.'
]

const CATEGORIES = [
  'Fondation',
  'Structure',
  'Enveloppe',
  'Toiture',
  'Portes et fenêtres',
  'Mécanique',
  'Électricité',
  'Finitions',
  'Main-d\'œuvre',
  'Équipements',
  'Sous-traitants',
  'Autre'
]

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function DevisModule({ projectId, projectName, initialItems, onSave }: DevisModuleProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  // Données de la soumission
  const [soumission, setSoumission] = useState<SoumissionData>({
    soumission_number: generateSoumissionNumber(),
    project_name: projectName || '',
    client_name: '',
    status: 'draft',
    items: initialItems || [],
    subtotal: 0,
    margin_percent: 15,
    margin_amount: 0,
    total_before_tax: 0,
    tps: 0,
    tvq: 0,
    total: 0,
    validity_days: 30,
    conditions: [...DEFAULT_CONDITIONS]
  })

  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Partial<SoumissionItem>>({
    description: '',
    quantity: 1,
    unit: 'unité',
    unitPrice: 0,
    category: 'Autre'
  })

  // Charger les clients et projets
  useEffect(() => {
    loadData()
  }, [])

  // Recalculer les totaux quand les items changent
  useEffect(() => {
    calculateTotals()
  }, [soumission.items, soumission.margin_percent])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [clientsRes, projectsRes] = await Promise.all([
      supabase.from('clients').select('id, name, email, phone, address, city').eq('user_id', user.id),
      supabase.from('projects').select('id, name, client_name').eq('user_id', user.id)
    ])

    setClients(clientsRes.data || [])
    setProjects(projectsRes.data || [])
  }

  const calculateTotals = () => {
    const subtotal = soumission.items.reduce((sum, item) => sum + item.total, 0)
    const margin_amount = subtotal * (soumission.margin_percent / 100)
    const total_before_tax = subtotal + margin_amount
    const tps = total_before_tax * TAX_RATES.TPS
    const tvq = total_before_tax * TAX_RATES.TVQ
    const total = total_before_tax + tps + tvq

    setSoumission(prev => ({
      ...prev,
      subtotal,
      margin_amount,
      total_before_tax,
      tps,
      tvq,
      total
    }))
  }

  // Gestion des items
  const addItem = () => {
    if (!newItem.description) return

    const item: SoumissionItem = {
      id: `item-${Date.now()}`,
      description: newItem.description || '',
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'unité',
      unitPrice: newItem.unitPrice || 0,
      total: (newItem.quantity || 1) * (newItem.unitPrice || 0),
      category: newItem.category
    }

    setSoumission(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))

    setNewItem({
      description: '',
      quantity: 1,
      unit: 'unité',
      unitPrice: 0,
      category: 'Autre'
    })
  }

  const updateItem = (id: string, updates: Partial<SoumissionItem>) => {
    setSoumission(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          updated.total = updated.quantity * updated.unitPrice
          return updated
        }
        return item
      })
    }))
  }

  const removeItem = (id: string) => {
    setSoumission(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const duplicateItem = (id: string) => {
    const item = soumission.items.find(i => i.id === id)
    if (!item) return

    const newItem: SoumissionItem = {
      ...item,
      id: `item-${Date.now()}`
    }

    setSoumission(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  // Sélection client
  const selectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    setSoumission(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      client_phone: client.phone,
      client_address: `${client.address || ''}, ${client.city || ''}`
    }))
  }

  // Sélection projet
  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    setSoumission(prev => ({
      ...prev,
      project_id: project.id,
      project_name: project.name,
      client_name: prev.client_name || project.client_name || ''
    }))
  }

  // Sauvegarder
  const saveSoumission = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const soumissionData = {
        user_id: user.id,
        soumission_number: soumission.soumission_number,
        project_id: soumission.project_id,
        client_id: soumission.client_id,
        client_name: soumission.client_name,
        client_email: soumission.client_email,
        client_phone: soumission.client_phone,
        client_address: soumission.client_address,
        status: soumission.status,
        items: soumission.items,
        subtotal: soumission.subtotal,
        margin_percent: soumission.margin_percent,
        margin_amount: soumission.margin_amount,
        total_before_tax: soumission.total_before_tax,
        tps: soumission.tps,
        tvq: soumission.tvq,
        total: soumission.total,
        validity_days: soumission.validity_days,
        conditions: soumission.conditions,
        notes: soumission.notes,
        deadline: soumission.deadline
      }

      if (soumission.id) {
        await supabase.from('soumissions').update(soumissionData).eq('id', soumission.id)
      } else {
        const { data } = await supabase.from('soumissions').insert(soumissionData).select().single()
        if (data) {
          setSoumission(prev => ({ ...prev, id: data.id }))
        }
      }

      if (onSave) onSave(soumission)
      alert('Soumission sauvegardée!')
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Export Excel
  const exportExcel = () => {
    exportSoumissionToExcel(
      soumission.soumission_number,
      soumission.project_name || 'Sans projet',
      {
        name: soumission.client_name,
        address: soumission.client_address,
        email: soumission.client_email,
        phone: soumission.client_phone
      },
      soumission.items,
      soumission.conditions,
      soumission.validity_days
    )
  }

  // Grouper items par catégorie
  const itemsByCategory = soumission.items.reduce((acc, item) => {
    const cat = item.category || 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, SoumissionItem[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-teal-500" />
            {soumission.id ? 'Modifier la soumission' : 'Nouvelle soumission'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            N° {soumission.soumission_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Eye size={18} /> Aperçu
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button
            onClick={saveSoumission}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne gauche - Infos */}
        <div className="space-y-4">
          {/* Client */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User size={18} className="text-teal-500" /> Client
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Sélectionner un client</label>
                <select
                  value={soumission.client_id || ''}
                  onChange={(e) => selectClient(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">-- Nouveau client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Nom du client"
                value={soumission.client_name}
                onChange={(e) => setSoumission(prev => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="email"
                placeholder="Courriel"
                value={soumission.client_email || ''}
                onChange={(e) => setSoumission(prev => ({ ...prev, client_email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={soumission.client_phone || ''}
                onChange={(e) => setSoumission(prev => ({ ...prev, client_phone: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={soumission.client_address || ''}
                onChange={(e) => setSoumission(prev => ({ ...prev, client_address: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Projet */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Building size={18} className="text-teal-500" /> Projet
            </h3>
            
            <div className="space-y-3">
              <select
                value={soumission.project_id || ''}
                onChange={(e) => selectProject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">-- Sélectionner --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nom du projet"
                value={soumission.project_name || ''}
                onChange={(e) => setSoumission(prev => ({ ...prev, project_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Paramètres */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calculator size={18} className="text-teal-500" /> Paramètres
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Marge de profit (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={soumission.margin_percent}
                    onChange={(e) => setSoumission(prev => ({ ...prev, margin_percent: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{soumission.margin_percent}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Validité (jours)</label>
                <input
                  type="number"
                  value={soumission.validity_days}
                  onChange={(e) => setSoumission(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Date limite</label>
                <input
                  type="date"
                  value={soumission.deadline || ''}
                  onChange={(e) => setSoumission(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne centrale - Items */}
        <div className="col-span-2 space-y-4">
          {/* Formulaire ajout */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ajouter un élément</h3>
            
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Description"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Qté"
                  value={newItem.quantity || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Unité"
                  value={newItem.unit || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Prix unit."
                  value={newItem.unitPrice || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <button
                  onClick={addItem}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Plus size={18} className="mx-auto" />
                </button>
              </div>
            </div>

            <div className="mt-2">
              <select
                value={newItem.category || 'Autre'}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Qté</th>
                    <th className="px-4 py-3">Unité</th>
                    <th className="px-4 py-3 text-right">Prix unit.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <>
                      <tr key={`cat-${category}`} className="bg-gray-100 dark:bg-gray-900">
                        <td colSpan={6} className="px-4 py-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                          {category} ({items.length})
                        </td>
                      </tr>
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-4 py-3">
                            {editingItem === item.id ? (
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                              />
                            ) : (
                              <span className="text-sm">{item.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingItem === item.id ? (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                className="w-20 px-2 py-1 border rounded text-right dark:bg-gray-700 dark:border-gray-600"
                              />
                            ) : (
                              <span>{item.quantity}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                          <td className="px-4 py-3 text-right">
                            {editingItem === item.id ? (
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-24 px-2 py-1 border rounded text-right dark:bg-gray-700 dark:border-gray-600"
                              />
                            ) : (
                              <span>{item.unitPrice.toFixed(2)} $</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {editingItem === item.id ? (
                                <button onClick={() => setEditingItem(null)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                  <Check size={16} />
                                </button>
                              ) : (
                                <button onClick={() => setEditingItem(item.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                  <Edit2 size={16} />
                                </button>
                              )}
                              <button onClick={() => duplicateItem(item.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                <Copy size={16} />
                              </button>
                              <button onClick={() => removeItem(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>

              {soumission.items.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aucun élément ajouté</p>
                </div>
              )}
            </div>

            {/* Totaux */}
            {soumission.items.length > 0 && (
              <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total:</span>
                    <span>{soumission.subtotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-teal-600">
                    <span>Marge ({soumission.margin_percent}%):</span>
                    <span>+ {soumission.margin_amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t dark:border-gray-700 pt-2">
                    <span className="text-gray-500">Total HT:</span>
                    <span>{soumission.total_before_tax.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>TPS (5%):</span>
                    <span>{soumission.tps.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>TVQ (9.975%):</span>
                    <span>{soumission.tvq.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2">
                    <span>TOTAL:</span>
                    <span className="text-teal-600">{soumission.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes et conditions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Notes et conditions</h3>
            <textarea
              placeholder="Notes supplémentaires..."
              value={soumission.notes || ''}
              onChange={(e) => setSoumission(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 mb-3"
              rows={3}
            />
            <div className="space-y-2">
              {soumission.conditions.map((condition, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => {
                      const newConditions = [...soumission.conditions]
                      newConditions[i] = e.target.value
                      setSoumission(prev => ({ ...prev, conditions: newConditions }))
                    }}
                    className="flex-1 px-3 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={() => {
                      const newConditions = soumission.conditions.filter((_, idx) => idx !== i)
                      setSoumission(prev => ({ ...prev, conditions: newConditions }))
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSoumission(prev => ({ ...prev, conditions: [...prev.conditions, ''] }))}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                + Ajouter une condition
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Aperçu */}
      {showPreview && (
        <SoumissionPreview
          soumission={soumission}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// APERÇU SOUMISSION
// ============================================================================

function SoumissionPreview({ soumission, onClose }: { soumission: SoumissionData; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Aperçu de la soumission</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Printer size={16} /> Imprimer
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-8 print:p-4">
          {/* En-tête */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SOUMISSION</h1>
              <p className="text-gray-500">N° {soumission.soumission_number}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">DAST Solutions</p>
              <p className="text-sm text-gray-500">Montréal, QC</p>
              <p className="text-sm text-gray-500">info@dastsolutions.ca</p>
            </div>
          </div>

          {/* Infos client et projet */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">CLIENT</h3>
              <p className="font-medium">{soumission.client_name}</p>
              {soumission.client_address && <p className="text-sm text-gray-600">{soumission.client_address}</p>}
              {soumission.client_email && <p className="text-sm text-gray-600">{soumission.client_email}</p>}
              {soumission.client_phone && <p className="text-sm text-gray-600">{soumission.client_phone}</p>}
            </div>
            <div className="text-right">
              <p><span className="text-gray-500">Date:</span> {new Date().toLocaleDateString('fr-CA')}</p>
              <p><span className="text-gray-500">Validité:</span> {soumission.validity_days} jours</p>
              {soumission.project_name && <p><span className="text-gray-500">Projet:</span> {soumission.project_name}</p>}
            </div>
          </div>

          {/* Tableau des items */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2 border">Description</th>
                <th className="text-right p-2 border w-20">Qté</th>
                <th className="text-left p-2 border w-16">Unité</th>
                <th className="text-right p-2 border w-24">Prix unit.</th>
                <th className="text-right p-2 border w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {soumission.items.map(item => (
                <tr key={item.id}>
                  <td className="p-2 border">{item.description}</td>
                  <td className="p-2 border text-right">{item.quantity}</td>
                  <td className="p-2 border">{item.unit}</td>
                  <td className="p-2 border text-right">{item.unitPrice.toFixed(2)} $</td>
                  <td className="p-2 border text-right">{item.total.toFixed(2)} $</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span>{soumission.subtotal.toFixed(2)} $</span>
              </div>
              {soumission.margin_percent > 0 && (
                <div className="flex justify-between text-teal-600">
                  <span>Marge ({soumission.margin_percent}%):</span>
                  <span>+ {soumission.margin_amount.toFixed(2)} $</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1">
                <span>Total HT:</span>
                <span>{soumission.total_before_tax.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>TPS (5%):</span>
                <span>{soumission.tps.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>TVQ (9.975%):</span>
                <span>{soumission.tvq.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-1">
                <span>TOTAL:</span>
                <span>{soumission.total.toFixed(2)} $</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {soumission.conditions.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Conditions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {soumission.conditions.filter(c => c).map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {soumission.notes && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{soumission.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSoumissionNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SOU-${year}${month}-${random}`
}
