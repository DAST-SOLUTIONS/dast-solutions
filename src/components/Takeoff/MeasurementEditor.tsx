/**
 * DAST Solutions - MeasurementEditor
 * Panneau d'édition complet pour une mesure:
 * - Nom et description
 * - Dimensions additionnelles (hauteur, largeur, épaisseur)
 * - Métier CCQ avec taux horaire
 * - Matériaux avec prix unitaire
 * - Calculs automatiques (surface, volume, coûts)
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  X, Save, Trash2, Calculator, DollarSign, Ruler, Users,
  Package, Layers, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import type { Measurement, AdditionalDimensions, MeasurementCosts } from '@/types/takeoff-measure-types'
import {
  TAKEOFF_CATEGORIES,
  CCQ_TRADES,
  COMMON_MATERIALS,
  calculateDerivedValues,
  calculateMeasurementCosts
} from '@/types/takeoff-measure-types'

interface MeasurementEditorProps {
  measurement: Measurement
  onSave: (updated: Measurement) => void
  onDelete: () => void
  onClose: () => void
}

export function MeasurementEditor({
  measurement,
  onSave,
  onDelete,
  onClose
}: MeasurementEditorProps) {
  // État local de la mesure
  const [label, setLabel] = useState(measurement.label || '')
  const [description, setDescription] = useState(measurement.description || '')
  const [category, setCategory] = useState(measurement.category)
  const [color, setColor] = useState(measurement.color)
  const [notes, setNotes] = useState(measurement.notes || '')
  
  // Dimensions additionnelles
  const [dimensions, setDimensions] = useState<AdditionalDimensions>(
    measurement.dimensions || {}
  )
  
  // Coûts
  const [costs, setCosts] = useState<MeasurementCosts>(
    measurement.costs || {}
  )
  
  // Sections expandables
  const [showDimensions, setShowDimensions] = useState(true)
  const [showLabor, setShowLabor] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)

  // Mettre à jour la couleur quand la catégorie change
  useEffect(() => {
    const cat = TAKEOFF_CATEGORIES.find(c => c.name === category)
    if (cat) {
      setColor(cat.color)
      // Suggérer le métier par défaut de la catégorie
      if (!costs.laborTradeCode && cat.defaultTrade) {
        const trade = CCQ_TRADES.find(t => t.code === cat.defaultTrade)
        if (trade) {
          setCosts(prev => ({
            ...prev,
            laborTradeCode: trade.code,
            laborTradeName: trade.name,
            laborHourlyRate: trade.rate
          }))
        }
      }
    }
  }, [category])

  // Calculer les valeurs dérivées
  const calculatedValues = useMemo(() => {
    const tempMeasurement: Measurement = {
      ...measurement,
      dimensions,
      costs
    }
    return calculateDerivedValues(tempMeasurement)
  }, [measurement, dimensions])

  // Calculer les coûts
  const calculatedCosts = useMemo(() => {
    const tempMeasurement: Measurement = {
      ...measurement,
      dimensions,
      costs,
      calculated: calculatedValues
    }
    return calculateMeasurementCosts(tempMeasurement)
  }, [measurement, dimensions, costs, calculatedValues])

  // Gérer le changement de métier
  const handleTradeChange = useCallback((tradeCode: string) => {
    const trade = CCQ_TRADES.find(t => t.code === tradeCode)
    if (trade) {
      setCosts(prev => ({
        ...prev,
        laborTradeCode: trade.code,
        laborTradeName: trade.name,
        laborHourlyRate: trade.rate
      }))
    }
  }, [])

  // Gérer le changement de matériau
  const handleMaterialChange = useCallback((materialId: string) => {
    const material = COMMON_MATERIALS.find(m => m.id === materialId)
    if (material) {
      setCosts(prev => ({
        ...prev,
        materialName: material.name,
        materialUnit: material.unit,
        materialUnitPrice: material.price,
        // Auto-calculer la quantité si possible
        materialQuantity: calculatedValues.area || calculatedValues.volume || measurement.value
      }))
    }
  }, [calculatedValues, measurement.value])

  // Sauvegarder
  const handleSave = useCallback(() => {
    const updated: Measurement = {
      ...measurement,
      label: label || `${measurement.type} - ${category}`,
      description,
      category,
      color,
      notes,
      dimensions,
      costs: calculatedCosts,
      calculated: calculatedValues,
      updatedAt: new Date().toISOString()
    }
    onSave(updated)
  }, [measurement, label, description, category, color, notes, dimensions, calculatedCosts, calculatedValues, onSave])

  // Obtenir l'icône du type
  const getTypeLabel = () => {
    switch (measurement.type) {
      case 'line': return '📏 Ligne'
      case 'rectangle': return '⬜ Rectangle'
      case 'area': return '⬡ Polygone'
      case 'count': return '🔢 Comptage'
      default: return measurement.type
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
          <span className="font-medium">{getTypeLabel()}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Informations de base */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'item
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${measurement.type} - ${category}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {TAKEOFF_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">{color}</span>
              </div>
            </div>
          </div>

          {/* Valeur principale */}
          <div className="p-3 bg-teal-50 rounded-lg">
            <div className="text-sm text-teal-700 font-medium">Valeur mesurée</div>
            <div className="text-2xl font-bold text-teal-800">
              {measurement.value.toFixed(2)} {measurement.unit}
            </div>
          </div>
        </div>

        {/* Section: Dimensions additionnelles */}
        <div className="border rounded-lg">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Ruler size={18} className="text-blue-600" />
              <span className="font-medium">Dimensions additionnelles</span>
            </div>
            {showDimensions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showDimensions && (
            <div className="p-3 border-t space-y-3">
              {measurement.type === 'line' && (
                <>
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    💡 Ajoutez une hauteur pour calculer une surface, ou hauteur + largeur pour un volume
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hauteur (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.height || ''}
                        onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
                        placeholder="Ex: 2.75"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Largeur (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.width || ''}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || undefined }))}
                        placeholder="Ex: 0.20"
                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {(measurement.type === 'rectangle' || measurement.type === 'area') && (
                <>
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    💡 Ajoutez une épaisseur pour calculer un volume (ex: dalle de béton)
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Épaisseur (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.thickness || ''}
                      onChange={(e) => setDimensions(prev => ({ ...prev, thickness: parseFloat(e.target.value) || undefined }))}
                      placeholder="Ex: 0.15"
                      className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-gray-600 mb-1">Quantité/Répétition</label>
                <input
                  type="number"
                  min="1"
                  value={dimensions.quantity || 1}
                  onChange={(e) => setDimensions(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Valeurs calculées */}
              {(calculatedValues.area || calculatedValues.volume) && (
                <div className="p-2 bg-green-50 rounded-lg space-y-1">
                  <div className="text-xs font-medium text-green-700">Valeurs calculées</div>
                  {calculatedValues.length && (
                    <div className="flex justify-between text-sm">
                      <span>Longueur:</span>
                      <span className="font-medium">{calculatedValues.length.toFixed(2)} m</span>
                    </div>
                  )}
                  {calculatedValues.area && (
                    <div className="flex justify-between text-sm">
                      <span>Surface:</span>
                      <span className="font-medium">{calculatedValues.area.toFixed(2)} m²</span>
                    </div>
                  )}
                  {calculatedValues.volume && (
                    <div className="flex justify-between text-sm">
                      <span>Volume:</span>
                      <span className="font-medium">{calculatedValues.volume.toFixed(3)} m³</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Main-d'œuvre CCQ */}
        <div className="border rounded-lg">
          <button
            onClick={() => setShowLabor(!showLabor)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-orange-600" />
              <span className="font-medium">Main-d'œuvre CCQ</span>
              {costs.laborCost && costs.laborCost > 0 && (
                <span className="text-sm text-orange-600 font-medium">
                  ${costs.laborCost?.toFixed(2)}
                </span>
              )}
            </div>
            {showLabor ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showLabor && (
            <div className="p-3 border-t space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Métier CCQ</label>
                <select
                  value={costs.laborTradeCode || ''}
                  onChange={(e) => handleTradeChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Sélectionner un métier --</option>
                  {CCQ_TRADES.map(trade => (
                    <option key={trade.code} value={trade.code}>
                      {trade.name} ({trade.rate.toFixed(2)}$/h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Taux horaire ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.laborHourlyRate || ''}
                    onChange={(e) => setCosts(prev => ({ ...prev, laborHourlyRate: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Heures estimées</label>
                  <input
                    type="number"
                    step="0.5"
                    value={costs.laborHours || ''}
                    onChange={(e) => setCosts(prev => ({ ...prev, laborHours: parseFloat(e.target.value) || undefined }))}
                    placeholder="Ex: 8"
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {costs.laborHourlyRate && costs.laborHours && (
                <div className="p-2 bg-orange-50 rounded flex justify-between items-center">
                  <span className="text-sm text-orange-700">Coût main-d'œuvre:</span>
                  <span className="font-bold text-orange-800">
                    ${(costs.laborHourlyRate * costs.laborHours).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section: Matériaux */}
        <div className="border rounded-lg">
          <button
            onClick={() => setShowMaterials(!showMaterials)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Package size={18} className="text-purple-600" />
              <span className="font-medium">Matériaux</span>
              {costs.materialCost && costs.materialCost > 0 && (
                <span className="text-sm text-purple-600 font-medium">
                  ${costs.materialCost?.toFixed(2)}
                </span>
              )}
            </div>
            {showMaterials ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {showMaterials && (
            <div className="p-3 border-t space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Matériau</label>
                <select
                  value={COMMON_MATERIALS.find(m => m.name === costs.materialName)?.id || ''}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Sélectionner un matériau --</option>
                  {COMMON_MATERIALS.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.price.toFixed(2)}$/{mat.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prix unit.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.materialUnitPrice || ''}
                    onChange={(e) => setCosts(prev => ({ ...prev, materialUnitPrice: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costs.materialQuantity || ''}
                    onChange={(e) => setCosts(prev => ({ ...prev, materialQuantity: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Unité</label>
                  <input
                    type="text"
                    value={costs.materialUnit || ''}
                    onChange={(e) => setCosts(prev => ({ ...prev, materialUnit: e.target.value }))}
                    placeholder="m²"
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {costs.materialUnitPrice && costs.materialQuantity && (
                <div className="p-2 bg-purple-50 rounded flex justify-between items-center">
                  <span className="text-sm text-purple-700">Coût matériaux:</span>
                  <span className="font-bold text-purple-800">
                    ${(costs.materialUnitPrice * costs.materialQuantity).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Résumé des coûts */}
        {(calculatedCosts.totalCost && calculatedCosts.totalCost > 0) && (
          <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg text-white">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} />
              <span className="font-medium">Résumé des coûts</span>
            </div>
            <div className="space-y-1 text-sm">
              {calculatedCosts.laborCost && calculatedCosts.laborCost > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-90">Main-d'œuvre:</span>
                  <span>${calculatedCosts.laborCost.toFixed(2)}</span>
                </div>
              )}
              {calculatedCosts.materialCost && calculatedCosts.materialCost > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-90">Matériaux:</span>
                  <span>${calculatedCosts.materialCost.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/30 pt-1 mt-1">
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span>${calculatedCosts.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes additionnelles..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>
      </div>

      {/* Footer - Actions */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-lg">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
        >
          <Trash2 size={16} />
          Supprimer
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default MeasurementEditor
