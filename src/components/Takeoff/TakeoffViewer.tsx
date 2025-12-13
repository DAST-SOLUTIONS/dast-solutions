/**
 * DAST Solutions - TakeoffViewer v2
 * Interface style Bluebeam avec:
 * - Panneau de plans à gauche
 * - Calibration manuelle d'échelle (X et Y)
 * - Support gros fichiers (lazy loading)
 * - Support futur DWG/IFC/RVT
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { 
  FileText, Ruler, ChevronLeft, ChevronRight,
  Upload, ZoomIn, ZoomOut, RotateCw, Maximize2, List,
  MousePointer, Minus, Square, Hexagon, Plus, Download, Trash2,
  AlertCircle, Loader2, X
} from 'lucide-react'
import { ScaleCalibration } from './ScaleCalibration'
import type { Measurement, MeasureToolType } from '@/types/takeoff-measure-types'
import { TAKEOFF_CATEGORIES } from '@/types/takeoff-measure-types'

// ============================================================================
// TYPES
// ============================================================================

interface Plan {
  id: string
  name: string
  file: File
  type: 'pdf' | 'dwg' | 'ifc' | 'rvt' | 'image'
  pageCount: number
  thumbnail?: string
  size: number
}

interface TakeoffViewerProps {
  projectId: string
  onSaveMeasurements?: (measurements: Measurement[]) => void
  onExportToEstimation?: (measurements: Measurement[]) => void
  initialMeasurements?: Measurement[]
}

// ============================================================================
// CONSTANTES
// ============================================================================

const TOOLS = [
  { type: 'select' as MeasureToolType, icon: MousePointer, label: 'Sélection', shortcut: 'V' },
  { type: 'line' as MeasureToolType, icon: Minus, label: 'Ligne', shortcut: 'L' },
  { type: 'rectangle' as MeasureToolType, icon: Square, label: 'Rectangle', shortcut: 'R' },
  { type: 'area' as MeasureToolType, icon: Hexagon, label: 'Polygone', shortcut: 'P' },
  { type: 'count' as MeasureToolType, icon: Plus, label: 'Comptage', shortcut: 'C' },
]

const MAX_FILE_SIZE_WARNING = 20 * 1024 * 1024 // 20MB

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function TakeoffViewer({
  projectId,
  onSaveMeasurements,
  onExportToEstimation,
  initialMeasurements = []
}: TakeoffViewerProps) {
  // === ÉTAT ===
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Outils
  const [activeTool, setActiveTool] = useState<MeasureToolType>('select')
  const [currentCategory, setCurrentCategory] = useState(TAKEOFF_CATEGORIES[0].id)
  const [currentColor, setCurrentColor] = useState(TAKEOFF_CATEGORIES[0].color)
  
  // Échelle (X et Y séparés)
  const [scaleX, setScaleX] = useState(0.02)
  const [scaleY, setScaleY] = useState(0.02)
  const [scaleUnit, setScaleUnit] = useState<'metric' | 'imperial'>('metric')
  const [showScaleCalibration, setShowScaleCalibration] = useState(false)
  
  // Mesures
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements)
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null)
  
  // Vue
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  
  // UI
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [leftPanelTab, setLeftPanelTab] = useState<'plans' | 'types'>('plans')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfDocRef = useRef<any>(null)

  // === GESTION DES FICHIERS ===
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()
      
      // Déterminer le type
      let type: Plan['type'] = 'pdf'
      if (ext === 'dwg') type = 'dwg'
      else if (ext === 'ifc') type = 'ifc'
      else if (ext === 'rvt') type = 'rvt'
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) type = 'image'

      // Avertissement pour gros fichiers
      if (file.size > MAX_FILE_SIZE_WARNING) {
        console.warn(`Fichier volumineux: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      }

      try {
        let pageCount = 1
        let thumbnail: string | undefined

        if (type === 'pdf') {
          // Charger le PDF avec pdf.js
          const pdfjsLib = await import('pdfjs-dist')
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
          
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          pageCount = pdf.numPages
          
          // Générer thumbnail de la première page
          const page = await pdf.getPage(1)
          const scale = 0.2
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise
            thumbnail = canvas.toDataURL('image/jpeg', 0.5)
          }
        } else if (type === 'image') {
          thumbnail = URL.createObjectURL(file)
        }

        const plan: Plan = {
          id: `plan-${Date.now()}-${i}`,
          name: file.name,
          file,
          type,
          pageCount,
          thumbnail,
          size: file.size
        }

        setPlans(prev => [...prev, plan])
        
        if (i === 0 && !selectedPlan) {
          setSelectedPlan(plan)
        }

        setLoadingProgress(((i + 1) / files.length) * 100)
      } catch (err) {
        console.error(`Erreur chargement ${file.name}:`, err)
        setError(`Erreur lors du chargement de ${file.name}`)
      }
    }

    setIsLoading(false)
    setLoadingProgress(100)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [selectedPlan])

  // === RENDU DU PLAN ===
  
  const renderPlan = useCallback(async () => {
    if (!selectedPlan || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsLoading(true)

    try {
      if (selectedPlan.type === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
        
        const arrayBuffer = await selectedPlan.file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        pdfDocRef.current = pdf
        
        const page = await pdf.getPage(currentPage)
        const scale = zoom / 100 * 1.5
        const viewport = page.getViewport({ scale, rotation })
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({
          canvasContext: ctx,
          viewport
        }).promise
        
      } else if (selectedPlan.type === 'image') {
        const img = new Image()
        img.onload = () => {
          canvas.width = img.width * (zoom / 100)
          canvas.height = img.height * (zoom / 100)
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
          ctx.restore()
        }
        img.src = URL.createObjectURL(selectedPlan.file)
      } else {
        // DWG, IFC, RVT - placeholder
        canvas.width = 800
        canvas.height = 600
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#6b7280'
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Format ${selectedPlan.type.toUpperCase()} - Support à venir`, canvas.width / 2, canvas.height / 2)
      }
    } catch (err) {
      console.error('Erreur rendu:', err)
      setError('Erreur lors du rendu du plan')
    }

    setIsLoading(false)
  }, [selectedPlan, currentPage, zoom, rotation])

  useEffect(() => {
    renderPlan()
  }, [renderPlan])

  // === GESTION CALIBRATION ===
  
  const handleCalibrate = useCallback((newScaleX: number, newScaleY: number, unit: 'metric' | 'imperial') => {
    setScaleX(newScaleX)
    setScaleY(newScaleY)
    setScaleUnit(unit)
  }, [])

  // === RACCOURCIS CLAVIER ===
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break
        case 'l': setActiveTool('line'); break
        case 'r': setActiveTool('rectangle'); break
        case 'p': setActiveTool('area'); break
        case 'c': setActiveTool('count'); break
        case '+': case '=': setZoom(z => Math.min(z + 25, 400)); break
        case '-': setZoom(z => Math.max(z - 25, 25)); break
        case '0': setZoom(100); break
        case 'delete': case 'backspace':
          if (selectedMeasurement) {
            setMeasurements(prev => prev.filter(m => m.id !== selectedMeasurement))
            setSelectedMeasurement(null)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMeasurement])

  // === STATS ===
  
  const measurementStats = useMemo(() => {
    const byCategory: Record<string, { count: number; total: number; unit: string }> = {}
    
    measurements.forEach(m => {
      const cat = m.category || 'Autre'
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, total: 0, unit: m.unit }
      }
      byCategory[cat].count++
      byCategory[cat].total += m.value
    })
    
    return byCategory
  }, [measurements])

  // === RENDU ===
  
  return (
    <div className="flex h-full bg-gray-100" style={{ minHeight: '700px' }}>
      {/* ====== PANNEAU GAUCHE ====== */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          leftPanelCollapsed ? 'w-12' : 'w-72'
        }`}
      >
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          {!leftPanelCollapsed && (
            <div className="flex gap-1">
              <button
                onClick={() => setLeftPanelTab('plans')}
                className={`px-3 py-1.5 text-sm rounded ${
                  leftPanelTab === 'plans' ? 'bg-teal-600 text-white' : 'hover:bg-gray-200'
                }`}
              >
                Plans
              </button>
              <button
                onClick={() => setLeftPanelTab('types')}
                className={`px-3 py-1.5 text-sm rounded ${
                  leftPanelTab === 'types' ? 'bg-teal-600 text-white' : 'hover:bg-gray-200'
                }`}
              >
                Types
              </button>
            </div>
          )}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="p-1.5 hover:bg-gray-200 rounded"
          >
            {leftPanelCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!leftPanelCollapsed && (
          <>
            {leftPanelTab === 'plans' && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 border-b">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.dwg,.ifc,.rvt,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload size={16} />
                    Ajouter des plans
                  </button>
                </div>

                <div className="px-3 py-2 text-sm text-gray-500 border-b">
                  {plans.length} plan{plans.length > 1 ? 's' : ''}
                </div>

                <div className="divide-y">
                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan)
                        setCurrentPage(1)
                      }}
                      className={`w-full p-2 flex gap-3 hover:bg-gray-50 text-left ${
                        selectedPlan?.id === plan.id ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                      }`}
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                        {plan.thumbnail ? (
                          <img src={plan.thumbnail} alt={plan.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{plan.name}</div>
                        <div className="text-xs text-gray-500">
                          {plan.type.toUpperCase()} • {plan.pageCount} page{plan.pageCount > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(plan.size / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {plans.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <div className="text-sm">Aucun plan</div>
                  </div>
                )}
              </div>
            )}

            {leftPanelTab === 'types' && (
              <div className="flex-1 overflow-y-auto p-2">
                <div className="text-sm text-gray-500 mb-2 px-2">
                  {Object.keys(measurementStats).length} type{Object.keys(measurementStats).length > 1 ? 's' : ''} de relevé
                </div>
                
                {Object.entries(measurementStats).map(([category, stats]) => (
                  <div key={category} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TAKEOFF_CATEGORIES.find(c => c.id === category)?.color || '#666' }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{category}</div>
                      <div className="text-xs text-gray-500">
                        {stats.count} mesure{stats.count > 1 ? 's' : ''} • {stats.total.toFixed(2)} {stats.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ====== ZONE CENTRALE ====== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barre outils supérieure */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-4">
          {selectedPlan && selectedPlan.pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm min-w-[80px] text-center">
                {currentPage} / {selectedPlan.pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(selectedPlan.pageCount, p + 1))}
                disabled={currentPage === selectedPlan.pageCount}
                className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-gray-600" />

          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1.5 hover:bg-gray-700 rounded">
              <ZoomOut size={18} />
            </button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="p-1.5 hover:bg-gray-700 rounded">
              <ZoomIn size={18} />
            </button>
          </div>

          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-gray-700 rounded">
            <RotateCw size={18} />
          </button>

          <button onClick={() => setZoom(100)} className="p-1.5 hover:bg-gray-700 rounded">
            <Maximize2 size={18} />
          </button>

          <div className="h-6 w-px bg-gray-600" />

          <button
            onClick={() => setShowScaleCalibration(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded text-sm"
          >
            <Ruler size={16} />
            Échelle: {scaleUnit === 'metric' ? `1:${Math.round(1/scaleX)}` : `1"=${Math.round(1/scaleX)}'`}
          </button>

          <div className="flex-1" />

          {selectedPlan && (
            <div className="text-sm text-gray-400">
              {selectedPlan.name}
              {selectedPlan.size > MAX_FILE_SIZE_WARNING && (
                <span className="ml-2 text-amber-400">
                  <AlertCircle size={14} className="inline" /> Volumineux
                </span>
              )}
            </div>
          )}
        </div>

        {/* Barre d'outils mesure */}
        <div className="bg-gray-700 px-4 py-2 flex items-center gap-2">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`p-2 rounded transition ${
                activeTool === tool.type ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              <tool.icon size={20} />
            </button>
          ))}

          <div className="h-6 w-px bg-gray-500 mx-2" />

          <select
            value={currentCategory}
            onChange={(e) => {
              setCurrentCategory(e.target.value)
              const cat = TAKEOFF_CATEGORIES.find(c => c.id === e.target.value)
              if (cat) setCurrentColor(cat.color)
            }}
            className="bg-gray-600 text-white px-3 py-1.5 rounded text-sm border-0"
          >
            {TAKEOFF_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-white" style={{ backgroundColor: currentColor }} />
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-8 h-8 cursor-pointer bg-transparent"
            />
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-500 relative"
          style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-teal-600" />
                <div className="text-sm text-gray-600">Chargement...</div>
                {loadingProgress > 0 && loadingProgress < 100 && (
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 transition-all" style={{ width: `${loadingProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 z-10">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError(null)} className="ml-2 hover:text-red-900"><X size={16} /></button>
            </div>
          )}

          {selectedPlan ? (
            <canvas
              ref={canvasRef}
              className="mx-auto my-4 shadow-2xl"
              style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-300">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <div className="text-lg">Aucun plan sélectionné</div>
                <div className="text-sm mt-2">Ajoutez des plans depuis le panneau de gauche</div>
                <div className="text-xs mt-4 text-gray-400">
                  Formats: PDF, JPG, PNG
                  <br />
                  <span className="text-amber-400">Bientôt: DWG, IFC, RVT</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Barre d'état */}
        <div className="bg-gray-800 text-gray-400 px-4 py-1 flex items-center gap-4 text-xs">
          <span>Outil: {TOOLS.find(t => t.type === activeTool)?.label}</span>
          <span>•</span>
          <span>Échelle X: {scaleX.toFixed(4)}</span>
          <span>Échelle Y: {scaleY.toFixed(4)}</span>
          <span>•</span>
          <span>{measurements.length} mesure{measurements.length > 1 ? 's' : ''}</span>
          <div className="flex-1" />
          <span>Raccourcis: V L R P C • +/- Zoom</span>
        </div>
      </div>

      {/* ====== PANNEAU DROIT ====== */}
      <div className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${rightPanelCollapsed ? 'w-12' : 'w-80'}`}>
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="p-1.5 hover:bg-gray-200 rounded">
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {!rightPanelCollapsed && <span className="text-sm font-medium text-gray-700">Mesures</span>}
        </div>

        {!rightPanelCollapsed && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => onExportToEstimation?.(measurements)}
                disabled={measurements.length === 0}
                className="flex-1 px-3 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Exporter
              </button>
              <button
                onClick={() => { if (confirm('Supprimer toutes les mesures?')) setMeasurements([]) }}
                disabled={measurements.length === 0}
                className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {measurements.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeasurement(m.id === selectedMeasurement ? null : m.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    m.id === selectedMeasurement ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-sm font-medium">{m.label || `Mesure ${m.type}`}</span>
                  </div>
                  <div className="mt-1 text-lg font-bold">{m.value.toFixed(2)} {m.unit}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.category} • {m.type}</div>
                </div>
              ))}

              {measurements.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <List size={32} className="mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Aucune mesure</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal calibration */}
      <ScaleCalibration
        isOpen={showScaleCalibration}
        onClose={() => setShowScaleCalibration(false)}
        onCalibrate={handleCalibrate}
        currentScaleX={scaleX}
        currentScaleY={scaleY}
        currentUnit={scaleUnit}
      />
    </div>
  )
}

export default TakeoffViewer
