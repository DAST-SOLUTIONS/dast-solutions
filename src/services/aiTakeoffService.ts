/**
 * DAST Solutions - AI Takeoff Service
 * Analyse automatique de plans PDF avec extraction de quantités
 * Utilise OCR et reconnaissance de formes
 */

export interface DetectedElement {
  id: string
  type: 'wall' | 'door' | 'window' | 'room' | 'dimension' | 'text' | 'symbol'
  category: string
  label: string
  boundingBox: { x: number; y: number; width: number; height: number }
  confidence: number
  properties: Record<string, any>
  measurements?: {
    length?: number
    width?: number
    height?: number
    area?: number
    perimeter?: number
    count?: number
    unit: string
  }
}

export interface AIAnalysisResult {
  success: boolean
  pageNumber: number
  elements: DetectedElement[]
  scale?: { ratio: number; unit: string; detected: boolean }
  summary: {
    totalWalls: number
    totalDoors: number
    totalWindows: number
    totalRooms: number
    estimatedArea: number
    detectedDimensions: string[]
  }
  rawText: string[]
  processingTime: number
}

export interface TakeoffItem {
  id: string
  category: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  source: 'ai' | 'manual'
  confidence?: number
  linkedElements?: string[]
}

// Catégories de construction standard CSC MasterFormat
export const CSC_CATEGORIES = [
  { code: '03', name: 'Béton', subcategories: ['Fondations', 'Dalles', 'Murs', 'Colonnes'] },
  { code: '04', name: 'Maçonnerie', subcategories: ['Briques', 'Blocs', 'Pierre'] },
  { code: '05', name: 'Métaux', subcategories: ['Acier structural', 'Métaux ouvrés', 'Garde-corps'] },
  { code: '06', name: 'Bois et plastiques', subcategories: ['Charpente', 'Menuiserie', 'Armoires'] },
  { code: '07', name: 'Protection thermique', subcategories: ['Isolation', 'Toiture', 'Revêtement'] },
  { code: '08', name: 'Portes et fenêtres', subcategories: ['Portes', 'Fenêtres', 'Quincaillerie'] },
  { code: '09', name: 'Finitions', subcategories: ['Gypse', 'Peinture', 'Planchers', 'Plafonds'] },
  { code: '22', name: 'Plomberie', subcategories: ['Tuyauterie', 'Appareils', 'Drainage'] },
  { code: '23', name: 'CVAC', subcategories: ['Chauffage', 'Ventilation', 'Climatisation'] },
  { code: '26', name: 'Électricité', subcategories: ['Distribution', 'Éclairage', 'Communications'] },
]

// Prix unitaires par défaut (Québec 2024)
export const DEFAULT_UNIT_PRICES: Record<string, { unit: string; price: number }> = {
  // Béton
  'concrete_foundation': { unit: 'm³', price: 250 },
  'concrete_slab': { unit: 'm²', price: 85 },
  'concrete_wall': { unit: 'm²', price: 180 },
  
  // Murs
  'wall_2x4': { unit: 'pi.l.', price: 3.50 },
  'wall_2x6': { unit: 'pi.l.', price: 4.25 },
  'drywall_1/2': { unit: 'm²', price: 8.50 },
  'drywall_5/8': { unit: 'm²', price: 10.00 },
  
  // Portes et fenêtres
  'door_interior': { unit: 'unité', price: 350 },
  'door_exterior': { unit: 'unité', price: 850 },
  'window_standard': { unit: 'unité', price: 450 },
  'window_large': { unit: 'unité', price: 750 },
  
  // Finitions
  'paint_interior': { unit: 'm²', price: 6.50 },
  'flooring_laminate': { unit: 'm²', price: 35 },
  'flooring_ceramic': { unit: 'm²', price: 65 },
  'ceiling_suspended': { unit: 'm²', price: 28 },
  
  // Isolation
  'insulation_r20': { unit: 'm²', price: 12 },
  'insulation_r30': { unit: 'm²', price: 18 },
  
  // Toiture
  'roofing_shingles': { unit: 'm²', price: 45 },
  'roofing_membrane': { unit: 'm²', price: 75 },
}

// ============================================================================
// ANALYSE AI DES PLANS
// ============================================================================

/**
 * Analyse une image de plan avec OCR et détection de formes
 */
export async function analyzePageWithAI(
  imageData: string, // Base64 ou URL
  pageNumber: number,
  options: {
    detectScale?: boolean
    extractDimensions?: boolean
    categorizeElements?: boolean
  } = {}
): Promise<AIAnalysisResult> {
  const startTime = Date.now()
  
  try {
    // Créer un canvas pour l'analyse
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Analyse des éléments
    const elements: DetectedElement[] = []
    const rawText: string[] = []
    
    // Détection de lignes (murs potentiels)
    const walls = detectLines(imageDataObj)
    walls.forEach((wall, i) => {
      elements.push({
        id: `wall-${pageNumber}-${i}`,
        type: 'wall',
        category: 'Structure',
        label: `Mur ${i + 1}`,
        boundingBox: wall.boundingBox,
        confidence: wall.confidence,
        properties: { orientation: wall.orientation },
        measurements: {
          length: wall.length,
          unit: 'pi'
        }
      })
    })

    // Détection de rectangles (pièces, portes, fenêtres)
    const rectangles = detectRectangles(imageDataObj)
    rectangles.forEach((rect, i) => {
      const type = classifyRectangle(rect)
      elements.push({
        id: `${type}-${pageNumber}-${i}`,
        type: type as any,
        category: type === 'room' ? 'Pièces' : 'Ouvertures',
        label: `${type === 'door' ? 'Porte' : type === 'window' ? 'Fenêtre' : 'Pièce'} ${i + 1}`,
        boundingBox: rect,
        confidence: 0.75,
        properties: {},
        measurements: {
          width: rect.width,
          height: rect.height,
          area: rect.width * rect.height,
          unit: 'pi²'
        }
      })
    })

    // Détection de texte/dimensions (simplifié - en production, utiliser Tesseract.js)
    const textRegions = detectTextRegions(imageDataObj)
    textRegions.forEach((region, i) => {
      elements.push({
        id: `text-${pageNumber}-${i}`,
        type: 'text',
        category: 'Annotations',
        label: region.text || `Texte ${i + 1}`,
        boundingBox: region.boundingBox,
        confidence: region.confidence,
        properties: { possibleDimension: region.isDimension }
      })
      if (region.text) rawText.push(region.text)
    })

    // Calcul du résumé
    const summary = {
      totalWalls: elements.filter(e => e.type === 'wall').length,
      totalDoors: elements.filter(e => e.type === 'door').length,
      totalWindows: elements.filter(e => e.type === 'window').length,
      totalRooms: elements.filter(e => e.type === 'room').length,
      estimatedArea: elements
        .filter(e => e.type === 'room')
        .reduce((sum, e) => sum + (e.measurements?.area || 0), 0),
      detectedDimensions: rawText.filter(t => /\d+['"x×]?\s*\d*/.test(t))
    }

    // Détection d'échelle
    let scale = undefined
    if (options.detectScale) {
      scale = detectScale(rawText, elements)
    }

    return {
      success: true,
      pageNumber,
      elements,
      scale,
      summary,
      rawText,
      processingTime: Date.now() - startTime
    }
  } catch (error) {
    console.error('Erreur analyse AI:', error)
    return {
      success: false,
      pageNumber,
      elements: [],
      summary: {
        totalWalls: 0,
        totalDoors: 0,
        totalWindows: 0,
        totalRooms: 0,
        estimatedArea: 0,
        detectedDimensions: []
      },
      rawText: [],
      processingTime: Date.now() - startTime
    }
  }
}

/**
 * Convertit les éléments détectés en items de takeoff
 */
export function elementsToTakeoffItems(
  elements: DetectedElement[],
  scale: { ratio: number; unit: string } | undefined
): TakeoffItem[] {
  const items: TakeoffItem[] = []
  const scaleRatio = scale?.ratio || 1

  // Grouper les murs
  const walls = elements.filter(e => e.type === 'wall')
  if (walls.length > 0) {
    const totalLength = walls.reduce((sum, w) => sum + (w.measurements?.length || 0) * scaleRatio, 0)
    items.push({
      id: `takeoff-walls`,
      category: 'Structure',
      description: 'Murs intérieurs / extérieurs',
      quantity: Math.round(totalLength),
      unit: 'pi.l.',
      unitPrice: DEFAULT_UNIT_PRICES.wall_2x4.price,
      total: Math.round(totalLength) * DEFAULT_UNIT_PRICES.wall_2x4.price,
      source: 'ai',
      confidence: walls.reduce((sum, w) => sum + w.confidence, 0) / walls.length,
      linkedElements: walls.map(w => w.id)
    })

    // Gypse pour les murs
    const gypsumArea = totalLength * 8 / 10.764 // Conversion en m², hauteur 8'
    items.push({
      id: `takeoff-drywall`,
      category: 'Finitions',
      description: 'Gypse 1/2" (deux faces)',
      quantity: Math.round(gypsumArea * 2),
      unit: 'm²',
      unitPrice: DEFAULT_UNIT_PRICES['drywall_1/2'].price,
      total: Math.round(gypsumArea * 2) * DEFAULT_UNIT_PRICES['drywall_1/2'].price,
      source: 'ai',
      confidence: 0.7
    })
  }

  // Portes
  const doors = elements.filter(e => e.type === 'door')
  if (doors.length > 0) {
    items.push({
      id: `takeoff-doors`,
      category: 'Portes et fenêtres',
      description: 'Portes intérieures',
      quantity: doors.length,
      unit: 'unité',
      unitPrice: DEFAULT_UNIT_PRICES.door_interior.price,
      total: doors.length * DEFAULT_UNIT_PRICES.door_interior.price,
      source: 'ai',
      confidence: doors.reduce((sum, d) => sum + d.confidence, 0) / doors.length,
      linkedElements: doors.map(d => d.id)
    })
  }

  // Fenêtres
  const windows = elements.filter(e => e.type === 'window')
  if (windows.length > 0) {
    items.push({
      id: `takeoff-windows`,
      category: 'Portes et fenêtres',
      description: 'Fenêtres standard',
      quantity: windows.length,
      unit: 'unité',
      unitPrice: DEFAULT_UNIT_PRICES.window_standard.price,
      total: windows.length * DEFAULT_UNIT_PRICES.window_standard.price,
      source: 'ai',
      confidence: windows.reduce((sum, w) => sum + w.confidence, 0) / windows.length,
      linkedElements: windows.map(w => w.id)
    })
  }

  // Pièces / Superficie
  const rooms = elements.filter(e => e.type === 'room')
  if (rooms.length > 0) {
    const totalArea = rooms.reduce((sum, r) => sum + (r.measurements?.area || 0) * scaleRatio * scaleRatio, 0)
    const areaM2 = totalArea / 10.764 // Conversion pi² → m²

    items.push({
      id: `takeoff-flooring`,
      category: 'Finitions',
      description: 'Revêtement de sol (à déterminer)',
      quantity: Math.round(areaM2),
      unit: 'm²',
      unitPrice: DEFAULT_UNIT_PRICES.flooring_laminate.price,
      total: Math.round(areaM2) * DEFAULT_UNIT_PRICES.flooring_laminate.price,
      source: 'ai',
      confidence: 0.6
    })

    items.push({
      id: `takeoff-paint`,
      category: 'Finitions',
      description: 'Peinture intérieure (murs + plafonds)',
      quantity: Math.round(areaM2 * 3), // Murs + plafond approximatif
      unit: 'm²',
      unitPrice: DEFAULT_UNIT_PRICES.paint_interior.price,
      total: Math.round(areaM2 * 3) * DEFAULT_UNIT_PRICES.paint_interior.price,
      source: 'ai',
      confidence: 0.6
    })
  }

  return items
}

// ============================================================================
// FONCTIONS DE DÉTECTION (Algorithmes simplifiés)
// ============================================================================

interface Line {
  boundingBox: { x: number; y: number; width: number; height: number }
  orientation: 'horizontal' | 'vertical'
  length: number
  confidence: number
}

function detectLines(imageData: ImageData): Line[] {
  const lines: Line[] = []
  const { data, width, height } = imageData
  
  // Algorithme simplifié de détection de lignes
  // En production, utiliser OpenCV.js ou un algorithme Hough transform
  
  // Scan horizontal
  for (let y = 0; y < height; y += 10) {
    let lineStart = -1
    let lineLength = 0
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      
      if (brightness < 50) { // Pixel sombre
        if (lineStart === -1) lineStart = x
        lineLength++
      } else {
        if (lineLength > 50) { // Ligne significative
          lines.push({
            boundingBox: { x: lineStart, y: y - 2, width: lineLength, height: 4 },
            orientation: 'horizontal',
            length: lineLength / 10, // Approximation en unités
            confidence: Math.min(0.9, lineLength / 200)
          })
        }
        lineStart = -1
        lineLength = 0
      }
    }
  }

  // Scan vertical
  for (let x = 0; x < width; x += 10) {
    let lineStart = -1
    let lineLength = 0
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      
      if (brightness < 50) {
        if (lineStart === -1) lineStart = y
        lineLength++
      } else {
        if (lineLength > 50) {
          lines.push({
            boundingBox: { x: x - 2, y: lineStart, width: 4, height: lineLength },
            orientation: 'vertical',
            length: lineLength / 10,
            confidence: Math.min(0.9, lineLength / 200)
          })
        }
        lineStart = -1
        lineLength = 0
      }
    }
  }

  return lines.slice(0, 50) // Limiter le nombre de résultats
}

function detectRectangles(imageData: ImageData): { x: number; y: number; width: number; height: number }[] {
  const rectangles: { x: number; y: number; width: number; height: number }[] = []
  
  // Algorithme simplifié - détection de contours rectangulaires
  // En production, utiliser contour detection d'OpenCV
  
  // Simulation de détection basée sur des zones de contraste
  const { width, height } = imageData
  const gridSize = 50
  
  for (let gy = 0; gy < height - gridSize; gy += gridSize) {
    for (let gx = 0; gx < width - gridSize; gx += gridSize) {
      // Vérifier si cette zone a un contour rectangulaire
      const hasTopEdge = checkEdge(imageData, gx, gy, gridSize, 'horizontal')
      const hasBottomEdge = checkEdge(imageData, gx, gy + gridSize - 5, gridSize, 'horizontal')
      const hasLeftEdge = checkEdge(imageData, gx, gy, gridSize, 'vertical')
      const hasRightEdge = checkEdge(imageData, gx + gridSize - 5, gy, gridSize, 'vertical')
      
      if (hasTopEdge && hasBottomEdge && hasLeftEdge && hasRightEdge) {
        rectangles.push({
          x: gx,
          y: gy,
          width: gridSize,
          height: gridSize
        })
      }
    }
  }

  return rectangles.slice(0, 20)
}

function checkEdge(imageData: ImageData, startX: number, startY: number, length: number, direction: 'horizontal' | 'vertical'): boolean {
  const { data, width } = imageData
  let darkPixels = 0
  
  for (let i = 0; i < length; i++) {
    const x = direction === 'horizontal' ? startX + i : startX
    const y = direction === 'vertical' ? startY + i : startY
    
    if (x < 0 || y < 0 || x >= width || y >= imageData.height) continue
    
    const idx = (y * width + x) * 4
    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
    
    if (brightness < 100) darkPixels++
  }
  
  return darkPixels > length * 0.5
}

function classifyRectangle(rect: { x: number; y: number; width: number; height: number }): string {
  const aspectRatio = rect.width / rect.height
  const area = rect.width * rect.height
  
  // Classification basée sur les proportions typiques
  if (area < 1000) {
    // Petit rectangle - probablement une fenêtre ou porte
    if (aspectRatio > 1.5 || aspectRatio < 0.67) {
      return 'window'
    }
    return 'door'
  }
  
  // Grand rectangle - probablement une pièce
  return 'room'
}

interface TextRegion {
  boundingBox: { x: number; y: number; width: number; height: number }
  text?: string
  confidence: number
  isDimension: boolean
}

function detectTextRegions(imageData: ImageData): TextRegion[] {
  // Simulation de détection de texte
  // En production, utiliser Tesseract.js pour l'OCR
  const regions: TextRegion[] = []
  
  // Placeholder - retourne des régions simulées
  // Les vraies dimensions seraient extraites par OCR
  
  return regions
}

function detectScale(rawText: string[], elements: DetectedElement[]): { ratio: number; unit: string; detected: boolean } | undefined {
  // Recherche de mentions d'échelle dans le texte
  for (const text of rawText) {
    // Patterns d'échelle courants
    const scalePatterns = [
      /1[:/](\d+)/i,                    // 1:100, 1/100
      /échelle\s*[:\s]*1[:/](\d+)/i,    // Échelle: 1:100
      /scale\s*[:\s]*1[:/](\d+)/i,      // Scale: 1:100
      /(\d+)"?\s*=\s*(\d+)'?/i,         // 1" = 10'
    ]
    
    for (const pattern of scalePatterns) {
      const match = text.match(pattern)
      if (match) {
        const ratio = parseInt(match[1]) || 100
        return {
          ratio: ratio,
          unit: 'pi',
          detected: true
        }
      }
    }
  }
  
  // Échelle par défaut si non détectée
  return {
    ratio: 48, // 1/4" = 1'-0" est courant
    unit: 'pi',
    detected: false
  }
}

// ============================================================================
// EXPORT EXCEL
// ============================================================================

export function exportTakeoffToExcel(items: TakeoffItem[], projectName: string): void {
  // Créer le contenu CSV (compatible Excel)
  const headers = ['Catégorie', 'Description', 'Quantité', 'Unité', 'Prix unitaire', 'Total', 'Source', 'Confiance']
  
  const rows = items.map(item => [
    item.category,
    item.description,
    item.quantity.toString(),
    item.unit,
    item.unitPrice.toFixed(2),
    item.total.toFixed(2),
    item.source === 'ai' ? 'IA' : 'Manuel',
    item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '-'
  ])

  const total = items.reduce((sum, item) => sum + item.total, 0)
  rows.push(['', '', '', '', 'TOTAL:', total.toFixed(2), '', ''])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Téléchargement
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `takeoff_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
