/**
 * DAST Solutions - Takeoff vers Estimation
 * Option B - Lier les mesures aux items d'estimation
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useMaterials } from '@/hooks/useMaterials'
import {
  Link2, Package, Plus, Search, Trash2, Save, Calculator,
  ChevronDown, ChevronRight, DollarSign, Ruler, Layers,
  FileText, X, Check, Loader2, ArrowRight, AlertCircle
} from 'lucide-react'
import type { Material, TakeoffMaterialLink, EstimationSection } from '@/types/pricing-types'

interface TakeoffMeasurement {
  id: string
  type: 'line' | 'rectangle' | 'polygon' | 'count'
  label?: string
  value: number
  unit: string
  color?: string
  pageNumber?: number
}

interface TakeoffEstimationProps {
  projectId: string
  measurements: TakeoffMeasurement[]
  onEstimationUpdate?: (estimation: EstimationSummary) => void
}

interface EstimationSummary {
  total_materials: number
  total_labor: number
  total_equipment: number
  subtotal: number
  tps: number
  tvq: number
  grand_total: number
  items_count: number
}

export function TakeoffEstimation({ projectId, measurements, onEstimationUpdate }: TakeoffEstimationProps) {
  const { materials, searchMaterials, calculatePrice } = useMaterials()
  const [links, setLinks] = useState<TakeoffMaterialLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['mesures']))
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Material[]>([])
  const [selectedMeasurement, setSelectedMeasurement] = useState<TakeoffMeasurement | null>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)

  // Charger les liens existants
  useEffect(() => {
    loadLinks()
  }, [projectId])

  const loadLinks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('takeoff_material_links')
        .select(`
          *,
          material:materials(*)
        `)
        .eq('project_id', projectId)

      if (error) throw error
      setLinks(data || [])
    } catch (err) {
      console.error('Erreur chargement liens:', err)
    } finally {
      setLoading(false)
    }
  }

  // Recherche de matériaux
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      const results = await searchMaterials(searchQuery)
      setSearchResults(results)
    }
    
    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, searchMaterials])

  // Calculer le sommaire
  const summary = useMemo<EstimationSummary>(() => {
    let total_materials = 0
    let total_labor = 0
    let total_equipment = 0

    links.forEach(link => {
      const price = link.total_price || 0
      switch (link.material?.price_type) {
        case 'labor':
          total_labor += price
          break
        case 'equipment':
          total_equipment += price
          break
        default:
          total_materials += price
      }
    })

    const subtotal = total_materials + total_labor + total_equipment
    const tps = subtotal * 0.05
    const tvq = subtotal * 0.09975
    const grand_total = subtotal + tps + tvq

    return {
      total_materials,
      total_labor,
      total_equipment,
      subtotal,
      tps,
      tvq,
      grand_total,
      items_count: links.length
    }
  }, [links])

  // Notifier le parent des mises à jour
  useEffect(() => {
    onEstimationUpdate?.(summary)
  }, [summary, onEstimationUpdate])

  // Ajouter un lien mesure → matériau
  const addLink = async (measurement: TakeoffMeasurement, material: Material) => {
    try {
      setSaving(true)
      
      const calc = calculatePrice(material, measurement.value)
      
      const newLink = {
        project_id: projectId,
        measurement_id: measurement.id,
        material_id: material.id,
        measured_quantity: measurement.value,
        adjusted_quantity: calc.adjusted_quantity,
        unit: measurement.unit,
        unit_price: material.unit_price,
        total_price: calc.total_price,
        labor_hours: material.labor_hours_per_unit ? measurement.value * material.labor_hours_per_unit : null,
      }

      const { data, error } = await supabase
        .from('takeoff_material_links')
        .insert(newLink)
        .select(`*, material:materials(*)`)
        .single()

      if (error) throw error
      
      setLinks(prev => [...prev, data])
      setShowLinkModal(false)
      setSelectedMeasurement(null)
      setSearchQuery('')
    } catch (err) {
      console.error('Erreur ajout lien:', err)
    } finally {
      setSaving(false)
    }
  }

  // Supprimer un lien
  const removeLink = async (linkId: string) => {
    if (!confirm('Supprimer ce lien?')) return
    
    try {
      const { error } = await supabase
        .from('takeoff_material_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  // Recalculer tous les prix
  const recalculateAll = async () => {
    try {
      setSaving(true)
      
      const updates = links.map(link => {
        if (!link.material) return null
        const calc = calculatePrice(link.material, link.measured_quantity)
        return {
          id: link.id,
          adjusted_quantity: calc.adjusted_quantity,
          unit_price: link.material.unit_price,
          total_price: calc.total_price
        }
      }).filter(Boolean)

      for (const update of updates) {
        if (update) {
          await supabase
            .from('takeoff_material_links')
            .update(update)
            .eq('id', update.id)
        }
      }

      await loadLinks()
    } catch (err) {
      console.error('Erreur recalcul:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const formatQuantity = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Grouper les mesures non liées
  const unlinkedMeasurements = measurements.filter(
    m => !links.some(l => l.measurement_id === m.id)
  )

  // Grouper les liens par type de matériau
  const groupedLinks = useMemo(() => {
    const groups: Record<string, TakeoffMaterialLink[]> = {
      material: [],
      labor: [],
      equipment: [],
      other: []
    }
    
    links.forEach(link => {
      const type = link.material?.price_type || 'other'
      if (groups[type]) {
        groups[type].push(link)
      } else {
        groups.other.push(link)
      }
    })
    
    return groups
  }, [links])

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Calculator className="text-teal-600" size={20} />
          <h3 className="font-semibold text-gray-900">Estimation</h3>
          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
            {summary.items_count} items
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={recalculateAll}
            disabled={saving || links.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Calculator size={14} />}
            Recalculer
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-teal-600" size={24} />
          </div>
        ) : (
          <div className="divide-y">
            {/* Mesures non liées */}
            <div>
              <button
                onClick={() => toggleSection('mesures')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  {expandedSections.has('mesures') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <Ruler size={18} className="text-orange-500" />
                  <span className="font-medium">Mesures à lier</span>
                  {unlinkedMeasurements.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                      {unlinkedMeasurements.length}
                    </span>
                  )}
                </div>
              </button>
              
              {expandedSections.has('mesures') && (
                <div className="px-3 pb-3 space-y-2">
                  {unlinkedMeasurements.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2 text-center">
                      Toutes les mesures sont liées ✓
                    </p>
                  ) : (
                    unlinkedMeasurements.map(measurement => (
                      <div
                        key={measurement.id}
                        className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: measurement.color || '#f97316' }}
                          />
                          <span className="text-sm font-medium">
                            {measurement.label || `${measurement.type} #${measurement.id.slice(0, 4)}`}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatQuantity(measurement.value, measurement.unit)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMeasurement(measurement)
                            setShowLinkModal(true)
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          <Link2 size={12} />
                          Lier
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Matériaux */}
            {groupedLinks.material.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('materials')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has('materials') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Package size={18} className="text-blue-500" />
                    <span className="font-medium">Matériaux</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {groupedLinks.material.length}
                    </span>
                  </div>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(summary.total_materials)}
                  </span>
                </button>
                
                {expandedSections.has('materials') && (
                  <div className="px-3 pb-3 space-y-2">
                    {groupedLinks.material.map(link => (
                      <LinkItem key={link.id} link={link} onRemove={removeLink} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main d'œuvre */}
            {groupedLinks.labor.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('labor')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has('labor') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Layers size={18} className="text-green-500" />
                    <span className="font-medium">Main-d'œuvre</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      {groupedLinks.labor.length}
                    </span>
                  </div>
                  <span className="font-medium text-green-600">
                    {formatCurrency(summary.total_labor)}
                  </span>
                </button>
                
                {expandedSections.has('labor') && (
                  <div className="px-3 pb-3 space-y-2">
                    {groupedLinks.labor.map(link => (
                      <LinkItem key={link.id} link={link} onRemove={removeLink} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Équipement */}
            {groupedLinks.equipment.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('equipment')}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.has('equipment') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Layers size={18} className="text-purple-500" />
                    <span className="font-medium">Équipement</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                      {groupedLinks.equipment.length}
                    </span>
                  </div>
                  <span className="font-medium text-purple-600">
                    {formatCurrency(summary.total_equipment)}
                  </span>
                </button>
                
                {expandedSections.has('equipment') && (
                  <div className="px-3 pb-3 space-y-2">
                    {groupedLinks.equipment.map(link => (
                      <LinkItem key={link.id} link={link} onRemove={removeLink} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Summary */}
      <div className="border-t bg-gray-50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sous-total:</span>
          <span className="font-medium">{formatCurrency(summary.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TPS (5%):</span>
          <span>{formatCurrency(summary.tps)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TVQ (9.975%):</span>
          <span>{formatCurrency(summary.tvq)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="text-xl font-bold text-teal-600">{formatCurrency(summary.grand_total)}</span>
        </div>
        
        <button
          className="w-full mt-3 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
        >
          <FileText size={18} />
          Créer une soumission
        </button>
      </div>

      {/* Link Modal */}
      {showLinkModal && selectedMeasurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Lier à un matériau</h3>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setSelectedMeasurement(null)
                  setSearchQuery('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {/* Selected Measurement */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedMeasurement.color || '#3b82f6' }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {selectedMeasurement.label || `${selectedMeasurement.type}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatQuantity(selectedMeasurement.value, selectedMeasurement.unit)}
                  </p>
                </div>
                <ArrowRight className="text-gray-400" size={20} />
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un matériau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              {/* Results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchQuery.length < 2 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Tapez au moins 2 caractères pour rechercher
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun matériau trouvé
                  </p>
                ) : (
                  searchResults.map(material => {
                    const calc = calculatePrice(material, selectedMeasurement.value)
                    return (
                      <button
                        key={material.id}
                        onClick={() => addLink(selectedMeasurement, material)}
                        disabled={saving}
                        className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-xs text-gray-500">
                            {material.code} • {formatCurrency(material.unit_price)}/{material.unit}
                            {material.waste_factor > 0 && ` • +${material.waste_factor}% perte`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-teal-600">{formatCurrency(calc.total_price)}</p>
                          <p className="text-xs text-gray-500">
                            {calc.adjusted_quantity.toFixed(2)} {material.unit}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Link Item Component
function LinkItem({ link, onRemove }: { link: TakeoffMaterialLink; onRemove: (id: string) => void }) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {link.material?.name || 'Matériau inconnu'}
        </p>
        <p className="text-xs text-gray-500">
          {link.measured_quantity?.toFixed(2)} → {link.adjusted_quantity?.toFixed(2)} {link.unit}
          {link.material?.waste_factor ? ` (+${link.material.waste_factor}%)` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{formatCurrency(link.total_price || 0)}</span>
        <button
          onClick={() => onRemove(link.id)}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default TakeoffEstimation
