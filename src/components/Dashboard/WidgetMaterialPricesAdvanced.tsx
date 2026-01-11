/**
 * DAST Solutions - Widget Prix Matériaux Avancé
 * Graphiques tendances + Alertes hausse + Historique
 */
import React, { useState, useEffect } from 'react'
import {
  Package, TrendingUp, TrendingDown, Minus, AlertTriangle,
  RefreshCw, ChevronRight, DollarSign, Calendar, ArrowUpRight,
  ArrowDownRight, BarChart3, Eye, Bell, ExternalLink
} from 'lucide-react'

interface MaterialPrice {
  id: string
  name: string
  category: string
  unit: string
  currentPrice: number
  previousPrice: number
  weekAgoPrice: number
  monthAgoPrice: number
  change24h: number
  change7d: number
  change30d: number
  lastUpdated: string
  source: string
  alert?: {
    type: 'increase' | 'decrease' | 'volatile'
    threshold: number
    message: string
  }
}

interface PriceHistory {
  date: string
  price: number
}

const MATERIAL_CATEGORIES = [
  { id: 'all', name: 'Tous', icon: Package },
  { id: 'concrete', name: 'Béton', icon: Package },
  { id: 'steel', name: 'Acier', icon: Package },
  { id: 'wood', name: 'Bois', icon: Package },
  { id: 'masonry', name: 'Maçonnerie', icon: Package },
]

export default function WidgetMaterialPricesAdvanced() {
  const [materials, setMaterials] = useState<MaterialPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPrice | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [showAlerts, setShowAlerts] = useState(false)

  useEffect(() => {
    loadMaterialPrices()
    // Rafraîchir toutes les heures
    const interval = setInterval(loadMaterialPrices, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadMaterialPrices = async () => {
    try {
      setLoading(true)
      // Simuler les données - en production, connecter à une API de prix
      const mockMaterials = generateMockMaterials()
      setMaterials(mockMaterials)
    } catch (err) {
      console.error('Erreur prix matériaux:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateMockMaterials = (): MaterialPrice[] => {
    const basePrices: Record<string, { name: string; category: string; unit: string; base: number }> = {
      'concrete-30mpa': { name: 'Béton 30 MPa', category: 'concrete', unit: 'm³', base: 185 },
      'concrete-25mpa': { name: 'Béton 25 MPa', category: 'concrete', unit: 'm³', base: 175 },
      'rebar-15m': { name: 'Armature 15M', category: 'steel', unit: 'tonne', base: 1450 },
      'rebar-20m': { name: 'Armature 20M', category: 'steel', unit: 'tonne', base: 1480 },
      'steel-beam': { name: 'Poutre acier W310', category: 'steel', unit: 'tonne', base: 2200 },
      'lumber-2x4': { name: 'Bois 2x4x8 SPF', category: 'wood', unit: 'pmp', base: 0.85 },
      'lumber-2x6': { name: 'Bois 2x6x8 SPF', category: 'wood', unit: 'pmp', base: 0.95 },
      'plywood': { name: 'Contreplaqué 3/4"', category: 'wood', unit: 'feuille', base: 65 },
      'osb': { name: 'OSB 7/16"', category: 'wood', unit: 'feuille', base: 28 },
      'brick-std': { name: 'Brique standard', category: 'masonry', unit: '1000 unités', base: 850 },
      'block-8': { name: 'Bloc béton 8"', category: 'masonry', unit: 'unité', base: 3.25 },
      'mortar': { name: 'Mortier type S', category: 'masonry', unit: 'sac 30kg', base: 12.50 },
    }

    return Object.entries(basePrices).map(([id, info]) => {
      const variation = (Math.random() - 0.5) * 0.15
      const currentPrice = Math.round((info.base * (1 + variation)) * 100) / 100
      const previousPrice = Math.round((currentPrice * (1 + (Math.random() - 0.5) * 0.03)) * 100) / 100
      const weekAgoPrice = Math.round((currentPrice * (1 + (Math.random() - 0.5) * 0.08)) * 100) / 100
      const monthAgoPrice = Math.round((currentPrice * (1 + (Math.random() - 0.5) * 0.15)) * 100) / 100
      
      const change24h = ((currentPrice - previousPrice) / previousPrice) * 100
      const change7d = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100
      const change30d = ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100

      let alert: MaterialPrice['alert'] = undefined
      
      if (change7d > 5) {
        alert = {
          type: 'increase',
          threshold: 5,
          message: `Hausse de ${change7d.toFixed(1)}% cette semaine`
        }
      } else if (change7d < -5) {
        alert = {
          type: 'decrease',
          threshold: 5,
          message: `Baisse de ${Math.abs(change7d).toFixed(1)}% cette semaine`
        }
      } else if (Math.abs(change24h) > 3) {
        alert = {
          type: 'volatile',
          threshold: 3,
          message: 'Forte volatilité des prix'
        }
      }

      return {
        id,
        name: info.name,
        category: info.category,
        unit: info.unit,
        currentPrice,
        previousPrice,
        weekAgoPrice,
        monthAgoPrice,
        change24h,
        change7d,
        change30d,
        lastUpdated: new Date().toISOString(),
        source: 'BMR/Canac/Index Construction',
        alert
      }
    })
  }

  const generatePriceHistory = (material: MaterialPrice): PriceHistory[] => {
    const history: PriceHistory[] = []
    let price = material.monthAgoPrice
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Variation aléatoire mais tendant vers le prix actuel
      const targetProgress = (30 - i) / 30
      const targetPrice = material.monthAgoPrice + (material.currentPrice - material.monthAgoPrice) * targetProgress
      const variation = (Math.random() - 0.5) * material.monthAgoPrice * 0.02
      price = targetPrice + variation
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100
      })
    }
    
    return history
  }

  const handleSelectMaterial = (material: MaterialPrice) => {
    setSelectedMaterial(material)
    setPriceHistory(generatePriceHistory(material))
  }

  const filteredMaterials = selectedCategory === 'all' 
    ? materials 
    : materials.filter(m => m.category === selectedCategory)

  const alertMaterials = materials.filter(m => m.alert)

  const getTrendIcon = (change: number) => {
    if (change > 0.5) return <TrendingUp size={14} className="text-red-500" />
    if (change < -0.5) return <TrendingDown size={14} className="text-green-500" />
    return <Minus size={14} className="text-gray-400" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0.5) return 'text-red-600'
    if (change < -0.5) return 'text-green-600'
    return 'text-gray-500'
  }

  const formatPrice = (price: number, unit: string) => {
    if (price >= 1000) return `${(price / 1000).toFixed(1)}k$`
    if (price < 1) return `${(price * 100).toFixed(0)}¢`
    return `${price.toFixed(2)}$`
  }

  // Mini graphique sparkline
  const renderSparkline = (history: PriceHistory[]) => {
    if (history.length < 2) return null
    
    const prices = history.map(h => h.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    
    const width = 80
    const height = 30
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * width
      const y = height - ((h.price - min) / range) * height
      return `${x},${y}`
    }).join(' ')
    
    const isUp = prices[prices.length - 1] > prices[0]
    const color = isUp ? '#ef4444' : '#22c55e'
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (loading && materials.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="text-emerald-600" size={18} />
          <h3 className="font-semibold text-gray-900">Prix Matériaux</h3>
          {alertMaterials.length > 0 && (
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-1 hover:bg-gray-100 rounded"
            >
              <Bell size={16} className="text-amber-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {alertMaterials.length}
              </span>
            </button>
          )}
        </div>
        <button 
          onClick={loadMaterialPrices}
          className="p-1 hover:bg-gray-100 rounded"
          title="Rafraîchir"
        >
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerts Panel */}
      {showAlerts && alertMaterials.length > 0 && (
        <div className="mb-4 space-y-2">
          {alertMaterials.map(m => (
            <div 
              key={m.id}
              className={`p-2 rounded-lg text-sm flex items-start gap-2 ${
                m.alert?.type === 'increase' ? 'bg-red-50 text-red-800' :
                m.alert?.type === 'decrease' ? 'bg-green-50 text-green-800' :
                'bg-amber-50 text-amber-800'
              }`}
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">{m.name}:</span> {m.alert?.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {MATERIAL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Materials List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredMaterials.map(material => (
          <div 
            key={material.id}
            onClick={() => handleSelectMaterial(material)}
            className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-sm ${
              selectedMaterial?.id === material.id ? 'border-emerald-300 bg-emerald-50' : 'hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{material.name}</span>
                  {material.alert && (
                    <AlertTriangle size={12} className={
                      material.alert.type === 'increase' ? 'text-red-500' :
                      material.alert.type === 'decrease' ? 'text-green-500' :
                      'text-amber-500'
                    } />
                  )}
                </div>
                <span className="text-xs text-gray-500">/{material.unit}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatPrice(material.currentPrice, material.unit)}
                  </div>
                  <div className={`text-xs flex items-center gap-0.5 ${getTrendColor(material.change7d)}`}>
                    {getTrendIcon(material.change7d)}
                    {material.change7d > 0 ? '+' : ''}{material.change7d.toFixed(1)}%
                    <span className="text-gray-400 ml-1">7j</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Material Detail */}
      {selectedMaterial && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">{selectedMaterial.name}</h4>
            <button 
              onClick={() => setSelectedMaterial(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fermer
            </button>
          </div>
          
          {/* Price Changes */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">24h</p>
              <p className={`font-semibold ${getTrendColor(selectedMaterial.change24h)}`}>
                {selectedMaterial.change24h > 0 ? '+' : ''}{selectedMaterial.change24h.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">7 jours</p>
              <p className={`font-semibold ${getTrendColor(selectedMaterial.change7d)}`}>
                {selectedMaterial.change7d > 0 ? '+' : ''}{selectedMaterial.change7d.toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">30 jours</p>
              <p className={`font-semibold ${getTrendColor(selectedMaterial.change30d)}`}>
                {selectedMaterial.change30d > 0 ? '+' : ''}{selectedMaterial.change30d.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Sparkline */}
          {priceHistory.length > 0 && (
            <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
              {renderSparkline(priceHistory)}
              <span className="text-xs text-gray-500 ml-2">30 jours</span>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2 text-center">
            Source: {selectedMaterial.source}
          </p>
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-3 pt-3 border-t">
        <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1">
          Voir tous les prix
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  )
}
