/**
 * DAST Solutions - Soumission Builder avec Templates
 * Création de soumissions à partir de templates + calcul automatique des marges
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  FileText, Plus, Trash2, Save, Send, X, Check, ChevronDown, ChevronRight,
  Calculator, DollarSign, Percent, AlertTriangle, Info, Building2,
  Calendar, User, Phone, Mail, MapPin, Clock, Copy, Eye, Download,
  Layers, GripVertical, Settings, RefreshCw, TrendingUp, ArrowLeft
} from 'lucide-react'

// Types
interface SoumissionItem {
  id: string
  code: string
  description: string
  unit: string
  quantity: number
  unitCost: number
  unitPrice: number
  margin: number
  total: number
  notes?: string
}

interface SoumissionSection {
  id: string
  name: string
  items: SoumissionItem[]
  subtotal: number
  isExpanded: boolean
}

interface ClientInfo {
  name: string
  company?: string
  email: string
  phone: string
  address: string
}

interface SoumissionData {
  id?: string
  number: string
  projectName: string
  projectType: 'residential' | 'commercial' | 'institutional' | 'industrial'
  client: ClientInfo
  sections: SoumissionSection[]
  conditions: string[]
  exclusions: string[]
  subtotal: number
  taxes: { tps: number; tvq: number }
  total: number
  globalMargin: number
  validity: number
  paymentTerms: string
  deadline?: string
  notes?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
}

// Constantes
const DEFAULT_TPS = 5
const DEFAULT_TVQ = 9.975
const UNITS = ['forf.', 'unité', 'm²', 'm³', 'm.l.', 'kg', 'tonne', 'heure', 'jour', '%', 'pmp', 'pi²', 'pi³']

const PROJECT_TYPES = [
  { id: 'residential', name: 'Résidentiel', defaultMargin: 15 },
  { id: 'commercial', name: 'Commercial', defaultMargin: 12 },
  { id: 'institutional', name: 'Institutionnel', defaultMargin: 10 },
  { id: 'industrial', name: 'Industriel', defaultMargin: 8 },
]

export default function SoumissionBuilderAdvanced() {
  const navigate = useNavigate()
  const location = useLocation()
  const templateFromNav = location.state?.template

  const [soumission, setSoumission] = useState<SoumissionData>({
    number: generateSoumissionNumber(),
    projectName: '',
    projectType: 'commercial',
    client: { name: '', email: '', phone: '', address: '' },
    sections: [createDefaultSection()],
    conditions: [
      'Prix ferme valide pour 30 jours',
      'Taxes en sus (TPS/TVQ)',
      'Permis et inspections à la charge du client',
      'Site accessible et dégagé pour les travaux'
    ],
    exclusions: [
      'Travaux non spécifiés dans la présente soumission',
      'Réparations de dommages préexistants'
    ],
    subtotal: 0,
    taxes: { tps: 0, tvq: 0 },
    total: 0,
    globalMargin: 12,
    validity: 30,
    paymentTerms: '50% début, 50% fin des travaux',
    status: 'draft'
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMarginHelper, setShowMarginHelper] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [marginAnalytics, setMarginAnalytics] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Charger template si fourni
  useEffect(() => {
    if (templateFromNav) {
      loadFromTemplate(templateFromNav)
    }
    loadMarginAnalytics()
  }, [templateFromNav])

  // Recalculer totaux quand les sections changent
  useEffect(() => {
    recalculateTotals()
  }, [soumission.sections, soumission.globalMargin])

  function generateSoumissionNumber(): string {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `S-${year}-${random}`
  }

  function createDefaultSection(): SoumissionSection {
    return {
      id: `sec-${Date.now()}`,
      name: 'Nouvelle section',
      items: [],
      subtotal: 0,
      isExpanded: true
    }
  }

  function createDefaultItem(margin: number = 12): SoumissionItem {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: '',
      description: '',
      unit: 'forf.',
      quantity: 1,
      unitCost: 0,
      unitPrice: 0,
      margin,
      total: 0
    }
  }

  const loadFromTemplate = (template: any) => {
    const sections: SoumissionSection[] = (template.sections || []).map((sec: any) => ({
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: sec.name,
      items: (sec.items || []).map((item: any) => ({
        ...createDefaultItem(template.defaultMargin || 12),
        code: item.code || '',
        description: item.description || '',
        unit: item.unit || 'forf.',
        quantity: item.quantity || 1,
        margin: item.margin || template.defaultMargin || 12
      })),
      subtotal: 0,
      isExpanded: true
    }))

    setSoumission(prev => ({
      ...prev,
      projectType: template.projectType || 'commercial',
      sections: sections.length > 0 ? sections : [createDefaultSection()],
      conditions: template.conditions || prev.conditions,
      exclusions: template.exclusions || prev.exclusions,
      globalMargin: template.defaultMargin || 12,
      validity: template.validity || 30,
      paymentTerms: template.paymentTerms || prev.paymentTerms
    }))
  }

  const loadMarginAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: soumissions } = await supabase
        .from('soumissions')
        .select('project_type, margin, status, total')
        .eq('user_id', user.id)

      if (soumissions && soumissions.length > 0) {
        const analytics: Record<string, any> = {}
        
        PROJECT_TYPES.forEach(type => {
          const typeSoumissions = soumissions.filter(s => s.project_type === type.id)
          const wonSoumissions = typeSoumissions.filter(s => s.status === 'acceptee')
          const margins = typeSoumissions.filter(s => s.margin).map(s => s.margin)
          
          analytics[type.id] = {
            avgMargin: margins.length > 0 
              ? margins.reduce((a, b) => a + b, 0) / margins.length 
              : type.defaultMargin,
            successRate: typeSoumissions.length > 0 
              ? (wonSoumissions.length / typeSoumissions.length) * 100 
              : 0,
            totalBids: typeSoumissions.length,
            wonBids: wonSoumissions.length
          }
        })

        setMarginAnalytics(analytics)
      }
    } catch (err) {
      console.error('Erreur analytics:', err)
    }
  }

  const recalculateTotals = useCallback(() => {
    const updatedSections = soumission.sections.map(section => {
      const items = section.items.map(item => {
        const unitPrice = item.unitCost * (1 + item.margin / 100)
        const total = item.quantity * unitPrice
        return { ...item, unitPrice, total }
      })
      const subtotal = items.reduce((sum, item) => sum + item.total, 0)
      return { ...section, items, subtotal }
    })

    const subtotal = updatedSections.reduce((sum, sec) => sum + sec.subtotal, 0)
    const tps = subtotal * DEFAULT_TPS / 100
    const tvq = subtotal * DEFAULT_TVQ / 100
    const total = subtotal + tps + tvq

    setSoumission(prev => ({
      ...prev,
      sections: updatedSections,
      subtotal,
      taxes: { tps, tvq },
      total
    }))
  }, [soumission.sections])

  const updateItem = (sectionId: string, itemId: string, field: string, value: any) => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id !== itemId) return item
            return { ...item, [field]: value }
          })
        }
      })
    }))
  }

  const addItem = (sectionId: string) => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: [...section.items, createDefaultItem(prev.globalMargin)]
        }
      })
    }))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId)
        }
      })
    }))
  }

  const addSection = () => {
    setSoumission(prev => ({
      ...prev,
      sections: [...prev.sections, createDefaultSection()]
    }))
  }

  const removeSection = (sectionId: string) => {
    if (soumission.sections.length <= 1) return
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }))
  }

  const updateSectionName = (sectionId: string, name: string) => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, name } : s
      )
    }))
  }

  const toggleSection = (sectionId: string) => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
      )
    }))
  }

  const applyGlobalMargin = () => {
    setSoumission(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          margin: prev.globalMargin
        }))
      }))
    }))
  }

  const getSuggestedMargin = () => {
    if (!marginAnalytics || !marginAnalytics[soumission.projectType]) {
      return PROJECT_TYPES.find(t => t.id === soumission.projectType)?.defaultMargin || 12
    }
    return marginAnalytics[soumission.projectType].avgMargin
  }

  const handleSave = async (sendAfterSave = false) => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const soumissionData = {
        user_id: user.id,
        soumission_number: soumission.number,
        project_name: soumission.projectName,
        project_type: soumission.projectType,
        client_name: soumission.client.name,
        client_email: soumission.client.email,
        client_phone: soumission.client.phone,
        client_address: soumission.client.address,
        sections: soumission.sections,
        conditions: soumission.conditions,
        exclusions: soumission.exclusions,
        subtotal: soumission.subtotal,
        tps: soumission.taxes.tps,
        tvq: soumission.taxes.tvq,
        total: soumission.total,
        margin: soumission.globalMargin,
        validity: soumission.validity,
        payment_terms: soumission.paymentTerms,
        deadline: soumission.deadline,
        notes: soumission.notes,
        status: sendAfterSave ? 'envoyee' : 'brouillon',
        sent_at: sendAfterSave ? new Date().toISOString() : null
      }

      if (soumission.id) {
        await supabase
          .from('soumissions')
          .update(soumissionData)
          .eq('id', soumission.id)
      } else {
        const { data } = await supabase
          .from('soumissions')
          .insert(soumissionData)
          .select()
          .single()
        
        if (data) {
          setSoumission(prev => ({ ...prev, id: data.id }))
        }
      }

      if (sendAfterSave) {
        navigate('/soumissions')
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
  }

  const totalCost = soumission.sections.reduce((sum, sec) => 
    sum + sec.items.reduce((s, item) => s + (item.quantity * item.unitCost), 0), 0
  )
  const totalProfit = soumission.subtotal - totalCost
  const effectiveMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/soumissions')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="text-teal-600" />
                  {soumission.number}
                </h1>
                <p className="text-sm text-gray-500">
                  {soumission.status === 'draft' ? 'Brouillon' : 'En cours'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={16} />
                Aperçu
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Send size={16} />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-gray-500" />
                Informations du projet
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du projet *</label>
                  <input
                    type="text"
                    value={soumission.projectName}
                    onChange={(e) => setSoumission({...soumission, projectName: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Rénovation Centre sportif"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type de projet</label>
                  <select
                    value={soumission.projectType}
                    onChange={(e) => {
                      const type = e.target.value as any
                      const defaultMargin = PROJECT_TYPES.find(t => t.id === type)?.defaultMargin || 12
                      setSoumission({...soumission, projectType: type, globalMargin: defaultMargin})
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {PROJECT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date limite</label>
                  <input
                    type="date"
                    value={soumission.deadline || ''}
                    onChange={(e) => setSoumission({...soumission, deadline: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Validité (jours)</label>
                  <input
                    type="number"
                    value={soumission.validity}
                    onChange={(e) => setSoumission({...soumission, validity: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <User size={18} className="text-gray-500" />
                Client
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom / Entreprise *</label>
                  <input
                    type="text"
                    value={soumission.client.name}
                    onChange={(e) => setSoumission({
                      ...soumission, 
                      client: {...soumission.client, name: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={soumission.client.email}
                    onChange={(e) => setSoumission({
                      ...soumission, 
                      client: {...soumission.client, email: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={soumission.client.phone}
                    onChange={(e) => setSoumission({
                      ...soumission, 
                      client: {...soumission.client, phone: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input
                    type="text"
                    value={soumission.client.address}
                    onChange={(e) => setSoumission({
                      ...soumission, 
                      client: {...soumission.client, address: e.target.value}
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Sections & Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Détail des travaux</h2>
                <button
                  onClick={addSection}
                  className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} />
                  Ajouter section
                </button>
              </div>

              {soumission.sections.map((section, sectionIdx) => (
                <div key={section.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {section.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSectionName(section.id, e.target.value)}
                      className="flex-1 bg-transparent font-medium focus:outline-none focus:bg-white focus:px-2 focus:rounded"
                    />
                    <span className="text-sm text-gray-500">
                      {formatCurrency(section.subtotal)}
                    </span>
                    {soumission.sections.length > 1 && (
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Section Items */}
                  {section.isExpanded && (
                    <div className="p-4">
                      {/* Items Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-2 px-2">
                        <div className="col-span-1">Code</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-1">Unité</div>
                        <div className="col-span-1">Qté</div>
                        <div className="col-span-2">Coût unit.</div>
                        <div className="col-span-1">Marge %</div>
                        <div className="col-span-2">Prix unit.</div>
                        <div className="col-span-1"></div>
                      </div>

                      {/* Items */}
                      {section.items.map((item, itemIdx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
                          <input
                            type="text"
                            value={item.code}
                            onChange={(e) => updateItem(section.id, item.id, 'code', e.target.value)}
                            className="col-span-1 px-2 py-1.5 border rounded text-sm"
                            placeholder="Code"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(section.id, item.id, 'description', e.target.value)}
                            className="col-span-3 px-2 py-1.5 border rounded text-sm"
                            placeholder="Description"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(section.id, item.id, 'unit', e.target.value)}
                            className="col-span-1 px-1 py-1.5 border rounded text-sm"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(section.id, item.id, 'quantity', Number(e.target.value))}
                            className="col-span-1 px-2 py-1.5 border rounded text-sm text-right"
                            min="0"
                            step="0.01"
                          />
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => updateItem(section.id, item.id, 'unitCost', Number(e.target.value))}
                            className="col-span-2 px-2 py-1.5 border rounded text-sm text-right"
                            min="0"
                            step="0.01"
                          />
                          <input
                            type="number"
                            value={item.margin}
                            onChange={(e) => updateItem(section.id, item.id, 'margin', Number(e.target.value))}
                            className="col-span-1 px-2 py-1.5 border rounded text-sm text-right bg-amber-50"
                            min="0"
                            max="100"
                          />
                          <div className="col-span-2 px-2 py-1.5 bg-gray-50 border rounded text-sm text-right font-medium">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <button
                            onClick={() => removeItem(section.id, item.id)}
                            className="col-span-1 p-1.5 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {/* Add Item Button */}
                      <button
                        onClick={() => addItem(section.id)}
                        className="w-full py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 flex items-center justify-center gap-1"
                      >
                        <Plus size={14} />
                        Ajouter un item
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conditions & Exclusions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-medium mb-2">Conditions</h3>
                <textarea
                  value={soumission.conditions.join('\n')}
                  onChange={(e) => setSoumission({
                    ...soumission,
                    conditions: e.target.value.split('\n').filter(c => c.trim())
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={5}
                  placeholder="Une condition par ligne..."
                />
              </div>
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-medium mb-2">Exclusions</h3>
                <textarea
                  value={soumission.exclusions.join('\n')}
                  onChange={(e) => setSoumission({
                    ...soumission,
                    exclusions: e.target.value.split('\n').filter(c => c.trim())
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={5}
                  placeholder="Une exclusion par ligne..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Totals & Margin */}
          <div className="space-y-4">
            {/* Margin Helper */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calculator className="text-teal-600" size={18} />
                  Marge globale
                </h3>
                <button
                  onClick={() => setShowMarginHelper(!showMarginHelper)}
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  {showMarginHelper ? 'Masquer aide' : 'Aide'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Marge appliquée</span>
                    <span className="font-bold text-lg">{soumission.globalMargin}%</span>
                  </div>
                  <input
                    type="range"
                    value={soumission.globalMargin}
                    onChange={(e) => setSoumission({...soumission, globalMargin: Number(e.target.value)})}
                    min="0"
                    max="35"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span>35%</span>
                  </div>
                </div>

                <button
                  onClick={applyGlobalMargin}
                  className="w-full py-2 text-sm border rounded-lg hover:bg-gray-50"
                >
                  Appliquer à tous les items
                </button>

                {/* Suggested Margin */}
                {marginAnalytics && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 text-sm">
                      <TrendingUp size={14} />
                      <span>Marge suggérée: <strong>{getSuggestedMargin().toFixed(1)}%</strong></span>
                    </div>
                    {marginAnalytics[soumission.projectType] && (
                      <p className="text-xs text-blue-600 mt-1">
                        Basé sur {marginAnalytics[soumission.projectType].totalBids} soumissions 
                        ({marginAnalytics[soumission.projectType].successRate.toFixed(0)}% succès)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {showMarginHelper && (
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  <p className="text-gray-600 font-medium">Guide des marges:</p>
                  {PROJECT_TYPES.map(type => (
                    <div key={type.id} className="flex justify-between">
                      <span className="text-gray-500">{type.name}</span>
                      <span className="font-medium">{type.defaultMargin}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-4">Récapitulatif</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coût total</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Profit</span>
                  <span className="text-green-600">{formatCurrency(totalProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Marge effective</span>
                  <span className={effectiveMargin >= soumission.globalMargin ? 'text-green-600' : 'text-amber-600'}>
                    {effectiveMargin.toFixed(1)}%
                  </span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-medium">{formatCurrency(soumission.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TPS ({DEFAULT_TPS}%)</span>
                    <span>{formatCurrency(soumission.taxes.tps)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVQ ({DEFAULT_TVQ}%)</span>
                    <span>{formatCurrency(soumission.taxes.tvq)}</span>
                  </div>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatCurrency(soumission.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Modalités de paiement</h3>
              <textarea
                value={soumission.paymentTerms}
                onChange={(e) => setSoumission({...soumission, paymentTerms: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Notes internes</h3>
              <textarea
                value={soumission.notes || ''}
                onChange={(e) => setSoumission({...soumission, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Notes non visibles sur la soumission..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <SoumissionPreview 
          soumission={soumission} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </div>
  )
}

// Preview Component
function SoumissionPreview({ soumission, onClose }: { soumission: SoumissionData, onClose: () => void }) {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Aperçu de la soumission</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <Download size={14} />
              PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SOUMISSION</h1>
              <p className="text-gray-600">{soumission.number}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">DAST Solutions</p>
              <p className="text-sm text-gray-500">Montréal, QC</p>
            </div>
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">CLIENT</h3>
              <p className="font-medium">{soumission.client.name || '-'}</p>
              <p className="text-sm text-gray-600">{soumission.client.address}</p>
              <p className="text-sm text-gray-600">{soumission.client.phone}</p>
              <p className="text-sm text-gray-600">{soumission.client.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">PROJET</h3>
              <p className="font-medium">{soumission.projectName || '-'}</p>
              <p className="text-sm text-gray-600">Validité: {soumission.validity} jours</p>
            </div>
          </div>

          {/* Items */}
          {soumission.sections.map(section => (
            <div key={section.id} className="mb-6">
              <h3 className="font-semibold bg-gray-100 px-3 py-2 mb-2">{section.name}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qté</th>
                    <th className="text-right py-2">Unité</th>
                    <th className="text-right py-2">Prix unit.</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.description || '-'}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{item.unit}</td>
                      <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-2 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{formatCurrency(soumission.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TPS</span>
                <span>{formatCurrency(soumission.taxes.tps)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVQ</span>
                <span>{formatCurrency(soumission.taxes.tvq)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>TOTAL</span>
                <span>{formatCurrency(soumission.total)}</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-semibold mb-2">CONDITIONS</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {soumission.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">EXCLUSIONS</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {soumission.exclusions.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">MODALITÉS DE PAIEMENT</h3>
            <p className="text-sm text-gray-600">{soumission.paymentTerms}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
