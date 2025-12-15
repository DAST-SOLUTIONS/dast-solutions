/**
 * DAST Solutions - Types Takeoff Mesures & OCR
 * Module de relevé de quantités sur plans avec outils de mesure
 */

// Types de mesure disponibles
export type MeasureToolType = 'select' | 'line' | 'area' | 'count' | 'rectangle'

// Point sur le canvas
export interface Point {
  x: number
  y: number
}

// Une mesure effectuée sur le plan
export interface Measurement {
  id: string
  type: MeasureToolType
  points?: Point[]         // Points du tracé
  value: number           // Valeur calculée (longueur, surface, ou comptage)
  unit: string            // m, m², unité
  scale?: number          // Échelle appliquée (ex: 1:50 = 0.02)
  label?: string          // Nom de l'élément
  category: string        // Catégorie (Fondations, Murs, etc.)
  color: string           // Couleur d'affichage
  pageNumber?: number     // Page du PDF (ancien)
  page?: number           // Page du PDF (nouveau)
  planId?: string         // ID du plan associé
  notes?: string
  createdAt?: string
}

// Document/Plan uploadé
export interface TakeoffPlan {
  id: string
  projectId: string
  name: string
  fileUrl: string
  fileType: string
  fileSize: number
  pageCount: number
  currentPage: number
  scale: number           // Échelle détectée ou définie
  scaleUnit: string       // 'm', 'cm', 'pi', 'po'
  measurements: Measurement[]
  ocrResults?: OCRResult[]
  createdAt: string
  updatedAt: string
}

// Résultat OCR
export interface OCRResult {
  id: string
  text: string
  confidence: number      // 0-100
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  pageNumber: number
  type: 'dimension' | 'text' | 'number' | 'scale' | 'unknown'
}

// Configuration des outils
export interface MeasureToolConfig {
  type: MeasureToolType
  name: string
  icon: string
  color: string
  defaultUnit: string
  cursor: string
}

// État du viewer
export interface ViewerState {
  zoom: number
  pan: Point
  rotation: number
  currentPage: number
  totalPages: number
  isLoading: boolean
}

// Catégories de takeoff prédéfinies
export const TAKEOFF_CATEGORIES = [
  { id: 'excavation', name: 'Excavation', color: '#8B4513' },
  { id: 'fondations', name: 'Fondations', color: '#696969' },
  { id: 'structure', name: 'Structure/Charpente', color: '#CD853F' },
  { id: 'murs_ext', name: 'Murs extérieurs', color: '#4682B4' },
  { id: 'murs_int', name: 'Murs intérieurs', color: '#87CEEB' },
  { id: 'toiture', name: 'Toiture', color: '#B22222' },
  { id: 'portes', name: 'Portes', color: '#228B22' },
  { id: 'fenetres', name: 'Fenêtres', color: '#00CED1' },
  { id: 'electricite', name: 'Électricité', color: '#FFD700' },
  { id: 'plomberie', name: 'Plomberie', color: '#1E90FF' },
  { id: 'cvac', name: 'CVAC', color: '#32CD32' },
  { id: 'finitions', name: 'Finitions', color: '#DDA0DD' },
  { id: 'paysagement', name: 'Paysagement', color: '#90EE90' },
  { id: 'autre', name: 'Autre', color: '#A9A9A9' },
] as const

// Configuration des outils de mesure
export const MEASURE_TOOLS: MeasureToolConfig[] = [
  { type: 'select', name: 'Sélection', icon: 'MousePointer', color: '#6B7280', defaultUnit: '', cursor: 'default' },
  { type: 'line', name: 'Ligne (longueur)', icon: 'Minus', color: '#3B82F6', defaultUnit: 'm', cursor: 'crosshair' },
  { type: 'area', name: 'Surface (polygone)', icon: 'Hexagon', color: '#10B981', defaultUnit: 'm²', cursor: 'crosshair' },
  { type: 'rectangle', name: 'Rectangle', icon: 'Square', color: '#8B5CF6', defaultUnit: 'm²', cursor: 'crosshair' },
  { type: 'count', name: 'Comptage', icon: 'Plus', color: '#F59E0B', defaultUnit: 'unité', cursor: 'cell' },
]

// Unités disponibles
export const UNITS = {
  length: ['m', 'cm', 'mm', 'pi', 'po'],
  area: ['m²', 'pi²'],
  count: ['unité', 'pce', 'lot'],
} as const

// Échelles communes
export const COMMON_SCALES = [
  { label: '1:10', value: 0.1 },
  { label: '1:20', value: 0.05 },
  { label: '1:25', value: 0.04 },
  { label: '1:50', value: 0.02 },
  { label: '1:75', value: 0.0133 },
  { label: '1:100', value: 0.01 },
  { label: '1:200', value: 0.005 },
  { label: '1:500', value: 0.002 },
] as const

// Helpers
export function generateMeasurementId(): string {
  return `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area / 2)
}

export function pixelsToReal(pixels: number, scale: number, dpi: number = 72): number {
  // Convertit pixels en mètres selon l'échelle
  // DPI standard PDF = 72
  const inches = pixels / dpi
  const meters = inches * 0.0254 / scale
  return meters
}
