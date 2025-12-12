/**
 * DAST Solutions - OCRExtractor
 * Extraction de texte des plans avec Tesseract.js
 */
import { useState, useCallback } from 'react'
import { createWorker, Worker } from 'tesseract.js'
import { Scan, Loader2, AlertCircle, Check, Trash2, Eye, Search } from 'lucide-react'
import type { OCRResult } from '@/types/takeoff-measure-types'

interface OCRExtractorProps {
  imageUrl: string | null
  onResultsFound: (results: OCRResult[]) => void
  onDimensionDetected?: (value: number, unit: string) => void
}

export function OCRExtractor({ 
  imageUrl, 
  onResultsFound,
  onDimensionDetected 
}: OCRExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<OCRResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)

  // Patterns pour détecter les dimensions
  const dimensionPatterns = [
    // Mètres: 12.5m, 12,5 m, 12.50 M
    /(\d+[.,]?\d*)\s*(m|M|mètres?|meters?)\b/gi,
    // Centimètres: 125cm, 125 CM
    /(\d+[.,]?\d*)\s*(cm|CM|centimètres?)\b/gi,
    // Millimètres: 1250mm, 1250 MM
    /(\d+[.,]?\d*)\s*(mm|MM|millimètres?)\b/gi,
    // Pieds: 12', 12 pi, 12 ft
    /(\d+[.,]?\d*)\s*('|pi|ft|pieds?|feet)\b/gi,
    // Pouces: 12", 12 po, 12 in
    /(\d+[.,]?\d*)\s*("|po|in|pouces?|inches?)\b/gi,
    // Pieds et pouces: 12'-6", 12' 6"
    /(\d+)\s*['′]\s*-?\s*(\d+)\s*["″]?/g,
    // Dimensions sans unité (probablement en mm sur plans arch)
    /\b(\d{3,5})\b/g,
  ]

  // Patterns pour détecter les échelles
  const scalePatterns = [
    /(?:échelle|scale|ech\.?)\s*[:=]?\s*1\s*[:\/]\s*(\d+)/gi,
    /1\s*[:\/]\s*(\d+)/g,
  ]

  // Classifier le type de texte détecté
  const classifyText = (text: string): OCRResult['type'] => {
    // Vérifier si c'est une échelle
    for (const pattern of scalePatterns) {
      if (pattern.test(text)) return 'scale'
      pattern.lastIndex = 0
    }
    
    // Vérifier si c'est une dimension
    for (const pattern of dimensionPatterns) {
      if (pattern.test(text)) return 'dimension'
      pattern.lastIndex = 0
    }
    
    // Vérifier si c'est un nombre seul
    if (/^\d+[.,]?\d*$/.test(text.trim())) return 'number'
    
    return 'text'
  }

  // Extraire les valeurs numériques des dimensions
  const extractDimension = (text: string): { value: number, unit: string } | null => {
    // Pieds et pouces
    const ftInMatch = text.match(/(\d+)\s*['′]\s*-?\s*(\d+)\s*["″]?/)
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1])
      const inches = parseInt(ftInMatch[2])
      return { value: feet * 0.3048 + inches * 0.0254, unit: 'm' }
    }

    // Autres formats
    for (const pattern of dimensionPatterns) {
      const match = pattern.exec(text)
      if (match) {
        let value = parseFloat(match[1].replace(',', '.'))
        let unit = match[2]?.toLowerCase() || 'mm'
        
        // Convertir en mètres
        if (unit.includes('cm')) value /= 100
        else if (unit.includes('mm')) value /= 1000
        else if (unit === "'" || unit.includes('pi') || unit.includes('ft')) value *= 0.3048
        else if (unit === '"' || unit.includes('po') || unit.includes('in')) value *= 0.0254
        
        return { value, unit: 'm' }
      }
      pattern.lastIndex = 0
    }
    
    return null
  }

  // Lancer l'OCR
  const runOCR = useCallback(async () => {
    if (!imageUrl) {
      setError('Aucune image à analyser')
      return
    }

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      // Créer le worker Tesseract
      const newWorker = await createWorker('fra+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })
      setWorker(newWorker)

      // Lancer la reconnaissance
      const { data } = await newWorker.recognize(imageUrl)
      
      // Traiter les résultats
      const ocrResults: OCRResult[] = []
      
      // Traiter chaque mot détecté
      data.words.forEach((word, index) => {
        if (word.confidence > 30 && word.text.trim().length > 0) {
          const type = classifyText(word.text)
          ocrResults.push({
            id: `ocr_${index}_${Date.now()}`,
            text: word.text,
            confidence: word.confidence,
            boundingBox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0
            },
            pageNumber: 1,
            type
          })

          // Si c'est une dimension, notifier
          if (type === 'dimension' && onDimensionDetected) {
            const dim = extractDimension(word.text)
            if (dim) {
              onDimensionDetected(dim.value, dim.unit)
            }
          }
        }
      })

      setResults(ocrResults)
      onResultsFound(ocrResults)

      // Terminer le worker
      await newWorker.terminate()
      setWorker(null)

    } catch (err) {
      console.error('OCR Error:', err)
      setError('Erreur lors de l\'analyse OCR')
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, onResultsFound, onDimensionDetected])

  // Annuler l'OCR en cours
  const cancelOCR = async () => {
    if (worker) {
      await worker.terminate()
      setWorker(null)
    }
    setIsProcessing(false)
    setProgress(0)
  }

  // Filtrer par type
  const dimensions = results.filter(r => r.type === 'dimension')
  const scales = results.filter(r => r.type === 'scale')
  const numbers = results.filter(r => r.type === 'number')

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Scan size={20} />
          Extraction OCR
        </h3>
        {results.length > 0 && (
          <button 
            onClick={() => setResults([])}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 size={14} /> Effacer
          </button>
        )}
      </div>

      {/* Bouton de lancement */}
      {!isProcessing && (
        <button
          onClick={runOCR}
          disabled={!imageUrl}
          className={`
            w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2
            ${imageUrl 
              ? 'bg-teal-600 hover:bg-teal-700 text-white' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Search size={20} />
          Analyser le plan (OCR)
        </button>
      )}

      {/* Progression */}
      {isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Analyse en cours...
            </span>
            <span className="text-sm font-medium text-teal-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={cancelOCR}
            className="w-full py-2 text-sm text-red-600 hover:text-red-700"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Résultats */}
      {results.length > 0 && (
        <div className="mt-4 space-y-4">
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-lg font-bold text-blue-700">{dimensions.length}</div>
              <div className="text-xs text-blue-600">Dimensions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-lg font-bold text-green-700">{scales.length}</div>
              <div className="text-xs text-green-600">Échelles</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-lg font-bold text-gray-700">{numbers.length}</div>
              <div className="text-xs text-gray-600">Nombres</div>
            </div>
          </div>

          {/* Échelles détectées */}
          {scales.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Échelles détectées</h4>
              <div className="space-y-1">
                {scales.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                    <span className="font-mono text-green-800">{s.text}</span>
                    <span className="text-xs text-green-600">{s.confidence.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dimensions détectées */}
          {dimensions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dimensions détectées</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {dimensions.slice(0, 20).map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                    <span className="font-mono text-blue-800">{d.text}</span>
                    <span className="text-xs text-blue-600">{d.confidence.toFixed(0)}%</span>
                  </div>
                ))}
                {dimensions.length > 20 && (
                  <p className="text-xs text-gray-500 text-center py-1">
                    +{dimensions.length - 20} autres dimensions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Succès */}
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Check size={18} />
            <span className="text-sm">{results.length} éléments détectés</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        <p>L'OCR détecte automatiquement:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Dimensions (12.5m, 4'-6", 1250mm)</li>
          <li>Échelles (1:50, 1:100)</li>
          <li>Numéros et textes</li>
        </ul>
      </div>
    </div>
  )
}
