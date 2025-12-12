/**
 * DAST Solutions - TakeoffViewer
 * Composant principal du module Takeoff avec viewer, outils et OCR
 */
import { useState, useCallback, useEffect } from 'react'
import { PDFViewer } from './PDFViewer'
import { PlanUploader } from './PlanUploader'
import { MeasureToolbar } from './MeasureToolbar'
import { MeasurementList } from './MeasurementList'
import { OCRExtractor } from './OCRExtractor'
import { FileText, Layers, Brain, List, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Measurement, MeasureToolType, OCRResult } from '@/types/takeoff-measure-types'
import { generateMeasurementId, TAKEOFF_CATEGORIES } from '@/types/takeoff-measure-types'

interface TakeoffViewerProps {
  projectId: string
  onSaveMeasurements?: (measurements: Measurement[]) => void
  onExportToEstimation?: (measurements: Measurement[]) => void
  initialMeasurements?: Measurement[]
}

type SidebarTab = 'tools' | 'measurements' | 'ocr'

export function TakeoffViewer({
  projectId,
  onSaveMeasurements,
  onExportToEstimation,
  initialMeasurements = []
}: TakeoffViewerProps) {
  // État du fichier
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  
  // État des outils
  const [activeTool, setActiveTool] = useState<MeasureToolType>('select')
  const [currentCategory, setCurrentCategory] = useState('murs_ext')
  const [currentColor, setCurrentColor] = useState(TAKEOFF_CATEGORIES[3].color)
  const [scale, setScale] = useState(0.02) // 1:50 par défaut
  
  // État des mesures
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements)
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null)
  
  // État OCR
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([])
  
  // UI
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('tools')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Créer l'URL du fichier quand il change
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool('select'); break
        case 'l': setActiveTool('line'); break
        case 'r': setActiveTool('rectangle'); break
        case 'p': setActiveTool('area'); break
        case 'c': setActiveTool('count'); break
        case 'escape': setActiveTool('select'); break
        case 'delete':
        case 'backspace':
          if (selectedMeasurement) {
            handleDeleteMeasurement(selectedMeasurement)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMeasurement])

  // Auto-save
  useEffect(() => {
    if (onSaveMeasurements && measurements.length > 0) {
      const timer = setTimeout(() => {
        onSaveMeasurements(measurements)
      }, 2000) // Debounce 2 secondes
      return () => clearTimeout(timer)
    }
  }, [measurements, onSaveMeasurements])

  // Gestion du fichier
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setMeasurements([]) // Reset mesures pour nouveau fichier
    setOcrResults([])
  }

  // Ajouter une mesure
  const handleAddMeasurement = useCallback((measurement: Omit<Measurement, 'id' | 'createdAt'>) => {
    const newMeasurement: Measurement = {
      ...measurement,
      id: generateMeasurementId(),
      createdAt: new Date().toISOString()
    }
    setMeasurements(prev => [...prev, newMeasurement])
  }, [])

  // Supprimer une mesure
  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id))
    if (selectedMeasurement === id) setSelectedMeasurement(null)
  }

  // Mettre à jour une mesure
  const handleUpdateMeasurement = (id: string, updates: Partial<Measurement>) => {
    setMeasurements(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ))
  }

  // Dupliquer une mesure
  const handleDuplicateMeasurement = (measurement: Measurement) => {
    const duplicate: Measurement = {
      ...measurement,
      id: generateMeasurementId(),
      label: `${measurement.label} (copie)`,
      createdAt: new Date().toISOString()
    }
    setMeasurements(prev => [...prev, duplicate])
  }

  // Gérer les résultats OCR
  const handleOCRResults = (results: OCRResult[]) => {
    setOcrResults(results)
    // Si une échelle est détectée, proposer de l'utiliser
    const scaleResult = results.find(r => r.type === 'scale')
    if (scaleResult) {
      const match = scaleResult.text.match(/1\s*[:\/]\s*(\d+)/)
      if (match) {
        const detectedScale = 1 / parseInt(match[1])
        // On pourrait afficher une notification ici
        console.log(`Échelle détectée: 1:${match[1]}`)
      }
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Catégorie', 'Label', 'Type', 'Valeur', 'Unité', 'Page', 'Notes']
    const rows = measurements.map(m => [
      TAKEOFF_CATEGORIES.find(c => c.id === m.category)?.name || m.category,
      m.label,
      m.type,
      m.value.toFixed(2),
      m.unit,
      m.pageNumber.toString(),
      m.notes || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `takeoff_${projectId}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export vers Estimation
  const handleExportToEstimation = () => {
    if (onExportToEstimation) {
      onExportToEstimation(measurements)
    }
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-gray-100 rounded-xl overflow-hidden">
      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {!file ? (
          /* Upload zone */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-xl w-full">
              <PlanUploader onFileSelect={handleFileSelect} />
              <p className="text-center text-sm text-gray-500 mt-4">
                Formats supportés: PDF, PNG, JPG, TIFF
              </p>
            </div>
          </div>
        ) : (
          /* PDF Viewer */
          <div className="flex-1">
            <PDFViewer
              file={file}
              activeTool={activeTool}
              scale={scale}
              measurements={measurements}
              onMeasurementAdd={handleAddMeasurement}
              onMeasurementSelect={setSelectedMeasurement}
              selectedMeasurement={selectedMeasurement}
              currentCategory={currentCategory}
              currentColor={currentColor}
            />
          </div>
        )}

        {/* Barre inférieure avec info fichier */}
        {file && (
          <div className="px-4 py-2 bg-white border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-gray-600">
                <FileText size={16} />
                {file.name}
              </span>
              <span className="text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {measurements.length} mesure{measurements.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => { setFile(null); setFileUrl(null); }}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Changer de plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`
        bg-white border-l transition-all duration-300 flex flex-col
        ${sidebarCollapsed ? 'w-12' : 'w-80'}
      `}>
        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white border rounded-l-lg p-1 shadow z-10"
        >
          {sidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {!sidebarCollapsed && (
          <>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setSidebarTab('tools')}
                className={`flex-1 px-3 py-3 text-sm font-medium transition flex items-center justify-center gap-2
                  ${sidebarTab === 'tools' ? 'text-teal-700 border-b-2 border-teal-500 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <Layers size={16} />
                Outils
              </button>
              <button
                onClick={() => setSidebarTab('measurements')}
                className={`flex-1 px-3 py-3 text-sm font-medium transition flex items-center justify-center gap-2
                  ${sidebarTab === 'measurements' ? 'text-teal-700 border-b-2 border-teal-500 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <List size={16} />
                Liste
                {measurements.length > 0 && (
                  <span className="bg-teal-100 text-teal-700 text-xs px-1.5 py-0.5 rounded-full">
                    {measurements.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('ocr')}
                className={`flex-1 px-3 py-3 text-sm font-medium transition flex items-center justify-center gap-2
                  ${sidebarTab === 'ocr' ? 'text-teal-700 border-b-2 border-teal-500 bg-teal-50' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <Brain size={16} />
                OCR
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === 'tools' && (
                <MeasureToolbar
                  activeTool={activeTool}
                  onToolChange={setActiveTool}
                  currentCategory={currentCategory}
                  onCategoryChange={setCurrentCategory}
                  currentColor={currentColor}
                  onColorChange={setCurrentColor}
                  scale={scale}
                  onScaleChange={setScale}
                />
              )}

              {sidebarTab === 'measurements' && (
                <MeasurementList
                  measurements={measurements}
                  onDelete={handleDeleteMeasurement}
                  onUpdate={handleUpdateMeasurement}
                  onDuplicate={handleDuplicateMeasurement}
                  onSelect={setSelectedMeasurement}
                  selectedId={selectedMeasurement}
                  onExportCSV={handleExportCSV}
                  onExportToEstimation={handleExportToEstimation}
                />
              )}

              {sidebarTab === 'ocr' && (
                <OCRExtractor
                  imageUrl={fileUrl}
                  onResultsFound={handleOCRResults}
                  onDimensionDetected={(value, unit) => {
                    console.log(`Dimension détectée: ${value} ${unit}`)
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
