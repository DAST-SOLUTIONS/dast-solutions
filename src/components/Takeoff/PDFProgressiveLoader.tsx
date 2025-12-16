/**
 * DAST Solutions - PDFProgressiveLoader
 * Chargement progressif des PDF volumineux (40MB+)
 * Option C - Optimisation gros fichiers
 * 
 * Fonctionnalités:
 * - Chargement page par page (lazy loading)
 * - Cache des pages rendues
 * - Rendu en basse résolution puis haute résolution
 * - Support fichiers jusqu'à 100MB+
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Download, HardDrive,
  Clock, Layers, RefreshCw
} from 'lucide-react'

interface PageCache {
  pageNumber: number
  lowRes?: ImageBitmap | HTMLCanvasElement
  highRes?: ImageBitmap | HTMLCanvasElement
  lastAccessed: number
}

interface PDFProgressiveLoaderProps {
  file: File
  onPageRendered?: (pageNumber: number, canvas: HTMLCanvasElement) => void
  onError?: (error: string) => void
  maxCacheSize?: number // Nombre max de pages en cache
  initialQuality?: 'low' | 'high'
}

interface LoadingState {
  isLoading: boolean
  currentPage: number
  totalPages: number
  progress: number
  stage: 'init' | 'parsing' | 'rendering' | 'complete'
  memoryUsage?: number
}

// Taille max recommandée avant avertissement
const WARNING_SIZE_MB = 20
const MAX_CACHE_PAGES = 10

export function PDFProgressiveLoader({
  file,
  onPageRendered,
  onError,
  maxCacheSize = MAX_CACHE_PAGES,
  initialQuality = 'low'
}: PDFProgressiveLoaderProps) {
  // État du PDF
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // État de chargement
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    currentPage: 0,
    totalPages: 0,
    progress: 0,
    stage: 'init'
  })
  
  // Affichage
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [quality, setQuality] = useState<'low' | 'high'>(initialQuality)
  const [showWarning, setShowWarning] = useState(false)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageCacheRef = useRef<Map<number, PageCache>>(new Map())
  const renderTaskRef = useRef<any>(null)

  // Taille du fichier
  const fileSizeMB = useMemo(() => file.size / (1024 * 1024), [file])
  const isLargeFile = fileSizeMB > WARNING_SIZE_MB

  // Statistiques du cache
  const cacheStats = useMemo(() => {
    const cache = pageCacheRef.current
    return {
      cachedPages: cache.size,
      maxPages: maxCacheSize
    }
  }, [maxCacheSize, currentPage]) // Recalculer quand page change

  // Charger le PDF
  const loadPDF = useCallback(async () => {
    setLoading({
      isLoading: true,
      currentPage: 0,
      totalPages: 0,
      progress: 0,
      stage: 'init'
    })

    try {
      // Import dynamique de PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      setLoading(prev => ({ ...prev, stage: 'parsing', progress: 10 }))

      // Charger le document
      const arrayBuffer = await file.arrayBuffer()
      
      setLoading(prev => ({ ...prev, progress: 30 }))

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        // Options pour gros fichiers
        disableAutoFetch: isLargeFile,
        disableStream: false,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@latest/cmaps/',
        cMapPacked: true
      })

      // Progress callback
      loadingTask.onProgress = (data: { loaded: number; total: number }) => {
        if (data.total > 0) {
          const progress = 30 + (data.loaded / data.total) * 40
          setLoading(prev => ({ ...prev, progress }))
        }
      }

      const pdf = await loadingTask.promise

      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      
      setLoading(prev => ({
        ...prev,
        totalPages: pdf.numPages,
        progress: 70,
        stage: 'rendering'
      }))

      // Afficher avertissement si gros fichier
      if (isLargeFile) {
        setShowWarning(true)
      }

    } catch (err) {
      console.error('Erreur chargement PDF:', err)
      onError?.(`Erreur de chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
      setLoading(prev => ({ ...prev, isLoading: false }))
    }
  }, [file, isLargeFile, onError])

  // Rendre une page
  const renderPage = useCallback(async (pageNum: number, forceHighRes = false) => {
    if (!pdfDoc || !canvasRef.current) return

    // Vérifier le cache
    const cached = pageCacheRef.current.get(pageNum)
    if (cached && (quality === 'low' || cached.highRes)) {
      const source = quality === 'high' && cached.highRes ? cached.highRes : cached.lowRes
      if (source) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx && source instanceof HTMLCanvasElement) {
          canvasRef.current.width = source.width
          canvasRef.current.height = source.height
          ctx.drawImage(source, 0, 0)
          cached.lastAccessed = Date.now()
          setLoading(prev => ({ ...prev, isLoading: false, stage: 'complete', progress: 100 }))
          return
        }
      }
    }

    // Annuler le rendu précédent
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
    }

    try {
      setLoading(prev => ({ ...prev, isLoading: true, currentPage: pageNum }))

      const page = await pdfDoc.getPage(pageNum)
      
      // Calculer l'échelle
      const useHighRes = forceHighRes || quality === 'high'
      const baseScale = (zoom / 100) * (window.devicePixelRatio || 1)
      const scale = useHighRes ? baseScale : baseScale * 0.5 // Basse résolution = 50%
      
      const viewport = page.getViewport({ scale, rotation })

      // Configurer le canvas
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Rendu
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
        // Options de performance
        enableWebGL: true,
        renderInteractiveForms: false
      })
      
      renderTaskRef.current = renderTask

      await renderTask.promise

      // Mettre en cache
      const cacheCanvas = document.createElement('canvas')
      cacheCanvas.width = canvas.width
      cacheCanvas.height = canvas.height
      const cacheCtx = cacheCanvas.getContext('2d')
      cacheCtx?.drawImage(canvas, 0, 0)

      const cacheEntry = pageCacheRef.current.get(pageNum) || {
        pageNumber: pageNum,
        lastAccessed: Date.now()
      }

      if (useHighRes) {
        cacheEntry.highRes = cacheCanvas
      } else {
        cacheEntry.lowRes = cacheCanvas
      }
      cacheEntry.lastAccessed = Date.now()

      pageCacheRef.current.set(pageNum, cacheEntry)

      // Nettoyer le cache si nécessaire
      if (pageCacheRef.current.size > maxCacheSize) {
        const entries = Array.from(pageCacheRef.current.entries())
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        const toRemove = entries.slice(0, entries.length - maxCacheSize)
        toRemove.forEach(([key]) => pageCacheRef.current.delete(key))
      }

      // Callback
      onPageRendered?.(pageNum, canvas)

      setLoading(prev => ({ ...prev, isLoading: false, stage: 'complete', progress: 100 }))

      // Si en basse résolution, planifier le rendu haute résolution
      if (!useHighRes && quality === 'high') {
        setTimeout(() => renderPage(pageNum, true), 100)
      }

    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Erreur rendu page:', err)
        onError?.(`Erreur de rendu page ${pageNum}`)
      }
      setLoading(prev => ({ ...prev, isLoading: false }))
    }
  }, [pdfDoc, zoom, rotation, quality, maxCacheSize, onPageRendered, onError])

  // Charger au montage
  useEffect(() => {
    loadPDF()
  }, [loadPDF])

  // Rendre la page courante
  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage)
    }
  }, [pdfDoc, currentPage, zoom, rotation, quality, renderPage])

  // Navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Pré-charger les pages adjacentes
  useEffect(() => {
    if (!pdfDoc || !currentPage) return

    const preloadPages = [currentPage - 1, currentPage + 1].filter(
      p => p >= 1 && p <= totalPages && !pageCacheRef.current.has(p)
    )

    // Pré-charger en arrière-plan avec délai
    preloadPages.forEach((pageNum, i) => {
      setTimeout(() => {
        if (pageCacheRef.current.size < maxCacheSize) {
          // Créer un canvas temporaire pour le pré-chargement
          const tempCanvas = document.createElement('canvas')
          pdfDoc.getPage(pageNum).then((page: any) => {
            const viewport = page.getViewport({ scale: 0.5 })
            tempCanvas.width = viewport.width
            tempCanvas.height = viewport.height
            const ctx = tempCanvas.getContext('2d')
            if (ctx) {
              page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                pageCacheRef.current.set(pageNum, {
                  pageNumber: pageNum,
                  lowRes: tempCanvas,
                  lastAccessed: Date.now()
                })
              })
            }
          })
        }
      }, (i + 1) * 500)
    })
  }, [pdfDoc, currentPage, totalPages, maxCacheSize])

  // Vider le cache
  const clearCache = useCallback(() => {
    pageCacheRef.current.clear()
    if (currentPage) {
      renderPage(currentPage)
    }
  }, [currentPage, renderPage])

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Toolbar */}
      <div className="bg-gray-900 px-4 py-2 flex items-center gap-3 border-b border-gray-700">
        {/* Navigation */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || loading.isLoading}
          className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50 text-gray-300"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            min={1}
            max={totalPages}
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center text-sm"
          />
          <span className="text-gray-400 text-sm">/ {totalPages}</span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || loading.isLoading}
          className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-50 text-gray-300"
        >
          <ChevronRight size={18} />
        </button>

        <div className="h-6 w-px bg-gray-600" />

        {/* Zoom */}
        <button
          onClick={() => setZoom(z => Math.max(25, z - 25))}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-sm text-gray-300 min-w-[50px] text-center">{zoom}%</span>
        <button
          onClick={() => setZoom(z => Math.min(400, z + 25))}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
        >
          <RotateCw size={18} />
        </button>

        <div className="h-6 w-px bg-gray-600" />

        {/* Qualité */}
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value as any)}
          className="bg-gray-700 text-white px-2 py-1 rounded text-sm border-0"
        >
          <option value="low">Rapide (basse rés.)</option>
          <option value="high">Haute qualité</option>
        </select>

        <div className="flex-1" />

        {/* Infos fichier */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <HardDrive size={14} />
            {fileSizeMB.toFixed(1)} MB
          </span>
          <span className="flex items-center gap-1">
            <Layers size={14} />
            Cache: {cacheStats.cachedPages}/{cacheStats.maxPages}
          </span>
          <button
            onClick={clearCache}
            className="p-1 hover:bg-gray-700 rounded"
            title="Vider le cache"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Avertissement gros fichier */}
      {showWarning && (
        <div className="bg-amber-900/50 border-b border-amber-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-200 text-sm">
            <AlertCircle size={16} />
            <span>
              Fichier volumineux ({fileSizeMB.toFixed(1)} MB) - Le chargement progressif est activé pour optimiser les performances
            </span>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-amber-300 hover:text-amber-100 text-sm"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Zone de rendu */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-700 relative">
        {/* Loading overlay */}
        {loading.isLoading && loading.stage !== 'complete' && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
            <div className="bg-gray-800 rounded-lg p-6 text-center min-w-[300px]">
              <Loader2 size={40} className="animate-spin text-teal-500 mx-auto mb-4" />
              <div className="text-white mb-2">
                {loading.stage === 'init' && 'Initialisation...'}
                {loading.stage === 'parsing' && 'Analyse du PDF...'}
                {loading.stage === 'rendering' && `Rendu page ${loading.currentPage}/${loading.totalPages}`}
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${loading.progress}%` }}
                />
              </div>
              <div className="text-gray-400 text-sm mt-2">
                {loading.progress.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex items-center justify-center min-h-full p-4">
          <canvas 
            ref={canvasRef}
            className="shadow-2xl bg-white"
            style={{
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>

        {/* Mini loading pour changement de page */}
        {loading.isLoading && loading.stage === 'complete' && (
          <div className="absolute top-4 right-4 bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 text-white text-sm">
            <Loader2 size={16} className="animate-spin" />
            Chargement...
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-gray-900 px-4 py-1 flex items-center gap-4 text-xs text-gray-400 border-t border-gray-700">
        <span>{file.name}</span>
        <span>•</span>
        <span>Page {currentPage} sur {totalPages}</span>
        <span>•</span>
        <span>Rotation: {rotation}°</span>
        <div className="flex-1" />
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Chargement progressif {isLargeFile ? 'activé' : 'standard'}
        </span>
      </div>
    </div>
  )
}

// Hook pour utiliser le loader progressif
export function usePDFProgressiveLoader(file: File | null) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    if (!file) {
      setIsReady(false)
      setPageCount(0)
      return
    }

    const checkFile = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
        
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        
        setPageCount(pdf.numPages)
        setIsReady(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setIsReady(false)
      }
    }

    checkFile()
  }, [file])

  return { isReady, error, pageCount }
}

export default PDFProgressiveLoader
