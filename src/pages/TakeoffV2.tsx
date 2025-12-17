/**
 * DAST Solutions - Takeoff V2 avec PDF.js + CCQ Labor
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTakeoff, CSC_DIVISIONS } from '@/hooks/useTakeoff'
import CCQLaborCalculator from '@/components/CCQLaborCalculator'
import * as pdfjsLib from 'pdfjs-dist'
import * as XLSX from 'xlsx'
import { Upload, FileText, Trash2, ZoomIn, ZoomOut, RotateCcw, Move, Ruler, Square, Hexagon, Hash, MousePointer, Check, X, ChevronLeft, ChevronRight, Download, Send, Loader2, Crosshair, RotateCw, HardHat, Eye, EyeOff, Minus } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

type Tool = 'select' | 'pan' | 'calibrate' | 'line' | 'rectangle' | 'polygon' | 'count'
type Point = { x: number; y: number }

const COLORS = ['#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899']

export default function TakeoffV2() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { plans, activePlan, setActivePlan, uploadPlan, deletePlan, calibration, saveCalibration, measures, addMeasure, deleteMeasure, loading, getStats } = useTakeoff(projectId || '')

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [activePage, setActivePage] = useState(1)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [showMeasures, setShowMeasures] = useState(true)
  const [showLabor, setShowLabor] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([])
  const [calibrationStep, setCalibrationStep] = useState<0 | 1 | 2>(0)
  const [calibrationDistance, setCalibrationDistance] = useState('')
  const [calibrationUnit, setCalibrationUnit] = useState('pi')
  const [measureLabel, setMeasureLabel] = useState('')
  const [measureCategory, setMeasureCategory] = useState('')
  const [measureColor, setMeasureColor] = useState(COLORS[0])
  const [measureUnitPrice, setMeasureUnitPrice] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [laborTotal, setLaborTotal] = useState(0)
  const [project, setProject] = useState<any>(null)

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!projectId) return
    supabase.from('projects').select('*').eq('id', projectId).single().then(({ data }) => setProject(data))
  }, [projectId])

  useEffect(() => {
    if (!activePlan?.file_url) { setPdfDoc(null); setNumPages(0); return }
    setPdfLoading(true)
    pdfjsLib.getDocument(activePlan.file_url).promise.then(pdf => {
      setPdfDoc(pdf); setNumPages(pdf.numPages); setActivePage(1); setPdfLoading(false)
    }).catch(() => setPdfLoading(false))
    return () => { pdfDoc?.destroy() }
  }, [activePlan])

  const renderPDFPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current) return
    const page = await pdfDoc.getPage(activePage)
    const canvas = pdfCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const viewport = page.getViewport({ scale: zoom / 100 * 1.5, rotation })
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
    if (overlayCanvasRef.current) { overlayCanvasRef.current.width = viewport.width; overlayCanvasRef.current.height = viewport.height }
    drawOverlay()
  }, [pdfDoc, activePage, zoom, rotation])

  useEffect(() => { renderPDFPage() }, [renderPDFPage])

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!showMeasures) return
    const scale = zoom / 100 * 1.5

    measures.forEach(m => {
      if (m.page_number !== activePage) return
      ctx.strokeStyle = m.color; ctx.fillStyle = m.color + '40'; ctx.lineWidth = 2
      const pts = m.points.map((p: Point) => ({ x: p.x * scale, y: p.y * scale }))
      if (pts.length < 1) return
      ctx.beginPath()
      if (m.type === 'rectangle' && pts.length >= 2) { ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y); ctx.fill() }
      else if (m.type === 'polygon') { ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach((p: Point) => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.fill() }
      else if (m.type === 'line') { ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach((p: Point) => ctx.lineTo(p.x, p.y)) }
      else if (m.type === 'count') { pts.forEach((p: Point) => { ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill() }); return }
      ctx.stroke()
      if (m.label) { ctx.fillStyle = m.color; ctx.font = `bold ${12 * scale}px sans-serif`; ctx.fillText(m.label, pts[0].x + 5, pts[0].y - 5) }
    })

    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.lineWidth = 3
      calibrationPoints.forEach((p, i) => { const sp = { x: p.x * scale, y: p.y * scale }; ctx.beginPath(); ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), sp.x, sp.y + 4); ctx.fillStyle = '#ef4444' })
      if (calibrationPoints.length === 2) { ctx.beginPath(); ctx.moveTo(calibrationPoints[0].x * scale, calibrationPoints[0].y * scale); ctx.lineTo(calibrationPoints[1].x * scale, calibrationPoints[1].y * scale); ctx.stroke() }
    }

    if (currentPoints.length > 0) {
      ctx.strokeStyle = measureColor; ctx.fillStyle = measureColor + '40'; ctx.lineWidth = 2; ctx.setLineDash([5, 5])
      const pts = currentPoints.map(p => ({ x: p.x * scale, y: p.y * scale }))
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
      if (tool === 'rectangle' && pts.length >= 2) { ctx.rect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y); ctx.fill() }
      else { pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y)) }
      ctx.stroke(); ctx.setLineDash([])
    }
  }, [measures, calibrationPoints, currentPoints, activePage, zoom, showMeasures, measureColor, tool])

  useEffect(() => { drawOverlay() }, [drawOverlay])

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
      if (calibrationPoints.length < 2) { setCalibrationPoints([...calibrationPoints, point]); if (calibrationPoints.length === 1) setCalibrationStep(2) }
      return
    }
    if (tool === 'count') { setCurrentPoints([...currentPoints, point]); return }
    if (tool === 'line') { if (!isDrawing) { setCurrentPoints([point]); setIsDrawing(true) } else { setCurrentPoints([...currentPoints, point]) }; return }
    if (tool === 'rectangle') { if (!isDrawing) { setCurrentPoints([point]); setIsDrawing(true) } else { finishMeasure([currentPoints[0], point]) }; return }
    if (tool === 'polygon') { if (!isDrawing) { setCurrentPoints([point]); setIsDrawing(true) } else { setCurrentPoints([...currentPoints, point]) } }
  }

  const handleDoubleClick = () => { if (currentPoints.length >= 2) finishMeasure(currentPoints) }

  const finishMeasure = async (points: Point[]) => {
    if (!calibration && tool !== 'count') { alert('Calibrez d\'abord l\'échelle'); return }
    await addMeasure(tool as any, points, measureLabel || `Mesure ${measures.length + 1}`, measureCategory, measureColor, measureUnitPrice)
    setCurrentPoints([]); setIsDrawing(false); setMeasureLabel('')
  }

  const cancelDrawing = () => { setCurrentPoints([]); setIsDrawing(false); setCalibrationPoints([]); setCalibrationStep(0) }

  const handleSaveCalibration = async () => {
    if (calibrationPoints.length !== 2 || !calibrationDistance) return
    await saveCalibration(calibrationPoints[0], calibrationPoints[1], parseFloat(calibrationDistance), calibrationUnit)
    setCalibrationPoints([]); setCalibrationStep(0); setCalibrationDistance(''); setTool('select')
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true); await uploadPlan(files[0]); setUploading(false)
  }

  const exportToExcel = () => {
    const data = measures.map(m => ({ Label: m.label, Type: m.type, Catégorie: m.category || '', Valeur: m.value, Unité: m.unit, 'Prix unit.': m.unit_price, Total: m.total_price }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mesures')
    XLSX.writeFile(wb, `Takeoff_${project?.name || 'export'}.xlsx`)
  }

  const createSoumission = () => {
    sessionStorage.setItem('takeoff_measures', JSON.stringify(measures))
    sessionStorage.setItem('takeoff_labor', laborTotal.toString())
    navigate(`/bid-proposal/${projectId}?from=takeoff`)
  }

  const stats = getStats()
  const grandTotal = stats.totalPrice + laborTotal

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/project/${projectId}`)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
          <div><h1 className="text-xl font-bold">{project?.name || 'Projet'}</h1><p className="text-sm text-gray-500">Takeoff - Relevé de quantités</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600"><span className="font-medium">{measures.length}</span> mesure(s) | <span className="font-medium text-teal-600 ml-1">{grandTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
          <button onClick={exportToExcel} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"><Download size={16} />Excel</button>
          <button onClick={createSoumission} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center gap-1"><Send size={16} />Soumission</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Plans */}
        <div className="w-56 bg-gray-50 border-r flex flex-col flex-shrink-0">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm mb-2">Plans</h3>
            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 flex items-center justify-center gap-2">
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Ajouter
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {plans.length === 0 ? (
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${dragOver ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files) }}>
                <FileText className="mx-auto mb-2 text-gray-400" size={32} /><p className="text-xs text-gray-500">Glissez un PDF</p>
              </div>
            ) : (
              <div className="space-y-1">
                {plans.map(plan => (
                  <div key={plan.id} onClick={() => setActivePlan(plan)} className={`p-2 rounded-lg cursor-pointer text-sm flex items-center justify-between group ${activePlan?.id === plan.id ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'}`}>
                    <span className="truncate flex-1">{plan.name || plan.filename}</span>
                    <button onClick={(e) => { e.stopPropagation(); deletePlan(plan.id) }} className="p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - PDF Viewer */}
        <div className="flex-1 flex flex-col bg-gray-800 overflow-hidden">
          <div className="bg-gray-900 px-4 py-2 flex items-center gap-2 flex-wrap">
            {numPages > 1 && (
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2">
                <button onClick={() => setActivePage(Math.max(1, activePage - 1))} disabled={activePage <= 1} className="p-1.5 text-white hover:bg-gray-600 rounded disabled:opacity-50"><ChevronLeft size={16} /></button>
                <span className="text-white text-sm w-16 text-center">{activePage} / {numPages}</span>
                <button onClick={() => setActivePage(Math.min(numPages, activePage + 1))} disabled={activePage >= numPages} className="p-1.5 text-white hover:bg-gray-600 rounded disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            )}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2">
              <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1.5 text-white hover:bg-gray-600 rounded"><ZoomOut size={16} /></button>
              <span className="text-white text-sm w-12 text-center">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(400, zoom + 25))} className="p-1.5 text-white hover:bg-gray-600 rounded"><ZoomIn size={16} /></button>
            </div>
            <button onClick={() => setRotation((rotation + 90) % 360)} className="p-1.5 text-white hover:bg-gray-700 rounded"><RotateCw size={16} /></button>
            <button onClick={() => { setZoom(100); setRotation(0) }} className="p-1.5 text-white hover:bg-gray-700 rounded"><RotateCcw size={16} /></button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button onClick={() => setTool('select')} className={`p-1.5 rounded ${tool === 'select' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><MousePointer size={16} /></button>
              <button onClick={() => setTool('pan')} className={`p-1.5 rounded ${tool === 'pan' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><Move size={16} /></button>
            </div>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <button onClick={() => { setTool('calibrate'); setCalibrationStep(1) }} className={`p-1.5 rounded flex items-center gap-1 ${tool === 'calibrate' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}><Crosshair size={16} /><span className="text-xs">Calibrer</span></button>
            {calibration && <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded">✓ Calibré</span>}
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button onClick={() => setTool('line')} className={`p-1.5 rounded ${tool === 'line' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><Minus size={16} /></button>
              <button onClick={() => setTool('rectangle')} className={`p-1.5 rounded ${tool === 'rectangle' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><Square size={16} /></button>
              <button onClick={() => setTool('polygon')} className={`p-1.5 rounded ${tool === 'polygon' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><Hexagon size={16} /></button>
              <button onClick={() => setTool('count')} className={`p-1.5 rounded ${tool === 'count' ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}><Hash size={16} /></button>
            </div>
            <select value={measureCategory} onChange={(e) => setMeasureCategory(e.target.value)} className="bg-gray-700 text-white text-sm rounded px-2 py-1.5 border-0">
              <option value="">Catégorie...</option>
              {CSC_DIVISIONS.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
            </select>
            <div className="flex gap-1">{COLORS.slice(0, 5).map(c => <button key={c} onClick={() => setMeasureColor(c)} className={`w-5 h-5 rounded ${measureColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />)}</div>
            <button onClick={() => setShowMeasures(!showMeasures)} className={`p-1.5 rounded ${showMeasures ? 'text-teal-400' : 'text-gray-500'} hover:bg-gray-700`}>{showMeasures ? <Eye size={16} /> : <EyeOff size={16} />}</button>
            {(isDrawing || currentPoints.length > 0) && (
              <div className="flex gap-1 ml-2">
                <button onClick={() => finishMeasure(currentPoints)} className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1"><Check size={14} />Terminer</button>
                <button onClick={cancelDrawing} className="px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1"><X size={14} />Annuler</button>
              </div>
            )}
          </div>

          {calibrationStep === 2 && calibrationPoints.length === 2 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 z-50">
              <h3 className="font-bold text-lg mb-4">Distance réelle</h3>
              <div className="flex gap-2 mb-4">
                <input type="number" value={calibrationDistance} onChange={(e) => setCalibrationDistance(e.target.value)} placeholder="Distance" className="flex-1 px-3 py-2 border rounded-lg" autoFocus />
                <select value={calibrationUnit} onChange={(e) => setCalibrationUnit(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="pi">Pieds</option><option value="m">Mètres</option><option value="po">Pouces</option></select>
              </div>
              <div className="flex gap-2"><button onClick={cancelDrawing} className="flex-1 py-2 border rounded-lg">Annuler</button><button onClick={handleSaveCalibration} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Confirmer</button></div>
            </div>
          )}

          <div className="flex-1 overflow-auto flex items-start justify-center p-4 relative">
            {pdfLoading ? <Loader2 className="animate-spin text-white" size={40} /> : pdfDoc ? (
              <div className="relative">
                <canvas ref={pdfCanvasRef} className="shadow-xl" />
                <canvas ref={overlayCanvasRef} className="absolute top-0 left-0" onClick={handleCanvasClick} onDoubleClick={handleDoubleClick} style={{ cursor: tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair' }} />
              </div>
            ) : <div className="text-center"><FileText size={64} className="mx-auto mb-4 text-gray-500" /><p className="text-gray-400">Sélectionnez un plan</p></div>}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l flex flex-col flex-shrink-0">
          <div className="flex border-b">
            <button onClick={() => setShowLabor(false)} className={`flex-1 py-3 text-sm font-medium ${!showLabor ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500'}`}><Ruler size={16} className="inline mr-1" />Mesures</button>
            <button onClick={() => setShowLabor(true)} className={`flex-1 py-3 text-sm font-medium ${showLabor ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500'}`}><HardHat size={16} className="inline mr-1" />Main-d'œuvre</button>
          </div>

          {!showLabor ? (
            <>
              <div className="p-3 border-b">
                <input type="text" value={measureLabel} onChange={(e) => setMeasureLabel(e.target.value)} placeholder="Nom de la mesure..." className="w-full px-3 py-2 border rounded-lg text-sm" />
                <div className="flex gap-2 mt-2">
                  <input type="number" value={measureUnitPrice || ''} onChange={(e) => setMeasureUnitPrice(parseFloat(e.target.value) || 0)} placeholder="Prix/unité" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <span className="text-gray-500 self-center text-sm">$/unité</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {measures.length === 0 ? <div className="text-center py-8 text-gray-500"><Ruler className="mx-auto mb-2" size={32} /><p className="text-sm">Aucune mesure</p></div> : (
                  <div className="space-y-2">
                    {measures.map(m => (
                      <div key={m.id} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{ backgroundColor: m.color }} /><span className="font-medium text-sm">{m.label}</span></div>
                          <button onClick={() => deleteMeasure(m.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{m.type} | {m.value.toFixed(2)} {m.unit}</div>
                        {m.unit_price > 0 && <div className="mt-1 text-sm font-medium text-teal-600">{m.total_price.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t bg-gray-50">
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Total mesures:</span><span className="font-medium">{stats.totalItems}</span></div>
                <div className="flex justify-between text-lg font-bold"><span>Matériaux:</span><span className="text-teal-600">{stats.totalPrice.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-3"><CCQLaborCalculator projectId={projectId || ''} onTotalChange={setLaborTotal} /></div>
          )}

          <div className="p-3 border-t bg-gradient-to-r from-teal-600 to-orange-500 text-white">
            <div className="flex justify-between text-sm mb-1 opacity-90"><span>Matériaux + Main-d'œuvre</span></div>
            <div className="flex justify-between text-xl font-bold"><span>TOTAL:</span><span>{grandTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}