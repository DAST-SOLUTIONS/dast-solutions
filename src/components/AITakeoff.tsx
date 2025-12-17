/**
 * DAST Solutions - AI Takeoff Component
 * Interface pour l'analyse automatique de plans
 */
import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, Cpu, Play, Pause, CheckCircle, AlertCircle,
  Download, RefreshCw, Layers, Eye, EyeOff, ChevronDown, ChevronRight,
  Trash2, Edit2, Plus, Save, Wand2, Target, ZoomIn, ZoomOut
} from 'lucide-react'
import {
  analyzePageWithAI,
  elementsToTakeoffItems,
  exportTakeoffToExcel,
  CSC_CATEGORIES,
  DEFAULT_UNIT_PRICES,
  type AIAnalysisResult,
  type DetectedElement,
  type TakeoffItem
} from '@/services/aiTakeoffService'

interface AITakeoffProps {
  projectId: string
  projectName: string
  onItemsGenerated?: (items: TakeoffItem[]) => void
}

export default function AITakeoff({ projectId, projectName, onItemsGenerated }: AITakeoffProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pages, setPages] = useState<string[]>([]) // Base64 images
  const [currentPage, setCurrentPage] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [results, setResults] = useState<AIAnalysisResult[]>([])
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([])
  const [showElements, setShowElements] = useState(true)
  const [selectedElement, setSelectedElement] = useState<DetectedElement | null>(null)
  const [scale, setScale] = useState({ ratio: 48, unit: 'pi' })
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Charger un PDF
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return

    setPdfFile(file)
    setPages([])
    setResults([])
    setTakeoffItems([])
    setAnalysisProgress(0)

    try {
      // Utiliser pdf.js pour convertir les pages en images
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      const pageImages: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise
        
        pageImages.push(canvas.toDataURL('image/png'))
      }

      setPages(pageImages)
      setCurrentPage(0)
    } catch (err) {
      console.error('Erreur chargement PDF:', err)
      alert('Erreur lors du chargement du PDF')
    }
  }

  // Analyser toutes les pages
  const analyzeAllPages = async () => {
    if (pages.length === 0) return

    setAnalyzing(true)
    setResults([])
    setAnalysisProgress(0)

    const allResults: AIAnalysisResult[] = []

    for (let i = 0; i < pages.length; i++) {
      setCurrentPage(i)
      setAnalysisProgress(((i + 1) / pages.length) * 100)

      const result = await analyzePageWithAI(pages[i], i + 1, {
        detectScale: true,
        extractDimensions: true,
        categorizeElements: true
      })

      allResults.push(result)
      setResults([...allResults])

      // Pause pour permettre le rendu
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Générer les items de takeoff à partir des éléments détectés
    const allElements = allResults.flatMap(r => r.elements)
    const detectedScale = allResults.find(r => r.scale?.detected)?.scale
    if (detectedScale) {
      setScale(detectedScale)
    }

    const items = elementsToTakeoffItems(allElements, detectedScale || scale)
    setTakeoffItems(items)

    if (onItemsGenerated) {
      onItemsGenerated(items)
    }

    setAnalyzing(false)
  }

  // Dessiner les éléments détectés sur le canvas
  const drawElements = useCallback(() => {
    if (!canvasRef.current || !pages[currentPage]) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      if (showElements && results[currentPage]) {
        const elements = results[currentPage].elements

        elements.forEach(element => {
          const { x, y, width, height } = element.boundingBox
          
          // Couleurs par type
          const colors: Record<string, string> = {
            wall: '#3B82F6',
            door: '#10B981',
            window: '#F59E0B',
            room: '#8B5CF6',
            text: '#6B7280',
            dimension: '#EF4444'
          }

          ctx.strokeStyle = colors[element.type] || '#9CA3AF'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          // Label
          ctx.fillStyle = colors[element.type] || '#9CA3AF'
          ctx.font = '12px Inter, sans-serif'
          ctx.fillText(element.label, x, y - 5)

          // Highlight sélection
          if (selectedElement?.id === element.id) {
            ctx.strokeStyle = '#EF4444'
            ctx.lineWidth = 3
            ctx.strokeRect(x - 2, y - 2, width + 4, height + 4)
          }
        })
      }
    }

    img.src = pages[currentPage]
  }, [pages, currentPage, results, showElements, selectedElement])

  // Redessiner quand les données changent
  useState(() => {
    drawElements()
  })

  // Modifier un item
  const updateItem = (id: string, updates: Partial<TakeoffItem>) => {
    setTakeoffItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates }
        updated.total = updated.quantity * updated.unitPrice
        updated.source = 'manual'
        return updated
      }
      return item
    }))
  }

  // Ajouter un item manuel
  const addManualItem = () => {
    const newItem: TakeoffItem = {
      id: `manual-${Date.now()}`,
      category: 'Structure',
      description: 'Nouvel élément',
      quantity: 1,
      unit: 'unité',
      unitPrice: 0,
      total: 0,
      source: 'manual'
    }
    setTakeoffItems(prev => [...prev, newItem])
    setEditingItem(newItem.id)
  }

  // Supprimer un item
  const removeItem = (id: string) => {
    setTakeoffItems(prev => prev.filter(item => item.id !== id))
  }

  // Calculer le total
  const grandTotal = takeoffItems.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wand2 className="text-teal-500" />
            AI Takeoff - Analyse automatique
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Importez un plan PDF pour extraire automatiquement les quantités
          </p>
        </div>
        <div className="flex items-center gap-2">
          {takeoffItems.length > 0 && (
            <button
              onClick={() => exportTakeoffToExcel(takeoffItems, projectName)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={18} /> Exporter Excel
            </button>
          )}
        </div>
      </div>

      {/* Upload zone */}
      {pages.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Importer un plan PDF
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Glissez-déposez ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-gray-400">
            Formats supportés: PDF (plans architecturaux, dessins techniques)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Visualisation et analyse */}
      {pages.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {/* Plan viewer */}
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {currentPage + 1} / {pages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  <ChevronDown size={18} className="rotate-90" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                  disabled={currentPage === pages.length - 1}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  <ChevronDown size={18} className="-rotate-90" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowElements(!showElements)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                    showElements 
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {showElements ? <Eye size={16} /> : <EyeOff size={16} />}
                  Détections
                </button>

                {!analyzing && (
                  <button
                    onClick={analyzeAllPages}
                    className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    <Cpu size={16} /> Analyser
                  </button>
                )}

                <button
                  onClick={() => { setPages([]); setPdfFile(null); setResults([]); setTakeoffItems([]) }}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  title="Nouveau fichier"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
              {analyzing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Analyse en cours...</p>
                    <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{Math.round(analysisProgress)}%</p>
                  </div>
                </div>
              )}

              <canvas
                ref={canvasRef}
                className="max-w-full"
                onClick={(e) => {
                  if (!results[currentPage]) return
                  const rect = canvasRef.current!.getBoundingClientRect()
                  const x = (e.clientX - rect.left) * (canvasRef.current!.width / rect.width)
                  const y = (e.clientY - rect.top) * (canvasRef.current!.height / rect.height)
                  
                  const clicked = results[currentPage].elements.find(el => 
                    x >= el.boundingBox.x && 
                    x <= el.boundingBox.x + el.boundingBox.width &&
                    y >= el.boundingBox.y && 
                    y <= el.boundingBox.y + el.boundingBox.height
                  )
                  setSelectedElement(clicked || null)
                }}
              />

              {/* Afficher l'image si pas de canvas */}
              {pages[currentPage] && !results[currentPage] && (
                <img src={pages[currentPage]} alt={`Page ${currentPage + 1}`} className="max-w-full" />
              )}
            </div>

            {/* Légende */}
            {results[currentPage] && (
              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Murs</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Portes</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> Fenêtres</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded" /> Pièces</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel de résultats */}
          <div className="space-y-4">
            {/* Résumé de l'analyse */}
            {results.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Target size={18} className="text-teal-500" />
                  Résumé de l'analyse
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Murs', value: results.reduce((s, r) => s + r.summary.totalWalls, 0), color: 'blue' },
                    { label: 'Portes', value: results.reduce((s, r) => s + r.summary.totalDoors, 0), color: 'green' },
                    { label: 'Fenêtres', value: results.reduce((s, r) => s + r.summary.totalWindows, 0), color: 'yellow' },
                    { label: 'Pièces', value: results.reduce((s, r) => s + r.summary.totalRooms, 0), color: 'purple' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Échelle détectée */}
                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-teal-700 dark:text-teal-300">Échelle:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={scale.ratio}
                        onChange={(e) => setScale({ ...scale, ratio: parseInt(e.target.value) || 48 })}
                        className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">: 1 {scale.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Élément sélectionné */}
            {selectedElement && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Élément sélectionné
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Type:</span> {selectedElement.type}</p>
                  <p><span className="text-gray-500">Label:</span> {selectedElement.label}</p>
                  <p><span className="text-gray-500">Confiance:</span> {(selectedElement.confidence * 100).toFixed(0)}%</p>
                  {selectedElement.measurements && (
                    <>
                      {selectedElement.measurements.length && (
                        <p><span className="text-gray-500">Longueur:</span> {selectedElement.measurements.length} {selectedElement.measurements.unit}</p>
                      )}
                      {selectedElement.measurements.area && (
                        <p><span className="text-gray-500">Superficie:</span> {selectedElement.measurements.area} {selectedElement.measurements.unit}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau des items de takeoff */}
      {takeoffItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-teal-500" />
              Items de Takeoff générés
            </h3>
            <button
              onClick={addManualItem}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-lg hover:bg-teal-200"
            >
              <Plus size={16} /> Ajouter item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3">Unité</th>
                  <th className="px-4 py-3 text-right">Prix unit.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Source</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {takeoffItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-3">
                      {editingItem === item.id ? (
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, { category: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600"
                        >
                          {CSC_CATEGORIES.map(cat => (
                            <option key={cat.code} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm">{item.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingItem === item.id ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border rounded text-right dark:bg-gray-800 dark:border-gray-600"
                        />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingItem === item.id ? (
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                          className="w-16 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border rounded text-right dark:bg-gray-800 dark:border-gray-600"
                        />
                      ) : (
                        <span>{item.unitPrice.toFixed(2)} $</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {item.total.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        item.source === 'ai' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {item.source === 'ai' ? <Cpu size={12} /> : <Edit2 size={12} />}
                        {item.source === 'ai' ? 'IA' : 'Manuel'}
                      </span>
                      {item.confidence && (
                        <p className="text-xs text-gray-400 mt-1">{(item.confidence * 100).toFixed(0)}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {editingItem === item.id ? (
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingItem(item.id)}
                            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900 font-bold">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right">TOTAL:</td>
                  <td className="px-4 py-3 text-right text-teal-600 dark:text-teal-400">
                    {grandTotal.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
