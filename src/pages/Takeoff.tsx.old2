/**
 * DAST Solutions - Takeoff COMPLET
 * Upload PDF, Calibration, Mesures, Export
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTakeoff, CSC_DIVISIONS, Point, TakeoffMeasure } from '@/hooks/useTakeoff'
import * as XLSX from 'xlsx'
import {
  Upload, FileText, Trash2, ZoomIn, ZoomOut, RotateCcw, Move,
  Ruler, Square, Hexagon, Hash, MousePointer, Check, X,
  ChevronLeft, ChevronRight, Download, Send, Loader2,
  Crosshair, Settings, Layers, DollarSign, Plus, Minus
} from 'lucide-react'

// Types outils
type Tool = 'select' | 'pan' | 'calibrate' | 'line' | 'rectangle' | 'polygon' | 'count'

// Couleurs prédéfinies
const COLORS = [
  '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#22c55e',
  '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'
]

export default function TakeoffPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const {
    plans, activePlan, setActivePlan, activePage, setActivePage,
    uploadPlan, deletePlan,
    calibration, saveCalibration,
    measures, addMeasure, updateMeasure, deleteMeasure, calculateMeasure,
    loading, getStats
  } = useTakeoff(projectId || '')

  // États UI
  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(100)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // États dessin
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedMeasure, setSelectedMeasure] = useState<string | null>(null)
  
  // États calibration
  const [calibrationStep, setCalibrationStep] = useState<0 | 1 | 2>(0)
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([])
  const [calibrationDistance, setCalibrationDistance] = useState('')
  const [calibrationUnit, setCalibrationUnit] = useState('pi')
  
  // États nouvelle mesure
  const [measureLabel, setMeasureLabel] = useState('')
  const [measureCategory, setMeasureCategory] = useState('')
  const [measureColor, setMeasureColor] = useState(COLORS[0])
  const [measureUnitPrice, setMeasureUnitPrice] = useState(0)
  
  // États upload
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfImage, setPdfImage] = useState<HTMLImageElement | null>(null)
  const [project, setProject] = useState<any>(null)

  // Charger le projet
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single()
      setProject(data)
    }
    loadProject()
  }, [projectId])

  // Charger l'image PDF
  useEffect(() => {
    if (activePlan?.file_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => setPdfImage(img)
      img.src = activePlan.file_url
    } else {
      setPdfImage(null)
    }
  }, [activePlan])

  // Dessiner le canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const container = containerRef.current
    if (!container) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Appliquer transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoom / 100, zoom / 100)

    // Dessiner l'image PDF
    if (pdfImage) {
      ctx.drawImage(pdfImage, 0, 0)
    } else {
      // Placeholder
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Aucun plan sélectionné', 400, 300)
    }

    // Dessiner les mesures existantes
    measures.forEach(measure => {
      ctx.strokeStyle = measure.color
      ctx.fillStyle = measure.color + '30'
      ctx.lineWidth = 2

      const pts = measure.points
      if (pts.length < 2) return

      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      
      if (measure.type === 'rectangle' && pts.length >= 2) {
        const [p1, p2] = pts
        ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)
        ctx.fill()
      } else if (measure.type === 'polygon' || measure.type === 'area') {
        pts.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.fill()
      } else if (measure.type === 'line') {
        pts.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
      } else if (measure.type === 'count') {
        pts.forEach(p => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        })
      }
      
      ctx.stroke()

      // Label
      if (pts.length > 0 && measure.label) {
        ctx.fillStyle = measure.color
        ctx.font = 'bold 12px sans-serif'
        ctx.fillText(measure.label, pts[0].x + 5, pts[0].y - 5)
      }
    })

    // Dessiner les points de calibration
    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.fillStyle = '#ef4444'
      ctx.lineWidth = 2
      
      calibrationPoints.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(i + 1), p.x, p.y + 4)
        ctx.fillStyle = '#ef4444'
      })

      if (calibrationPoints.length === 2) {
        ctx.beginPath()
        ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y)
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y)
        ctx.stroke()
      }
    }

    // Dessiner la forme en cours
    if (currentPoints.length > 0) {
      ctx.strokeStyle = measureColor
      ctx.fillStyle = measureColor + '30'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
      
      if (tool === 'rectangle' && currentPoints.length >= 2) {
        const [p1, p2] = currentPoints
        ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)
        ctx.fill()
      } else {
        currentPoints.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y)
        })
      }
      
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.restore()
  }, [pdfImage, measures, currentPoints, calibrationPoints, zoom, panOffset, measureColor, tool])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Convertir coordonnées écran → canvas
  const screenToCanvas = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / (zoom / 100)
    const y = (e.clientY - rect.top - panOffset.y) / (zoom / 100)
    return { x, y }
  }

  // Gestion des clics
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'pan' || tool === 'select') return
    
    const point = screenToCanvas(e)

    if (tool === 'calibrate') {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, point])
        if (calibrationPoints.length === 1) {
          setCalibrationStep(2)
        }
      }
      return
    }

    if (tool === 'count') {
      setCurrentPoints([...currentPoints, point])
      return
    }

    if (tool === 'line') {
      if (!isDrawing) {
        setCurrentPoints([point])
        setIsDrawing(true)
      } else {
        setCurrentPoints([...currentPoints, point])
      }
      return
    }

    if (tool === 'rectangle') {
      if (!isDrawing) {
        setCurrentPoints([point])
        setIsDrawing(true)
      } else {
        setCurrentPoints([currentPoints[0], point])
        // Terminer automatiquement le rectangle
        finishMeasure([currentPoints[0], point])
      }
      return
    }

    if (tool === 'polygon') {
      if (!isDrawing) {
        setCurrentPoints([point])
        setIsDrawing(true)
      } else {
        setCurrentPoints([...currentPoints, point])
      }
    }
  }

  // Double-clic pour terminer
  const handleDoubleClick = () => {
    if (currentPoints.length >= 2) {
      finishMeasure(currentPoints)
    }
  }

  // Terminer une mesure
  const finishMeasure = async (points: Point[]) => {
    if (!calibration && tool !== 'count') {
      alert('Veuillez d\'abord calibrer l\'échelle')
      return
    }

    const type = tool as TakeoffMeasure['type']
    await addMeasure(type, points, measureLabel || `Mesure ${measures.length + 1}`, measureCategory, measureColor, measureUnitPrice)
    
    setCurrentPoints([])
    setIsDrawing(false)
    setMeasureLabel('')
  }

  // Annuler le dessin en cours
  const cancelDrawing = () => {
    setCurrentPoints([])
    setIsDrawing(false)
    setCalibrationPoints([])
    setCalibrationStep(0)
  }

  // Sauvegarder la calibration
  const handleSaveCalibration = async () => {
    if (calibrationPoints.length !== 2 || !calibrationDistance) return
    
    await saveCalibration(
      calibrationPoints[0],
      calibrationPoints[1],
      parseFloat(calibrationDistance),
      calibrationUnit
    )
    
    setCalibrationPoints([])
    setCalibrationStep(0)
    setCalibrationDistance('')
    setTool('select')
  }

  // Gestion du pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
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

  // Upload de fichier
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      alert('Format non supporté. Utilisez PDF ou images.')
      return
    }

    setUploading(true)
    await uploadPlan(file)
    setUploading(false)
  }

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  // Export Excel
  const exportToExcel = () => {
    const data = measures.map(m => ({
      'Label': m.label,
      'Type': m.type,
      'Catégorie': m.category || '',
      'Valeur': m.value,
      'Unité': m.unit,
      'Prix unitaire': m.unit_price,
      'Total': m.total_price
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mesures')
    XLSX.writeFile(wb, `Takeoff_${project?.name || 'export'}.xlsx`)
  }

  // Créer soumission depuis mesures
  const createSoumission = () => {
    // Stocker les mesures dans sessionStorage pour la page soumission
    sessionStorage.setItem('takeoff_measures', JSON.stringify(measures))
    navigate(`/bid-proposal/${projectId}?from=takeoff`)
  }

  const stats = getStats()

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project?.name || 'Projet'}</h1>
          <p className="text-sm text-gray-500">Takeoff - Relevé de quantités</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{measures.length}</span> mesure(s) | 
            <span className="font-medium text-teal-600 ml-1">
              {stats.totalPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </span>
          </div>
          <button onClick={exportToExcel} className="btn btn-secondary text-sm">
            <Download size={16} className="mr-1" /> Excel
          </button>
          <button onClick={createSoumission} className="btn btn-primary text-sm">
            <Send size={16} className="mr-1" /> Soumission
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar gauche - Plans */}
        <div className="w-56 bg-gray-50 border-r flex flex-col flex-shrink-0">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm text-gray-700 mb-2">Plans</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2 px-3 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Ajouter des plans
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {plans.length === 0 ? (
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  dragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-xs text-gray-500">Glissez un PDF ici</p>
              </div>
            ) : (
              <div className="space-y-1">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setActivePlan(plan)}
                    className={`p-2 rounded-lg cursor-pointer text-sm flex items-center justify-between group ${
                      activePlan?.id === plan.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate flex-1">{plan.name || plan.filename}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePlan(plan.id) }}
                      className="p-1 text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone centrale - Canvas */}
        <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2">
              <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1.5 text-white hover:bg-gray-600 rounded">
                <ZoomOut size={16} />
              </button>
              <span className="text-white text-sm w-12 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(400, zoom + 25))} className="p-1.5 text-white hover:bg-gray-600 rounded">
                <ZoomIn size={16} />
              </button>
            </div>
            
            <button onClick={() => { setZoom(100); setPanOffset({ x: 0, y: 0 }) }} className="p-1.5 text-white hover:bg-gray-700 rounded" title="Réinitialiser">
              <RotateCcw size={16} />
            </button>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            {/* Outils */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button onClick={() => setTool('select')} className={`p-1.5 rounded ${tool === 'select' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Sélection">
                <MousePointer size={16} />
              </button>
              <button onClick={() => setTool('pan')} className={`p-1.5 rounded ${tool === 'pan' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Déplacer">
                <Move size={16} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            {/* Calibration */}
            <button 
              onClick={() => { setTool('calibrate'); setCalibrationStep(1) }} 
              className={`p-1.5 rounded flex items-center gap-1 ${tool === 'calibrate' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              title="Calibrer l'échelle"
            >
              <Crosshair size={16} />
              <span className="text-xs">Calibrer</span>
            </button>

            {calibration && (
              <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded">
                ✓ {calibration.scale_ratio || `${calibration.real_distance} ${calibration.real_unit}`}
              </span>
            )}

            <div className="w-px h-6 bg-gray-600 mx-2" />

            {/* Outils de mesure */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button onClick={() => setTool('line')} className={`p-1.5 rounded ${tool === 'line' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Ligne">
                <Minus size={16} />
              </button>
              <button onClick={() => setTool('rectangle')} className={`p-1.5 rounded ${tool === 'rectangle' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Rectangle">
                <Square size={16} />
              </button>
              <button onClick={() => setTool('polygon')} className={`p-1.5 rounded ${tool === 'polygon' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Polygone">
                <Hexagon size={16} />
              </button>
              <button onClick={() => setTool('count')} className={`p-1.5 rounded ${tool === 'count' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Comptage">
                <Hash size={16} />
              </button>
            </div>

            {/* Catégorie */}
            <select
              value={measureCategory}
              onChange={(e) => setMeasureCategory(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1.5 border-0"
            >
              <option value="">Catégorie...</option>
              {CSC_DIVISIONS.map(d => (
                <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>

            {/* Couleurs */}
            <div className="flex gap-1">
              {COLORS.slice(0, 5).map(c => (
                <button
                  key={c}
                  onClick={() => setMeasureColor(c)}
                  className={`w-5 h-5 rounded ${measureColor === c ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Actions dessin */}
            {(isDrawing || currentPoints.length > 0) && (
              <div className="flex gap-1 ml-2">
                <button onClick={() => finishMeasure(currentPoints)} className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                  <Check size={14} className="inline mr-1" /> Terminer
                </button>
                <button onClick={cancelDrawing} className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                  <X size={14} className="inline mr-1" /> Annuler
                </button>
              </div>
            )}
          </div>

          {/* Modal calibration */}
          {calibrationStep === 2 && calibrationPoints.length === 2 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 z-50">
              <h3 className="font-bold text-lg mb-4">Définir la distance réelle</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  value={calibrationDistance}
                  onChange={(e) => setCalibrationDistance(e.target.value)}
                  placeholder="Distance"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  autoFocus
                />
                <select
                  value={calibrationUnit}
                  onChange={(e) => setCalibrationUnit(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="pi">Pieds (pi)</option>
                  <option value="m">Mètres (m)</option>
                  <option value="po">Pouces (po)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelDrawing} className="flex-1 py-2 border rounded-lg">Annuler</button>
                <button onClick={handleSaveCalibration} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Confirmer</button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden cursor-crosshair relative"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute inset-0"
              style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
            />
            
            {dragOver && (
              <div className="absolute inset-0 bg-teal-500/30 flex items-center justify-center">
                <div className="bg-white rounded-xl p-8 text-center">
                  <Upload size={48} className="mx-auto mb-4 text-teal-600" />
                  <p className="text-lg font-medium">Déposez votre fichier ici</p>
                </div>
              </div>
            )}

            {!activePlan && !dragOver && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FileText size={64} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400 text-lg">Aucun plan sélectionné</p>
                  <p className="text-gray-500 text-sm mt-2">Uploadez un PDF ou sélectionnez un plan</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar droite - Mesures */}
        <div className="w-72 bg-white border-l flex flex-col flex-shrink-0">
          <div className="p-3 border-b">
            <h3 className="font-medium text-gray-700">Mesures & Coûts</h3>
          </div>
          
          {/* Champ label */}
          <div className="p-3 border-b">
            <input
              type="text"
              value={measureLabel}
              onChange={(e) => setMeasureLabel(e.target.value)}
              placeholder="Nom de la mesure..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={measureUnitPrice || ''}
                onChange={(e) => setMeasureUnitPrice(parseFloat(e.target.value) || 0)}
                placeholder="Prix/unité"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-gray-500 self-center">$/unité</span>
            </div>
          </div>

          {/* Liste des mesures */}
          <div className="flex-1 overflow-y-auto p-2">
            {measures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ruler className="mx-auto mb-2" size={32} />
                <p className="text-sm">Aucune mesure</p>
                <p className="text-xs mt-1">Sélectionnez un outil et cliquez sur le plan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {measures.map(measure => (
                  <div
                    key={measure.id}
                    className={`p-3 rounded-lg border ${
                      selectedMeasure === measure.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMeasure(measure.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: measure.color }} />
                        <span className="font-medium text-sm">{measure.label}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMeasure(measure.id) }}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {measure.type} | {measure.value.toFixed(2)} {measure.unit}
                    </div>
                    {measure.unit_price > 0 && (
                      <div className="mt-1 text-sm font-medium text-teal-600">
                        {measure.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totaux */}
          <div className="p-3 border-t bg-gray-50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Total items:</span>
              <span className="font-medium">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-teal-600">
                {stats.totalPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
