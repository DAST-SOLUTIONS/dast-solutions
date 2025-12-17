/**
 * DAST Solutions - Service AI Réel pour Analyse de Plans
 * Intégration OpenAI Vision API + Claude API (Anthropic)
 * 
 * CONFIGURATION REQUISE:
 * - Clé API OpenAI dans les variables d'environnement: VITE_OPENAI_API_KEY
 * - Ou clé API Anthropic: VITE_ANTHROPIC_API_KEY
 */

// ============================================================================
// TYPES
// ============================================================================
export interface AIProvider {
  name: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model: string;
}

export interface AnalysisRequest {
  imageBase64: string;
  pageNumber: number;
  scale?: {
    pixelsPerUnit: number;
    unit: string;
  };
  analysisType: 'full' | 'elements' | 'measurements' | 'text';
  language: 'fr' | 'en';
}

export interface DetectedElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'stairs' | 'electrical' | 'plumbing' | 'hvac' | 'furniture' | 'annotation' | 'dimension';
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  label: string;
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    unit: string;
  };
  properties?: Record<string, any>;
}

export interface AIAnalysisResponse {
  success: boolean;
  provider: string;
  elements: DetectedElement[];
  scale?: {
    detected: boolean;
    pixelsPerUnit: number;
    unit: string;
    confidence: number;
  };
  textAnnotations?: string[];
  dimensions?: {
    text: string;
    value: number;
    unit: string;
    location: { x: number; y: number };
  }[];
  summary: {
    totalWalls: number;
    totalDoors: number;
    totalWindows: number;
    totalRooms: number;
    estimatedArea: number;
    floorType?: string;
    buildingType?: string;
  };
  processingTime: number;
  tokensUsed?: number;
  error?: string;
}

// ============================================================================
// PROMPTS SYSTÈME
// ============================================================================
const ANALYSIS_PROMPT_FR = `Tu es un expert en analyse de plans de construction. Analyse cette image de plan architectural et identifie tous les éléments suivants:

1. MURS: Identifie tous les murs (extérieurs et intérieurs), estime leur longueur
2. PORTES: Compte et localise toutes les portes (intérieures, extérieures, coulissantes)
3. FENÊTRES: Compte et localise toutes les fenêtres
4. PIÈCES: Identifie chaque pièce et estime sa superficie
5. ESCALIERS: Localise les escaliers et cages d'escalier
6. ÉLECTRICITÉ: Prises, interrupteurs, panneaux électriques
7. PLOMBERIE: Éviers, toilettes, douches, baignoires
8. CVAC: Bouches d'aération, thermostats, unités de climatisation
9. DIMENSIONS: Extrait toutes les cotes et dimensions annotées
10. ÉCHELLE: Détecte l'échelle du plan si indiquée

Réponds en JSON avec cette structure exacte:
{
  "elements": [
    {
      "type": "wall|door|window|room|stairs|electrical|plumbing|hvac|furniture|annotation|dimension",
      "label": "description en français",
      "boundingBox": {"x": 0, "y": 0, "width": 100, "height": 100},
      "confidence": 0.95,
      "measurements": {"length": 10, "width": 5, "area": 50, "unit": "pi"}
    }
  ],
  "scale": {
    "detected": true,
    "value": "1:50",
    "pixelsPerUnit": 20,
    "unit": "pi"
  },
  "dimensions": [
    {"text": "12'-6\"", "value": 12.5, "unit": "pi", "location": {"x": 100, "y": 200}}
  ],
  "summary": {
    "totalWalls": 15,
    "totalDoors": 8,
    "totalWindows": 12,
    "totalRooms": 6,
    "estimatedArea": 1500,
    "floorType": "Rez-de-chaussée",
    "buildingType": "Résidentiel unifamilial"
  }
}`;

const ANALYSIS_PROMPT_EN = `You are an expert in construction plan analysis. Analyze this architectural plan image and identify all the following elements:

1. WALLS: Identify all walls (exterior and interior), estimate their length
2. DOORS: Count and locate all doors (interior, exterior, sliding)
3. WINDOWS: Count and locate all windows
4. ROOMS: Identify each room and estimate its area
5. STAIRS: Locate stairs and stairwells
6. ELECTRICAL: Outlets, switches, electrical panels
7. PLUMBING: Sinks, toilets, showers, bathtubs
8. HVAC: Vents, thermostats, AC units
9. DIMENSIONS: Extract all annotated dimensions
10. SCALE: Detect the plan scale if indicated

Respond in JSON with this exact structure:
{
  "elements": [...],
  "scale": {...},
  "dimensions": [...],
  "summary": {...}
}`;

// ============================================================================
// SERVICE OPENAI VISION
// ============================================================================
export async function analyzeWithOpenAI(
  request: AnalysisRequest,
  apiKey?: string
): Promise<AIAnalysisResponse> {
  const startTime = Date.now();
  const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!key) {
    return {
      success: false,
      provider: 'openai',
      elements: [],
      summary: { totalWalls: 0, totalDoors: 0, totalWindows: 0, totalRooms: 0, estimatedArea: 0 },
      processingTime: 0,
      error: 'Clé API OpenAI non configurée. Ajoutez VITE_OPENAI_API_KEY dans vos variables d\'environnement.'
    };
  }
  
  try {
    const prompt = request.language === 'fr' ? ANALYSIS_PROMPT_FR : ANALYSIS_PROMPT_EN;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // ou 'gpt-4-vision-preview'
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt + (request.scale ? `\n\nÉchelle fournie: ${request.scale.pixelsPerUnit} pixels par ${request.scale.unit}` : '')
              },
              {
                type: 'image_url',
                image_url: {
                  url: request.imageBase64.startsWith('data:') 
                    ? request.imageBase64 
                    : `data:image/png;base64,${request.imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Réponse AI invalide - pas de JSON trouvé');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Générer des IDs uniques pour les éléments
    const elements: DetectedElement[] = (parsed.elements || []).map((el: any, index: number) => ({
      id: `openai-${Date.now()}-${index}`,
      type: el.type || 'annotation',
      label: el.label || el.type,
      boundingBox: el.boundingBox || { x: 0, y: 0, width: 50, height: 50 },
      confidence: el.confidence || 0.8,
      measurements: el.measurements,
      properties: el.properties
    }));
    
    return {
      success: true,
      provider: 'openai',
      elements,
      scale: parsed.scale ? {
        detected: parsed.scale.detected || false,
        pixelsPerUnit: parsed.scale.pixelsPerUnit || 20,
        unit: parsed.scale.unit || 'pi',
        confidence: parsed.scale.confidence || 0.7
      } : undefined,
      textAnnotations: parsed.textAnnotations,
      dimensions: parsed.dimensions,
      summary: {
        totalWalls: parsed.summary?.totalWalls || elements.filter(e => e.type === 'wall').length,
        totalDoors: parsed.summary?.totalDoors || elements.filter(e => e.type === 'door').length,
        totalWindows: parsed.summary?.totalWindows || elements.filter(e => e.type === 'window').length,
        totalRooms: parsed.summary?.totalRooms || elements.filter(e => e.type === 'room').length,
        estimatedArea: parsed.summary?.estimatedArea || 0,
        floorType: parsed.summary?.floorType,
        buildingType: parsed.summary?.buildingType
      },
      processingTime: Date.now() - startTime,
      tokensUsed: data.usage?.total_tokens
    };
    
  } catch (error) {
    console.error('Erreur OpenAI Vision:', error);
    return {
      success: false,
      provider: 'openai',
      elements: [],
      summary: { totalWalls: 0, totalDoors: 0, totalWindows: 0, totalRooms: 0, estimatedArea: 0 },
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// ============================================================================
// SERVICE CLAUDE (ANTHROPIC)
// ============================================================================
export async function analyzeWithClaude(
  request: AnalysisRequest,
  apiKey?: string
): Promise<AIAnalysisResponse> {
  const startTime = Date.now();
  const key = apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!key) {
    return {
      success: false,
      provider: 'anthropic',
      elements: [],
      summary: { totalWalls: 0, totalDoors: 0, totalWindows: 0, totalRooms: 0, estimatedArea: 0 },
      processingTime: 0,
      error: 'Clé API Anthropic non configurée. Ajoutez VITE_ANTHROPIC_API_KEY dans vos variables d\'environnement.'
    };
  }
  
  try {
    const prompt = request.language === 'fr' ? ANALYSIS_PROMPT_FR : ANALYSIS_PROMPT_EN;
    
    // Extraire le base64 pur
    let base64Data = request.imageBase64;
    let mediaType = 'image/png';
    
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1];
        base64Data = matches[2];
      }
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt + (request.scale ? `\n\nÉchelle fournie: ${request.scale.pixelsPerUnit} pixels par ${request.scale.unit}` : '')
              }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    // Parser le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Réponse AI invalide - pas de JSON trouvé');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Générer des IDs uniques pour les éléments
    const elements: DetectedElement[] = (parsed.elements || []).map((el: any, index: number) => ({
      id: `claude-${Date.now()}-${index}`,
      type: el.type || 'annotation',
      label: el.label || el.type,
      boundingBox: el.boundingBox || { x: 0, y: 0, width: 50, height: 50 },
      confidence: el.confidence || 0.85,
      measurements: el.measurements,
      properties: el.properties
    }));
    
    return {
      success: true,
      provider: 'anthropic',
      elements,
      scale: parsed.scale ? {
        detected: parsed.scale.detected || false,
        pixelsPerUnit: parsed.scale.pixelsPerUnit || 20,
        unit: parsed.scale.unit || 'pi',
        confidence: parsed.scale.confidence || 0.75
      } : undefined,
      textAnnotations: parsed.textAnnotations,
      dimensions: parsed.dimensions,
      summary: {
        totalWalls: parsed.summary?.totalWalls || elements.filter(e => e.type === 'wall').length,
        totalDoors: parsed.summary?.totalDoors || elements.filter(e => e.type === 'door').length,
        totalWindows: parsed.summary?.totalWindows || elements.filter(e => e.type === 'window').length,
        totalRooms: parsed.summary?.totalRooms || elements.filter(e => e.type === 'room').length,
        estimatedArea: parsed.summary?.estimatedArea || 0,
        floorType: parsed.summary?.floorType,
        buildingType: parsed.summary?.buildingType
      },
      processingTime: Date.now() - startTime,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens
    };
    
  } catch (error) {
    console.error('Erreur Claude Vision:', error);
    return {
      success: false,
      provider: 'anthropic',
      elements: [],
      summary: { totalWalls: 0, totalDoors: 0, totalWindows: 0, totalRooms: 0, estimatedArea: 0 },
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// ============================================================================
// SERVICE PRINCIPAL - AUTO-SÉLECTION DU PROVIDER
// ============================================================================
export async function analyzeConstructionPlan(
  request: AnalysisRequest,
  preferredProvider?: 'openai' | 'anthropic' | 'auto'
): Promise<AIAnalysisResponse> {
  const provider = preferredProvider || 'auto';
  
  // Vérifier les clés API disponibles
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasAnthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!hasOpenAI && !hasAnthropic) {
    // Fallback vers simulation si aucune API configurée
    console.warn('Aucune clé API configurée - utilisation du mode simulation');
    return simulateAnalysis(request);
  }
  
  // Sélection du provider
  if (provider === 'openai' && hasOpenAI) {
    return analyzeWithOpenAI(request);
  }
  
  if (provider === 'anthropic' && hasAnthropic) {
    return analyzeWithClaude(request);
  }
  
  // Auto-sélection: préférer Claude, sinon OpenAI
  if (provider === 'auto') {
    if (hasAnthropic) {
      return analyzeWithClaude(request);
    }
    if (hasOpenAI) {
      return analyzeWithOpenAI(request);
    }
  }
  
  return simulateAnalysis(request);
}

// ============================================================================
// MODE SIMULATION (FALLBACK)
// ============================================================================
function simulateAnalysis(request: AnalysisRequest): AIAnalysisResponse {
  const startTime = Date.now();
  
  // Générer des éléments simulés basés sur une analyse "fictive"
  const elements: DetectedElement[] = [];
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Simuler des murs
  for (let i = 0; i < random(8, 15); i++) {
    elements.push({
      id: `sim-wall-${i}`,
      type: 'wall',
      label: `Mur ${i + 1}`,
      boundingBox: { x: random(50, 500), y: random(50, 500), width: random(100, 300), height: random(10, 20) },
      confidence: 0.7 + Math.random() * 0.25,
      measurements: { length: random(8, 25), unit: 'pi' }
    });
  }
  
  // Simuler des portes
  for (let i = 0; i < random(4, 8); i++) {
    elements.push({
      id: `sim-door-${i}`,
      type: 'door',
      label: i === 0 ? 'Porte d\'entrée' : `Porte intérieure ${i}`,
      boundingBox: { x: random(100, 600), y: random(100, 600), width: 30, height: 40 },
      confidence: 0.75 + Math.random() * 0.2,
      measurements: { width: random(30, 36), height: 80, unit: 'po' }
    });
  }
  
  // Simuler des fenêtres
  for (let i = 0; i < random(6, 12); i++) {
    elements.push({
      id: `sim-window-${i}`,
      type: 'window',
      label: `Fenêtre ${i + 1}`,
      boundingBox: { x: random(100, 600), y: random(100, 600), width: random(40, 80), height: 30 },
      confidence: 0.7 + Math.random() * 0.25,
      measurements: { width: random(36, 72), height: random(36, 60), unit: 'po' }
    });
  }
  
  // Simuler des pièces
  const roomTypes = ['Salon', 'Cuisine', 'Chambre principale', 'Chambre 2', 'Salle de bain', 'Bureau', 'Entrée'];
  for (let i = 0; i < random(4, 7); i++) {
    elements.push({
      id: `sim-room-${i}`,
      type: 'room',
      label: roomTypes[i] || `Pièce ${i + 1}`,
      boundingBox: { x: random(50, 400), y: random(50, 400), width: random(100, 200), height: random(100, 200) },
      confidence: 0.65 + Math.random() * 0.3,
      measurements: { area: random(80, 250), unit: 'pi²' }
    });
  }
  
  // Calculer le summary
  const summary = {
    totalWalls: elements.filter(e => e.type === 'wall').length,
    totalDoors: elements.filter(e => e.type === 'door').length,
    totalWindows: elements.filter(e => e.type === 'window').length,
    totalRooms: elements.filter(e => e.type === 'room').length,
    estimatedArea: elements
      .filter(e => e.type === 'room')
      .reduce((sum, e) => sum + (e.measurements?.area || 0), 0),
    floorType: 'Rez-de-chaussée (simulé)',
    buildingType: 'Résidentiel (simulé)'
  };
  
  return {
    success: true,
    provider: 'simulation',
    elements,
    scale: request.scale ? {
      detected: true,
      pixelsPerUnit: request.scale.pixelsPerUnit,
      unit: request.scale.unit,
      confidence: 1.0
    } : {
      detected: false,
      pixelsPerUnit: 20,
      unit: 'pi',
      confidence: 0.5
    },
    summary,
    processingTime: Date.now() - startTime + random(500, 1500), // Simuler un délai
    tokensUsed: 0
  };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Vérifie si les APIs AI sont configurées
 */
export function checkAIConfiguration(): {
  openai: boolean;
  anthropic: boolean;
  anyConfigured: boolean;
} {
  const openai = !!import.meta.env.VITE_OPENAI_API_KEY;
  const anthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  return {
    openai,
    anthropic,
    anyConfigured: openai || anthropic
  };
}

/**
 * Convertit une image File en base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convertit un canvas en base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement, format: string = 'image/png'): string {
  return canvas.toDataURL(format);
}
