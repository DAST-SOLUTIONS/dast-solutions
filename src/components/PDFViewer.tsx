/**
 * DAST Solutions - PDF Viewer avec pdf.js
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  onPageChange?: (page: number, total: number) => void
  onLoad?: (numPages: number) => void
  className?: string
  initialPage?: number
  initialZoom?: number
  showControls?: boolean
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
}

export default function PDFViewer({ url, onPageChange, onLoad, className = '', initialPage = 1, initialZoom = 100, showControls = true, onCanvasReady }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(initialZoom)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    if (!url) return
    setLoading(true)
    setError(null)
    const loadPDF = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
        setCurrentPage(Math.min(initialPage, pdf.numPages))
        onLoad?.(pdf.numPages)
        setLoading(false)
      } catch (err) {
        setError('Impossible de charger le PDF')
        setLoading(false)
      }
    }
    loadPDF()
    return () => { pdfDoc?.destroy() }
  }, [url])

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || rendering) return
    setRendering(true)
    try {
      const page = await pdfDoc.getPage(currentPage)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const viewport = page.getViewport({ scale: zoom / 100, rotation })
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: ctx, viewport }).promise
      onCanvasReady?.(canvas)
      onPageChange?.(currentPage, numPages)
    } finally { setRendering(false) }
  }, [pdfDoc, currentPage, zoom, rotation])

  useEffect(() => { renderPage() }, [renderPage])

  if (loading) return <div className={`flex items-center justify-center bg-gray-800 ${className}`}><Loader2 className="animate-spin text-white" size={40} /></div>
  if (error) return <div className={`flex items-center justify-center bg-gray-800 ${className}`}><AlertCircle className="text-red-400" size={40} /><p className="text-red-400 ml-2">{error}</p></div>

  return (
    <div className={`flex flex-col bg-gray-800 ${className}`}>
      {showControls && (
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage <= 1} className="p-1.5 text-white hover:bg-gray-700 rounded disabled:opacity-50"><ChevronLeft size={20} /></button>
            <span className="text-white text-sm">{currentPage} / {numPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage >= numPages} className="p-1.5 text-white hover:bg-gray-700 rounded disabled:opacity-50"><ChevronRight size={20} /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(25, z-25))} className="p-1.5 text-white hover:bg-gray-700 rounded"><ZoomOut size={18} /></button>
            <span className="text-white text-sm w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(400, z+25))} className="p-1.5 text-white hover:bg-gray-700 rounded"><ZoomIn size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRotation(r => (r+90)%360)} className="p-1.5 text-white hover:bg-gray-700 rounded"><RotateCw size={18} /></button>
            <a href={url} download className="p-1.5 text-white hover:bg-gray-700 rounded"><Download size={18} /></a>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        <canvas ref={canvasRef} className="shadow-xl" />
        {rendering && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}
      </div>
    </div>
  )
}