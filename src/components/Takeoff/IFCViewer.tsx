/**
 * DAST Solutions - IFCViewer
 * Viewer 3D pour fichiers IFC avec Three.js + web-ifc
 * 
 * Fonctionnalités:
 * - Chargement et parsing de fichiers IFC
 * - Rendu 3D avec Three.js
 * - Navigation orbit/pan/zoom
 * - Arbre des éléments par catégorie
 * - Sélection et mise en surbrillance
 * - Extraction des propriétés
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  Box, RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff,
  Layers, Info, MousePointer, Ruler, Upload, Settings,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, Package,
  Home, Sun, Moon, LayoutGrid
} from 'lucide-react'
import * as THREE from 'three'

// Types pour les éléments IFC
interface IFCElement {
  expressID: number
  type: string
  name: string
  description?: string
  visible: boolean
  mesh?: THREE.Mesh
}

interface IFCCategory {
  type: string
  label: string
  color: string
  icon: string
  elements: IFCElement[]
  visible: boolean
}

interface IFCViewerProps {
  onExtractQuantities?: (elements: IFCElement[]) => void
}

// Catégories IFC
const IFC_CATEGORIES: Omit<IFCCategory, 'elements'>[] = [
  { type: 'IfcWall', label: 'Murs', color: '#A0522D', icon: '🧱', visible: true },
  { type: 'IfcSlab', label: 'Dalles', color: '#808080', icon: '⬛', visible: true },
  { type: 'IfcColumn', label: 'Colonnes', color: '#4682B4', icon: '🏛️', visible: true },
  { type: 'IfcBeam', label: 'Poutres', color: '#CD853F', icon: '📏', visible: true },
  { type: 'IfcDoor', label: 'Portes', color: '#8B4513', icon: '🚪', visible: true },
  { type: 'IfcWindow', label: 'Fenêtres', color: '#87CEEB', icon: '🪟', visible: true },
  { type: 'IfcStair', label: 'Escaliers', color: '#DEB887', icon: '🪜', visible: true },
  { type: 'IfcRoof', label: 'Toitures', color: '#B22222', icon: '🏠', visible: true },
  { type: 'IfcSpace', label: 'Espaces', color: '#90EE90', icon: '📦', visible: true },
]

export function IFCViewer({ onExtractQuantities }: IFCViewerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationRef = useRef<number | null>(null)
  
  // État
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  
  // UI
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true)
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'section'>('select')
  const [darkMode, setDarkMode] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  
  // Données IFC
  const [categories, setCategories] = useState<IFCCategory[]>(
    IFC_CATEGORIES.map(c => ({ ...c, elements: [] }))
  )
  const [selectedElement, setSelectedElement] = useState<IFCElement | null>(null)
  const [elementProperties, setElementProperties] = useState<Record<string, any>>({})

  // Initialiser Three.js
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(darkMode ? 0x1a1a2e : 0xf0f0f0)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(10, 10, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Grille
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222)
      gridHelper.name = 'grid'
      scene.add(gridHelper)
    }

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5)
    axesHelper.name = 'axes'
    scene.add(axesHelper)

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Mouse controls (simple orbit)
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let theta = Math.PI / 4
    let phi = Math.PI / 4
    let radius = 15

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaX = e.clientX - previousMousePosition.x
      const deltaY = e.clientY - previousMousePosition.y
      
      theta -= deltaX * 0.01
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * 0.01))
      
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
      camera.position.y = radius * Math.cos(phi)
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
      camera.lookAt(0, 0, 0)
      
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      radius = Math.max(5, Math.min(50, radius + e.deltaY * 0.01))
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
      camera.position.y = radius * Math.cos(phi)
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
    }

    canvasRef.current.addEventListener('mousedown', handleMouseDown)
    canvasRef.current.addEventListener('mousemove', handleMouseMove)
    canvasRef.current.addEventListener('mouseup', handleMouseUp)
    canvasRef.current.addEventListener('mouseleave', handleMouseUp)
    canvasRef.current.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      renderer.dispose()
      
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown)
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp)
      canvasRef.current?.removeEventListener('mouseleave', handleMouseUp)
      canvasRef.current?.removeEventListener('wheel', handleWheel)
    }
  }, [darkMode, showGrid])

  // Charger un fichier IFC
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith('.ifc')) {
      setError('Veuillez sélectionner un fichier IFC valide')
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    try {
      // Charger web-ifc dynamiquement
      const WebIFC = await import('web-ifc')
      const ifcAPI = new WebIFC.IfcAPI()
      
      // Initialiser l'API
      await ifcAPI.Init()
      setLoadingProgress(20)

      // Lire le fichier
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      setLoadingProgress(40)

      // Ouvrir le modèle
      const modelID = ifcAPI.OpenModel(data)
      setLoadingProgress(60)

      // Extraire les éléments par catégorie
      const newCategories: IFCCategory[] = IFC_CATEGORIES.map(cat => ({
        ...cat,
        elements: []
      }))

      // Pour chaque type IFC
      for (const cat of newCategories) {
        try {
          // Obtenir le type IFC correspondant
          const typeCode = (WebIFC as any)[cat.type.toUpperCase()]
          if (typeCode !== undefined) {
            const ids = ifcAPI.GetLineIDsWithType(modelID, typeCode)
            
            for (let i = 0; i < ids.size(); i++) {
              const expressID = ids.get(i)
              try {
                const props = ifcAPI.GetLine(modelID, expressID)
                cat.elements.push({
                  expressID,
                  type: cat.type,
                  name: props?.Name?.value || `${cat.label} #${expressID}`,
                  description: props?.Description?.value,
                  visible: true
                })
              } catch (err) {
                // Ignorer les éléments qui ne peuvent pas être lus
              }
            }
          }
        } catch (err) {
          console.warn(`Impossible de charger ${cat.type}:`, err)
        }
      }
      
      setLoadingProgress(80)
      setCategories(newCategories)

      // Créer une géométrie de démonstration pour chaque catégorie
      if (sceneRef.current) {
        // Nettoyer les anciennes géométries
        sceneRef.current.children
          .filter(obj => obj.userData.isIFC)
          .forEach(obj => sceneRef.current?.remove(obj))

        // Créer des représentations simplifiées
        let yOffset = 0
        newCategories.forEach(cat => {
          if (cat.elements.length > 0) {
            const geometry = new THREE.BoxGeometry(2, 0.5, 2)
            const material = new THREE.MeshStandardMaterial({ 
              color: cat.color,
              transparent: true,
              opacity: 0.8
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.y = yOffset
            mesh.userData.isIFC = true
            mesh.userData.category = cat.type
            mesh.castShadow = true
            mesh.receiveShadow = true
            sceneRef.current?.add(mesh)
            yOffset += 1
          }
        })
      }

      // Fermer le modèle
      ifcAPI.CloseModel(modelID)
      
      setLoadingProgress(100)
      setModelLoaded(true)
      setIsLoading(false)

    } catch (err) {
      console.error('Erreur chargement IFC:', err)
      setError(`Erreur lors du chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      setIsLoading(false)
    }
  }, [])

  // Toggle visibilité catégorie
  const toggleCategoryVisibility = useCallback((categoryType: string) => {
    setCategories(prev => prev.map(cat => 
      cat.type === categoryType 
        ? { ...cat, visible: !cat.visible }
        : cat
    ))
    
    // Mettre à jour la scène
    if (sceneRef.current) {
      sceneRef.current.children.forEach(obj => {
        if (obj.userData.category === categoryType) {
          obj.visible = !obj.visible
        }
      })
    }
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(10, 10, 10)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }, [])

  // Sélectionner un élément
  const selectElement = useCallback((element: IFCElement) => {
    setSelectedElement(element)
    setElementProperties({
      'ID Express': element.expressID,
      'Type': element.type,
      'Nom': element.name,
      'Description': element.description || 'N/A'
    })
    setRightPanelCollapsed(false)
  }, [])

  // Compter les éléments total
  const totalElements = categories.reduce((sum, cat) => sum + cat.elements.length, 0)

  return (
    <div className="flex h-full bg-gray-900" style={{ minHeight: '600px' }}>
      {/* ====== PANNEAU GAUCHE - ARBRE IFC ====== */}
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
              {categories.map(cat => (
                <div key={cat.type} className="mb-1">
                  <button
                    onClick={() => toggleCategoryVisibility(cat.type)}
                    className={`w-full flex items-center justify-between p-2 rounded hover:bg-gray-700 ${
                      cat.visible ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm">{cat.label}</span>
                      {cat.elements.length > 0 && (
                        <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                          {cat.elements.length}
                        </span>
                      )}
                    </div>
                    {cat.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  {cat.visible && cat.elements.length > 0 && (
                    <div className="ml-6 space-y-0.5">
                      {cat.elements.slice(0, 10).map(el => (
                        <button
                          key={el.expressID}
                          onClick={() => selectElement(el)}
                          className={`w-full text-left text-xs p-1.5 rounded truncate ${
                            selectedElement?.expressID === el.expressID
                              ? 'bg-teal-600 text-white'
                              : 'text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {el.name}
                        </button>
                      ))}
                      {cat.elements.length > 10 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{cat.elements.length - 10} autres...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {totalElements === 0 && !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Aucun modèle chargé</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ====== ZONE CENTRALE - CANVAS 3D ====== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-3 border-b border-gray-700">
          <div className="flex items-center gap-1">
            {[
              { tool: 'select' as const, icon: MousePointer, label: 'Sélection' },
              { tool: 'measure' as const, icon: Ruler, label: 'Mesure' },
            ].map(({ tool, icon: Icon, label }) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                title={label}
                className={`p-2 rounded ${
                  activeTool === tool ? 'bg-teal-600' : 'hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-600" />

          <button onClick={resetCamera} className="p-2 hover:bg-gray-700 rounded" title="Vue par défaut">
            <Home size={18} />
          </button>

          <button onClick={() => setShowGrid(!showGrid)} className="p-2 hover:bg-gray-700 rounded" title="Grille">
            <LayoutGrid size={18} className={showGrid ? 'text-teal-400' : ''} />
          </button>

          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-700 rounded" title="Thème">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex-1" />

          {modelLoaded && (
            <div className="text-sm text-gray-400">
              {totalElements} éléments • {categories.filter(c => c.elements.length > 0).length} catégories
            </div>
          )}
        </div>

        {/* Canvas 3D */}
        <div ref={containerRef} className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ cursor: activeTool === 'select' ? 'grab' : 'crosshair' }}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-teal-500" />
                <div className="text-white">Chargement du modèle IFC...</div>
                <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400">{loadingProgress}%</div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-red-300">
                <Box size={16} />
              </button>
            </div>
          )}

          {/* Placeholder quand pas de modèle */}
          {!modelLoaded && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <Package size={80} className="mx-auto mb-4 opacity-30" />
                <div className="text-lg">Viewer IFC 3D</div>
                <div className="text-sm mt-2">Chargez un fichier IFC pour visualiser le modèle</div>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="bg-gray-800 text-gray-400 px-4 py-1 flex items-center gap-4 text-xs border-t border-gray-700">
          <span>Outil: {activeTool === 'select' ? 'Sélection' : 'Mesure'}</span>
          <span>•</span>
          <span>Clic gauche: Rotation • Molette: Zoom</span>
          <div className="flex-1" />
          <span>Three.js + web-ifc</span>
        </div>
      </div>

      {/* ====== PANNEAU DROIT - PROPRIÉTÉS ====== */}
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
            {selectedElement ? (
              <div className="space-y-3">
                <div className="p-3 bg-teal-600/20 rounded-lg border border-teal-500/30">
                  <div className="text-sm text-teal-300 font-medium">{selectedElement.type}</div>
                  <div className="text-white font-bold mt-1">{selectedElement.name}</div>
                </div>

                <div className="space-y-2">
                  {Object.entries(elementProperties).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}:</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>

                {onExtractQuantities && (
                  <button
                    onClick={() => onExtractQuantities([selectedElement])}
                    className="w-full mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                  >
                    Extraire vers Takeoff
                  </button>
                )}
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
    </div>
  )
}

export default IFCViewer
