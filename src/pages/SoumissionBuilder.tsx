/**
 * DAST Solutions - Constructeur de Soumissions Professionnelles
 * Option C - Module complet avec templates
 */
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSoumissionsV2 } from '@/hooks/useSoumissionsV2'
import { useMaterials } from '@/hooks/useMaterials'
import { PageTitle } from '@/components/PageTitle'
import {
  FileText, Save, Send, Eye, Download, Plus, Trash2, 
  GripVertical, ChevronDown, ChevronRight, Settings,
  DollarSign, Percent, Calculator, User, Building2,
  Mail, Phone, MapPin, Calendar, Clock, Check, X,
  Loader2, Copy, AlertCircle, FileDown, Printer
} from 'lucide-react'
import type { SoumissionV2, SoumissionSection, SoumissionItem, SoumissionTemplate } from '@/types/pricing-types'

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Vue', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusée', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expirée', color: 'bg-gray-100 text-gray-500' },
}

export default function SoumissionBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getSoumission, updateSoumission, templates, calculateTotals } = useSoumissionsV2()
  const { searchMaterials } = useMaterials()

  const [soumission, setSoumission] = useState<SoumissionV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)

  // Charger la soumission
  useEffect(() => {
    if (id && id !== 'new') {
      loadSoumission()
    } else {
      // Nouvelle soumission
      setSoumission({
        id: '',
        numero: '',
        revision: 1,
        status: 'draft',
        date_creation: new Date().toISOString().split('T')[0],
        sections: [
          { id: crypto.randomUUID(), name: 'Travaux principaux', sort_order: 0, items: [], subtotal: 0 }
        ],
        subtotal_materials: 0,
        subtotal_labor: 0,
        subtotal_equipment: 0,
        subtotal_subcontracts: 0,
        subtotal: 0,
        discount_percent: 0,
        discount_amount: 0,
        contingency_percent: 0,
        contingency_amount: 0,
        profit_percent: 0,
        profit_amount: 0,
        tps_amount: 0,
        tvq_amount: 0,
        grand_total: 0,
        viewed_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setLoading(false)
    }
  }, [id])

  const loadSoumission = async () => {
    try {
      setLoading(true)
      const data = await getSoumission(id!)
      if (data) {
        setSoumission(data)
        // Expand first section
        if (data.sections?.length > 0) {
          setExpandedSections(new Set([data.sections[0].id]))
        }
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  // Sauvegarder
  const handleSave = async () => {
    if (!soumission) return
    
    setSaving(true)
    try {
      if (soumission.id) {
        await updateSoumission(soumission.id, soumission)
      }
      // TODO: Create if new
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
    } finally {
      setSaving(false)
    }
  }

  // Auto-calcul des totaux
  const totals = useMemo(() => {
    if (!soumission) return null
    return calculateTotals(soumission)
  }, [soumission, calculateTotals])

  // Ajouter une section
  const addSection = () => {
    if (!soumission) return
    const newSection: SoumissionSection = {
      id: crypto.randomUUID(),
      name: `Section ${(soumission.sections?.length || 0) + 1}`,
      sort_order: soumission.sections?.length || 0,
      items: [],
      subtotal: 0
    }
    setSoumission({
      ...soumission,
      sections: [...(soumission.sections || []), newSection]
    })
    setExpandedSections(prev => new Set([...prev, newSection.id]))
  }

  // Supprimer une section
  const removeSection = (sectionId: string) => {
    if (!soumission || !confirm('Supprimer cette section?')) return
    setSoumission({
      ...soumission,
      sections: soumission.sections.filter(s => s.id !== sectionId)
    })
  }

  // Ajouter un item
  const addItem = (sectionId: string) => {
    if (!soumission) return
    
    const newItem: SoumissionItem = {
      id: crypto.randomUUID(),
      soumission_id: soumission.id,
      section_name: '',
      section_order: 0,
      item_order: 0,
      description: '',
      quantity: 1,
      unit: 'unité',
      unit_price: 0,
      total_price: 0,
      is_optional: false,
      is_included: true,
    }

    setSoumission({
      ...soumission,
      sections: soumission.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: [...(section.items || []), newItem]
          }
        }
        return section
      })
    })
  }

  // Mettre à jour un item
  const updateItem = (sectionId: string, itemId: string, updates: Partial<SoumissionItem>) => {
    if (!soumission) return

    setSoumission({
      ...soumission,
      sections: soumission.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                const updated = { ...item, ...updates }
                // Recalculer total
                if (updates.quantity !== undefined || updates.unit_price !== undefined) {
                  updated.total_price = (updated.quantity || 0) * (updated.unit_price || 0)
                }
                return updated
              }
              return item
            })
          }
        }
        return section
      })
    })
  }

  // Supprimer un item
  const removeItem = (sectionId: string, itemId: string) => {
    if (!soumission) return

    setSoumission({
      ...soumission,
      sections: soumission.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.filter(item => item.id !== itemId)
          }
        }
        return section
      })
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (!soumission) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <p className="mt-4 text-gray-600">Soumission non trouvée</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <PageTitle 
            title={soumission.numero || 'Nouvelle soumission'}
            subtitle={soumission.project_name || 'Projet non spécifié'}
          />
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[soumission.status]?.color}`}>
              {STATUS_CONFIG[soumission.status]?.label}
            </span>
            {soumission.revision > 1 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Révision {soumission.revision}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'edit' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
            >
              Éditer
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'preview' ? 'bg-teal-50 text-teal-600' : 'hover:bg-gray-50'}`}
            >
              Aperçu
            </button>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Sauvegarder
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send size={18} />
            Envoyer
          </button>
        </div>
      </div>

      {activeTab === 'edit' ? (
        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
          {/* Left Panel - Client & Project Info */}
          <div className="space-y-4 overflow-y-auto">
            {/* Client */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <User size={18} />
                Client
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={soumission.client_name || ''}
                    onChange={(e) => setSoumission({ ...soumission, client_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Nom du client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courriel</label>
                  <input
                    type="email"
                    value={soumission.client_email || ''}
                    onChange={(e) => setSoumission({ ...soumission, client_email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={soumission.client_phone || ''}
                    onChange={(e) => setSoumission({ ...soumission, client_phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="(514) 555-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea
                    value={soumission.client_address || ''}
                    onChange={(e) => setSoumission({ ...soumission, client_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={2}
                    placeholder="123 rue Principale..."
                  />
                </div>
              </div>
            </div>

            {/* Project */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <Building2 size={18} />
                Projet
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                  <input
                    type="text"
                    value={soumission.project_name || ''}
                    onChange={(e) => setSoumission({ ...soumission, project_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du projet</label>
                  <textarea
                    value={soumission.project_address || ''}
                    onChange={(e) => setSoumission({ ...soumission, project_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={soumission.project_description || ''}
                    onChange={(e) => setSoumission({ ...soumission, project_description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    rows={3}
                    placeholder="Description des travaux..."
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <Calendar size={18} />
                Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                  <input
                    type="date"
                    value={soumission.date_creation || ''}
                    onChange={(e) => setSoumission({ ...soumission, date_creation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de validité</label>
                  <input
                    type="date"
                    value={soumission.date_validite || ''}
                    onChange={(e) => setSoumission({ ...soumission, date_validite: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Items */}
          <div className="col-span-2 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Sections */}
              {soumission.sections?.map((section, sectionIndex) => (
                <div key={section.id} className="bg-white rounded-xl border overflow-hidden">
                  {/* Section Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => {
                          setSoumission({
                            ...soumission,
                            sections: soumission.sections.map(s =>
                              s.id === section.id ? { ...s, name: e.target.value } : s
                            )
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold bg-transparent border-0 focus:ring-0 p-0"
                      />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        {formatCurrency(
                          section.items?.reduce((sum, item) => 
                            sum + (item.is_included ? (item.total_price || 0) : 0), 0
                          ) || 0
                        )}
                      </span>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Section Items */}
                  {expandedSections.has(section.id) && (
                    <div className="p-3 space-y-2">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase">
                        <div className="col-span-5">Description</div>
                        <div className="col-span-2 text-right">Quantité</div>
                        <div className="col-span-1">Unité</div>
                        <div className="col-span-2 text-right">Prix unit.</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>

                      {/* Items */}
                      {section.items?.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className={`grid grid-cols-12 gap-2 p-2 rounded-lg group ${
                            item.is_optional && !item.is_included ? 'bg-gray-50 opacity-60' : 'bg-gray-50'
                          }`}
                        >
                          <div className="col-span-5 flex items-center gap-2">
                            <button className="cursor-grab text-gray-300 hover:text-gray-500">
                              <GripVertical size={14} />
                            </button>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                              className="flex-1 px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-teal-500 rounded"
                              placeholder="Description de l'item..."
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) => updateItem(section.id, item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:ring-1 focus:ring-teal-500 rounded"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="text"
                              value={item.unit || ''}
                              onChange={(e) => updateItem(section.id, item.id, { unit: e.target.value })}
                              className="w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 focus:ring-teal-500 rounded"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              value={item.unit_price || ''}
                              onChange={(e) => updateItem(section.id, item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-sm text-right border-0 bg-transparent focus:ring-1 focus:ring-teal-500 rounded"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-2">
                            <span className="text-sm font-medium">
                              {formatCurrency(item.total_price || 0)}
                            </span>
                            <button
                              onClick={() => removeItem(section.id, item.id)}
                              className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Item Button */}
                      <button
                        onClick={() => addItem(section.id)}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-teal-500 hover:text-teal-600 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Ajouter un item
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Section Button */}
              <button
                onClick={addSection}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-teal-500 hover:text-teal-600 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Ajouter une section
              </button>
            </div>

            {/* Totals Panel */}
            <div className="mt-4 bg-white rounded-xl border p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Ajustements */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Ajustements</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-24">Rabais</label>
                    <input
                      type="number"
                      value={soumission.discount_percent || 0}
                      onChange={(e) => setSoumission({ ...soumission, discount_percent: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border rounded text-right"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="ml-auto text-red-600">-{formatCurrency(totals?.discount_amount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-24">Contingence</label>
                    <input
                      type="number"
                      value={soumission.contingency_percent || 0}
                      onChange={(e) => setSoumission({ ...soumission, contingency_percent: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border rounded text-right"
                      min="0"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="ml-auto">{formatCurrency(totals?.contingency_amount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 w-24">Profit</label>
                    <input
                      type="number"
                      value={soumission.profit_percent || 0}
                      onChange={(e) => setSoumission({ ...soumission, profit_percent: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border rounded text-right"
                      min="0"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="ml-auto">{formatCurrency(totals?.profit_amount || 0)}</span>
                  </div>
                </div>

                {/* Totaux */}
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total:</span>
                    <span className="font-medium">{formatCurrency(totals?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TPS (5%):</span>
                    <span>{formatCurrency(totals?.tps_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVQ (9.975%):</span>
                    <span>{formatCurrency(totals?.tvq_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">TOTAL:</span>
                    <span className="text-2xl font-bold text-teal-600">{formatCurrency(totals?.grand_total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="flex-1 bg-gray-100 rounded-xl p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <SoumissionPreview soumission={soumission} totals={totals} />
          </div>
        </div>
      )}
    </div>
  )
}

// Preview Component
function SoumissionPreview({ soumission, totals }: { soumission: SoumissionV2; totals: any }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SOUMISSION</h1>
          <p className="text-lg text-teal-600 font-medium mt-1">{soumission.numero}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">DAST Solutions</h2>
          <p className="text-gray-600">Construction & Estimation</p>
          <p className="text-gray-500 text-sm">Montréal, Québec</p>
        </div>
      </div>

      {/* Client & Project Info */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Client</h3>
          <p className="font-medium">{soumission.client_name || '-'}</p>
          <p className="text-gray-600 text-sm whitespace-pre-line">{soumission.client_address || '-'}</p>
          {soumission.client_email && <p className="text-gray-600 text-sm">{soumission.client_email}</p>}
          {soumission.client_phone && <p className="text-gray-600 text-sm">{soumission.client_phone}</p>}
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Projet</h3>
          <p className="font-medium">{soumission.project_name || '-'}</p>
          <p className="text-gray-600 text-sm whitespace-pre-line">{soumission.project_address || '-'}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-8 text-sm">
        <div>
          <span className="text-gray-500">Date: </span>
          <span className="font-medium">{soumission.date_creation}</span>
        </div>
        <div>
          <span className="text-gray-500">Valide jusqu'au: </span>
          <span className="font-medium">{soumission.date_validite}</span>
        </div>
      </div>

      {/* Description */}
      {soumission.project_description && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Description des travaux</h3>
          <p className="text-gray-600 whitespace-pre-line">{soumission.project_description}</p>
        </div>
      )}

      {/* Items Table */}
      {soumission.sections?.map(section => (
        <div key={section.id}>
          <h3 className="font-semibold text-gray-900 bg-gray-100 px-3 py-2 rounded">{section.name}</h3>
          <table className="w-full mt-2">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qté</th>
                <th className="py-2">Unité</th>
                <th className="py-2 text-right">Prix unit.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {section.items?.filter(i => i.is_included).map(item => (
                <tr key={item.id}>
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2">{item.unit}</td>
                  <td className="py-2 text-right">{formatCurrency(item.unit_price || 0)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(item.total_price || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Totals */}
      <div className="border-t pt-4">
        <div className="flex flex-col items-end space-y-1">
          <div className="flex gap-8">
            <span className="text-gray-600">Sous-total:</span>
            <span className="font-medium w-28 text-right">{formatCurrency(totals?.subtotal || 0)}</span>
          </div>
          <div className="flex gap-8">
            <span className="text-gray-600">TPS (5%):</span>
            <span className="w-28 text-right">{formatCurrency(totals?.tps_amount || 0)}</span>
          </div>
          <div className="flex gap-8">
            <span className="text-gray-600">TVQ (9.975%):</span>
            <span className="w-28 text-right">{formatCurrency(totals?.tvq_amount || 0)}</span>
          </div>
          <div className="flex gap-8 pt-2 border-t">
            <span className="font-bold text-lg">TOTAL:</span>
            <span className="font-bold text-lg text-teal-600 w-28 text-right">{formatCurrency(totals?.grand_total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      {soumission.terms_conditions && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Conditions</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">{soumission.terms_conditions}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t">
        <div>
          <p className="text-sm text-gray-500 mb-8">Préparé par:</p>
          <div className="border-t border-gray-300 pt-2">
            <p className="font-medium">{soumission.prepared_by || 'DAST Solutions'}</p>
            <p className="text-sm text-gray-500">{soumission.prepared_by_title || ''}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-8">Accepté par:</p>
          <div className="border-t border-gray-300 pt-2">
            <p className="font-medium">{soumission.client_name || 'Client'}</p>
            <p className="text-sm text-gray-500">Date: ____________________</p>
          </div>
        </div>
      </div>
    </div>
  )
}
