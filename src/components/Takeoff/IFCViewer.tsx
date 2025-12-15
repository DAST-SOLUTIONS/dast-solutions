/**
 * DAST Solutions - IFCViewer
 * Viewer 3D pour fichiers IFC (fonctionnalité en développement)
 * 
 * Note: Three.js et web-ifc sont en optionalDependencies
 * Cette fonctionnalité sera activée dans une prochaine version
 */
import { useState, useCallback } from 'react'
import {
  Box, Upload, AlertCircle, Loader2, ChevronLeft, ChevronRight, Package,
  Eye, EyeOff, Info, Layers
} from 'lucide-react'

interface IFCElement {
  expressID: number
  type: string
  name: string
  description?: string
  visible: boolean
}

interface IFCViewerProps {
  onExtractQuantities?: (elements: IFCElement[]) => void
}

// Catégories IFC pour démonstration
const IFC_DEMO_CATEGORIES = [
  { type: 'IfcWall', label: 'Murs', icon: '🧱', count: 0 },
  { type: 'IfcSlab', label: 'Dalles', icon: '⬛', count: 0 },
  { type: 'IfcColumn', label: 'Colonnes', icon: '🏛️', count: 0 },
  { type: 'IfcBeam', label: 'Poutres', icon: '📏', count: 0 },
  { type: 'IfcDoor', label: 'Portes', icon: '🚪', count: 0 },
  { type: 'IfcWindow', label: 'Fenêtres', icon: '🪟', count: 0 },
  { type: 'IfcStair', label: 'Escaliers', icon: '🪜', count: 0 },
  { type: 'IfcRoof', label: 'Toitures', icon: '🏠', count: 0 },
]

export function IFCViewer({ onExtractQuantities }: IFCViewerProps) {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith('.ifc')) {
      setError('Veuillez sélectionner un fichier IFC valide')
      return
    }

    setIsLoading(true)
    setError(null)

    // Simulation de chargement
    setTimeout(() => {
      setError('Le viewer IFC 3D sera disponible dans une prochaine version. Les dépendances Three.js et web-ifc sont en cours d\'intégration.')
      setIsLoading(false)
    }, 2000)
  }, [])

  return (
    <div className="flex h-full bg-gray-900" style={{ minHeight: '600px' }}>
      {/* Panneau gauche - Structure IFC */}
      <div className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ${
        leftPanelCollapsed ? 'w-12' : 'w-72'
      }`}>
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          {!leftPanelCollapsed && (
            <span className="text-sm font-medium text-white">Structure IFC</span>
          )}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          >
            {leftPanelCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!leftPanelCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {/* Upload */}
            <div className="p-3 border-b border-gray-700">
              <input
                type="file"
                accept=".ifc"
                onChange={handleFileUpload}
                className="hidden"
                id="ifc-upload"
              />
              <label
                htmlFor="ifc-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer"
              >
                <Upload size={18} />
                Charger fichier IFC
              </label>
            </div>

            {/* Catégories */}
            <div className="p-2">
              {IFC_DEMO_CATEGORIES.map(cat => (
                <div
                  key={cat.type}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-700 text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm">{cat.label}</span>
                  </div>
                  <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                    {cat.count}
                  </span>
                </div>
              ))}

              <div className="text-center text-gray-500 py-8 mt-4">
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-sm">Aucun modèle chargé</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone centrale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-3 border-b border-gray-700">
          <span className="text-sm">Viewer IFC 3D</span>
          <div className="flex-1" />
          <span className="text-xs text-gray-400 bg-amber-600/20 text-amber-400 px-2 py-1 rounded">
            🚧 En développement
          </span>
        </div>

        {/* Zone 3D */}
        <div className="flex-1 relative bg-gradient-to-b from-gray-800 to-gray-900">
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <div className="text-white">Chargement du modèle IFC...</div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-900/90 text-amber-200 px-4 py-3 rounded-lg flex items-center gap-2 max-w-lg">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400 max-w-md">
              <Box size={80} className="mx-auto mb-4 opacity-30" />
              <div className="text-xl font-medium mb-2">Viewer IFC 3D</div>
              <div className="text-sm mb-4">
                Visualisez vos modèles BIM directement dans DAST
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-left text-xs">
                <div className="font-medium text-gray-300 mb-2">Fonctionnalités prévues:</div>
                <ul className="space-y-1 text-gray-500">
                  <li>• Rendu 3D haute qualité (Three.js)</li>
                  <li>• Parsing IFC natif (web-ifc)</li>
                  <li>• Navigation orbit/pan/zoom</li>
                  <li>• Arbre des éléments par catégorie</li>
                  <li>• Extraction automatique des quantités</li>
                  <li>• Export vers module Takeoff</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-gray-800 text-gray-400 px-4 py-1 flex items-center gap-4 text-xs border-t border-gray-700">
          <span>Format supporté: IFC 2x3, IFC 4</span>
          <div className="flex-1" />
          <span>Bientôt disponible</span>
        </div>
      </div>

      {/* Panneau droit - Propriétés */}
      <div className={`bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300 ${
        rightPanelCollapsed ? 'w-12' : 'w-72'
      }`}>
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400"
          >
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {!rightPanelCollapsed && (
            <span className="text-sm font-medium text-white">Propriétés</span>
          )}
        </div>

        {!rightPanelCollapsed && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-center text-gray-500 py-8">
              <Info size={32} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm">Sélectionnez un élément</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IFCViewer
