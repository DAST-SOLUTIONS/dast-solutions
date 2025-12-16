/**
 * DAST Solutions - Composant Takeoff → Soumission
 * Permet de sélectionner des mesures du takeoff pour créer une soumission
 */
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Check, ChevronDown, ChevronRight, Search, Ruler, Square,
  Pentagon, Hash, DollarSign, Plus, X, Package
} from 'lucide-react'

export interface TakeoffMeasure {
  id: string
  project_id: string
  page_number: number
  type: 'line' | 'rectangle' | 'polygon' | 'count'
  label: string
  value: number
  unit: string
  color: string
  points: any[]
  metadata?: {
    category?: string
    unit_price?: number
    notes?: string
  }
  created_at: string
}

export interface SelectedTakeoffItem {
  measureId: string
  label: string
  quantity: number
  unit: string
  unitPrice: number
  category: string
  notes?: string
}

interface TakeoffSelectorProps {
  projectId: string
  selectedItems: SelectedTakeoffItem[]
  onSelectionChange: (items: SelectedTakeoffItem[]) => void
  onClose?: () => void
}

const TYPE_ICONS = {
  line: Ruler,
  rectangle: Square,
  polygon: Pentagon,
  count: Hash
}

const TYPE_LABELS = {
  line: 'Longueur',
  rectangle: 'Surface',
  polygon: 'Surface',
  count: 'Comptage'
}

// Catégories CSC MasterFormat simplifiées
const CATEGORIES = [
  { code: '03', label: 'Béton' },
  { code: '04', label: 'Maçonnerie' },
  { code: '05', label: 'Métaux' },
  { code: '06', label: 'Bois et plastiques' },
  { code: '07', label: 'Protection thermique et humidité' },
  { code: '08', label: 'Portes et fenêtres' },
  { code: '09', label: 'Finitions' },
  { code: '10', label: 'Spécialités' },
  { code: '11', label: 'Équipement' },
  { code: '12', label: 'Ameublement' },
  { code: '15', label: 'Mécanique' },
  { code: '16', label: 'Électricité' },
  { code: '00', label: 'Autre' }
]

export function TakeoffToSoumissionSelector({
  projectId,
  selectedItems,
  onSelectionChange,
  onClose
}: TakeoffSelectorProps) {
  const [measures, setMeasures] = useState<TakeoffMeasure[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({})
  const [itemCategories, setItemCategories] = useState<Record<string, string>>({})

  // Charger les mesures du takeoff
  useEffect(() => {
    const loadMeasures = async () => {
      try {
        const { data, error } = await supabase
          .from('takeoff_measures')
          .select('*')
          .eq('project_id', projectId)
          .order('page_number')
          .order('created_at')

        if (error) throw error
        setMeasures(data || [])

        // Expand first page by default
        if (data && data.length > 0) {
          setExpandedPages(new Set([data[0].page_number]))
        }
      } catch (err) {
        console.error('Erreur chargement mesures:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMeasures()
  }, [projectId])

  // Grouper par page
  const measuresByPage = useMemo(() => {
    const filtered = measures.filter(m =>
      m.label.toLowerCase().includes(search.toLowerCase())
    )
    
    return filtered.reduce((acc, measure) => {
      const page = measure.page_number
      if (!acc[page]) acc[page] = []
      acc[page].push(measure)
      return acc
    }, {} as Record<number, TakeoffMeasure[]>)
  }, [measures, search])

  const pages = Object.keys(measuresByPage).map(Number).sort((a, b) => a - b)

  // Toggle sélection
  const toggleSelection = (measure: TakeoffMeasure) => {
    const existingIndex = selectedItems.findIndex(i => i.measureId === measure.id)
    
    if (existingIndex >= 0) {
      // Désélectionner
      onSelectionChange(selectedItems.filter(i => i.measureId !== measure.id))
    } else {
      // Sélectionner
      const newItem: SelectedTakeoffItem = {
        measureId: measure.id,
        label: measure.label,
        quantity: measure.value,
        unit: measure.unit,
        unitPrice: itemPrices[measure.id] || measure.metadata?.unit_price || 0,
        category: itemCategories[measure.id] || measure.metadata?.category || '00',
        notes: measure.metadata?.notes
      }
      onSelectionChange([...selectedItems, newItem])
    }
  }

  // Mettre à jour le prix d'un item
  const updateItemPrice = (measureId: string, price: number) => {
    setItemPrices(prev => ({ ...prev, [measureId]: price }))
    
    // Mettre à jour dans la sélection si déjà sélectionné
    const updated = selectedItems.map(item => {
      if (item.measureId === measureId) {
        return { ...item, unitPrice: price }
      }
      return item
    })
    onSelectionChange(updated)
  }

  // Mettre à jour la catégorie
  const updateItemCategory = (measureId: string, category: string) => {
    setItemCategories(prev => ({ ...prev, [measureId]: category }))
    
    const updated = selectedItems.map(item => {
      if (item.measureId === measureId) {
        return { ...item, category }
      }
      return item
    })
    onSelectionChange(updated)
  }

  // Toggle page expansion
  const togglePage = (page: number) => {
    const newExpanded = new Set(expandedPages)
    if (newExpanded.has(page)) {
      newExpanded.delete(page)
    } else {
      newExpanded.add(page)
    }
    setExpandedPages(newExpanded)
  }

  // Sélectionner/désélectionner tous les items d'une page
  const togglePageSelection = (page: number, select: boolean) => {
    const pageMeasures = measuresByPage[page] || []
    
    if (select) {
      const newItems = pageMeasures
        .filter(m => !selectedItems.find(i => i.measureId === m.id))
        .map(m => ({
          measureId: m.id,
          label: m.label,
          quantity: m.value,
          unit: m.unit,
          unitPrice: itemPrices[m.id] || m.metadata?.unit_price || 0,
          category: itemCategories[m.id] || m.metadata?.category || '00'
        }))
      onSelectionChange([...selectedItems, ...newItems])
    } else {
      const pageIds = new Set(pageMeasures.map(m => m.id))
      onSelectionChange(selectedItems.filter(i => !pageIds.has(i.measureId)))
    }
  }

  // Calculer le total de la sélection
  const selectionTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }, [selectedItems])

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-gray-500">Chargement des mesures...</p>
      </div>
    )
  }

  if (measures.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Aucune mesure dans le takeoff</p>
        <p className="text-sm text-gray-400 mt-2">
          Créez des mesures dans le Takeoff pour les ajouter à la soumission
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Mesures du Takeoff</h3>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une mesure..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {pages.map(page => {
          const pageMeasures = measuresByPage[page]
          const isExpanded = expandedPages.has(page)
          const selectedCount = pageMeasures.filter(m => 
            selectedItems.find(i => i.measureId === m.id)
          ).length
          const allSelected = selectedCount === pageMeasures.length
          
          return (
            <div key={page} className="border-b border-gray-100">
              {/* Page Header */}
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => togglePage(page)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-medium text-gray-700">Page {page}</span>
                  <span className="text-sm text-gray-500">({pageMeasures.length} mesures)</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                      {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePageSelection(page, !allSelected)
                    }}
                    className={`p-1 rounded ${allSelected ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>

              {/* Measures */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {pageMeasures.map(measure => {
                    const isSelected = selectedItems.find(i => i.measureId === measure.id)
                    const Icon = TYPE_ICONS[measure.type]
                    const isEditing = editingItem === measure.id
                    const price = itemPrices[measure.id] ?? measure.metadata?.unit_price ?? 0
                    const category = itemCategories[measure.id] ?? measure.metadata?.category ?? '00'

                    return (
                      <div
                        key={measure.id}
                        className={`p-3 ${isSelected ? 'bg-teal-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelection(measure)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-teal-500 border-teal-500 text-white' 
                                : 'border-gray-300 hover:border-teal-400'
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: measure.color }}
                              />
                              <Icon size={14} className="text-gray-400" />
                              <span className="font-medium text-gray-900 truncate">
                                {measure.label}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span>{TYPE_LABELS[measure.type]}</span>
                              <span className="font-mono">
                                {measure.value.toFixed(2)} {measure.unit}
                              </span>
                            </div>

                            {/* Prix et catégorie (éditable) */}
                            {isSelected && (
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} className="text-gray-400" />
                                  <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => updateItemPrice(measure.id, parseFloat(e.target.value) || 0)}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                                    placeholder="Prix unit."
                                    step="0.01"
                                  />
                                  <span className="text-xs text-gray-500">/{measure.unit}</span>
                                </div>
                                
                                <select
                                  value={category}
                                  onChange={(e) => updateItemCategory(measure.id, e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-teal-500"
                                >
                                  {CATEGORIES.map(cat => (
                                    <option key={cat.code} value={cat.code}>
                                      {cat.code} - {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Total si prix défini */}
                          {isSelected && price > 0 && (
                            <div className="text-right">
                              <span className="font-semibold text-teal-600">
                                {(measure.value * price).toLocaleString('fr-CA', {
                                  style: 'currency',
                                  currency: 'CAD'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer - Résumé */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-600">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-500">Sous-total estimé:</span>
            <p className="text-xl font-bold text-teal-600">
              {selectionTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeoffToSoumissionSelector
