/**
 * Service AI Takeoff - Analyse automatique des plans
 */

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

export interface AIAnalysisResult {
  success: boolean;
  elements: DetectedElement[];
  totalConfidence: number;
  processingTime: number;
  pageInfo?: { width: number; height: number; scale?: number };
  error?: string;
}

export interface TakeoffItem {
  id: string;
  element_id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total?: number;
  category?: string;
  csc_code?: string;
  layer?: string;
  confidence?: number;
}

export interface TakeoffLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  items: TakeoffItem[];
}

export interface AITakeoffResult {
  success: boolean;
  items: DetectedElement[];
  confidence: number;
  processingTime: number;
  error?: string;
}

// CSC MasterFormat Categories
export const CSC_CATEGORIES = {
  '03': { code: '03', name: 'Béton', subcategories: ['Coffrage', 'Armature', 'Béton coulé'] },
  '04': { code: '04', name: 'Maçonnerie', subcategories: ['Brique', 'Bloc', 'Pierre'] },
  '05': { code: '05', name: 'Métaux', subcategories: ['Acier structural', 'Métaux ouvrés'] },
  '06': { code: '06', name: 'Bois et plastiques', subcategories: ['Charpente', 'Menuiserie'] },
  '07': { code: '07', name: 'Protection thermique', subcategories: ['Isolation', 'Toiture'] },
  '08': { code: '08', name: 'Portes et fenêtres', subcategories: ['Portes', 'Fenêtres', 'Quincaillerie'] },
  '09': { code: '09', name: 'Finitions', subcategories: ['Gypse', 'Peinture', 'Revêtements'] }
};

// Default layers
export const DEFAULT_LAYERS: TakeoffLayer[] = [
  { id: 'structure', name: 'Structure', color: '#3b82f6', visible: true, locked: false, items: [] },
  { id: 'architecture', name: 'Architecture', color: '#10b981', visible: true, locked: false, items: [] },
  { id: 'mechanical', name: 'Mécanique', color: '#f59e0b', visible: true, locked: false, items: [] },
  { id: 'electrical', name: 'Électrique', color: '#ef4444', visible: true, locked: false, items: [] },
  { id: 'plumbing', name: 'Plomberie', color: '#8b5cf6', visible: true, locked: false, items: [] }
];

class AITakeoffService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async analyzeImage(imageData: string | Blob): Promise<AITakeoffResult> {
    const startTime = Date.now();
    
    try {
      const mockItems: DetectedElement[] = [
        { id: '1', type: 'wall', label: 'Mur béton', description: 'Mur de béton 200mm', quantity: 45.5, unit: 'm²', confidence: 0.92, category: 'Béton', csc_code: '03-31-00' },
        { id: '2', type: 'door', label: 'Porte', description: 'Porte standard 900x2100', quantity: 3, unit: 'unité', confidence: 0.88, category: 'Portes', csc_code: '08-11-00' },
        { id: '3', type: 'window', label: 'Fenêtre', description: 'Fenêtre 1200x1500', quantity: 4, unit: 'unité', confidence: 0.85, category: 'Fenêtres', csc_code: '08-51-00' }
      ];

      return { success: true, items: mockItems, confidence: 0.88, processingTime: Date.now() - startTime };
    } catch (error: any) {
      return { success: false, items: [], confidence: 0, processingTime: Date.now() - startTime, error: error.message };
    }
  }
}

export const aiTakeoffService = new AITakeoffService();

// Helper functions expected by existing code
export async function analyzePageWithAI(imageData: string | Blob): Promise<AIAnalysisResult> {
  const result = await aiTakeoffService.analyzeImage(imageData);
  return {
    success: result.success,
    elements: result.items,
    totalConfidence: result.confidence,
    processingTime: result.processingTime,
    error: result.error
  };
}

export function elementsToTakeoffItems(elements: DetectedElement[]): TakeoffItem[] {
  return elements.map(el => ({
    id: el.id,
    element_id: el.id,
    description: el.description,
    quantity: el.quantity,
    unit: el.unit,
    category: el.category,
    csc_code: el.csc_code,
    confidence: el.confidence
  }));
}

export function exportTakeoffToExcel(items: TakeoffItem[], filename: string): void {
  const csv = [
    'Description,Quantité,Unité,Code CSC,Catégorie',
    ...items.map(i => `"${i.description}",${i.quantity},"${i.unit}","${i.csc_code || ''}","${i.category || ''}"`)
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default aiTakeoffService;
