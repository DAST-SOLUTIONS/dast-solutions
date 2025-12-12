/**
 * DAST Solutions - MeasureToolbar
 * Barre d'outils pour les mesures sur plans
 */
import { MousePointer, Minus, Square, Hexagon, Plus, Settings } from 'lucide-react'
import type { MeasureToolType } from '@/types/takeoff-measure-types'
import { TAKEOFF_CATEGORIES, COMMON_SCALES } from '@/types/takeoff-measure-types'

interface MeasureToolbarProps {
  activeTool: MeasureToolType
  onToolChange: (tool: MeasureToolType) => void
  currentCategory: string
  onCategoryChange: (category: string) => void
  currentColor: string
  onColorChange: (color: string) => void
  scale: number
  onScaleChange: (scale: number) => void
  onScaleCalibrate?: () => void
}

const TOOLS = [
  { type: 'select' as MeasureToolType, name: 'Sélection', icon: MousePointer, shortcut: 'V' },
  { type: 'line' as MeasureToolType, name: 'Ligne', icon: Minus, shortcut: 'L' },
  { type: 'rectangle' as MeasureToolType, name: 'Rectangle', icon: Square, shortcut: 'R' },
  { type: 'area' as MeasureToolType, name: 'Polygone', icon: Hexagon, shortcut: 'P' },
  { type: 'count' as MeasureToolType, name: 'Comptage', icon: Plus, shortcut: 'C' },
]

export function MeasureToolbar({
  activeTool,
  onToolChange,
  currentCategory,
  onCategoryChange,
  currentColor,
  onColorChange,
  scale,
  onScaleChange,
  onScaleCalibrate
}: MeasureToolbarProps) {
  const selectedCategory = TAKEOFF_CATEGORIES.find(c => c.id === currentCategory)

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* Outils de mesure */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Outils</h3>
        <div className="flex gap-1">
          {TOOLS.map(tool => {
            const Icon = tool.icon
            const isActive = activeTool === tool.type
            return (
              <button
                key={tool.type}
                onClick={() => onToolChange(tool.type)}
                className={`
                  relative p-3 rounded-lg transition-all group
                  ${isActive 
                    ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-500' 
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                `}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <Icon size={20} />
                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  {tool.name} ({tool.shortcut})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Catégorie</h3>
        <select
          value={currentCategory}
          onChange={(e) => {
            onCategoryChange(e.target.value)
            const cat = TAKEOFF_CATEGORIES.find(c => c.id === e.target.value)
            if (cat) onColorChange(cat.color)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {TAKEOFF_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {selectedCategory && (
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="text-sm text-gray-600">Couleur: {selectedCategory.color}</span>
          </div>
        )}
      </div>

      {/* Couleur personnalisée */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Couleur</h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-200"
          />
          <input
            type="text"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Échelle */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Échelle du plan</h3>
        <select
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {COMMON_SCALES.map(s => (
            <option key={s.label} value={s.value}>{s.label}</option>
          ))}
          <option value="custom">Personnalisé...</option>
        </select>
        
        {onScaleCalibrate && (
          <button
            onClick={onScaleCalibrate}
            className="w-full mt-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            Calibrer avec une dimension connue
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Instructions</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li><strong>Ligne:</strong> 2 clics (début → fin)</li>
          <li><strong>Rectangle:</strong> 2 clics (coins opposés)</li>
          <li><strong>Polygone:</strong> Clics multiples, double-clic pour fermer</li>
          <li><strong>Comptage:</strong> 1 clic = 1 unité</li>
          <li><strong>Déplacer:</strong> Alt + Clic et glisser</li>
        </ul>
      </div>

      {/* Raccourcis clavier */}
      <div className="text-xs text-gray-400">
        <p>Raccourcis: V (sélection), L (ligne), R (rectangle), P (polygone), C (comptage)</p>
      </div>
    </div>
  )
}
