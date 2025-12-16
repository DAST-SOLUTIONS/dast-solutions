/**
 * DAST Solutions - Takeoff to Soumission
 * Sélecteur de mesures pour créer une soumission
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  X, Check, Plus, Ruler, Square, Move3D, Hash,
  ChevronRight, FileText, Loader2, Search
} from 'lucide-react'

interface TakeoffMeasure {
  id: string
  project_id: string
  page_number: number
  type: 'line' | 'rectangle' | 'polygon' | 'count' | 'area'
  label: string
  value: number
  unit: string
  color: string
  category?: string
  unit_price?: number
}

interface TakeoffToSoumissionProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onCreateSoumission: (items: Array<{
    description: string
    quantity: number
    unit: string
    unit_price: number
    category?: string
  }>) => void
}

// Icônes par type de mesure
const TYPE_ICONS = {
  line: Ruler,
  rectangle: Square,
  polygon: Move3D,
  count: Hash,
  area: Square
}

const TYPE_LABELS = {
  line: 'Ligne',
  rectangle: 'Rectangle',
  polygon: 'Polygone',
  count: 'Comptage',
  area: 'Surface'
}

export function TakeoffToSoumission({
  projectId,
  isOpen,
  onClose,
  onCreateSoumission
}: TakeoffToSoumissionProps) {
  const [measures, setMeasures] = useState<TakeoffMeasure[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Charger les mesures du projet
  useEffect(() => {
    if (isOpen && projectId) {
      loadMeasures()
    }
  }, [isOpen, projectId])

  const loadMeasures = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('takeoff_measures')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('page_number')
        .order('created_at')

      if (error) throw error
      setMeasures(data || [])
    } catch (err) {
      console.error('Erreur chargement mesures:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les mesures
  const filteredMeasures = measures.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false
    if (search) {
      const s = search.toLowerCase()
      return m.label.toLowerCase().includes(s) || 
             (m.category && m.category.toLowerCase().includes(s))
    }
    return true
  })

  // Grouper par page
  const measuresByPage = filteredMeasures.reduce((acc, m) => {
    const page = m.page_number || 1
    if (!acc[page]) acc[page] = []
    acc[page].push(m)
    return acc
  }, {} as Record<number, TakeoffMeasure[]>)

  // Toggle sélection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Tout sélectionner
  const selectAll = () => {
    setSelectedIds(new Set(filteredMeasures.map(m => m.id)))
  }

  // Tout désélectionner
  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  // Créer la soumission
  const handleCreate = () => {
    const selectedMeasures = measures.filter(m => selectedIds.has(m.id))
    
    const items = selectedMeasures.map(m => ({
      description: m.label,
      quantity: m.value,
      unit: m.unit,
      unit_price: m.unit_price || 0,
      category: m.category
    }))

    onCreateSoumission(items)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Créer soumission depuis Takeoff</h2>
            <p className="text-teal-100 text-sm">Sélectionnez les mesures à inclure</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tous les types</option>
            <option value="line">Lignes</option>
            <option value="rectangle">Rectangles</option>
            <option value="polygon">Polygones</option>
            <option value="count">Comptages</option>
            <option value="area">Surfaces</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              Tout sélectionner
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAll}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Désélectionner
            </button>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {selectedIds.size} / {measures.length} sélectionné(s)
          </div>
        </div>

        {/* Liste des mesures */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-teal-600" size={40} />
            </div>
          ) : measures.length === 0 ? (
            <div className="text-center py-12">
              <Ruler size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mesure</h3>
              <p className="text-gray-600">
                Effectuez des mesures dans le Takeoff pour les ajouter à une soumission.
              </p>
            </div>
          ) : filteredMeasures.length === 0 ? (
            <div className="text-center py-12">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Aucune mesure ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(measuresByPage).map(([page, pageMeasures]) => (
                <div key={page}>
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Page {page}
                    <span className="text-sm text-gray-500">
                      ({pageMeasures.length} mesure{pageMeasures.length > 1 ? 's' : ''})
                    </span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pageMeasures.map(measure => {
                      const Icon = TYPE_ICONS[measure.type] || Ruler
                      const isSelected = selectedIds.has(measure.id)
                      
                      return (
                        <div
                          key={measure.id}
                          onClick={() => toggleSelect(measure.id)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                              isSelected
                                ? 'bg-teal-500 border-teal-500'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>

                            {/* Icône type */}
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: measure.color + '20', color: measure.color }}
                            >
                              <Icon size={18} />
                            </div>

                            {/* Contenu */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {measure.label}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">
                                  {TYPE_LABELS[measure.type]}
                                </span>
                                {measure.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {measure.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Valeur */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900">
                                {measure.value.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">{measure.unit}</p>
                            </div>
                          </div>

                          {/* Prix unitaire si défini */}
                          {measure.unit_price && measure.unit_price > 0 && (
                            <div className="mt-2 pt-2 border-t text-sm flex justify-between">
                              <span className="text-gray-500">Prix unitaire:</span>
                              <span className="font-medium">
                                {measure.unit_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })} / {measure.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedIds.size > 0 && (
              <>
                Total sélectionné: <span className="font-medium">
                  {measures
                    .filter(m => selectedIds.has(m.id))
                    .reduce((sum, m) => sum + (m.value * (m.unit_price || 0)), 0)
                    .toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={selectedIds.size === 0}
              className="btn btn-primary disabled:opacity-50"
            >
              <Plus size={18} className="mr-2" />
              Créer soumission ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TakeoffToSoumission
