/**
 * DAST Solutions - Takeoff V3 Professional
 * Interface inspirée de Bluebeam Revu / PlanSwift
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
import { 
  Upload, FileText, Trash2, ZoomIn, ZoomOut, RotateCcw, Move, Ruler, 
  Square, Hexagon, Hash, MousePointer, Check, X, ChevronLeft, ChevronRight, 
  Download, Send, Loader2, Crosshair, RotateCw, Eye, EyeOff, Minus,
  AlertTriangle, RefreshCw, Maximize2, Grid, Layers, Search, Filter,
  Plus, FolderOpen, Settings, HelpCircle
} from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

type Tool = 'select' | 'pan' | 'calibrate' | 'line' | 'rectangle' | 'polygon' | 'count'
type Point = { x: number; y: number }

interface TakeoffPlan {
  id: string
  project_id: string
  user_id: string
  filename: string
  original_name?: string
  storage_path: string
  file_url?: string
  page_count: number
  name?: string
  sort_order: number
}

interface TakeoffMeasure {
  id: string
  type: string
  points: Point[]
  value: number
  unit: string
  label: string
  category?: string
  color: string
  unit_price: number
  total_price: number
  page_number: number
}

interface Calibration {
  id: string
  pixels_per_unit: number
  real_unit: string
  real_distance: number
}

const COLORS = [
  { name: 'Turquoise', hex: '#14b8a6' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Rouge', hex: '#ef4444' },
  { name: 'Vert', hex: '#22c55e' },
  { name: 'Bleu', hex: '#3b82f6' },
  { name: 'Jaune', hex: '#eab308' },
  { name: 'Rose', hex: '#ec4899' },
]

const CSC_DIVISIONS = [
  { code: '03', name: 'Béton' },
  { code: '04', name: 'Maçonnerie' },
  { code: '05', name: 'Métaux' },
  { code: '06', name: 'Bois et plastiques' },
  { code: '07', name: 'Isolation / Étanchéité' },
  { code: '08', name: 'Portes et fenêtres' },
  { code: '09', name: 'Finitions' },
  { code: '22', name: 'Plomberie' },
  { code: '23', name: 'CVAC' },
  { code: '26', name: 'Électricité' },
  { code: '31', name: 'Terrassement' },
  { code: '32', name: 'Extérieur' },
]

export default function TakeoffV3() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  // State - Plans & PDF
  const [plans, setPlans] = useState<TakeoffPlan[]>([])
  const [activePlan, setActivePlan] = useState<TakeoffPlan | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [activePage, setActivePage] = useState(1)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // State - Tools & Drawing
  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [showMeasures, setShowMeasures] = useState(true)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  // State - Calibration
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([])
  const [calibrationStep, setCalibrationStep] = useState<0 | 1 | 2>(0)
  const [calibrationDistance, setCalibrationDistance] = useState('')
  const [calibrationUnit, setCalibrationUnit] = useState('pi')

  // State - Measures
  const [measures, setMeasures] = useState<TakeoffMeasure[]>([])
  const [measureLabel, setMeasureLabel] = useState('')
  const [measureCategory, setMeasureCategory] = useState('')
  const [measureColor, setMeasureColor] = useState(COLORS[0].hex)
  const [measureUnitPrice, setMeasureUnitPrice] = useState(0)

  // State - UI
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [searchMeasures, setSearchMeasures] = useState('')

  // Refs
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (!projectId) return
    supabase.from('projects').select('*').eq('id', projectId).single()
      .then(({ data }) => setProject(data))
  }, [projectId])

  useEffect(() => {
    loadPlans()
  }, [projectId])

  const loadPlans = async () => {
    if (!projectId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('takeoff_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('sort_order')

      if (error) throw error

      // Generate public URLs
      const plansWithUrls = (data || []).map(plan => {
        if (plan.storage_path) {
          const { data: urlData } = supabase.storage
            .from('takeoff-plans')
            .getPublicUrl(plan.storage_path)
          return { ...plan, file_url: urlData?.publicUrl }
        }
        return plan
      })

      setPlans(plansWithUrls)
      if (plansWithUrls.length > 0 && !activePlan) {
        setActivePlan(plansWithUrls[0])
      }
    } catch (err: any) {
      console.error('Error loading plans:', err)
    }
  }

  const loadCalibration = async () => {
    if (!activePlan) { setCalibration(null); return }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('takeoff_calibrations')
        .select('*')
        .eq('plan_id', activePlan.id)
        .eq('page_number', activePage)
        .eq('user_id', user.id)
        .maybeSingle()

      setCalibration(data || null)
    } catch (err) {
      console.error('Error loading calibration:', err)
    }
  }

  const loadMeasures = async () => {
    if (!projectId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('takeoff_measures')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMeasures(data || [])
    } catch (err) {
      console.error('Error loading measures:', err)
    }
  }

  useEffect(() => { loadCalibration() }, [activePlan, activePage])
  useEffect(() => { loadMeasures() }, [projectId, activePlan])

  // ============================================================================
  // PDF LOADING & RENDERING
  // ============================================================================

  useEffect(() => {
    if (!activePlan?.file_url) {
      setPdfDoc(null)
      setNumPages(0)
      setPdfError(null)
      return
    }

    setPdfLoading(true)
    setPdfError(null)
    
    console.log('Loading PDF from:', activePlan.file_url)

    pdfjsLib.getDocument({
      url: activePlan.file_url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    }).promise
      .then(pdf => {
        console.log('PDF loaded successfully, pages:', pdf.numPages)
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        setActivePage(1)
        setPdfLoading(false)
      })
      .catch(err => {
        console.error('PDF loading error:', err)
        setPdfError(`Erreur chargement PDF: ${err.message}`)
        setPdfLoading(false)
      })

    return () => { pdfDoc?.destroy() }
  }, [activePlan])

  const renderPDFPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return

    try {
      const page = await pdfDoc.getPage(activePage)
      const canvas = pdfCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const scale = zoom / 100 * 1.5
      const viewport = page.getViewport({ scale, rotation })
      
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: ctx, viewport }).promise

      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = viewport.width
        overlayCanvasRef.current.height = viewport.height
      }
      
      drawOverlay()
    } catch (err) {
      console.error('Error rendering page:', err)
    }
  }, [pdfDoc, activePage, zoom, rotation])

  useEffect(() => { renderPDFPage() }, [renderPDFPage])

  // ============================================================================
  // DRAWING & OVERLAY
  // ============================================================================

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!showMeasures) return

    const scale = zoom / 100 * 1.5

    // Draw saved measures
    measures.forEach(m => {
      if (m.page_number !== activePage) return
      ctx.strokeStyle = m.color
      ctx.fillStyle = m.color + '40'
      ctx.lineWidth = 2

      const pts = m.points.map((p: Point) => ({ x: p.x * scale, y: p.y * scale }))
      if (pts.length < 1) return

      ctx.beginPath()
      if (m.type === 'rectangle' && pts.length >= 2) {
        ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y)
        ctx.fill()
      } else if (m.type === 'polygon') {
        ctx.moveTo(pts[0].x, pts[0].y)
        pts.slice(1).forEach((p: Point) => ctx.lineTo(p.x, p.y))
        ctx.closePath()
        ctx.fill()
      } else if (m.type === 'line') {
        ctx.moveTo(pts[0].x, pts[0].y)
        pts.slice(1).forEach((p: Point) => ctx.lineTo(p.x, p.y))
      } else if (m.type === 'count') {
        pts.forEach((p: Point, i) => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(String(i + 1), p.x, p.y + 3)
          ctx.fillStyle = m.color + '40'
        })
        return
      }
      ctx.stroke()

      // Label
      if (m.label && pts.length > 0) {
        ctx.fillStyle = m.color
        ctx.font = `bold ${12}px sans-serif`
        ctx.fillText(m.label, pts[0].x + 5, pts[0].y - 5)
      }
    })

    // Draw calibration points
    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.fillStyle = '#ef4444'
      ctx.lineWidth = 3
      calibrationPoints.forEach((p, i) => {
        const sp = { x: p.x * scale, y: p.y * scale }
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(String(i + 1), sp.x, sp.y + 5)
        ctx.fillStyle = '#ef4444'
      })
      if (calibrationPoints.length === 2) {
        ctx.beginPath()
        ctx.moveTo(calibrationPoints[0].x * scale, calibrationPoints[0].y * scale)
        ctx.lineTo(calibrationPoints[1].x * scale, calibrationPoints[1].y * scale)
        ctx.stroke()
      }
    }

    // Draw current points (in progress)
    if (currentPoints.length > 0) {
      ctx.strokeStyle = measureColor
      ctx.fillStyle = measureColor + '40'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      const pts = currentPoints.map(p => ({ x: p.x * scale, y: p.y * scale }))
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      
      if (tool === 'rectangle' && pts.length >= 2) {
        ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y)
        ctx.fill()
      } else {
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [measures, calibrationPoints, currentPoints, activePage, zoom, showMeasures, measureColor, tool])

  useEffect(() => { drawOverlay() }, [drawOverlay])

  // ============================================================================
  // MOUSE HANDLERS
  // ============================================================================

  const screenToCanvas = (e: React.MouseEvent): Point => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scale = zoom / 100 * 1.5
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'pan' || tool === 'select') return
    const point = screenToCanvas(e)

    if (tool === 'calibrate') {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, point])
        if (calibrationPoints.length === 1) setCalibrationStep(2)
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

  const handleDoubleClick = () => {
    if (currentPoints.length >= 2) finishMeasure(currentPoints)
  }

  // ============================================================================
  // MEASURE OPERATIONS
  // ============================================================================

  const finishMeasure = async (points: Point[]) => {
    if (!calibration && tool !== 'count') {
      alert('Calibrez d\'abord l\'échelle avec l\'outil "Calibrer"')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let value = 0
      let unit = 'unité'

      if (calibration) {
        const ppu = calibration.pixels_per_unit

        if (tool === 'line' && points.length >= 2) {
          let totalDist = 0
          for (let i = 0; i < points.length - 1; i++) {
            totalDist += Math.sqrt(
              Math.pow(points[i + 1].x - points[i].x, 2) +
              Math.pow(points[i + 1].y - points[i].y, 2)
            )
          }
          value = totalDist / ppu
          unit = calibration.real_unit
        } else if (tool === 'rectangle' && points.length >= 2) {
          const width = Math.abs(points[1].x - points[0].x) / ppu
          const height = Math.abs(points[1].y - points[0].y) / ppu
          value = width * height
          unit = `${calibration.real_unit}²`
        } else if (tool === 'polygon' && points.length >= 3) {
          let area = 0
          for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length
            area += points[i].x * points[j].y
            area -= points[j].x * points[i].y
          }
          value = Math.abs(area / 2) / (ppu * ppu)
          unit = `${calibration.real_unit}²`
        }
      }

      if (tool === 'count') {
        value = points.length
        unit = 'unité'
      }

      const { data, error } = await supabase
        .from('takeoff_measures')
        .insert({
          project_id: projectId,
          plan_id: activePlan?.id,
          page_number: activePage,
          user_id: user.id,
          type: tool,
          points,
          value,
          unit,
          label: measureLabel || `Mesure ${measures.length + 1}`,
          category: measureCategory || 'Général',
          color: measureColor,
          unit_price: measureUnitPrice,
          total_price: value * measureUnitPrice
        })
        .select()
        .single()

      if (error) throw error

      setMeasures([data, ...measures])
      setCurrentPoints([])
      setIsDrawing(false)
      setMeasureLabel('')
    } catch (err: any) {
      console.error('Error saving measure:', err)
      alert('Erreur: ' + err.message)
    }
  }

  const deleteMeasure = async (measureId: string) => {
    try {
      await supabase.from('takeoff_measures').delete().eq('id', measureId)
      setMeasures(measures.filter(m => m.id !== measureId))
    } catch (err) {
      console.error('Error deleting measure:', err)
    }
  }

  const cancelDrawing = () => {
    setCurrentPoints([])
    setIsDrawing(false)
    setCalibrationPoints([])
    setCalibrationStep(0)
  }

  // ============================================================================
  // CALIBRATION
  // ============================================================================

  const handleSaveCalibration = async () => {
    if (calibrationPoints.length !== 2 || !calibrationDistance) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !activePlan) return

      const pixelDistance = Math.sqrt(
        Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
        Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
      )

      const payload = {
        plan_id: activePlan.id,
        page_number: activePage,
        user_id: user.id,
        point1_x: calibrationPoints[0].x,
        point1_y: calibrationPoints[0].y,
        point2_x: calibrationPoints[1].x,
        point2_y: calibrationPoints[1].y,
        real_distance: parseFloat(calibrationDistance),
        real_unit: calibrationUnit,
        pixels_per_unit: pixelDistance / parseFloat(calibrationDistance)
      }

      const { data, error } = await supabase
        .from('takeoff_calibrations')
        .upsert(payload, { onConflict: 'plan_id,page_number,user_id' })
        .select()
        .single()

      if (error) throw error

      setCalibration(data)
      setCalibrationPoints([])
      setCalibrationStep(0)
      setCalibrationDistance('')
      setTool('select')
    } catch (err: any) {
      console.error('Error saving calibration:', err)
      alert('Erreur: ' + err.message)
    }
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length || !projectId) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const file = files[0]
      if (file.size > 50 * 1024 * 1024) throw new Error('Fichier trop volumineux (max 50MB)')

      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

      const { error: uploadError } = await supabase.storage
        .from('takeoff-plans')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(`Upload: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from('takeoff-plans').getPublicUrl(storagePath)
      const nextOrder = plans.length > 0 ? Math.max(...plans.map(p => p.sort_order)) + 1 : 1

      const { data: planData, error: insertError } = await supabase
        .from('takeoff_plans')
        .insert({
          project_id: projectId,
          user_id: user.id,
          filename: sanitizedName,
          original_name: file.name,
          storage_path: storagePath,
          file_size: file.size,
          page_count: 1,
          name: file.name.replace(/\.[^/.]+$/, ''),
          numero: `P-${String(nextOrder).padStart(3, '0')}`,
          sort_order: nextOrder
        })
        .select()
        .single()

      if (insertError) {
        await supabase.storage.from('takeoff-plans').remove([storagePath])
        throw insertError
      }

      const newPlan = { ...planData, file_url: urlData?.publicUrl }
      setPlans([...plans, newPlan])
      setActivePlan(newPlan)
    } catch (err: any) {
      console.error('Upload error:', err)
      alert('Erreur: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Supprimer ce plan?')) return
    try {
      const plan = plans.find(p => p.id === planId)
      if (plan?.storage_path) {
        await supabase.storage.from('takeoff-plans').remove([plan.storage_path])
      }
      await supabase.from('takeoff_plans').delete().eq('id', planId)
      const updated = plans.filter(p => p.id !== planId)
      setPlans(updated)
      if (activePlan?.id === planId) setActivePlan(updated[0] || null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportToExcel = () => {
    const data = measures.map(m => ({
      'Étiquette': m.label,
      'Type': m.type,
      'Catégorie': m.category || '',
      'Valeur': m.value.toFixed(2),
      'Unité': m.unit,
      'Prix unitaire': m.unit_price,
      'Total': m.total_price.toFixed(2)
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relevé')
    XLSX.writeFile(wb, `Takeoff_${project?.name || 'export'}.xlsx`)
  }

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = {
    totalMeasures: measures.length,
    totalPrice: measures.reduce((sum, m) => sum + (m.total_price || 0), 0),
    byCategory: measures.reduce((acc, m) => {
      const cat = m.category || 'Général'
      if (!acc[cat]) acc[cat] = { count: 0, total: 0 }
      acc[cat].count++
      acc[cat].total += m.total_price || 0
      return acc
    }, {} as Record<string, { count: number; total: number }>)
  }

  const filteredMeasures = searchMeasures 
    ? measures.filter(m => m.label.toLowerCase().includes(searchMeasures.toLowerCase()))
    : measures

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* TOP HEADER */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{project?.name || 'Projet'}</h1>
            <p className="text-xs text-gray-500">Relevé de quantités</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-gray-500">{stats.totalMeasures} mesure(s)</span>
            <span className="mx-2">|</span>
            <span className="font-bold text-teal-600">
              {stats.totalPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
            </span>
          </div>
          <button onClick={exportToExcel} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
            <Download size={16} />Excel
          </button>
          <button onClick={() => navigate(`/bid-proposal/${projectId}`)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center gap-1">
            <Send size={16} />Soumission
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - PLANS & MEASURES */}
        {showLeftPanel && (
          <div className="w-72 bg-white border-r flex flex-col flex-shrink-0">
            {/* Plans Section */}
            <div className="border-b">
              <div className="p-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Layers size={16} />
                  Plans ({plans.length})
                </h3>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading}
                  className="p-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>

              {plans.length === 0 ? (
                <div 
                  className={`mx-3 mb-3 border-2 border-dashed rounded-lg p-4 text-center transition ${dragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}
                >
                  <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-xs text-gray-500">Glissez un PDF ici</p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto px-2 pb-2">
                  {plans.map(plan => (
                    <div 
                      key={plan.id} 
                      onClick={() => setActivePlan(plan)}
                      className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between group ${
                        activePlan?.id === plan.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="flex-shrink-0" />
                        <span className="truncate">{plan.name || plan.filename}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePlan(plan.id) }} 
                        className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Measures Section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-gray-400" />
                  <input 
                    type="text"
                    value={searchMeasures}
                    onChange={(e) => setSearchMeasures(e.target.value)}
                    placeholder="Rechercher..."
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                  <span className="text-xs text-gray-500">{filteredMeasures.length}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredMeasures.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Ruler className="mx-auto mb-2" size={32} />
                    <p className="text-sm">Aucune mesure</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredMeasures.map(m => (
                      <div 
                        key={m.id} 
                        className="p-2 rounded border border-gray-200 hover:border-gray-300 bg-white text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: m.color }} />
                            <span className="font-medium truncate">{m.label}</span>
                          </div>
                          <button 
                            onClick={() => deleteMeasure(m.id)} 
                            className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex justify-between">
                          <span>{m.value.toFixed(2)} {m.unit}</span>
                          {m.total_price > 0 && (
                            <span className="text-teal-600 font-medium">
                              {m.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="p-3 border-t bg-gray-50">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-teal-600">
                    {stats.totalPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CENTER - PDF VIEWER */}
        <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-900 px-3 py-2 flex items-center gap-2 flex-wrap">
            {/* Toggle Panels */}
            <button 
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`p-1.5 rounded ${showLeftPanel ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            >
              <Layers size={16} />
            </button>

            <div className="w-px h-6 bg-gray-700" />

            {/* Pagination */}
            {numPages > 1 && (
              <>
                <div className="flex items-center gap-1 bg-gray-700 rounded px-2">
                  <button onClick={() => setActivePage(Math.max(1, activePage - 1))} disabled={activePage <= 1} className="p-1 text-white hover:bg-gray-600 rounded disabled:opacity-50">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-white text-xs w-14 text-center">{activePage} / {numPages}</span>
                  <button onClick={() => setActivePage(Math.min(numPages, activePage + 1))} disabled={activePage >= numPages} className="p-1 text-white hover:bg-gray-600 rounded disabled:opacity-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="w-px h-6 bg-gray-700" />
              </>
            )}

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-700 rounded px-2">
              <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1 text-white hover:bg-gray-600 rounded">
                <ZoomOut size={14} />
              </button>
              <span className="text-white text-xs w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(400, zoom + 25))} className="p-1 text-white hover:bg-gray-600 rounded">
                <ZoomIn size={14} />
              </button>
            </div>

            <button onClick={() => setRotation((rotation + 90) % 360)} className="p-1.5 text-white hover:bg-gray-700 rounded">
              <RotateCw size={14} />
            </button>
            <button onClick={() => { setZoom(100); setRotation(0) }} className="p-1.5 text-white hover:bg-gray-700 rounded">
              <RotateCcw size={14} />
            </button>

            <div className="w-px h-6 bg-gray-700" />

            {/* Navigation Tools */}
            <div className="flex items-center gap-0.5 bg-gray-700 rounded p-0.5">
              <button onClick={() => setTool('select')} className={`p-1.5 rounded ${tool === 'select' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Sélection">
                <MousePointer size={14} />
              </button>
              <button onClick={() => setTool('pan')} className={`p-1.5 rounded ${tool === 'pan' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Déplacer">
                <Move size={14} />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-700" />

            {/* Calibration */}
            <button 
              onClick={() => { setTool('calibrate'); setCalibrationStep(1) }} 
              className={`px-2 py-1 rounded flex items-center gap-1 text-xs ${tool === 'calibrate' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              <Crosshair size={14} />
              Calibrer
            </button>
            {calibration && (
              <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded">
                ✓ 1:{(calibration.pixels_per_unit * calibration.real_distance).toFixed(0)}
              </span>
            )}

            <div className="w-px h-6 bg-gray-700" />

            {/* Measure Tools */}
            <div className="flex items-center gap-0.5 bg-gray-700 rounded p-0.5">
              <button onClick={() => setTool('line')} className={`p-1.5 rounded ${tool === 'line' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Ligne">
                <Minus size={14} />
              </button>
              <button onClick={() => setTool('rectangle')} className={`p-1.5 rounded ${tool === 'rectangle' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Rectangle">
                <Square size={14} />
              </button>
              <button onClick={() => setTool('polygon')} className={`p-1.5 rounded ${tool === 'polygon' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Polygone">
                <Hexagon size={14} />
              </button>
              <button onClick={() => setTool('count')} className={`p-1.5 rounded ${tool === 'count' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`} title="Comptage">
                <Hash size={14} />
              </button>
            </div>

            {/* Color Picker */}
            <div className="flex gap-0.5">
              {COLORS.slice(0, 6).map(c => (
                <button 
                  key={c.hex}
                  onClick={() => setMeasureColor(c.hex)}
                  className={`w-5 h-5 rounded ${measureColor === c.hex ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Category */}
            <select 
              value={measureCategory} 
              onChange={(e) => setMeasureCategory(e.target.value)} 
              className="bg-gray-700 text-white text-xs rounded px-2 py-1.5 border-0 outline-none"
            >
              <option value="">Catégorie...</option>
              {CSC_DIVISIONS.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
            </select>

            {/* Visibility */}
            <button 
              onClick={() => setShowMeasures(!showMeasures)} 
              className={`p-1.5 rounded ${showMeasures ? 'text-teal-400' : 'text-gray-500'} hover:bg-gray-700`}
              title={showMeasures ? 'Masquer mesures' : 'Afficher mesures'}
            >
              {showMeasures ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>

            {/* Drawing Controls */}
            {(isDrawing || currentPoints.length > 0) && (
              <div className="flex gap-1 ml-2">
                <button onClick={() => finishMeasure(currentPoints)} className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1">
                  <Check size={12} />Terminer
                </button>
                <button onClick={cancelDrawing} className="px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1">
                  <X size={12} />Annuler
                </button>
              </div>
            )}
          </div>

          {/* Measure Label Input */}
          <div className="bg-gray-800 px-3 py-2 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={measureLabel}
                onChange={(e) => setMeasureLabel(e.target.value)}
                placeholder="Nom de la mesure..."
                className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input 
                type="number"
                value={measureUnitPrice || ''}
                onChange={(e) => setMeasureUnitPrice(parseFloat(e.target.value) || 0)}
                placeholder="Prix/unité"
                className="w-24 bg-gray-700 text-white text-sm rounded px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-gray-400 text-sm">$/unité</span>
            </div>
          </div>

          {/* Calibration Modal */}
          {calibrationStep === 2 && calibrationPoints.length === 2 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 z-50">
              <h3 className="font-bold text-lg mb-4">Distance réelle entre les 2 points</h3>
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
                  <option value="pi">Pieds</option>
                  <option value="m">Mètres</option>
                  <option value="po">Pouces</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelDrawing} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleSaveCalibration} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Confirmer</button>
              </div>
            </div>
          )}

          {/* PDF Canvas Area */}
          <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center p-4 relative">
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Chargement du PDF...</p>
              </div>
            ) : pdfError ? (
              <div className="flex flex-col items-center justify-center text-white bg-red-900/50 rounded-xl p-8 max-w-md">
                <AlertTriangle className="mb-4 text-red-400" size={48} />
                <p className="text-red-300 text-center mb-4">{pdfError}</p>
                <p className="text-gray-400 text-sm text-center mb-4">
                  URL: {activePlan?.file_url?.substring(0, 50)}...
                </p>
                <button onClick={() => loadPlans()} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2">
                  <RefreshCw size={16} />Réessayer
                </button>
              </div>
            ) : pdfDoc ? (
              <div className="relative shadow-2xl">
                <canvas ref={pdfCanvasRef} className="bg-white" />
                <canvas 
                  ref={overlayCanvasRef} 
                  className="absolute top-0 left-0" 
                  onClick={handleCanvasClick}
                  onDoubleClick={handleDoubleClick}
                  style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <FolderOpen size={64} className="mb-4" />
                <p className="text-lg mb-2">Aucun plan sélectionné</p>
                <p className="text-sm">Ajoutez un PDF dans le panneau de gauche</p>
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="bg-gray-900 px-3 py-1.5 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              {activePlan && <span>{activePlan.name || activePlan.filename}</span>}
              {calibration && <span>Échelle: 1:{(calibration.pixels_per_unit * calibration.real_distance).toFixed(0)}</span>}
            </div>
            <div className="flex items-center gap-4">
              <span>Zoom: {zoom}%</span>
              <span>Rotation: {rotation}°</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Page Thumbnails (simplified) */}
        {showRightPanel && numPages > 1 && (
          <div className="w-24 bg-gray-100 border-l flex flex-col">
            <div className="p-2 text-xs font-medium text-center border-b bg-white">Pages</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setActivePage(pageNum)}
                  className={`w-full aspect-[3/4] rounded border-2 flex items-center justify-center text-sm font-medium ${
                    activePage === pageNum ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
