/**
 * DAST Solutions - Types Takeoff Mesures & OCR
 * Module de relevé de quantités sur plans avec outils de mesure
 * V2: Support dimensions additionnelles, métiers CCQ, coûts
 */

// Types de mesure disponibles
export type MeasureToolType = 'select' | 'line' | 'area' | 'count' | 'rectangle'

// Point sur le canvas
export interface Point {
  x: number
  y: number
}

// Dimensions additionnelles pour calculs étendus
export interface AdditionalDimensions {
  height?: number       // Hauteur (pour transformer ligne en surface)
  width?: number        // Largeur (pour volume)
  depth?: number        // Profondeur (pour volume)
  thickness?: number    // Épaisseur (ex: mur)
  quantity?: number     // Quantité/répétition
}

// Coûts associés à une mesure
export interface MeasurementCosts {
  // Main-d'œuvre
  laborTradeCode?: string      // Code métier CCQ
  laborTradeName?: string      // Nom du métier
  laborHourlyRate?: number     // Taux horaire
  laborHours?: number          // Heures estimées
  laborCost?: number           // Coût total main-d'œuvre
  
  // Matériaux
  materialName?: string        // Nom du matériau
  materialUnit?: string        // Unité (m², m³, unité)
  materialUnitPrice?: number   // Prix unitaire
  materialQuantity?: number    // Quantité
  materialCost?: number        // Coût total matériaux
  
  // Totaux
  totalCost?: number           // Coût total (labor + material)
  markup?: number              // Majoration (%)
  totalWithMarkup?: number     // Total avec majoration
}

// Valeurs calculées depuis les dimensions
export interface CalculatedValues {
  length?: number       // Longueur (m)
  area?: number         // Surface (m²)
  volume?: number       // Volume (m³)
  perimeter?: number    // Périmètre (m)
  count?: number        // Comptage
}

// Une mesure effectuée sur le plan
export interface Measurement {
  id: string
  type: MeasureToolType
  
  // Identification
  label?: string           // Nom personnalisé
  description?: string     // Description détaillée
  category: string         // Catégorie (Fondations, Murs, etc.)
  color: string            // Couleur d'affichage
  
  // Géométrie
  points?: Point[]         // Points du tracé
  
  // Valeur principale
  value: number            // Valeur calculée principale
  unit: string             // m, m², m³, unité
  
  // Dimensions additionnelles
  dimensions?: AdditionalDimensions
  
  // Valeurs calculées
  calculated?: CalculatedValues
  
  // Coûts
  costs?: MeasurementCosts
  
  // Métadonnées
  scale?: number           // Échelle appliquée
  planId?: string          // ID du plan associé
  page?: number            // Page du PDF
  pageNumber?: number      // Alias pour compatibilité
  notes?: string
  createdAt?: string
  updatedAt?: string
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
  scale: number
  scaleUnit: string
  measurements: Measurement[]
  ocrResults?: OCRResult[]
  createdAt: string
  updatedAt: string
}

// Résultat OCR
export interface OCRResult {
  id: string
  text: string
  confidence: number
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

// Catégories de takeoff prédéfinies avec métiers associés
export const TAKEOFF_CATEGORIES = [
  { id: 'excavation', name: 'Excavation', color: '#8B4513', defaultTrade: 'COND' },
  { id: 'fondations', name: 'Fondations', color: '#696969', defaultTrade: 'CARP' },
  { id: 'structure', name: 'Structure/Charpente', color: '#CD853F', defaultTrade: 'CARP' },
  { id: 'murs_ext', name: 'Murs extérieurs', color: '#4682B4', defaultTrade: 'BRIQ' },
  { id: 'murs_int', name: 'Murs intérieurs', color: '#87CEEB', defaultTrade: 'CARP' },
  { id: 'toiture', name: 'Toiture', color: '#B22222', defaultTrade: 'COUV' },
  { id: 'portes', name: 'Portes', color: '#228B22', defaultTrade: 'CARP' },
  { id: 'fenetres', name: 'Fenêtres', color: '#00CED1', defaultTrade: 'CARP' },
  { id: 'electricite', name: 'Électricité', color: '#FFD700', defaultTrade: 'ELEC' },
  { id: 'plomberie', name: 'Plomberie', color: '#1E90FF', defaultTrade: 'PLMB' },
  { id: 'cvac', name: 'CVAC', color: '#32CD32', defaultTrade: 'FRIG' },
  { id: 'finitions', name: 'Finitions', color: '#DDA0DD', defaultTrade: 'PEIN' },
  { id: 'paysagement', name: 'Paysagement', color: '#90EE90', defaultTrade: 'COND' },
  { id: 'autre', name: 'Autre', color: '#A9A9A9', defaultTrade: '' },
] as const

// Métiers CCQ avec taux horaires approximatifs (2024)
export const CCQ_TRADES = [
  { code: 'CARP', name: 'Charpentier-menuisier', rate: 42.50 },
  { code: 'ELEC', name: 'Électricien', rate: 45.00 },
  { code: 'PLMB', name: 'Plombier', rate: 46.50 },
  { code: 'BRIQ', name: 'Briqueteur-maçon', rate: 44.00 },
  { code: 'PEIN', name: 'Peintre', rate: 38.50 },
  { code: 'FRIG', name: 'Frigoriste', rate: 47.00 },
  { code: 'TUYA', name: 'Tuyauteur', rate: 48.00 },
  { code: 'FERB', name: 'Ferblantier', rate: 44.50 },
  { code: 'COUV', name: 'Couvreur', rate: 41.00 },
  { code: 'COND', name: 'Opérateur d\'équipement lourd', rate: 43.00 },
  { code: 'MANV', name: 'Manœuvre', rate: 32.00 },
  { code: 'CIME', name: 'Cimentier-applicateur', rate: 40.00 },
  { code: 'FERR', name: 'Ferrailleur', rate: 43.50 },
  { code: 'GYPS', name: 'Poseur de systèmes intérieurs', rate: 39.00 },
] as const

// Matériaux courants avec prix unitaires approximatifs
export const COMMON_MATERIALS = [
  { id: 'beton', name: 'Béton 30 MPa', unit: 'm³', price: 185.00 },
  { id: 'acier', name: 'Acier d\'armature', unit: 'kg', price: 2.50 },
  { id: 'brique', name: 'Brique standard', unit: 'unité', price: 0.85 },
  { id: 'bloc', name: 'Bloc de béton', unit: 'unité', price: 3.50 },
  { id: 'bois_2x4', name: 'Bois 2x4 SPF', unit: 'pmp', price: 0.95 },
  { id: 'bois_2x6', name: 'Bois 2x6 SPF', unit: 'pmp', price: 1.10 },
  { id: 'plywood', name: 'Contreplaqué 3/4"', unit: 'feuille', price: 65.00 },
  { id: 'gypse', name: 'Gypse 1/2"', unit: 'feuille', price: 18.00 },
  { id: 'isolant_r20', name: 'Isolant R-20', unit: 'm²', price: 12.00 },
  { id: 'bardeaux', name: 'Bardeaux asphalte', unit: 'paquet', price: 35.00 },
  { id: 'membrane', name: 'Membrane élastomère', unit: 'm²', price: 45.00 },
  { id: 'peinture', name: 'Peinture latex', unit: 'litre', price: 45.00 },
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
  volume: ['m³', 'pi³'],
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

// ============================================================================
// HELPERS
// ============================================================================

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
  const inches = pixels / dpi
  const meters = inches * 0.0254 / scale
  return meters
}

/**
 * Calcule les valeurs dérivées d'une mesure
 */
export function calculateDerivedValues(measurement: Measurement): CalculatedValues {
  const result: CalculatedValues = {}
  const dims = measurement.dimensions || {}
  
  if (measurement.type === 'line') {
    result.length = measurement.value
    
    // Si hauteur fournie: calculer surface
    if (dims.height && dims.height > 0) {
      result.area = measurement.value * dims.height
    }
    
    // Si hauteur ET largeur: calculer volume
    if (dims.height && dims.width && dims.height > 0 && dims.width > 0) {
      result.volume = measurement.value * dims.height * dims.width
    }
  } else if (measurement.type === 'rectangle' || measurement.type === 'area') {
    result.area = measurement.value
    
    // Si épaisseur fournie: calculer volume
    if (dims.thickness && dims.thickness > 0) {
      result.volume = measurement.value * dims.thickness
    }
    
    // Si hauteur fournie (ex: mur): calculer différemment
    if (dims.height && dims.height > 0 && measurement.type === 'rectangle') {
      // Pour un mur, la "valeur" est la longueur, multiplier par hauteur
      result.area = measurement.value * dims.height
    }
  } else if (measurement.type === 'count') {
    result.count = measurement.value
  }
  
  // Appliquer la quantité/répétition
  if (dims.quantity && dims.quantity > 1) {
    if (result.length) result.length *= dims.quantity
    if (result.area) result.area *= dims.quantity
    if (result.volume) result.volume *= dims.quantity
    if (result.count) result.count *= dims.quantity
  }
  
  return result
}

/**
 * Calcule les coûts d'une mesure
 */
export function calculateMeasurementCosts(measurement: Measurement): MeasurementCosts {
  const costs = measurement.costs || {}
  const calculated = measurement.calculated || calculateDerivedValues(measurement)
  
  // Coût main-d'œuvre
  if (costs.laborHourlyRate && costs.laborHours) {
    costs.laborCost = costs.laborHourlyRate * costs.laborHours
  }
  
  // Coût matériaux
  if (costs.materialUnitPrice && costs.materialQuantity) {
    costs.materialCost = costs.materialUnitPrice * costs.materialQuantity
  } else if (costs.materialUnitPrice && calculated.area) {
    // Auto-calculer quantité depuis la surface
    costs.materialQuantity = calculated.area
    costs.materialCost = costs.materialUnitPrice * calculated.area
  }
  
  // Total
  costs.totalCost = (costs.laborCost || 0) + (costs.materialCost || 0)
  
  // Avec majoration
  if (costs.markup && costs.markup > 0) {
    costs.totalWithMarkup = costs.totalCost * (1 + costs.markup / 100)
  } else {
    costs.totalWithMarkup = costs.totalCost
  }
  
  return costs
}
