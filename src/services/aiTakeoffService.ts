/**
 * Service AI Takeoff - Analyse de plans avec IA
 */

export interface PageInfo {
  width: number;
  height: number;
  scale?: number;
  unit?: string;
}

export interface DetectedElement {
  id: string;
  type: string;
  label: string;
  description: string;
  quantity: number;
  unit: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  category?: string;
  csc_code?: string;
  layer?: string;
}

export type AIDetectedItem = DetectedElement;

export interface AIAnalysisResult {
  success: boolean;
  elements: DetectedElement[];
  pageInfo: PageInfo;
  scale?: number;
  processingTime?: number;
  error?: string;
}

export interface TakeoffItem {
  id: string;
  element_id?: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total_price?: number;
  confidence?: number;
  source: 'ai' | 'manual';
  csc_code?: string;
  notes?: string;
}

export interface TakeoffLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  elements: DetectedElement[];
  elementTypes?: string[];
}

export interface AnalysisOptions {
  detectWalls?: boolean;
  detectDoors?: boolean;
  detectWindows?: boolean;
  detectElectrical?: boolean;
  detectPlumbing?: boolean;
  autoScale?: boolean;
  minConfidence?: number;
}

// Simulate AI analysis (would connect to OpenAI Vision API in production)
export async function analyzePageWithAI(
  imageData: string | Blob | File,
  scale?: number,
  options?: AnalysisOptions
): Promise<AIAnalysisResult> {
  // Simulated AI analysis
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const mockElements: DetectedElement[] = [
    {
      id: 'elem-1',
      type: 'wall',
      label: 'Mur extérieur',
      description: 'Mur extérieur en béton',
      quantity: 45.5,
      unit: 'ml',
      confidence: 0.92,
      category: 'Structure',
      csc_code: '03-31'
    },
    {
      id: 'elem-2',
      type: 'door',
      label: 'Porte standard',
      description: 'Porte intérieure 36"',
      quantity: 8,
      unit: 'unité',
      confidence: 0.88,
      category: 'Ouvertures',
      csc_code: '08-11'
    },
    {
      id: 'elem-3',
      type: 'window',
      label: 'Fenêtre',
      description: 'Fenêtre double vitrage',
      quantity: 12,
      unit: 'unité',
      confidence: 0.85,
      category: 'Ouvertures',
      csc_code: '08-52'
    }
  ];

  return {
    success: true,
    elements: mockElements,
    pageInfo: {
      width: 1000,
      height: 800,
      scale: scale || 0.01,
      unit: 'm'
    },
    scale: scale || 0.01,
    processingTime: 1500
  };
}

export function elementsToTakeoffItems(
  elements: DetectedElement[],
  options?: { categoryFilter?: string }
): TakeoffItem[] {
  return elements
    .filter(el => !options?.categoryFilter || el.category === options.categoryFilter)
    .map(el => ({
      id: `takeoff-${el.id}`,
      element_id: el.id,
      description: el.description,
      category: el.category || 'Général',
      subcategory: el.type,
      quantity: el.quantity,
      unit: el.unit,
      confidence: el.confidence,
      source: 'ai' as const,
      csc_code: el.csc_code
    }));
}

export function createTakeoffLayer(name: string, color: string): TakeoffLayer {
  return {
    id: `layer-${Date.now()}`,
    name,
    color,
    visible: true,
    locked: false,
    elements: [],
    elementTypes: []
  };
}

export default {
  analyzePageWithAI,
  elementsToTakeoffItems,
  createTakeoffLayer
};

// CSC Categories
export const CSC_CATEGORIES = [
  { code: '03', name: 'Béton', name_fr: 'Béton' },
  { code: '04', name: 'Maçonnerie', name_fr: 'Maçonnerie' },
  { code: '05', name: 'Métaux', name_fr: 'Métaux' },
  { code: '06', name: 'Bois et plastiques', name_fr: 'Bois et plastiques' },
  { code: '07', name: 'Isolation thermique', name_fr: 'Isolation thermique' },
  { code: '08', name: 'Portes et fenêtres', name_fr: 'Portes et fenêtres' },
  { code: '09', name: 'Finitions', name_fr: 'Finitions' },
  { code: '26', name: 'Électricité', name_fr: 'Électricité' },
  { code: '22', name: 'Plomberie', name_fr: 'Plomberie' },
  { code: '23', name: 'CVAC', name_fr: 'CVAC' }
];

// Default layers
export const DEFAULT_LAYERS: TakeoffLayer[] = [
  { id: 'layer-walls', name: 'Murs', color: '#3B82F6', visible: true, locked: false, elements: [], elementTypes: ['wall'] },
  { id: 'layer-doors', name: 'Portes', color: '#10B981', visible: true, locked: false, elements: [], elementTypes: ['door'] },
  { id: 'layer-windows', name: 'Fenêtres', color: '#F59E0B', visible: true, locked: false, elements: [], elementTypes: ['window'] },
  { id: 'layer-electrical', name: 'Électricité', color: '#EF4444', visible: true, locked: false, elements: [], elementTypes: ['electrical'] },
  { id: 'layer-plumbing', name: 'Plomberie', color: '#8B5CF6', visible: true, locked: false, elements: [], elementTypes: ['plumbing'] }
];

// Export to Excel
export function exportTakeoffToExcel(items: TakeoffItem[], filename?: string): void {
  // Implementation would use xlsx library
  console.log(`Exporting ${items.length} items to ${filename || 'takeoff.xlsx'}`);
}

export const aiTakeoffService = {
  analyzePageWithAI,
  elementsToTakeoffItems,
  createTakeoffLayer,
  exportTakeoffToExcel,
  CSC_CATEGORIES,
  DEFAULT_LAYERS
};
