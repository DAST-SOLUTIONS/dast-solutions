/**
 * DAST Solutions - TakeoffToSoumission
 * Liaison Takeoff → Module Soumission
 * Option E - Transfert des mesures vers les soumissions
 */
import { useState, useCallback, useMemo } from 'react'
import {
  ArrowRight, FileText, Check, X, ChevronDown, Plus,
  Package, DollarSign, AlertCircle, Loader2, Send,
  Calculator, ClipboardList, Building
} from 'lucide-react'
import type { Measurement } from '@/types/takeoff-measure-types'

// Type pour un item de soumission
interface SoumissionItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  laborCost: number
  materialCost: number
  totalCost: number
  category: string
  sourceType: 'takeoff' | 'manual'
  sourceMeasurementId?: string
  notes?: string
}

// Type pour une soumission
interface Soumission {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  items: SoumissionItem[]
  createdAt: Date
  updatedAt: Date
}

interface TakeoffToSoumissionProps {
  isOpen: boolean
  onClose: () => void
  measurements: Measurement[]
  projectId?: string
  projectName?: string
  onExportComplete?: (items: SoumissionItem[]) => void
}

// Mapping des types de mesure vers descriptions
const MEASURE_TYPE_LABELS: Record<string, string> = {
  line: 'Longueur linéaire',
  rectangle: 'Surface rectangulaire',
  area: 'Surface polygonale',
  count: 'Comptage éléments'
}

// Grouper les mesures par catégorie
function groupMeasurementsByCategory(measurements: Measurement[]): Record<string, Measurement[]> {
  return measurements.reduce((acc, m) => {
    const cat = m.category || 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {} as Record<string, Measurement[]>)
}

// Convertir une mesure en item de soumission
function measurementToSoumissionItem(m: Measurement): SoumissionItem {
  return {
    id: `si-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    description: m.label || `${MEASURE_TYPE_LABELS[m.type] || m.type} - ${m.category}`,
    quantity: m.value,
    unit: m.unit,
    unitPrice: m.costs?.unitPrice || 0,
    laborCost: m.costs?.laborCost || 0,
    materialCost: m.costs?.materialCost || 0,
    totalCost: m.costs?.totalCost || 0,
    category: m.category || 'Autre',
    sourceType: 'takeoff',
    sourceMeasurementId: m.id,
    notes: m.dimensions?.height 
      ? `Dimensions: ${m.dimensions.height}m H x ${m.dimensions.thickness || '-'}m ép.`
      : undefined
  }
}

export function TakeoffToSoumission({
  isOpen,
  onClose,
  measurements,
  projectId,
  projectName = 'Projet',
  onExportComplete
}: TakeoffToSoumissionProps) {
  // État des mesures sélectionnées
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportMode, setExportMode] = useState<'new' | 'existing'>('new')
  const [newSoumissionName, setNewSoumissionName] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Grouper par catégorie
  const groupedMeasurements = useMemo(() => 
    groupMeasurementsByCategory(measurements),
    [measurements]
  )

  // Calculer les totaux des sélectionnés
  const selectedTotals = useMemo(() => {
    const selected = measurements.filter(m => selectedIds.has(m.id))
    return {
      count: selected.length,
      laborCost: selected.reduce((sum, m) => sum + (m.costs?.laborCost || 0), 0),
      materialCost: selected.reduce((sum, m) => sum + (m.costs?.materialCost || 0), 0),
      totalCost: selected.reduce((sum, m) => sum + (m.costs?.totalCost || 0), 0)
    }
  }, [measurements, selectedIds])

  // Toggle sélection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Sélectionner tout / rien
  const selectAll = useCallback(() => {
    if (selectedIds.size === measurements.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(measurements.map(m => m.id)))
    }
  }, [measurements, selectedIds])

  // Sélectionner par catégorie
  const selectCategory = useCallback((category: string) => {
    const catMeasurements = groupedMeasurements[category] || []
    const catIds = catMeasurements.map(m => m.id)
    const allSelected = catIds.every(id => selectedIds.has(id))

    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        catIds.forEach(id => next.delete(id))
      } else {
        catIds.forEach(id => next.add(id))
      }
      return next
    })
  }, [groupedMeasurements, selectedIds])

  // Toggle catégorie expanded
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  // Exporter
  const handleExport = useCallback(async () => {
    if (selectedIds.size === 0) return

    setIsExporting(true)

    try {
      // Convertir les mesures sélectionnées
      const items = measurements
        .filter(m => selectedIds.has(m.id))
        .map(measurementToSoumissionItem)

      // Simuler un délai pour UX
      await new Promise(resolve => setTimeout(resolve, 800))

      // Callback
      if (onExportComplete) {
        onExportComplete(items)
      }

      // Fermer
      onClose()

    } catch (err) {
      console.error('Erreur export:', err)
    } finally {
      setIsExporting(false)
    }
  }, [selectedIds, measurements, onExportComplete, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Send size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Exporter vers Soumission</h2>
              <p className="text-sm text-teal-100">Transférer les mesures du takeoff</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Résumé */}
        <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={16} className="text-gray-500" />
              <span>{measurements.length} mesures disponibles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={16} className="text-teal-600" />
              <span className="text-teal-700 font-medium">{selectedIds.size} sélectionnées</span>
            </div>
          </div>
          <button
            onClick={selectAll}
            className="text-sm text-teal-600 hover:text-teal-700"
          >
            {selectedIds.size === measurements.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {measurements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calculator size={48} className="mx-auto mb-4 opacity-50" />
              <div className="font-medium">Aucune mesure disponible</div>
              <div className="text-sm mt-1">Effectuez des mesures dans le takeoff d'abord</div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedMeasurements).map(([category, items]) => {
                const isExpanded = expandedCategories.has(category)
                const catSelectedCount = items.filter(m => selectedIds.has(m.id)).length
                const catTotal = items.reduce((sum, m) => sum + (m.costs?.totalCost || 0), 0)

                return (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    {/* Header catégorie */}
                    <div 
                      className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown 
                          size={18} 
                          className={`text-gray-400 transition ${isExpanded ? '' : '-rotate-90'}`}
                        />
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-xs text-gray-500">
                            {items.length} mesure{items.length > 1 ? 's' : ''} • 
                            {catTotal > 0 && ` $${catTotal.toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
                          {catSelectedCount}/{items.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            selectCategory(category)
                          }}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          {catSelectedCount === items.length ? 'Aucun' : 'Tous'}
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    {isExpanded && (
                      <div className="divide-y">
                        {items.map(m => (
                          <label
                            key={m.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                              selectedIds.has(m.id) ? 'bg-teal-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(m.id)}
                              onChange={() => toggleSelect(m.id)}
                              className="w-5 h-5 rounded text-teal-600"
                            />
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: m.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {m.label || `${MEASURE_TYPE_LABELS[m.type]} ${m.id.slice(-4)}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {m.value.toFixed(2)} {m.unit}
                                {m.dimensions?.height && ` • H: ${m.dimensions.height}m`}
                                {m.trade && ` • ${m.trade.name}`}
                              </div>
                            </div>
                            {(m.costs?.totalCost || 0) > 0 && (
                              <div className="text-right">
                                <div className="font-medium text-green-600">
                                  ${m.costs?.totalCost?.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  M.O: ${m.costs?.laborCost?.toFixed(2) || '0'}
                                </div>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Totaux sélectionnés */}
        {selectedIds.size > 0 && (
          <div className="bg-teal-50 border-t border-teal-100 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-teal-700">
                <strong>{selectedIds.size}</strong> mesure{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>Main-d'œuvre: <strong>${selectedTotals.laborCost.toFixed(2)}</strong></span>
                <span>Matériaux: <strong>${selectedTotals.materialCost.toFixed(2)}</strong></span>
                <span className="text-teal-700 font-bold text-base">
                  Total: ${selectedTotals.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <Building size={16} className="inline mr-1" />
            Projet: {projectName}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedIds.size === 0}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  Exporter vers Soumission
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeoffToSoumission
