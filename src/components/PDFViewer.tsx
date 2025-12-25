/**
 * DAST Solutions - PDFViewer avec Canvas de Mesure
 * Viewer PDF interactif avec outils de mesure overlay
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, Move
} from 'lucide-react'
import type { Point, Measurement, MeasureToolType } from '@/types/takeoff-measure-types'
import { calculateDistance, calculatePolygonArea, generateMeasurementId } from '@/types/takeoff-measure-types'

// Configuration PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  file: File | string | null
  activeTool: MeasureToolType
  scale: number  // Échelle du plan (ex: 0.02 pour 1:50)
  measurements: Measurement[]
  onMeasurementAdd: (measurement: Omit<Measurement, 'id' | 'createdAt'>) => void
  onMeasurementSelect?: (id: string) => void
  selectedMeasurement?: string | null
  currentCategory: string
  currentColor: string
}

export function PDFViewer({
  file,
  activeTool,
  scale,
  measurements,
  onMeasurementAdd,
  onMeasurementSelect,
  selectedMeasurement,
  currentCategory,
  currentColor
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })
  
  // État du dessin
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 })

  // Gestion du document PDF
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }

  const onPageLoadSuccess = ({ width, height }: { width: number; height: number }) => {
    setPageSize({ width, height })
  }

  // Navigation pages
  const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNextPage = () => setCurrentPage(p => Math.min(numPages, p + 1))

  // Zoom
  const zoomIn = () => setZoom(z => Math.min(3, z + 0.25))
  const zoomOut = () => setZoom(z => Math.max(0.25, z - 0.25))
  const resetZoom = () => setZoom(1)

  // Rotation
  const rotate = () => setRotation(r => (r + 90) % 360)

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Obtenir les coordonnées relatives au canvas
  const getCanvasCoords = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    }
  }, [zoom])

  // Gestion des clics pour mesure
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === 'select' || isPanning) return
    
    const point = getCanvasCoords(e)

    if (activeTool === 'count') {
      // Comptage: un clic = une unité
      onMeasurementAdd({
        type: 'count',
        points: [point],
        value: 1,
        unit: 'unité',
        scale,
        label: 'Élément',
        category: currentCategory,
        color: currentColor,
        pageNumber: currentPage
      })
      return
    }

    if (activeTool === 'line') {
      if (currentPoints.length === 0) {
        setCurrentPoints([point])
        setIsDrawing(true)
      } else {
        // Finaliser la ligne
        const distance = calculateDistance(currentPoints[0], point)
        const realDistance = distance * scale * (72 / 96) // Ajustement DPI
        
        onMeasurementAdd({
          type: 'line',
          points: [currentPoints[0], point],
          value: realDistance,
          unit: 'm',
          scale,
          label: 'Ligne',
          category: currentCategory,
          color: currentColor,
          pageNumber: currentPage
        })
        setCurrentPoints([])
        setIsDrawing(false)
      }
    }

    if (activeTool === 'area' || activeTool === 'rectangle') {
      if (activeTool === 'rectangle') {
        if (currentPoints.length === 0) {
          setCurrentPoints([point])
          setIsDrawing(true)
        } else {
          // Créer un rectangle
          const p1 = currentPoints[0]
          const p2 = point
          const rectPoints = [
            p1,
            { x: p2.x, y: p1.y },
            p2,
            { x: p1.x, y: p2.y }
          ]
          const areaPixels = Math.abs((p2.x - p1.x) * (p2.y - p1.y))
          const realArea = areaPixels * Math.pow(scale * (72 / 96), 2)
          
          onMeasurementAdd({
            type: 'rectangle',
            points: rectPoints,
            value: realArea,
            unit: 'm²',
            scale,
            label: 'Surface',
            category: currentCategory,
            color: currentColor,
            pageNumber: currentPage
          })
          setCurrentPoints([])
          setIsDrawing(false)
        }
      } else {
        // Polygone: ajouter des points, double-clic pour terminer
        setCurrentPoints([...currentPoints, point])
        setIsDrawing(true)
      }
    }
  }

  // Double-clic pour fermer un polygone
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (activeTool !== 'area' || currentPoints.length < 3) return
    
    const areaPixels = calculatePolygonArea(currentPoints)
    const realArea = areaPixels * Math.pow(scale * (72 / 96), 2)
    
    onMeasurementAdd({
      type: 'area',
      points: currentPoints,
      value: realArea,
      unit: 'm²',
      scale,
      label: 'Surface',
      category: currentCategory,
      color: currentColor,
      pageNumber: currentPage
    })
    setCurrentPoints([])
    setIsDrawing(false)
  }

  // Gestion du pan (déplacement)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Dessiner le canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajuster la taille du canvas
    canvas.width = pageSize.width * zoom
    canvas.height = pageSize.height * zoom
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(zoom, zoom)

    // Dessiner les mesures existantes pour cette page
    measurements
      .filter(m => m.pageNumber === currentPage)
      .forEach(m => {
        ctx.strokeStyle = m.color
        ctx.fillStyle = m.color + '33' // 20% opacity
        ctx.lineWidth = 2 / zoom

        if (m.type === 'line' && m.points.length === 2) {
          ctx.beginPath()
          ctx.moveTo(m.points[0].x, m.points[0].y)
          ctx.lineTo(m.points[1].x, m.points[1].y)
          ctx.stroke()
          
          // Afficher la valeur
          const midX = (m.points[0].x + m.points[1].x) / 2
          const midY = (m.points[0].y + m.points[1].y) / 2
          ctx.font = `${14 / zoom}px sans-serif`
          ctx.fillStyle = m.color
          ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, midX, midY - 5)
        }

        if ((m.type === 'area' || m.type === 'rectangle') && m.points.length >= 3) {
          ctx.beginPath()
          ctx.moveTo(m.points[0].x, m.points[0].y)
          m.points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y)
          })
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          // Afficher la valeur au centre
          const centerX = m.points.reduce((s, p) => s + p.x, 0) / m.points.length
          const centerY = m.points.reduce((s, p) => s + p.y, 0) / m.points.length
          ctx.font = `${14 / zoom}px sans-serif`
          ctx.fillStyle = m.color
          ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, centerX, centerY)
        }

        if (m.type === 'count' && m.points.length === 1) {
          ctx.beginPath()
          ctx.arc(m.points[0].x, m.points[0].y, 8 / zoom, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      })

    // Dessiner la mesure en cours
    if (currentPoints.length > 0) {
      ctx.strokeStyle = currentColor
      ctx.fillStyle = currentColor + '33'
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([5 / zoom, 5 / zoom])

      if (activeTool === 'line' && currentPoints.length === 1) {
        // Ligne en cours - afficher le point de départ
        ctx.beginPath()
        ctx.arc(currentPoints[0].x, currentPoints[0].y, 5 / zoom, 0, Math.PI * 2)
        ctx.fill()
      }

      if (activeTool === 'area' && currentPoints.length >= 1) {
        ctx.beginPath()
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
        currentPoints.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()
        // Points
        currentPoints.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 4 / zoom, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      ctx.setLineDash([])
    }
  }, [measurements, currentPoints, currentPage, zoom, pageSize, currentColor, activeTool])

  // Curseur selon l'outil
  const getCursor = () => {
    if (isPanning) return 'grabbing'
    if (activeTool === 'select') return 'grab'
    if (activeTool === 'count') return 'cell'
    return 'crosshair'
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Aucun plan chargé</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Barre d'outils */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevPage} disabled={currentPage <= 1} className="p-2 hover:bg-gray-700 rounded disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm">Page {currentPage} / {numPages}</span>
          <button onClick={goToNextPage} disabled={currentPage >= numPages} className="p-2 hover:bg-gray-700 rounded disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-2 hover:bg-gray-700 rounded" title="Zoom -">
            <ZoomOut size={20} />
          </button>
          <button onClick={resetZoom} className="px-3 py-1 hover:bg-gray-700 rounded text-sm">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={zoomIn} className="p-2 hover:bg-gray-700 rounded" title="Zoom +">
            <ZoomIn size={20} />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2" />
          <button onClick={rotate} className="p-2 hover:bg-gray-700 rounded" title="Rotation">
            <RotateCw size={20} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-700 rounded" title="Plein écran">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Move size={16} />
          <span>Alt+Clic pour déplacer</span>
        </div>
      </div>

      {/* Zone de visualisation */}
      <div 
        className="relative flex-1 overflow-auto bg-gray-700 min-h-[500px]"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative inline-block"
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left'
          }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={zoom}
              rotate={rotation}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          
          {/* Canvas overlay pour les mesures */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-auto"
            style={{ 
              width: pageSize.width * zoom,
              height: pageSize.height * zoom
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
          />
        </div>
      </div>

      {/* Indicateur d'outil actif */}
      {isDrawing && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
          {activeTool === 'line' && 'Cliquez pour terminer la ligne'}
          {activeTool === 'area' && `${currentPoints.length} points - Double-clic pour terminer`}
          {activeTool === 'rectangle' && 'Cliquez pour le coin opposé'}
        </div>
      )}
    </div>
  )
}
