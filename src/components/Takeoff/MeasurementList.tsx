/**
 * DAST Solutions - MeasurementList
 * Liste des mesures effectuées avec actions
 */
import { useState, useMemo } from 'react'
import { Trash2, Edit2, Copy, Check, X, Download, FileSpreadsheet, ArrowUpDown } from 'lucide-react'
import type { Measurement } from '@/types/takeoff-measure-types'
import { TAKEOFF_CATEGORIES } from '@/types/takeoff-measure-types'

interface MeasurementListProps {
  measurements: Measurement[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Measurement>) => void
  onDuplicate: (measurement: Measurement) => void
  onSelect: (id: string) => void
  selectedId: string | null
  onExportCSV?: () => void
  onExportToEstimation?: () => void
}

export function MeasurementList({
  measurements,
  onDelete,
  onUpdate,
  onDuplicate,
  onSelect,
  selectedId,
  onExportCSV,
  onExportToEstimation
}: MeasurementListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [sortBy, setSortBy] = useState<'category' | 'type' | 'value'>('category')
  const [groupByCategory, setGroupByCategory] = useState(true)

  // Trier et grouper les mesures
  const sortedMeasurements = useMemo(() => {
    const sorted = [...measurements].sort((a, b) => {
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      if (sortBy === 'value') return b.value - a.value
      return 0
    })
    return sorted
  }, [measurements, sortBy])

  // Grouper par catégorie
  const groupedMeasurements = useMemo(() => {
    if (!groupByCategory) return { 'Toutes': sortedMeasurements }
    
    return sortedMeasurements.reduce((groups, m) => {
      const cat = m.category || 'autre'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(m)
      return groups
    }, {} as Record<string, Measurement[]>)
  }, [sortedMeasurements, groupByCategory])

  // Totaux par catégorie
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { count: number, linearM: number, areaM2: number, units: number }> = {}
    
    measurements.forEach(m => {
      const cat = m.category || 'autre'
      if (!totals[cat]) totals[cat] = { count: 0, linearM: 0, areaM2: 0, units: 0 }
      
      totals[cat].count++
      if (m.type === 'line') totals[cat].linearM += m.value
      if (m.type === 'area' || m.type === 'rectangle') totals[cat].areaM2 += m.value
      if (m.type === 'count') totals[cat].units += m.value
    })
    
    return totals
  }, [measurements])

  // Commencer l'édition
  const startEdit = (m: Measurement) => {
    setEditingId(m.id)
    setEditLabel(m.label)
  }

  // Sauvegarder l'édition
  const saveEdit = (id: string) => {
    onUpdate(id, { label: editLabel })
    setEditingId(null)
  }

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null)
    setEditLabel('')
  }

  // Formater la valeur
  const formatValue = (m: Measurement): string => {
    if (m.type === 'count') return `${m.value} ${m.unit}`
    return `${m.value.toFixed(2)} ${m.unit}`
  }

  // Obtenir le nom de catégorie
  const getCategoryName = (id: string): string => {
    const cat = TAKEOFF_CATEGORIES.find(c => c.id === id)
    return cat?.name || id
  }

  // Icône par type
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'line': return '📏'
      case 'area': return '⬡'
      case 'rectangle': return '▢'
      case 'count': return '🔢'
      default: return '•'
    }
  }

  if (measurements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-gray-400 mb-2">📐</div>
        <p className="text-gray-500">Aucune mesure</p>
        <p className="text-sm text-gray-400 mt-1">
          Utilisez les outils pour mesurer sur le plan
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header avec actions */}
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">
          Mesures ({measurements.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByCategory(!groupByCategory)}
            className={`p-1.5 rounded transition ${groupByCategory ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-200'}`}
            title="Grouper par catégorie"
          >
            <ArrowUpDown size={16} />
          </button>
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="p-1.5 hover:bg-gray-200 rounded transition"
              title="Exporter CSV"
            >
              <Download size={16} />
            </button>
          )}
          {onExportToEstimation && (
            <button
              onClick={onExportToEstimation}
              className="p-1.5 hover:bg-gray-200 rounded transition"
              title="Envoyer vers Estimation"
            >
              <FileSpreadsheet size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Liste des mesures */}
      <div className="max-h-[400px] overflow-y-auto">
        {Object.entries(groupedMeasurements).map(([category, items]) => (
          <div key={category}>
            {/* Header de catégorie */}
            {groupByCategory && (
              <div className="sticky top-0 px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
                <span className="font-medium text-gray-700">{getCategoryName(category)}</span>
                <span className="text-xs text-gray-500">
                  {items.length} élément{items.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Items */}
            {items.map(m => (
              <div
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`
                  px-4 py-3 border-b cursor-pointer transition
                  ${selectedId === m.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(m.type)}</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    {editingId === m.id ? (
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{m.label}</span>
                    )}
                  </div>
                  <span className="font-mono text-teal-700 font-semibold">
                    {formatValue(m)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    Page {m.pageNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    {editingId === m.id ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveEdit(m.id) }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(m) }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(m) }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Dupliquer"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Résumé / Totaux */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Résumé</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded p-2 border">
            <div className="text-lg font-bold text-blue-600">
              {Object.values(categoryTotals).reduce((s, t) => s + t.linearM, 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">m linéaires</div>
          </div>
          <div className="bg-white rounded p-2 border">
            <div className="text-lg font-bold text-green-600">
              {Object.values(categoryTotals).reduce((s, t) => s + t.areaM2, 0).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">m² surfaces</div>
          </div>
          <div className="bg-white rounded p-2 border">
            <div className="text-lg font-bold text-orange-600">
              {Object.values(categoryTotals).reduce((s, t) => s + t.units, 0)}
            </div>
            <div className="text-xs text-gray-500">unités</div>
          </div>
        </div>
      </div>
    </div>
  )
}
