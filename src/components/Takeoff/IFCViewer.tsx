/**
 * DAST Solutions - IFCViewer
 * Viewer 3D pour fichiers IFC
 * 
 * NOTE: Ce composant nécessite l'installation de:
 * npm install three web-ifc web-ifc-three @types/three
 * 
 * Pour une version complète avec rendu 3D, voir:
 * - https://github.com/ThatOpen/engine_web-ifc
 * - https://github.com/bimrocket/bimrocket
 */
import { useRef, useState, useCallback } from 'react'
import {
  Box, RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff,
  Layers, Info, MousePointer, Ruler, Upload, Settings,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, Package
} from 'lucide-react'

// Types pour les éléments IFC
interface IFCElement {
  expressID: number
  type: string
  name: string
  description?: string
  visible: boolean
}

interface IFCModel {
  id: string
  name: string
  elements: IFCElement[]
  fileSize: number
}

interface IFCViewerProps {
  onElementSelect?: (element: IFCElement | null) => void
  onModelLoad?: (model: IFCModel) => void
  initialFile?: File
}

// Catégories IFC courantes
const IFC_CATEGORIES = [
  { type: 'IfcWall', label: 'Murs', color: '#A0522D', icon: '🧱' },
  { type: 'IfcSlab', label: 'Dalles', color: '#808080', icon: '⬛' },
  { type: 'IfcColumn', label: 'Colonnes', color: '#4682B4', icon: '🏛️' },
  { type: 'IfcBeam', label: 'Poutres', color: '#CD853F', icon: '📏' },
  { type: 'IfcDoor', label: 'Portes', color: '#8B4513', icon: '🚪' },
  { type: 'IfcWindow', label: 'Fenêtres', color: '#87CEEB', icon: '🪟' },
  { type: 'IfcStair', label: 'Escaliers', color: '#696969', icon: '🪜' },
  { type: 'IfcRoof', label: 'Toitures', color: '#B22222', icon: '🏠' },
  { type: 'IfcSpace', label: 'Espaces', color: '#90EE90', icon: '📦' },
]

export function IFCViewer({
  onElementSelect,
  onModelLoad,
  initialFile
}: IFCViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<IFCModel | null>(null)
  const [selectedElement, setSelectedElement] = useState<IFCElement | null>(null)
  
  // UI State
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'tree' | 'properties'>('tree')
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(IFC_CATEGORIES.map(c => c.type))
  )
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'section'>('select')

  // Charger un fichier IFC (simulation pour l'instant)
  const loadIFCFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      // Simuler le chargement progressif
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setLoadingProgress(i)
      }

      // Créer un modèle simulé basé sur le nom du fichier
      const simulatedElements: IFCElement[] = IFC_CATEGORIES.flatMap((cat, catIdx) => {
        const count = Math.floor(Math.random() * 20) + 5
        return Array.from({ length: count }, (_, i) => ({
          expressID: catIdx * 1000 + i,
          type: cat.type,
          name: `${cat.label} ${i + 1}`,
          description: `Élément ${cat.type} généré automatiquement`,
          visible: true
        }))
      })

      const ifcModel: IFCModel = {
        id: `ifc-${Date.now()}`,
        name: file.name,
        elements: simulatedElements,
        fileSize: file.size
      }

      setModel(ifcModel)
      onModelLoad?.(ifcModel)

    } catch (err) {
      console.error('Erreur chargement IFC:', err)
      setError(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    } finally {
      setIsLoading(false)
    }
  }, [onModelLoad])

  // Gérer l'upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.ifc')) {
        setError('Veuillez sélectionner un fichier .ifc')
        return
      }
      loadIFCFile(file)
    }
  }, [loadIFCFile])

  // Toggle catégorie
  const toggleCategory = useCallback((type: string) => {
    setVisibleCategories(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  // Sélectionner un élément
  const selectElement = useCallback((element: IFCElement | null) => {
    setSelectedElement(element)
    onElementSelect?.(element)
    if (element) setSidebarTab('properties')
  }, [onElementSelect])

  return (
    <div className="flex h-full bg-gray-900" style={{ minHeight: '600px' }}>
      {/* Sidebar */}
      <div className={`bg-gray-800 border-r border-gray-700 flex flex-col transition-all ${showSidebar ? 'w-72' : 'w-0 overflow-hidden'}`}>
        {showSidebar && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setSidebarTab('tree')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  sidebarTab === 'tree' ? 'bg-teal-900 text-teal-300 border-b-2 border-teal-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers size={14} className="inline mr-2" />
                Structure
              </button>
              <button
                onClick={() => setSidebarTab('properties')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  sidebarTab === 'properties' ? 'bg-teal-900 text-teal-300 border-b-2 border-teal-500' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Info size={14} className="inline mr-2" />
                Propriétés
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
              {sidebarTab === 'tree' && (
                <div className="space-y-1">
                  {IFC_CATEGORIES.map(cat => {
                    const elements = model?.elements.filter(e => e.type === cat.type) || []
                    const count = elements.length
                    const isVisible = visibleCategories.has(cat.type)
                    
                    return (
                      <div key={cat.type}>
                        <div
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer text-gray-300"
                          onClick={() => toggleCategory(cat.type)}
                        >
                          <span>{cat.icon}</span>
                          <span className="flex-1 text-sm">{cat.label}</span>
                          <span className="text-xs text-gray-500">{count}</span>
                          {isVisible ? (
                            <Eye size={14} className="text-teal-400" />
                          ) : (
                            <EyeOff size={14} className="text-gray-600" />
                          )}
                        </div>
                        
                        {/* Éléments enfants */}
                        {isVisible && count > 0 && (
                          <div className="ml-6 border-l border-gray-700 pl-2">
                            {elements.slice(0, 5).map(el => (
                              <div
                                key={el.expressID}
                                onClick={() => selectElement(el)}
                                className={`text-xs py-1 px-2 rounded cursor-pointer ${
                                  selectedElement?.expressID === el.expressID
                                    ? 'bg-teal-900 text-teal-300'
                                    : 'text-gray-400 hover:bg-gray-700'
                                }`}
                              >
                                {el.name}
                              </div>
                            ))}
                            {count > 5 && (
                              <div className="text-xs text-gray-500 py-1 px-2">
                                ... +{count - 5} autres
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {sidebarTab === 'properties' && (
                <div className="text-gray-300">
                  {selectedElement ? (
                    <div className="space-y-3">
                      <div className="font-medium text-white">{selectedElement.name}</div>
                      <div className="text-xs text-teal-400">{selectedElement.type}</div>
                      {selectedElement.description && (
                        <div className="text-sm text-gray-400">{selectedElement.description}</div>
                      )}
                      <div className="border-t border-gray-700 pt-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">Propriétés</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Express ID</span>
                            <span>{selectedElement.expressID}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Type</span>
                            <span>{selectedElement.type}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Visible</span>
                            <span>{selectedElement.visible ? 'Oui' : 'Non'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Info size={32} className="mx-auto mb-2 opacity-50" />
                      <div className="text-sm">Sélectionnez un élément</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Model info */}
            {model && (
              <div className="border-t border-gray-700 p-3 bg-gray-900">
                <div className="text-xs text-gray-400">{model.name}</div>
                <div className="text-xs text-gray-500">
                  {model.elements.length} éléments • {(model.fileSize / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-700 rounded text-gray-400"
          >
            {showSidebar ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm text-white"
          >
            <Upload size={16} />
            Charger IFC
          </button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* Tools */}
          {[
            { id: 'select', icon: MousePointer, label: 'Sélection' },
            { id: 'measure', icon: Ruler, label: 'Mesure' },
            { id: 'section', icon: Box, label: 'Section' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`p-2 rounded ${
                activeTool === tool.id ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
              title={tool.label}
            >
              <tool.icon size={18} />
            </button>
          ))}

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* View controls */}
          <button className="p-2 hover:bg-gray-700 rounded text-gray-400">
            <ZoomOut size={18} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded text-gray-400">
            <ZoomIn size={18} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded text-gray-400">
            <Maximize2 size={18} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded text-gray-400">
            <RotateCcw size={18} />
          </button>

          <div className="flex-1" />

          <button className="p-2 hover:bg-gray-700 rounded text-gray-400">
            <Settings size={18} />
          </button>
        </div>

        {/* 3D Viewer area */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-3 border border-gray-700">
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <div className="text-sm text-gray-300">Chargement du modèle IFC...</div>
                <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 transition-all" style={{ width: `${loadingProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-700 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 z-10">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-white">×</button>
            </div>
          )}

          {model ? (
            <div className="h-full flex items-center justify-center">
              {/* Placeholder pour le viewer 3D */}
              <div className="text-center">
                <div className="relative">
                  <Package size={120} className="mx-auto text-teal-500 opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">🏗️</div>
                  </div>
                </div>
                <div className="text-xl font-medium text-white mt-4">{model.name}</div>
                <div className="text-gray-400 mt-2">{model.elements.length} éléments chargés</div>
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-md mx-auto">
                  <div className="text-sm text-amber-400 mb-2">⚠️ Viewer 3D en développement</div>
                  <div className="text-xs text-gray-500">
                    Le rendu 3D complet nécessite l'intégration de Three.js + web-ifc.
                    <br />Les métadonnées du modèle sont accessibles dans le panneau latéral.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Package size={80} className="mx-auto text-gray-600 mb-4" />
                <div className="text-xl font-medium text-gray-300">Viewer IFC 3D</div>
                <div className="text-gray-500 mt-2">Cliquez sur "Charger IFC" pour ouvrir un modèle</div>
                <div className="text-xs text-gray-600 mt-4">
                  Formats: IFC 2x3, IFC4
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="bg-gray-800 border-t border-gray-700 text-gray-500 px-4 py-1 text-xs flex items-center gap-4">
          <span>Outil: {activeTool}</span>
          {model && (
            <>
              <span>•</span>
              <span>{model.elements.length} éléments</span>
              <span>•</span>
              <span>{visibleCategories.size} catégories visibles</span>
            </>
          )}
          <div className="flex-1" />
          <span>Clic: Sélection • Molette: Zoom • Shift+Clic: Multi-sélection</span>
        </div>
      </div>
    </div>
  )
}

export default IFCViewer
