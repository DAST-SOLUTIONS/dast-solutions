/**
 * DAST Solutions - TakeoffViewer v5
 * Interface style Bluebeam avec MESURES INTERACTIVES:
 * - Ligne: cliquer 2 points → calcul distance
 * - Rectangle: cliquer 2 coins → périmètre + aire
 * - Polygone: cliquer plusieurs points → aire
 * - Comptage: cliquer pour ajouter des points
 * - Échelle X/Y configurable
 * - Édition des mesures avec dimensions, métiers CCQ, coûts
 * - Mode plein écran (F11)
 * - Calibration interactive 2 points
 * - Export PDF annoté
 * - Liaison vers Soumission
 * - Annotations sur plans
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { 
  FileText, Ruler, ChevronLeft, ChevronRight,
  Upload, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, List,
  MousePointer, Minus, Square, Hexagon, Plus, Download, Trash2,
  AlertCircle, Loader2, X, Check, Edit3, DollarSign, Target, Move,
  FileDown, Send, Type, StickyNote
} from 'lucide-react'
import { ScaleCalibration } from './ScaleCalibration'
import { MeasurementEditor } from './MeasurementEditor'
import { PDFExporter } from './PDFExporter'
import { TakeoffToSoumission } from './TakeoffToSoumission'
import { AnnotationToolbar, drawAnnotations, createAnnotation, type Annotation, type AnnotationType } from './PlanAnnotations'
import type { Measurement, MeasureToolType } from '@/types/takeoff-measure-types'
import { TAKEOFF_CATEGORIES, calculateDerivedValues, calculateMeasurementCosts } from '@/types/takeoff-measure-types'

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

interface Point {
  x: number
  y: number
}

interface DrawingState {
  isDrawing: boolean
  points: Point[]
  currentPoint: Point | null
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
// FONCTIONS UTILITAIRES
// ============================================================================

// Calculer la distance entre 2 points avec échelle X/Y
function calculateDistance(p1: Point, p2: Point, scaleX: number, scaleY: number): number {
  const dx = (p2.x - p1.x) * scaleX
  const dy = (p2.y - p1.y) * scaleY
  return Math.sqrt(dx * dx + dy * dy)
}

// Calculer l'aire d'un rectangle
function calculateRectangleArea(p1: Point, p2: Point, scaleX: number, scaleY: number): number {
  const width = Math.abs(p2.x - p1.x) * scaleX
  const height = Math.abs(p2.y - p1.y) * scaleY
  return width * height
}

// Calculer l'aire d'un polygone (formule de Shoelace)
function calculatePolygonArea(points: Point[], scaleX: number, scaleY: number): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const xi = points[i].x * scaleX
    const yi = points[i].y * scaleY
    const xj = points[j].x * scaleX
    const yj = points[j].y * scaleY
    area += xi * yj - xj * yi
  }
  return Math.abs(area) / 2
}

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
  const [currentCategory, setCurrentCategory] = useState<string>(TAKEOFF_CATEGORIES[0].id)
  const [currentColor, setCurrentColor] = useState<string>(TAKEOFF_CATEGORIES[0].color)
  
  // Échelle (X et Y séparés) - mètres par pixel
  const [scaleX, setScaleX] = useState(0.02)
  const [scaleY, setScaleY] = useState(0.02)
  const [scaleUnit, setScaleUnit] = useState<'metric' | 'imperial'>('metric')
  const [showScaleCalibration, setShowScaleCalibration] = useState(false)
  
  // Mesures
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements)
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null)
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null)
  
  // État de dessin
  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    points: [],
    currentPoint: null
  })
  
  // Vue
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // UI - Panneaux fermés par défaut pour mode full screen
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true)
  const [leftPanelTab, setLeftPanelTab] = useState<'plans' | 'types'>('plans')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Mode plein écran
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  
  // Calibration interactive (2 points sur le plan)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibrationStep, setCalibrationStep] = useState<1 | 2 | 3>(1)
  const [calibrationPoint1, setCalibrationPoint1] = useState<Point | null>(null)
  const [calibrationPoint2, setCalibrationPoint2] = useState<Point | null>(null)
  const [calibrationRealDistance, setCalibrationRealDistance] = useState('')
  const [calibrationUnit, setCalibrationUnit] = useState<'m' | 'cm' | 'mm' | 'ft' | 'in'>('m')
  
  // Option E - Export vers Soumission
  const [showExportToSoumission, setShowExportToSoumission] = useState(false)
  
  // Option F - Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<AnnotationType | null>(null)
  const [annotationColor, setAnnotationColor] = useState('#EF4444')
  const [selectedAnnotation, setSelectedAnnotationState] = useState<string | null>(null)
  
  // Option G - Export PDF
  const [showPDFExporter, setShowPDFExporter] = useState(false)
  const [planImageBase64, setPlanImageBase64] = useState<string | null>(null)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfDocRef = useRef<any>(null)

  // ============================================================================
  // GESTION DES FICHIERS
  // ============================================================================
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()
      
      let type: Plan['type'] = 'pdf'
      if (ext === 'dwg') type = 'dwg'
      else if (ext === 'ifc') type = 'ifc'
      else if (ext === 'rvt') type = 'rvt'
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) type = 'image'

      if (file.size > MAX_FILE_SIZE_WARNING) {
        console.warn(`Fichier volumineux: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      }

      try {
        let pageCount = 1
        let thumbnail: string | undefined

        if (type === 'pdf') {
          const pdfjsLib = await import('pdfjs-dist')
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
          
          try {
            const arrayBuffer = await file.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
            const pdf = await loadingTask.promise
            pageCount = pdf.numPages
            
            try {
              const page = await pdf.getPage(1)
              const scale = 0.3
              const viewport = page.getViewport({ scale })
              const canvas = document.createElement('canvas')
              canvas.width = viewport.width
              canvas.height = viewport.height
              const ctx = canvas.getContext('2d')
              
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport, canvas }).promise
                thumbnail = canvas.toDataURL('image/jpeg', 0.6)
              }
            } catch (thumbErr) {
              console.warn('Impossible de générer le thumbnail:', thumbErr)
            }
          } catch (pdfErr) {
            console.error('Erreur PDF:', pdfErr)
            throw new Error(`Impossible de lire le PDF: ${file.name}`)
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
  }, [selectedPlan])

  // ============================================================================
  // RENDU DU PLAN
  // ============================================================================
  
  const renderPlan = useCallback(async () => {
    if (!selectedPlan || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsLoading(true)
    setError(null)

    try {
      if (selectedPlan.type === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        
        const arrayBuffer = await selectedPlan.file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        pdfDocRef.current = pdf
        
        const page = await pdf.getPage(currentPage)
        const scale = zoom / 100 * 1.5
        const viewport = page.getViewport({ scale, rotation })
        
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({ canvasContext: ctx, viewport, canvas }).promise
        
        // Synchroniser overlay après rendu PDF
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = canvas.width
          overlayCanvasRef.current.height = canvas.height
        }
        
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
          
          // Synchroniser overlay
          if (overlayCanvasRef.current) {
            overlayCanvasRef.current.width = canvas.width
            overlayCanvasRef.current.height = canvas.height
          }
          
          setIsLoading(false)
        }
        img.onerror = () => {
          setError('Erreur lors du chargement de l\'image')
          setIsLoading(false)
        }
        img.src = URL.createObjectURL(selectedPlan.file)
        return
      } else {
        canvas.width = 800
        canvas.height = 600
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#6b7280'
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Format ${selectedPlan.type.toUpperCase()} - Support à venir`, canvas.width / 2, canvas.height / 2)
        
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = canvas.width
          overlayCanvasRef.current.height = canvas.height
        }
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

  // ============================================================================
  // DESSIN DES MESURES SUR L'OVERLAY
  // ============================================================================
  
  // Fonction helper pour dessiner un label avec fond
  const drawLabel = useCallback((ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const metrics = ctx.measureText(text)
    const padding = 4
    const bgWidth = metrics.width + padding * 2
    const bgHeight = 20
    
    // Fond
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillRect(x - bgWidth/2, y - bgHeight/2, bgWidth, bgHeight)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.strokeRect(x - bgWidth/2, y - bgHeight/2, bgWidth, bgHeight)
    
    // Texte
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  }, [])
  
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Dessiner les mesures existantes
    measurements.forEach(m => {
      if (!m.points || m.points.length === 0) return
      
      ctx.strokeStyle = m.color
      ctx.fillStyle = m.color + '40'
      ctx.lineWidth = m.id === selectedMeasurement ? 3 : 2
      ctx.setLineDash([])
      
      if (m.type === 'line' && m.points.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(m.points[0].x, m.points[0].y)
        ctx.lineTo(m.points[1].x, m.points[1].y)
        ctx.stroke()
        
        // Points aux extrémités
        ctx.fillStyle = m.color
        ctx.beginPath()
        ctx.arc(m.points[0].x, m.points[0].y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(m.points[1].x, m.points[1].y, 5, 0, Math.PI * 2)
        ctx.fill()
        
        // Label au milieu
        const midX = (m.points[0].x + m.points[1].x) / 2
        const midY = (m.points[0].y + m.points[1].y) / 2
        drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}`, midX, midY - 15, m.color)
        
      } else if (m.type === 'rectangle' && m.points.length >= 2) {
        const x = Math.min(m.points[0].x, m.points[1].x)
        const y = Math.min(m.points[0].y, m.points[1].y)
        const w = Math.abs(m.points[1].x - m.points[0].x)
        const h = Math.abs(m.points[1].y - m.points[0].y)
        
        ctx.fillStyle = m.color + '30'
        ctx.fillRect(x, y, w, h)
        ctx.strokeRect(x, y, w, h)
        
        // Label au centre
        drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}`, x + w/2, y + h/2, m.color)
        
      } else if (m.type === 'area' && m.points.length >= 3) {
        ctx.beginPath()
        ctx.moveTo(m.points[0].x, m.points[0].y)
        m.points.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.fillStyle = m.color + '30'
        ctx.fill()
        ctx.stroke()
        
        // Points
        ctx.fillStyle = m.color
        m.points.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
          ctx.fill()
        })
        
        // Label au centroid
        const cx = m.points.reduce((s, p) => s + p.x, 0) / m.points.length
        const cy = m.points.reduce((s, p) => s + p.y, 0) / m.points.length
        drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}`, cx, cy, m.color)
        
      } else if (m.type === 'count') {
        // Points de comptage
        ctx.fillStyle = m.color
        m.points.forEach((p, i) => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
          ctx.fill()
          
          // Numéro
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(String(i + 1), p.x, p.y)
          ctx.fillStyle = m.color
        })
      }
    })
    
    // Dessiner le dessin en cours
    if (drawing.isDrawing && drawing.points.length > 0) {
      ctx.strokeStyle = currentColor
      ctx.fillStyle = currentColor + '30'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      if (activeTool === 'line' && drawing.currentPoint) {
        ctx.beginPath()
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        ctx.lineTo(drawing.currentPoint.x, drawing.currentPoint.y)
        ctx.stroke()
        
        // Afficher la distance en temps réel
        const dist = calculateDistance(drawing.points[0], drawing.currentPoint, scaleX, scaleY)
        const midX = (drawing.points[0].x + drawing.currentPoint.x) / 2
        const midY = (drawing.points[0].y + drawing.currentPoint.y) / 2
        const unit = scaleUnit === 'metric' ? 'm' : 'ft'
        drawLabel(ctx, `${dist.toFixed(2)} ${unit}`, midX, midY - 15, currentColor)
        
      } else if (activeTool === 'rectangle' && drawing.currentPoint) {
        const x = Math.min(drawing.points[0].x, drawing.currentPoint.x)
        const y = Math.min(drawing.points[0].y, drawing.currentPoint.y)
        const w = Math.abs(drawing.currentPoint.x - drawing.points[0].x)
        const h = Math.abs(drawing.currentPoint.y - drawing.points[0].y)
        
        ctx.fillRect(x, y, w, h)
        ctx.strokeRect(x, y, w, h)
        
        // Afficher les dimensions
        const width = Math.abs(drawing.currentPoint.x - drawing.points[0].x) * scaleX
        const height = Math.abs(drawing.currentPoint.y - drawing.points[0].y) * scaleY
        const area = width * height
        const unit = scaleUnit === 'metric' ? 'm' : 'ft'
        const areaUnit = scaleUnit === 'metric' ? 'm²' : 'ft²'
        drawLabel(ctx, `${width.toFixed(2)} x ${height.toFixed(2)} ${unit}`, x + w/2, y - 15, currentColor)
        drawLabel(ctx, `Aire: ${area.toFixed(2)} ${areaUnit}`, x + w/2, y + h/2, currentColor)
        
      } else if (activeTool === 'area') {
        ctx.beginPath()
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        drawing.points.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
        if (drawing.currentPoint) {
          ctx.lineTo(drawing.currentPoint.x, drawing.currentPoint.y)
        }
        if (drawing.points.length >= 2) {
          ctx.closePath()
          ctx.fill()
        }
        ctx.stroke()
        
        // Points
        ctx.fillStyle = currentColor
        ctx.setLineDash([])
        drawing.points.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fill()
        })
        
        // Aire en temps réel
        if (drawing.points.length >= 2 && drawing.currentPoint) {
          const allPoints = [...drawing.points, drawing.currentPoint]
          const area = calculatePolygonArea(allPoints, scaleX, scaleY)
          const cx = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length
          const cy = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length
          const areaUnit = scaleUnit === 'metric' ? 'm²' : 'ft²'
          drawLabel(ctx, `${area.toFixed(2)} ${areaUnit}`, cx, cy, currentColor)
        }
      }
      
      ctx.setLineDash([])
    }

    // Dessiner les points de calibration
    if (isCalibrating) {
      ctx.setLineDash([])
      
      // Point 1
      if (calibrationPoint1) {
        ctx.beginPath()
        ctx.arc(calibrationPoint1.x, calibrationPoint1.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#F59E0B'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Croix au centre
        ctx.beginPath()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.moveTo(calibrationPoint1.x - 15, calibrationPoint1.y)
        ctx.lineTo(calibrationPoint1.x + 15, calibrationPoint1.y)
        ctx.moveTo(calibrationPoint1.x, calibrationPoint1.y - 15)
        ctx.lineTo(calibrationPoint1.x, calibrationPoint1.y + 15)
        ctx.stroke()
        
        // Label "P1"
        ctx.fillStyle = '#F59E0B'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('P1', calibrationPoint1.x + 15, calibrationPoint1.y - 15)
      }
      
      // Point 2
      if (calibrationPoint2) {
        ctx.beginPath()
        ctx.arc(calibrationPoint2.x, calibrationPoint2.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#10B981'
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Croix au centre
        ctx.beginPath()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.moveTo(calibrationPoint2.x - 15, calibrationPoint2.y)
        ctx.lineTo(calibrationPoint2.x + 15, calibrationPoint2.y)
        ctx.moveTo(calibrationPoint2.x, calibrationPoint2.y - 15)
        ctx.lineTo(calibrationPoint2.x, calibrationPoint2.y + 15)
        ctx.stroke()
        
        // Label "P2"
        ctx.fillStyle = '#10B981'
        ctx.font = 'bold 14px sans-serif'
        ctx.fillText('P2', calibrationPoint2.x + 15, calibrationPoint2.y - 15)
        
        // Ligne entre les deux points
        if (calibrationPoint1) {
          ctx.beginPath()
          ctx.setLineDash([8, 4])
          ctx.strokeStyle = '#F59E0B'
          ctx.lineWidth = 3
          ctx.moveTo(calibrationPoint1.x, calibrationPoint1.y)
          ctx.lineTo(calibrationPoint2.x, calibrationPoint2.y)
          ctx.stroke()
          ctx.setLineDash([])
          
          // Distance en pixels au milieu
          const midX = (calibrationPoint1.x + calibrationPoint2.x) / 2
          const midY = (calibrationPoint1.y + calibrationPoint2.y) / 2
          const pixelDist = Math.sqrt(
            Math.pow(calibrationPoint2.x - calibrationPoint1.x, 2) +
            Math.pow(calibrationPoint2.y - calibrationPoint1.y, 2)
          )
          
          ctx.fillStyle = '#1F2937'
          ctx.fillRect(midX - 50, midY - 25, 100, 25)
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${pixelDist.toFixed(0)} px`, midX, midY - 12)
        }
      }
    }
  }, [measurements, drawing, activeTool, currentColor, scaleX, scaleY, scaleUnit, selectedMeasurement, drawLabel, isCalibrating, calibrationPoint1, calibrationPoint2])

  // Redessiner l'overlay quand nécessaire
  useEffect(() => {
    drawOverlay()
  }, [drawOverlay])

  // ============================================================================
  // GESTION DES ÉVÉNEMENTS SOURIS
  // ============================================================================
  
  const getCanvasPoint = useCallback((e: React.MouseEvent): Point | null => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    const scaleFactorX = canvas.width / rect.width
    const scaleFactorY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleFactorX,
      y: (e.clientY - rect.top) * scaleFactorY
    }
  }, [])

  // Annuler le dessin en cours
  const cancelDrawing = useCallback(() => {
    setDrawing({ isDrawing: false, points: [], currentPoint: null })
  }, [])

  // ============================================================================
  // MODE PLEIN ÉCRAN
  // ============================================================================
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      mainContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Écouter les changements de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Raccourci F11 pour fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen])

  // ============================================================================
  // CALIBRATION INTERACTIVE (2 points sur le plan)
  // ============================================================================
  
  const startInteractiveCalibration = useCallback(() => {
    setIsCalibrating(true)
    setCalibrationStep(1)
    setCalibrationPoint1(null)
    setCalibrationPoint2(null)
    setCalibrationRealDistance('')
    setActiveTool('select')
  }, [])

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false)
    setCalibrationStep(1)
    setCalibrationPoint1(null)
    setCalibrationPoint2(null)
    setCalibrationRealDistance('')
  }, [])

  // Calculer distance en pixels entre les 2 points de calibration
  const calibrationPixelDistance = useMemo(() => {
    if (!calibrationPoint1 || !calibrationPoint2) return 0
    return Math.sqrt(
      Math.pow(calibrationPoint2.x - calibrationPoint1.x, 2) +
      Math.pow(calibrationPoint2.y - calibrationPoint1.y, 2)
    )
  }, [calibrationPoint1, calibrationPoint2])

  // Convertir distance en mètres
  const convertToMeters = (value: number, unit: string): number => {
    switch (unit) {
      case 'cm': return value / 100
      case 'mm': return value / 1000
      case 'ft': return value * 0.3048
      case 'in': return value * 0.0254
      default: return value
    }
  }

  // Calculer l'échelle depuis la calibration
  const calculatedCalibrationScale = useMemo(() => {
    const realValue = parseFloat(calibrationRealDistance)
    if (!realValue || realValue <= 0 || calibrationPixelDistance <= 0) return null
    const realMeters = convertToMeters(realValue, calibrationUnit)
    return realMeters / calibrationPixelDistance
  }, [calibrationRealDistance, calibrationUnit, calibrationPixelDistance])

  // Appliquer l'échelle calibrée
  const applyCalibration = useCallback(() => {
    if (!calculatedCalibrationScale) return
    setScaleX(calculatedCalibrationScale)
    setScaleY(calculatedCalibrationScale)
    setScaleUnit(calibrationUnit === 'ft' || calibrationUnit === 'in' ? 'imperial' : 'metric')
    cancelCalibration()
  }, [calculatedCalibrationScale, calibrationUnit, cancelCalibration])

  // Terminer le polygone
  const finishPolygon = useCallback(() => {
    if (activeTool === 'area' && drawing.isDrawing && drawing.points.length >= 3) {
      const area = calculatePolygonArea(drawing.points, scaleX, scaleY)
      const newMeasurement: Measurement = {
        id: `m-${Date.now()}`,
        type: 'area',
        label: `Polygone ${measurements.length + 1}`,
        value: area,
        unit: scaleUnit === 'metric' ? 'm²' : 'ft²',
        category: TAKEOFF_CATEGORIES.find(c => c.id === currentCategory)?.name || 'Autre',
        color: currentColor,
        points: [...drawing.points],
        planId: selectedPlan?.id,
        page: currentPage
      }
      setMeasurements(prev => [...prev, newMeasurement])
      setDrawing({ isDrawing: false, points: [], currentPoint: null })
    }
  }, [activeTool, drawing, scaleX, scaleY, scaleUnit, currentCategory, currentColor, selectedPlan, currentPage, measurements])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e)
    if (!point) return

    // Mode calibration interactive
    if (isCalibrating) {
      if (calibrationStep === 1) {
        setCalibrationPoint1(point)
        setCalibrationStep(2)
        return
      } else if (calibrationStep === 2) {
        setCalibrationPoint2(point)
        setCalibrationStep(3)
        return
      }
      return
    }
    
    if (activeTool === 'select') return
    
    if (activeTool === 'line') {
      if (!drawing.isDrawing) {
        // Premier point
        setDrawing({ isDrawing: true, points: [point], currentPoint: point })
      } else {
        // Deuxième point - créer la mesure
        const dist = calculateDistance(drawing.points[0], point, scaleX, scaleY)
        const newMeasurement: Measurement = {
          id: `m-${Date.now()}`,
          type: 'line',
          label: `Ligne ${measurements.length + 1}`,
          value: dist,
          unit: scaleUnit === 'metric' ? 'm' : 'ft',
          category: TAKEOFF_CATEGORIES.find(c => c.id === currentCategory)?.name || 'Autre',
          color: currentColor,
          points: [drawing.points[0], point],
          planId: selectedPlan?.id,
          page: currentPage
        }
        setMeasurements(prev => [...prev, newMeasurement])
        setDrawing({ isDrawing: false, points: [], currentPoint: null })
      }
      
    } else if (activeTool === 'rectangle') {
      if (!drawing.isDrawing) {
        setDrawing({ isDrawing: true, points: [point], currentPoint: point })
      } else {
        // Créer le rectangle
        const area = calculateRectangleArea(drawing.points[0], point, scaleX, scaleY)
        const newMeasurement: Measurement = {
          id: `m-${Date.now()}`,
          type: 'rectangle',
          label: `Rectangle ${measurements.length + 1}`,
          value: area,
          unit: scaleUnit === 'metric' ? 'm²' : 'ft²',
          category: TAKEOFF_CATEGORIES.find(c => c.id === currentCategory)?.name || 'Autre',
          color: currentColor,
          points: [drawing.points[0], point],
          planId: selectedPlan?.id,
          page: currentPage
        }
        setMeasurements(prev => [...prev, newMeasurement])
        setDrawing({ isDrawing: false, points: [], currentPoint: null })
      }
      
    } else if (activeTool === 'area') {
      // Ajouter un point au polygone
      setDrawing(prev => ({
        isDrawing: true,
        points: [...prev.points, point],
        currentPoint: point
      }))
      
    } else if (activeTool === 'count') {
      // Ajouter un point de comptage
      const catName = TAKEOFF_CATEGORIES.find(c => c.id === currentCategory)?.name || 'Autre'
      const existingCount = measurements.find(
        m => m.type === 'count' && m.category === catName && m.color === currentColor
      )
      
      if (existingCount && existingCount.points) {
        // Ajouter au comptage existant
        setMeasurements(prev => prev.map(m => 
          m.id === existingCount.id
            ? { ...m, points: [...(m.points || []), point], value: (m.points?.length || 0) + 1 }
            : m
        ))
      } else {
        // Créer un nouveau comptage
        const newMeasurement: Measurement = {
          id: `m-${Date.now()}`,
          type: 'count',
          label: `Comptage ${catName}`,
          value: 1,
          unit: 'unité(s)',
          category: catName,
          color: currentColor,
          points: [point],
          planId: selectedPlan?.id,
          page: currentPage
        }
        setMeasurements(prev => [...prev, newMeasurement])
      }
    }
  }, [activeTool, drawing, scaleX, scaleY, scaleUnit, currentCategory, currentColor, selectedPlan, currentPage, measurements, getCanvasPoint])

  const handleCanvasDoubleClick = useCallback(() => {
    finishPolygon()
  }, [finishPolygon])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }
    
    if (activeTool !== 'select' && drawing.isDrawing) {
      const point = getCanvasPoint(e)
      if (point) {
        setDrawing(prev => ({ ...prev, currentPoint: point }))
      }
    }
  }, [activeTool, drawing.isDrawing, isPanning, panStart, getCanvasPoint])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Middle click ou shift+click pour pan
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // ============================================================================
  // GESTION CALIBRATION
  // ============================================================================
  
  const handleCalibrate = useCallback((newScaleX: number, newScaleY: number, unit: 'metric' | 'imperial') => {
    setScaleX(newScaleX)
    setScaleY(newScaleY)
    setScaleUnit(unit)
  }, [])

  // ============================================================================
  // RACCOURCIS CLAVIER
  // ============================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); cancelDrawing(); break
        case 'l': setActiveTool('line'); cancelDrawing(); break
        case 'r': setActiveTool('rectangle'); cancelDrawing(); break
        case 'p': setActiveTool('area'); cancelDrawing(); break
        case 'c': setActiveTool('count'); cancelDrawing(); break
        case '+': case '=': setZoom(z => Math.min(z + 25, 400)); break
        case '-': setZoom(z => Math.max(z - 25, 25)); break
        case '0': setZoom(100); break
        case 'escape': cancelDrawing(); break
        case 'delete': case 'backspace':
          if (selectedMeasurement) {
            setMeasurements(prev => prev.filter(m => m.id !== selectedMeasurement))
            setSelectedMeasurement(null)
          }
          break
        case 'enter':
          finishPolygon()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMeasurement, cancelDrawing, finishPolygon])

  // ============================================================================
  // STATS
  // ============================================================================
  
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

  // ============================================================================
  // RENDU
  // ============================================================================
  
  return (
    <div 
      ref={mainContainerRef}
      className={`flex h-full bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} 
      style={{ minHeight: isFullscreen ? '100vh' : '700px' }}
    >
      {/* ====== PANNEAU DE CALIBRATION INTERACTIVE ====== */}
      {isCalibrating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-2xl p-4 min-w-[450px]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">📏 Calibration d'échelle - 2 points</h3>
              
              {/* Étapes */}
              <div className="mt-3 space-y-2">
                {/* Étape 1 */}
                <div className={`flex items-center gap-2 ${calibrationStep >= 1 ? 'text-white' : 'text-white/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    calibrationStep === 1 ? 'bg-white text-amber-600 animate-pulse' : 
                    calibrationStep > 1 ? 'bg-green-400 text-white' : 'bg-white/30'
                  }`}>
                    {calibrationStep > 1 ? '✓' : '1'}
                  </div>
                  <span className={calibrationStep === 1 ? 'font-semibold' : ''}>
                    {calibrationStep === 1 ? '👆 Cliquez sur le PREMIER point' : 'Premier point défini'}
                  </span>
                  {calibrationPoint1 && <span className="text-xs opacity-75">({Math.round(calibrationPoint1.x)}, {Math.round(calibrationPoint1.y)})</span>}
                </div>

                {/* Étape 2 */}
                <div className={`flex items-center gap-2 ${calibrationStep >= 2 ? 'text-white' : 'text-white/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    calibrationStep === 2 ? 'bg-white text-amber-600 animate-pulse' : 
                    calibrationStep > 2 ? 'bg-green-400 text-white' : 'bg-white/30'
                  }`}>
                    {calibrationStep > 2 ? '✓' : '2'}
                  </div>
                  <span className={calibrationStep === 2 ? 'font-semibold' : ''}>
                    {calibrationStep === 2 ? '👆 Cliquez sur le SECOND point' : calibrationStep > 2 ? 'Second point défini' : 'Cliquer le second point'}
                  </span>
                  {calibrationPoint2 && <span className="text-xs opacity-75">({Math.round(calibrationPoint2.x)}, {Math.round(calibrationPoint2.y)})</span>}
                </div>

                {/* Étape 3 - Saisie distance */}
                {calibrationStep === 3 && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <div className="text-sm mb-2">
                      📏 Distance mesurée: <strong>{calibrationPixelDistance.toFixed(1)} pixels</strong>
                    </div>
                    
                    {/* Distance réelle */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={calibrationRealDistance}
                        onChange={(e) => setCalibrationRealDistance(e.target.value)}
                        placeholder="Distance réelle..."
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-300"
                      />
                      <select
                        value={calibrationUnit}
                        onChange={(e) => setCalibrationUnit(e.target.value as any)}
                        className="px-3 py-2 rounded-lg text-gray-800 bg-white"
                      >
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="ft">pi (ft)</option>
                        <option value="in">po (in)</option>
                      </select>
                    </div>

                    {/* Résultat calculé */}
                    {calculatedCalibrationScale && (
                      <div className="mt-3 p-2 bg-green-500/30 rounded-lg text-sm">
                        <strong>Échelle calculée:</strong> 1:{Math.round(1 / calculatedCalibrationScale)}
                        <span className="text-xs ml-2 opacity-75">
                          ({calculatedCalibrationScale.toFixed(6)} m/px)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={cancelCalibration}
                  className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Annuler
                </button>
                
                {calibrationStep === 3 && (
                  <button
                    onClick={applyCalibration}
                    disabled={!calculatedCalibrationScale}
                    className="flex-1 px-4 py-2 bg-white text-amber-600 hover:bg-amber-50 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Appliquer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex-1 overflow-y-auto">
            {leftPanelTab === 'plans' && (
              <div className="p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.dwg,.ifc,.rvt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Ajouter des plans
                </button>

                <div className="mt-4 text-sm text-gray-500">{plans.length} plan(s)</div>

                <div className="mt-2 space-y-2">
                  {plans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-2 rounded-lg border cursor-pointer transition ${
                        plan.id === selectedPlan?.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.thumbnail ? (
                        <img src={plan.thumbnail} alt="" className="w-full h-20 object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <FileText size={24} className="text-gray-400" />
                        </div>
                      )}
                      <div className="text-sm font-medium truncate">{plan.name}</div>
                      <div className="text-xs text-gray-500">
                        {plan.pageCount} page(s) • {(plan.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  ))}

                  {plans.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      <FileText size={32} className="mx-auto mb-2 opacity-50" />
                      <div className="text-sm">Aucun plan</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {leftPanelTab === 'types' && (
              <div className="p-3 space-y-2">
                {Object.entries(measurementStats).map(([cat, stats]) => {
                  const s = stats as { count: number; total: number; unit: string }
                  return (
                    <div key={cat} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{cat}</div>
                      <div className="text-sm text-gray-500">{s.count} mesure(s)</div>
                      <div className="text-lg font-bold text-teal-600">{s.total.toFixed(2)} {s.unit}</div>
                    </div>
                  )
                })}
                {Object.keys(measurementStats).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <List size={32} className="mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Aucune mesure</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== ZONE CENTRALE ====== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barre d'outils navigation */}
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-3">
          {selectedPlan && selectedPlan.pageCount > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                {currentPage} / {selectedPlan.pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(selectedPlan.pageCount, p + 1))}
                disabled={currentPage >= selectedPlan.pageCount}
                className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
              <div className="h-6 w-px bg-gray-600" />
            </>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="p-1.5 hover:bg-gray-700 rounded">
              <ZoomOut size={18} />
            </button>
            <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(400, z + 25))} className="p-1.5 hover:bg-gray-700 rounded">
              <ZoomIn size={18} />
            </button>
          </div>

          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-gray-700 rounded" title="Rotation">
            <RotateCw size={18} />
          </button>

          <button onClick={() => setZoom(100)} className="p-1.5 hover:bg-gray-700 rounded" title="Réinitialiser zoom">
            <Move size={18} />
          </button>

          {/* Bouton plein écran */}
          <button 
            onClick={toggleFullscreen} 
            className={`p-1.5 hover:bg-gray-700 rounded ${isFullscreen ? 'bg-teal-600' : ''}`}
            title={isFullscreen ? 'Quitter plein écran (F11)' : 'Plein écran (F11)'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <div className="h-6 w-px bg-gray-600" />

          {/* Calibration interactive */}
          <button
            onClick={startInteractiveCalibration}
            disabled={!selectedPlan || isCalibrating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
              isCalibrating 
                ? 'bg-orange-500 text-white animate-pulse' 
                : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
            }`}
            title="Calibrer en cliquant 2 points sur le plan"
          >
            <Target size={16} />
            {isCalibrating ? 'Calibration...' : '2 Points'}
          </button>

          {/* Échelle prédéfinie */}
          <button
            onClick={() => setShowScaleCalibration(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded text-sm"
            title="Échelles prédéfinies"
          >
            <Ruler size={16} />
            {scaleUnit === 'metric' ? `1:${Math.round(1/scaleX)}` : `1"=${Math.round(1/scaleX)}'`}
          </button>

          <div className="flex-1" />

          {selectedPlan && (
            <div className="text-sm text-gray-400">
              {selectedPlan.name}
            </div>
          )}
        </div>

        {/* Barre d'outils mesure */}
        <div className="bg-gray-700 px-4 py-2 flex items-center gap-2">
          {TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => { setActiveTool(tool.type); setActiveAnnotationTool(null); cancelDrawing(); }}
              title={`${tool.label} (${tool.shortcut})`}
              className={`p-2 rounded transition ${
                activeTool === tool.type && !activeAnnotationTool ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'
              }`}
            >
              <tool.icon size={20} />
            </button>
          ))}

          <div className="h-6 w-px bg-gray-500 mx-2" />

          {/* Outils d'annotation (Option F) */}
          <button
            onClick={() => {
              setActiveAnnotationTool(activeAnnotationTool === 'text' ? null : 'text')
              if (activeAnnotationTool !== 'text') setActiveTool('select')
            }}
            title="Texte (T)"
            className={`p-2 rounded transition ${
              activeAnnotationTool === 'text' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Type size={20} />
          </button>
          <button
            onClick={() => {
              setActiveAnnotationTool(activeAnnotationTool === 'note' ? null : 'note')
              if (activeAnnotationTool !== 'note') setActiveTool('select')
            }}
            title="Note (N)"
            className={`p-2 rounded transition ${
              activeAnnotationTool === 'note' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            <StickyNote size={20} />
          </button>

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

          {drawing.isDrawing && (
            <>
              <div className="h-6 w-px bg-gray-500 mx-2" />
              <button
                onClick={cancelDrawing}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                <X size={16} />
                Annuler
              </button>
              {activeTool === 'area' && drawing.points.length >= 3 && (
                <button
                  onClick={finishPolygon}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  <Check size={16} />
                  Terminer ({drawing.points.length} pts)
                </button>
              )}
            </>
          )}
        </div>

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-500 relative"
          style={{ cursor: isCalibrating ? 'crosshair' : activeTool === 'select' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair' }}
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
            <div 
              className="relative inline-block mx-auto my-4"
              style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}
            >
              <canvas
                ref={canvasRef}
                className="shadow-2xl"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 pointer-events-auto"
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
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
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColor }} />
            {TOOLS.find(t => t.type === activeTool)?.label}
          </span>
          {drawing.isDrawing && (
            <span className="text-amber-400">
              {activeTool === 'area' 
                ? `${drawing.points.length} points (double-clic ou Entrée pour terminer)` 
                : 'Cliquez pour placer le point'}
            </span>
          )}
          <span>•</span>
          <span>Échelle: 1:{Math.round(1/scaleX)}</span>
          <span>•</span>
          <span>{measurements.length} mesure{measurements.length > 1 ? 's' : ''}</span>
          {(() => {
            const totalCost = measurements.reduce((sum, m) => sum + (m.costs?.totalCost || 0), 0)
            return totalCost > 0 ? (
              <>
                <span>•</span>
                <span className="text-green-400">${totalCost.toFixed(2)}</span>
              </>
            ) : null
          })()}
          <div className="flex-1" />
          <span>V L R P C: Outils • +/- Zoom • Shift+Clic: Pan • Échap: Annuler</span>
        </div>
      </div>

      {/* ====== PANNEAU DROIT ====== */}
      <div className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${rightPanelCollapsed ? 'w-12' : 'w-96'}`}>
        <div className="flex items-center justify-between p-2 border-b bg-gray-50">
          <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="p-1.5 hover:bg-gray-200 rounded">
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {!rightPanelCollapsed && <span className="text-sm font-medium text-gray-700">Mesures & Coûts</span>}
        </div>

        {!rightPanelCollapsed && (
          <div className="flex-1 overflow-y-auto p-3">
            {/* Actions */}
            <div className="space-y-2 mb-4">
              {/* Ligne 1: Export Soumission + PDF */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExportToSoumission(true)}
                  disabled={measurements.length === 0}
                  className="flex-1 px-3 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Exporter vers le module Soumission"
                >
                  <Send size={16} />
                  Soumission
                </button>
                <button
                  onClick={() => {
                    // Capturer l'image du canvas
                    if (canvasRef.current) {
                      setPlanImageBase64(canvasRef.current.toDataURL('image/jpeg', 0.8))
                    }
                    setShowPDFExporter(true)
                  }}
                  disabled={measurements.length === 0}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  title="Générer un PDF avec les mesures"
                >
                  <FileDown size={16} />
                  PDF
                </button>
              </div>
              
              {/* Ligne 2: Export classique + Supprimer */}
              <div className="flex gap-2">
                <button
                  onClick={() => onExportToEstimation?.(measurements)}
                  disabled={measurements.length === 0}
                  className="flex-1 px-3 py-2 border border-teal-500 text-teal-600 rounded text-sm hover:bg-teal-50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  JSON
                </button>
                <button
                  onClick={() => { if (confirm('Supprimer toutes les mesures?')) setMeasurements([]) }}
                  disabled={measurements.length === 0}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Totaux */}
            {measurements.length > 0 && (() => {
              const totalLabor = measurements.reduce((sum, m) => sum + (m.costs?.laborCost || 0), 0)
              const totalMaterial = measurements.reduce((sum, m) => sum + (m.costs?.materialCost || 0), 0)
              const totalCost = totalLabor + totalMaterial
              
              return totalCost > 0 ? (
                <div className="mb-4 p-3 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} />
                    <span className="font-medium">Total du relevé</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {totalLabor > 0 && (
                      <div className="flex justify-between opacity-90">
                        <span>Main-d'œuvre:</span>
                        <span>${totalLabor.toFixed(2)}</span>
                      </div>
                    )}
                    {totalMaterial > 0 && (
                      <div className="flex justify-between opacity-90">
                        <span>Matériaux:</span>
                        <span>${totalMaterial.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/30 pt-1 flex justify-between font-bold">
                      <span>TOTAL:</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : null
            })()}

            {/* Liste des mesures */}
            <div className="space-y-2">
              {measurements.map(m => {
                const hasCosts = (m.costs?.totalCost || 0) > 0
                const hasCalc = m.calculated?.area || m.calculated?.volume
                
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border transition ${
                      m.id === selectedMeasurement ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => setSelectedMeasurement(m.id === selectedMeasurement ? null : m.id)}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                        <span className="text-sm font-medium truncate">
                          {m.label || `${m.type} - ${m.category}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingMeasurement(m)
                          }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Modifier"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMeasurements(prev => prev.filter(x => x.id !== m.id))
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Valeur principale */}
                    <div className="mt-1 text-lg font-bold">{m.value.toFixed(2)} {m.unit}</div>
                    
                    {/* Valeurs calculées */}
                    {hasCalc && (
                      <div className="mt-1 text-xs text-blue-600">
                        {m.calculated?.area && `Surface: ${m.calculated.area.toFixed(2)} m² `}
                        {m.calculated?.volume && `Volume: ${m.calculated.volume.toFixed(3)} m³`}
                      </div>
                    )}
                    
                    {/* Coûts */}
                    {hasCosts && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-green-600 font-medium">
                        <DollarSign size={12} />
                        {m.costs?.totalCost?.toFixed(2)}
                      </div>
                    )}
                    
                    {/* Catégorie et type */}
                    <div className="text-xs text-gray-500 mt-1">{m.category} • {m.type}</div>
                  </div>
                )
              })}

              {measurements.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <List size={32} className="mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Aucune mesure</div>
                  <div className="text-xs mt-2">
                    Sélectionnez un outil et cliquez sur le plan
                  </div>
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

      {/* Modal édition de mesure */}
      {editingMeasurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <MeasurementEditor
            measurement={editingMeasurement}
            onSave={(updated) => {
              setMeasurements(prev => prev.map(m => 
                m.id === updated.id ? updated : m
              ))
              setEditingMeasurement(null)
            }}
            onDelete={() => {
              setMeasurements(prev => prev.filter(m => m.id !== editingMeasurement.id))
              setEditingMeasurement(null)
            }}
            onClose={() => setEditingMeasurement(null)}
          />
        </div>
      )}

      {/* Option E - Modal export vers Soumission */}
      <TakeoffToSoumission
        isOpen={showExportToSoumission}
        onClose={() => setShowExportToSoumission(false)}
        measurements={measurements}
        projectId={projectId}
        projectName="Projet"
        onExportComplete={(items) => {
          console.log('Exporté vers soumission:', items)
          // TODO: Intégrer avec le module Soumission
        }}
      />

      {/* Option G - Modal export PDF */}
      <PDFExporter
        isOpen={showPDFExporter}
        onClose={() => setShowPDFExporter(false)}
        measurements={measurements}
        annotations={annotations}
        planImage={planImageBase64 || undefined}
        planName={selectedPlan?.name || 'Plan'}
        projectName="Projet"
      />
    </div>
  )
}

export default TakeoffViewer
