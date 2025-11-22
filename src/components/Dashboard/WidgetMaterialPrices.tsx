import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MaterialPrice {
  id: string
  name: string
  unit: string
  price: number
  previous_price?: number
  change_percentage?: number
  trend: 'up' | 'down' | 'stable'
  supplier: string
  last_updated: string
  history?: { date: string; price: number }[]
}

interface WidgetMaterialPricesProps {
  materials?: string[] // List of materials to track
  onPriceAlert?: (material: MaterialPrice) => void
}

// Mock data - en production, utiliser API réelle
const MOCK_MATERIALS: MaterialPrice[] = [
  {
    id: 'concrete',
    name: 'Béton (m³)',
    unit: 'm³',
    price: 185,
    previous_price: 175,
    change_percentage: 5.7,
    trend: 'up',
    supplier: 'Graymont',
    last_updated: new Date().toISOString(),
    history: [
      { date: 'Lun', price: 175 },
      { date: 'Mar', price: 178 },
      { date: 'Mer', price: 180 },
      { date: 'Jeu', price: 183 },
      { date: 'Ven', price: 185 },
    ],
  },
  {
    id: 'steel',
    name: 'Acier (tonne)',
    unit: 'tonne',
    price: 950,
    previous_price: 960,
    change_percentage: -1.0,
    trend: 'down',
    supplier: 'ArcelorMittal',
    last_updated: new Date().toISOString(),
    history: [
      { date: 'Lun', price: 960 },
      { date: 'Mar', price: 955 },
      { date: 'Mer', price: 952 },
      { date: 'Jeu', price: 951 },
      { date: 'Ven', price: 950 },
    ],
  },
  {
    id: 'lumber',
    name: 'Bois (pmp)',
    unit: 'pmp',
    price: 4.85,
    previous_price: 4.75,
    change_percentage: 2.1,
    trend: 'up',
    supplier: 'Canfor',
    last_updated: new Date().toISOString(),
    history: [
      { date: 'Lun', price: 4.75 },
      { date: 'Mar', price: 4.78 },
      { date: 'Mer', price: 4.80 },
      { date: 'Jeu', price: 4.83 },
      { date: 'Ven', price: 4.85 },
    ],
  },
  {
    id: 'brick',
    name: 'Brique (m²)',
    unit: 'm²',
    price: 25.50,
    previous_price: 25.50,
    change_percentage: 0,
    trend: 'stable',
    supplier: 'Brampton Brick',
    last_updated: new Date().toISOString(),
    history: [
      { date: 'Lun', price: 25.50 },
      { date: 'Mar', price: 25.50 },
      { date: 'Mer', price: 25.50 },
      { date: 'Jeu', price: 25.50 },
      { date: 'Ven', price: 25.50 },
    ],
  },
]

export function WidgetMaterialPrices({ materials, onPriceAlert }: WidgetMaterialPricesProps) {
  const [prices, setPrices] = useState<MaterialPrice[]>(MOCK_MATERIALS)
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPrice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // En production, appeler une API réelle
    const fetchPrices = async () => {
      setLoading(true)
      try {
        // Simuler un délai API
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Appliquer les filtres si spécifiés
        let filtered = MOCK_MATERIALS
        if (materials && materials.length > 0) {
          filtered = MOCK_MATERIALS.filter(m =>
            materials.some(mat => mat.toLowerCase().includes(m.name.toLowerCase()))
          )
        }

        setPrices(filtered)
        setSelectedMaterial(filtered[0] || null)

        // Déclencher alertes pour variations > 5%
        filtered
          .filter(p => Math.abs(p.change_percentage || 0) > 5)
          .forEach(p => onPriceAlert?.(p))
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // Actualiser toutes les heures
    const interval = setInterval(fetchPrices, 3600000)
    return () => clearInterval(interval)
  }, [materials])

  const getTrendColor = (trend: string, change?: number) => {
    if (trend === 'up' || (change && change > 0)) return 'text-red-600'
    if (trend === 'down' || (change && change < 0)) return 'text-green-600'
    return 'text-gray-600'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={16} />
    if (trend === 'down') return <TrendingDown size={16} />
    return <Minus size={16} />
  }

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Prix Matériaux</h3>
        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />}
      </div>

      {/* Material List */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {prices.map(material => (
          <button
            key={material.id}
            onClick={() => setSelectedMaterial(material)}
            className={`
              p-3 rounded-lg border-l-4 transition text-left
              ${selectedMaterial?.id === material.id
                ? 'bg-teal-50 border-teal-500 shadow-md'
                : 'bg-gray-50 border-gray-300 hover:bg-white'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{material.name}</p>
                <p className="text-xs text-gray-600">{material.supplier}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">${material.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(material.trend, material.change_percentage)}`}>
                  {getTrendIcon(material.trend)}
                  <span>
                    {material.change_percentage && material.change_percentage > 0 ? '+' : ''}
                    {material.change_percentage?.toFixed(1) || '0'}%
                  </span>
                </div>
              </div>
            </div>

            {/* Alert for significant changes */}
            {Math.abs(material.change_percentage || 0) > 5 && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                <AlertCircle size={12} />
                Variation significative détectée
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Chart for selected material */}
      {selectedMaterial?.history && selectedMaterial.history.length > 0 && (
        <div className="flex-1 border-t pt-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Historique 5 jours</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={selectedMaterial.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                width={40}
              />
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={getTrendColor(selectedMaterial.trend)}
                dot={{ r: 4 }}
                strokeWidth={2}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 pt-3 border-t space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Dernière mise à jour:</span>
          <span className="font-semibold text-gray-900">
            {new Date(selectedMaterial?.last_updated || Date.now()).toLocaleTimeString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {selectedMaterial?.previous_price && (
          <div className="flex justify-between">
            <span className="text-gray-600">Prix précédent:</span>
            <span className="line-through text-gray-500">${selectedMaterial.previous_price.toFixed(2)}</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-blue-800">
          <p className="text-xs">
            💡 <strong>Conseil:</strong> Les prix changent quotidiennement. Optimisez vos achats en surveillant les tendances.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WidgetMaterialPrices