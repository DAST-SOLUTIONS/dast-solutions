/**
 * DAST Solutions - TakeoffAdvanced
 * Outil de takeoff professionnel - dual canvas PDF + mesures
 * Features: calibration, zoom/pan, polygone, linéaire, comptage, export Excel
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import {
  ArrowLeft, Upload, ZoomIn, ZoomOut, Ruler, Square, Circle, Hash,
  Crosshair, Trash2, Download, ChevronDown, ChevronRight, Plus,
  FileText, Layers, RotateCcw, X, Check, MousePointer, Move
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolType = 'select' | 'pan' | 'calibrate' | 'line' | 'polygon' | 'rectangle' | 'count'
type MeasureType = 'linear' | 'area' | 'count'

interface Point { x: number; y: number }

interface Measure {
  id: string
  type: MeasureType
  label: string
  points: Point[]
  closed?: boolean
  value: number       // en unités réelles (m ou m²)
  unit: string
  color: string
  category: string
}

interface DrawingSet {
  id: string
  project_id: string
  user_id?: string
  name: string
  version: string
  issue_date?: string
  status: string
  drawings: DrawingItem[]
  created_at?: string
}

interface DrawingItem {
  id: string
  set_id: string
  name: string
  number?: string
  file_url: string
  file_type?: string
  status: string
}

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#84CC16']
const CATEGORIES = ['Béton','Maçonnerie','Bois','Acier','Toiture','Isolation','Finitions','Mécanique','Électricité','Excavation','Autre']

const dist = (a: Point, b: Point) => Math.sqrt((b.x-a.x)**2 + (b.y-a.y)**2)
const polyArea = (pts: Point[]) => {
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  return Math.abs(area) / 2
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TakeoffAdvanced() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  // Canvas refs (dual layer)
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const pdfDocRef     = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)

  // Plan state
  const [drawingSets, setDrawingSets] = useState<DrawingSet[]>([])
  const [selectedSet, setSelectedSet] = useState<DrawingSet | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingItem | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)

  // Viewport
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const lastMouse = useRef<Point>({ x: 0, y: 0 })
  const spaceDown = useRef(false)

  // Calibration
  const [calibrated, setCalibrated] = useState(false)
  const [pxPerMeter, setPxPerMeter] = useState(100)   // pixels par mètre (défaut)
  const [calibPoints, setCalibPoints] = useState<Point[]>([])
  const [calibDist, setCalibDist] = useState('')
  const [showCalibModal, setShowCalibModal] = useState(false)

  // Outils & mesures
  const [tool, setTool] = useState<ToolType>('select')
  const [measures, setMeasures] = useState<Measure[]>([])
  const [currentPts, setCurrentPts] = useState<Point[]>([])
  const [hoverPt, setHoverPt] = useState<Point | null>(null)
  const [selectedMeasure, setSelectedMeasure] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeCategory, setActiveCategory] = useState('Béton')

  // UI
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', version: '1.0', date: new Date().toISOString().slice(0,10), files: [] as File[] })
  const [expandedSets, setExpandedSets] = useState<Record<string,boolean>>({})
  const [pdfRendering, setPdfRendering] = useState(false)

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) { navigate('/projects'); return }
    loadSets()
  }, [projectId])

  const loadSets = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('drawing_sets')
        .select('*, drawings(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (data?.length) {
        setDrawingSets(data)
        setExpandedSets({ [data[0].id]: true })
        setSelectedSet(data[0])
        if (data[0].drawings?.length) selectDrawing(data[0].drawings[0])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ── Rendu PDF ───────────────────────────────────────────────────────────────
  const renderPDF = useCallback(async (url: string, page: number, currentZoom: number, currentPan: Point) => {
    if (!pdfCanvasRef.current) return
    setPdfRendering(true)
    try {
      if (!pdfDocRef.current) {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs', import.meta.url
        ).toString()
        pdfDocRef.current = await pdfjsLib.getDocument(url).promise
        setTotalPages(pdfDocRef.current.numPages)
      }
      if (renderTaskRef.current) { renderTaskRef.current.cancel?.(); renderTaskRef.current = null }
      const pdfPage = await pdfDocRef.current.getPage(page)
      const container = containerRef.current
      const cw = container?.clientWidth ?? 900
      const ch = container?.clientHeight ?? 700
      const baseVp = pdfPage.getViewport({ scale: 1 })
      const baseScale = Math.min((cw - 40) / baseVp.width, (ch - 40) / baseVp.height)
      const finalScale = baseScale * currentZoom
      const vp = pdfPage.getViewport({ scale: finalScale })
      const canvas = pdfCanvasRef.current
      canvas.width = vp.width
      canvas.height = vp.height
      canvas.style.transform = `translate(${currentPan.x}px, ${currentPan.y}px)`
      const drawCanvas = drawCanvasRef.current
      if (drawCanvas) {
        drawCanvas.width = vp.width
        drawCanvas.height = vp.height
        drawCanvas.style.transform = `translate(${currentPan.x}px, ${currentPan.y}px)`
      }
      const ctx = canvas.getContext('2d')!
      renderTaskRef.current = pdfPage.render({ canvasContext: ctx as any, viewport: vp } as any)
      await renderTaskRef.current.promise
      redrawMeasures()
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') console.error('PDF render:', e)
    } finally { setPdfRendering(false) }
  }, [measures])

  const selectDrawing = (drawing: DrawingItem) => {
    pdfDocRef.current = null
    setSelectedDrawing(drawing)
    setCurrentPage(1)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setMeasures([])
    setCurrentPts([])
    loadDrawingMeasures(drawing.id)
  }

  useEffect(() => {
    if (selectedDrawing?.file_url) {
      renderPDF(selectedDrawing.file_url, currentPage, zoom, pan)
    }
  }, [selectedDrawing, currentPage, zoom, pan])

  const loadDrawingMeasures = async (drawingId: string) => {
    const { data } = await supabase
      .from('takeoff_items')
      .select('*')
      .eq('drawing_id', drawingId)
    if (data?.length) {
      setMeasures(data.map((d: any) => ({
        id: d.id, type: d.measurement_type as MeasureType,
        label: d.description, points: d.points || [],
        value: d.quantity, unit: d.unit,
        color: d.color || COLORS[0], category: d.category, closed: true
      })))
    }
  }

  // ── Dessin des mesures ──────────────────────────────────────────────────────
  const redrawMeasures = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Mesures existantes
    measures.forEach(m => {
      drawMeasure(ctx, m, m.id === selectedMeasure)
    })

    // Mesure en cours
    if (currentPts.length > 0) {
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.beginPath()
      ctx.moveTo(currentPts[0].x, currentPts[0].y)
      currentPts.forEach(p => ctx.lineTo(p.x, p.y))
      if (hoverPt) ctx.lineTo(hoverPt.x, hoverPt.y)
      ctx.stroke()
      ctx.setLineDash([])
      // Points
      currentPts.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? '#fff' : activeColor
        ctx.strokeStyle = activeColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      })
    }

    // Points de calibration
    calibPoints.forEach((p, i) => {
      ctx.fillStyle = '#F59E0B'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
      ctx.fill(); ctx.stroke()
      if (i === 1) {
        ctx.strokeStyle = '#F59E0B'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(calibPoints[0].x, calibPoints[0].y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    })
  }, [measures, currentPts, hoverPt, calibPoints, selectedMeasure, activeColor])

  useEffect(() => { redrawMeasures() }, [measures, currentPts, hoverPt, calibPoints, selectedMeasure])

  const drawMeasure = (ctx: CanvasRenderingContext2D, m: Measure, selected: boolean) => {
    if (!m.points.length) return
    const alpha = selected ? 1 : 0.85
    ctx.globalAlpha = alpha
    ctx.strokeStyle = m.color
    ctx.lineWidth = selected ? 3 : 2
    ctx.fillStyle = m.color + '30'

    ctx.beginPath()
    ctx.moveTo(m.points[0].x, m.points[0].y)
    m.points.forEach(p => ctx.lineTo(p.x, p.y))
    if (m.type === 'area') { ctx.closePath(); ctx.fill() }
    ctx.stroke()

    // Points
    m.points.forEach((p, i) => {
      if (m.type !== 'count') {
        ctx.fillStyle = m.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Comptage: icône +
    if (m.type === 'count') {
      m.points.forEach(p => {
        ctx.fillStyle = m.color
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('+', p.x, p.y + 1)
      })
    }

    // Label avec valeur
    if (m.points.length >= 2 && m.type !== 'count') {
      const cx = m.points.reduce((s,p) => s + p.x, 0) / m.points.length
      const cy = m.points.reduce((s,p) => s + p.y, 0) / m.points.length
      const valStr = m.type === 'area'
        ? `${m.value.toFixed(2)} m²`
        : `${m.value.toFixed(2)} m`
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = m.color
      ctx.lineWidth = 1
      const tw = ctx.measureText(valStr).width + 10
      ctx.beginPath()
      ctx.roundRect(cx - tw/2, cy - 12, tw, 22, 4)
      ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(valStr, cx, cy + 1)
    }

    // Comptage: total
    if (m.type === 'count' && m.points.length) {
      const p = m.points[m.points.length - 1]
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`×${m.points.length}`, p.x + 14, p.y - 8)
    }

    ctx.globalAlpha = 1
  }

  // ── Coordonnées canvas ──────────────────────────────────────────────────────
  const canvasCoords = (e: React.MouseEvent): Point => {
    const canvas = drawCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const pxToMeters = (px: number) => px / pxPerMeter

  // ── Gestion des clics canvas ────────────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!drawCanvasRef.current) return
    const pt = canvasCoords(e)

    if (tool === 'calibrate') {
      const pts = [...calibPoints, pt]
      setCalibPoints(pts)
      if (pts.length === 2) { setShowCalibModal(true) }
      return
    }

    if (tool === 'select') {
      // Chercher la mesure cliquée
      const found = measures.find(m => isMeasureHit(m, pt))
      setSelectedMeasure(found?.id ?? null)
      return
    }

    if (tool === 'count') {
      // Chaque clic = 1 item compté sur la mesure en cours OU nouvelle
      if (currentPts.length === 0) {
        setCurrentPts([pt])
        addCountPoint(pt, true)
      } else {
        addCountPoint(pt, false)
      }
      return
    }

    if (tool === 'line' || tool === 'polygon' || tool === 'rectangle') {
      const newPts = [...currentPts, pt]
      setCurrentPts(newPts)

      if (tool === 'rectangle' && newPts.length === 2) {
        finalizeMeasure(newPts, 'area')
      }
      // Fermer polygone si double-clic ou clic sur premier point
      if (tool === 'polygon' && newPts.length >= 3) {
        if (dist(pt, newPts[0]) < 12) {
          finalizeMeasure(newPts.slice(0, -1), 'area')
        }
      }
      // Ligne: double-clic pour terminer
    }
  }

  const handleDblClick = (e: React.MouseEvent) => {
    if (tool === 'line' && currentPts.length >= 2) {
      finalizeMeasure(currentPts, 'linear')
    }
    if (tool === 'polygon' && currentPts.length >= 3) {
      finalizeMeasure(currentPts, 'area')
    }
  }

  const addCountPoint = (pt: Point, isFirst: boolean) => {
    if (isFirst) {
      // Crée une nouvelle mesure de comptage
      const id = crypto.randomUUID()
      const m: Measure = {
        id, type: 'count', label: `${activeCategory}`,
        points: [pt], value: 1, unit: 'u', color: activeColor, category: activeCategory
      }
      setMeasures(prev => [...prev, m])
      setSelectedMeasure(id)
    } else {
      // Ajoute au dernier count sélectionné
      setMeasures(prev => prev.map(m =>
        m.id === selectedMeasure && m.type === 'count'
          ? { ...m, points: [...m.points, pt], value: m.points.length + 1 }
          : m
      ))
    }
    saveMeasureToDb(null)
  }

  const finalizeMeasure = (pts: Point[], type: MeasureType) => {
    if (pts.length < 2) { setCurrentPts([]); return }
    let expandedPts = pts
    if (tool === 'rectangle' && pts.length === 2) {
      const [a, b] = pts
      expandedPts = [a, {x:b.x,y:a.y}, b, {x:a.x,y:b.y}]
    }
    const rawPx = type === 'area' ? polyArea(expandedPts) : expandedPts.reduce((s,p,i) => i===0 ? s : s + dist(expandedPts[i-1],p), 0)
    const value = pxToMeters(type === 'area' ? Math.sqrt(rawPx) * Math.sqrt(rawPx) / (pxPerMeter) : rawPx)
    const m: Measure = {
      id: crypto.randomUUID(),
      type, label: `${activeCategory}`,
      points: expandedPts, closed: type === 'area',
      value: parseFloat(value.toFixed(3)),
      unit: type === 'area' ? 'm²' : 'm',
      color: activeColor, category: activeCategory
    }
    setMeasures(prev => [...prev, m])
    setCurrentPts([])
    setSelectedMeasure(m.id)
    saveMeasureToDb(m)
  }

  const saveMeasureToDb = async (m: Measure | null) => {
    if (!projectId || !selectedDrawing) return
    try {
      if (m) {
        await supabase.from('takeoff_items').insert({
          project_id: projectId,
          drawing_id: selectedDrawing.id,
          category: m.category,
          description: m.label,
          measurement_type: m.type,
          quantity: m.value,
          unit: m.unit,
          color: m.color,
          points: m.points
        })
      }
    } catch (e) { console.error(e) }
  }

  const deleteMeasure = async (id: string) => {
    setMeasures(prev => prev.filter(m => m.id !== id))
    setSelectedMeasure(null)
    await supabase.from('takeoff_items').delete().eq('id', id).catch(console.error)
  }

  const isMeasureHit = (m: Measure, pt: Point): boolean => {
    if (m.type === 'count') return m.points.some(p => dist(p, pt) < 14)
    if (m.points.length < 2) return false
    for (let i = 0; i < m.points.length - 1; i++) {
      if (distToSegment(pt, m.points[i], m.points[i+1]) < 8) return true
    }
    return false
  }

  const distToSegment = (p: Point, a: Point, b: Point): number => {
    const dx = b.x - a.x, dy = b.y - a.y
    if (dx === 0 && dy === 0) return dist(p, a)
    const t = Math.max(0, Math.min(1, ((p.x-a.x)*dx + (p.y-a.y)*dy) / (dx*dx + dy*dy)))
    return dist(p, { x: a.x + t*dx, y: a.y + t*dy })
  }

  // ── Zoom / Pan ──────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.2, Math.min(8, z * delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (spaceDown.current || tool === 'pan'))) {
      isPanning.current = true
      lastMouse.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      return
    }
    if (currentPts.length > 0 && drawCanvasRef.current) {
      setHoverPt(canvasCoords(e))
    }
  }

  const handleMouseUp = () => { isPanning.current = false }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') { spaceDown.current = true; e.preventDefault() }
      if (e.code === 'Escape') { setCurrentPts([]); setCalibPoints([]); setTool('select') }
      if (e.code === 'Delete' && selectedMeasure) deleteMeasure(selectedMeasure)
      if (e.code === 'Enter' && currentPts.length >= 2) {
        if (tool === 'line') finalizeMeasure(currentPts, 'linear')
        if (tool === 'polygon') finalizeMeasure(currentPts, 'area')
      }
    }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDown.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [currentPts, selectedMeasure, tool])

  // ── Calibration ─────────────────────────────────────────────────────────────
  const confirmCalibration = () => {
    const meters = parseFloat(calibDist)
    if (isNaN(meters) || meters <= 0 || calibPoints.length < 2) return
    const px = dist(calibPoints[0], calibPoints[1])
    setPxPerMeter(px / meters)
    setCalibrated(true)
    setCalibPoints([])
    setShowCalibModal(false)
    setCalibDist('')
    setTool('select')
  }

  // ── Import plans ─────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!uploadForm.name || !uploadForm.files.length || !projectId) return
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

    const newSetId = crypto.randomUUID()
    const drawings: DrawingItem[] = uploadForm.files.map(file => ({
      id: crypto.randomUUID(), set_id: newSetId,
      name: file.name.replace(/\.[^.]+$/, ''),
      number: file.name.split('.')[0],
      file_url: URL.createObjectURL(file),
      file_type: file.type, status: 'pending'
    }))
    const newSet: DrawingSet = {
      id: newSetId, project_id: projectId, user_id: user?.id,
      name: uploadForm.name, version: uploadForm.version,
      issue_date: uploadForm.date, status: 'draft', drawings
    }

    // Save to Supabase if possible
    try {
      if (user) {
        const { data: savedSet } = await supabase.from('drawing_sets').insert({
          id: newSetId, project_id: projectId, user_id: user.id,
          name: uploadForm.name, version: uploadForm.version,
          issue_date: uploadForm.date, status: 'draft'
        }).select().single()

        if (savedSet) {
          for (const file of uploadForm.files) {
            const path = `${projectId}/${newSetId}/${file.name}`
            const { error: upErr } = await supabase.storage.from('dast-assets').upload(path, file)
            if (!upErr) {
              const { data: { publicUrl } } = supabase.storage.from('dast-assets').getPublicUrl(path)
              const dwg = drawings.find(d => d.name === file.name.replace(/\.[^.]+$/,''))
              if (dwg) {
                dwg.file_url = publicUrl
                await supabase.from('drawings').insert({
                  id: dwg.id, set_id: newSetId,
                  name: dwg.name, number: dwg.number,
                  file_url: publicUrl, file_type: file.type, status: 'pending'
                })
              }
            }
          }
        }
      }
    } catch (e) { console.log('Local only:', e) }

    setDrawingSets(prev => [newSet, ...prev])
    setExpandedSets(prev => ({ ...prev, [newSetId]: true }))
    setSelectedSet(newSet)
    selectDrawing(drawings[0])
    setShowUpload(false)
    setUploadForm({ name: '', version: '1.0', date: new Date().toISOString().slice(0,10), files: [] })
  }

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = measures.map((m, i) => ({
      'No': i + 1,
      'Description': m.label,
      'Catégorie': m.category,
      'Type': m.type === 'area' ? 'Surface' : m.type === 'linear' ? 'Linéaire' : 'Comptage',
      'Quantité': m.value,
      'Unité': m.unit,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 },{ wch: 30 },{ wch: 15 },{ wch: 12 },{ wch: 12 },{ wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Takeoff')
    XLSX.writeFile(wb, `takeoff_${selectedDrawing?.name ?? 'export'}.xlsx`)
  }

  // ── Totaux ───────────────────────────────────────────────────────────────────
  const totals = {
    area: measures.filter(m => m.type === 'area').reduce((s,m) => s + m.value, 0),
    linear: measures.filter(m => m.type === 'linear').reduce((s,m) => s + m.value, 0),
    count: measures.filter(m => m.type === 'count').reduce((s,m) => s + m.value, 0),
  }

  // ── UI ───────────────────────────────────────────────────────────────────────
  const toolBtn = (id: ToolType, icon: React.ReactNode, label: string, shortcut?: string) => (
    <button
      onClick={() => { setTool(id); setCurrentPts([]) }}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
        tool === id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/project/${projectId}`)} className="p-1.5 hover:bg-gray-700 rounded">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-semibold text-sm">Takeoff Avancé</h1>
            <p className="text-xs text-gray-400">{selectedDrawing?.name ?? 'Aucun plan sélectionné'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <span className={`px-2 py-1 rounded ${calibrated ? 'bg-green-800 text-green-300' : 'bg-amber-800 text-amber-300'}`}>
            {calibrated ? `✓ Calibré (1m = ${pxPerMeter.toFixed(0)}px)` : '⚠ Non calibré'}
          </span>
          <span className="bg-gray-700 px-2 py-1 rounded">{Math.round(zoom * 100)}%</span>
          {selectedDrawing && totalPages > 1 && (
            <div className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1">
              <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="disabled:opacity-30">◀</button>
              <span>{currentPage}/{totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="disabled:opacity-30">▶</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportExcel} disabled={!measures.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs disabled:opacity-40">
            <Download size={14} /> Excel
          </button>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs">
            <Upload size={14} /> Importer plans
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar gauche: jeux de plans ── */}
        <div className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
            Jeux de plans
          </div>
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Chargement...</div>
          ) : drawingSets.length === 0 ? (
            <div className="p-4 text-center">
              <FileText className="mx-auto text-gray-600 mb-2" size={28} />
              <p className="text-xs text-gray-500">Aucun plan importé</p>
              <button onClick={() => setShowUpload(true)} className="mt-2 text-blue-400 text-xs hover:underline">
                Importer des plans
              </button>
            </div>
          ) : drawingSets.map(set => (
            <div key={set.id}>
              <button
                onClick={() => setExpandedSets(p => ({ ...p, [set.id]: !p[set.id] }))}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 text-left"
              >
                {expandedSets[set.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{set.name}</p>
                  <p className="text-[10px] text-gray-500">v{set.version} · {set.drawings?.length ?? 0} plan(s)</p>
                </div>
              </button>
              {expandedSets[set.id] && set.drawings?.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedSet(set); selectDrawing(d) }}
                  className={`w-full flex items-start gap-2 px-4 py-2 text-left text-xs transition-colors ${
                    selectedDrawing?.id === d.id ? 'bg-blue-700 text-white' : 'hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  <FileText size={12} className="mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.name}</p>
                    <span className="text-[10px] bg-gray-600 px-1 rounded">En attente</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* ── Barre d'outils verticale ── */}
        <div className="w-14 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {toolBtn('select', <MousePointer size={18}/>, 'Sélect', 'V')}
          {toolBtn('pan', <Move size={18}/>, 'Pan', 'H')}
          <div className="w-8 border-t border-gray-700 my-1"/>
          {toolBtn('calibrate', <Crosshair size={18}/>, 'Étalon', 'C')}
          <div className="w-8 border-t border-gray-700 my-1"/>
          {toolBtn('line', <Ruler size={18}/>, 'Linéaire', 'L')}
          {toolBtn('polygon', <Layers size={18}/>, 'Polygone', 'P')}
          {toolBtn('rectangle', <Square size={18}/>, 'Rectangle', 'R')}
          {toolBtn('count', <Hash size={18}/>, 'Comptage', 'N')}
          <div className="w-8 border-t border-gray-700 my-1"/>
          <button onClick={() => setZoom(z => Math.min(8, z * 1.25))} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <ZoomIn size={18}/>
          </button>
          <button onClick={() => setZoom(z => Math.max(0.2, z * 0.8))} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
            <ZoomOut size={18}/>
          </button>
          <button onClick={() => { setZoom(1); setPan({x:0,y:0}) }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg" title="Réinitialiser vue">
            <RotateCcw size={18}/>
          </button>
        </div>

        {/* ── Canvas zone ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-gray-950 select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: isPanning.current || tool === 'pan' || spaceDown.current ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair' }}
        >
          {!selectedDrawing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
              <FileText size={48} className="mb-3"/>
              <p className="text-lg">Sélectionnez un plan pour commencer</p>
              <button onClick={() => setShowUpload(true)} className="mt-3 text-blue-400 hover:underline text-sm">
                Importer des plans →
              </button>
            </div>
          ) : (
            <>
              {pdfRendering && (
                <div className="absolute top-3 right-3 bg-gray-800 text-xs text-gray-300 px-3 py-1.5 rounded-full z-10">
                  Chargement PDF...
                </div>
              )}
              {/* PDF canvas */}
              <canvas ref={pdfCanvasRef} className="absolute top-0 left-0 shadow-2xl" style={{ transformOrigin: '0 0' }} />
              {/* Drawing overlay */}
              <canvas
                ref={drawCanvasRef}
                className="absolute top-0 left-0"
                style={{ transformOrigin: '0 0' }}
                onClick={handleCanvasClick}
                onDoubleClick={handleDblClick}
              />
              {/* Instructions outil actif */}
              {tool !== 'select' && tool !== 'pan' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/90 text-xs text-gray-300 px-4 py-2 rounded-full backdrop-blur">
                  {tool === 'calibrate' && `Cliquez 2 points de référence (${calibPoints.length}/2)`}
                  {tool === 'line' && (currentPts.length === 0 ? 'Clic: point de départ · Double-clic ou Entrée: terminer' : `${currentPts.length} points · Double-clic ou Entrée pour terminer`)}
                  {tool === 'polygon' && (currentPts.length === 0 ? 'Cliquez les sommets du polygone · Clic sur le 1er point ou Entrée pour fermer' : `${currentPts.length} points · Cliquez le 1er point ou Entrée pour fermer`)}
                  {tool === 'rectangle' && 'Cliquez 2 coins opposés du rectangle'}
                  {tool === 'count' && 'Cliquez chaque élément à compter · Esc pour terminer'}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Panel droit: relevé de quantités ── */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0">
          {/* Options outil */}
          {tool !== 'select' && tool !== 'pan' && (
            <div className="p-3 border-b border-gray-700 space-y-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Catégorie</label>
                <select
                  value={activeCategory}
                  onChange={e => setActiveCategory(e.target.value)}
                  className="w-full mt-1 text-xs bg-gray-700 border-gray-600 rounded px-2 py-1 text-white"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase">Couleur</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setActiveColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${activeColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Totaux */}
          <div className="p-3 border-b border-gray-700 grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-900/40 rounded p-2">
              <p className="text-[10px] text-blue-400">Surface</p>
              <p className="text-sm font-bold text-blue-300">{totals.area.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">m²</p>
            </div>
            <div className="bg-green-900/40 rounded p-2">
              <p className="text-[10px] text-green-400">Linéaire</p>
              <p className="text-sm font-bold text-green-300">{totals.linear.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">m</p>
            </div>
            <div className="bg-purple-900/40 rounded p-2">
              <p className="text-[10px] text-purple-400">Comptage</p>
              <p className="text-sm font-bold text-purple-300">{totals.count}</p>
              <p className="text-[10px] text-gray-500">u</p>
            </div>
          </div>

          {/* Header panel */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-xs font-semibold text-gray-300">Relevé de quantités</span>
            <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">{measures.length}</span>
          </div>

          {/* Liste des mesures */}
          <div className="flex-1 overflow-y-auto">
            {measures.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                <Ruler className="mx-auto mb-2" size={24}/>
                <p className="text-xs">Aucune mesure</p>
                <p className="text-[10px] mt-1">Utilisez les outils pour commencer le relevé</p>
              </div>
            ) : measures.map((m, i) => (
              <div
                key={m.id}
                onClick={() => setSelectedMeasure(m.id === selectedMeasure ? null : m.id)}
                className={`flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-gray-700/50 ${
                  selectedMeasure === m.id ? 'bg-blue-900/40' : 'hover:bg-gray-700/40'
                }`}
              >
                <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ background: m.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{m.label}</p>
                  <p className="text-[10px] text-gray-500">{m.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-white">
                    {m.type === 'count' ? m.points.length : m.value.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">{m.unit}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteMeasure(m.id) }}
                  className="p-0.5 text-gray-600 hover:text-red-400 ml-1"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>

          {/* Footer: bouton estimation */}
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={() => navigate(`/estimating/${projectId}`)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-500 rounded text-sm font-medium"
            >
              <FileText size={14}/> → Estimation
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal import ── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Importer des plans</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nom du jeu de plans *</label>
                <input
                  value={uploadForm.name}
                  onChange={e => setUploadForm(p => ({...p, name: e.target.value}))}
                  placeholder="Ex: Plans Architecture - Émission construction"
                  className="w-full mt-1 bg-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Version</label>
                  <input value={uploadForm.version} onChange={e => setUploadForm(p => ({...p, version: e.target.value}))}
                    className="w-full mt-1 bg-gray-700 rounded px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Date d'émission</label>
                  <input type="date" value={uploadForm.date} onChange={e => setUploadForm(p => ({...p, date: e.target.value}))}
                    className="w-full mt-1 bg-gray-700 rounded px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Fichiers (PDF, DWG, IFC)</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <Upload size={24} className="text-gray-500 mb-2"/>
                  <p className="text-sm text-gray-400">
                    {uploadForm.files.length > 0 ? `${uploadForm.files.length} fichier(s) sélectionné(s)` : 'Glissez ou cliquez pour parcourir'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">PDF, DWG, DXF, IFC, RVT</p>
                  <input type="file" multiple accept=".pdf,.dwg,.dxf,.ifc,.rvt" className="hidden"
                    onChange={e => setUploadForm(p => ({...p, files: Array.from(e.target.files ?? [])}))} />
                </label>
              </div>
              {uploadForm.files.length > 0 && (
                <div className="bg-gray-700/50 rounded p-2 space-y-1 max-h-28 overflow-y-auto">
                  {uploadForm.files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                      <FileText size={12} className="text-blue-400 flex-shrink-0"/>
                      <span className="truncate">{f.name}</span>
                      <span className="text-gray-500 ml-auto flex-shrink-0">{(f.size/1024/1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Annuler</button>
              <button
                onClick={handleImport}
                disabled={!uploadForm.name || !uploadForm.files.length}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium disabled:opacity-40"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal calibration ── */}
      {showCalibModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Calibration</h3>
            <p className="text-sm text-gray-400 mb-4">
              Vous avez tracé une ligne de {dist(calibPoints[0], calibPoints[1]).toFixed(0)} px.<br/>
              Quelle est la distance réelle entre ces 2 points ?
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={calibDist}
                onChange={e => setCalibDist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmCalibration()}
                placeholder="Ex: 5.0"
                autoFocus
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">mètres</span>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCalibModal(false); setCalibPoints([]) }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">Annuler</button>
              <button onClick={confirmCalibration} disabled={!calibDist}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2">
                <Check size={14}/> Calibrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
