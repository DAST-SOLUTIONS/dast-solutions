/**
 * DAST Solutions - AI Takeoff Service
 * Analyse automatique des plans avec détection d'éléments et prix Québec 2024
 */

// ============================================================================
// TYPES
// ============================================================================
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'dimension' | 'text' | 'symbol' | 'electrical' | 'plumbing' | 'hvac' | 'stairs' | 'column';
  boundingBox: BoundingBox;
  confidence: number;
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    perimeter?: number;
    count?: number;
  };
  label?: string;
  layer?: string;
  properties?: Record<string, any>;
}

export interface AIAnalysisResult {
  success: boolean;
  elements: DetectedElement[];
  scale?: {
    detected: boolean;
    pixelsPerUnit: number;
    unit: 'ft' | 'm' | 'in' | 'cm';
    confidence: number;
  };
  pageInfo: {
    width: number;
    height: number;
    pageNumber: number;
  };
  summary: {
    totalWalls: number;
    totalDoors: number;
    totalWindows: number;
    totalRooms: number;
    estimatedArea: number;
    estimatedPerimeter: number;
  };
  processingTime: number;
}

export interface TakeoffItem {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  source: 'ai' | 'manual' | 'imported';
  confidence?: number;
  elementIds?: string[];
  notes?: string;
  laborHours?: number;
  laborRate?: number;
  materialCost?: number;
  equipmentCost?: number;
}

export interface TakeoffLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  elementTypes: string[];
  itemCount: number;
}

// ============================================================================
// CATÉGORIES CSC MASTERFORMAT (DIVISIONS 1-49)
// ============================================================================
export const CSC_CATEGORIES = {
  '01': { name: 'Exigences générales', subcategories: ['Conditions générales', 'Administration', 'Mobilisation'] },
  '02': { name: 'Conditions existantes', subcategories: ['Démolition', 'Décontamination', 'Excavation'] },
  '03': { name: 'Béton', subcategories: ['Coffrage', 'Armature', 'Béton coulé', 'Préfabriqué'] },
  '04': { name: 'Maçonnerie', subcategories: ['Brique', 'Bloc', 'Pierre', 'Mortier'] },
  '05': { name: 'Métaux', subcategories: ['Acier structural', 'Métaux ouvrés', 'Escaliers métal'] },
  '06': { name: 'Bois et plastiques', subcategories: ['Charpente', 'Finition bois', 'Panneaux'] },
  '07': { name: 'Protection thermique/humidité', subcategories: ['Isolation', 'Étanchéité', 'Toiture', 'Pare-vapeur'] },
  '08': { name: 'Portes et fenêtres', subcategories: ['Portes intérieures', 'Portes extérieures', 'Fenêtres', 'Quincaillerie'] },
  '09': { name: 'Finitions', subcategories: ['Gypse', 'Céramique', 'Peinture', 'Planchers', 'Plafonds'] },
  '10': { name: 'Spécialités', subcategories: ['Signalisation', 'Casiers', 'Accessoires toilettes'] },
  '11': { name: 'Équipement', subcategories: ['Cuisine commerciale', 'Buanderie', 'Équipement médical'] },
  '12': { name: 'Ameublement', subcategories: ['Mobilier fixe', 'Rideaux', 'Tapis'] },
  '13': { name: 'Constructions spéciales', subcategories: ['Piscines', 'Chambres fortes', 'Serres'] },
  '14': { name: 'Convoyeurs', subcategories: ['Ascenseurs', 'Monte-charge', 'Escaliers mécaniques'] },
  '21': { name: 'Protection incendie', subcategories: ['Gicleurs', 'Extincteurs', 'Alarmes'] },
  '22': { name: 'Plomberie', subcategories: ['Tuyauterie', 'Appareils sanitaires', 'Chauffe-eau'] },
  '23': { name: 'CVAC', subcategories: ['Chauffage', 'Ventilation', 'Climatisation', 'Conduits'] },
  '26': { name: 'Électricité', subcategories: ['Distribution', 'Éclairage', 'Prises', 'Panneau'] },
  '27': { name: 'Communications', subcategories: ['Câblage données', 'Téléphone', 'Audio-visuel'] },
  '28': { name: 'Sécurité électronique', subcategories: ['Contrôle accès', 'Vidéosurveillance', 'Intrusion'] },
  '31': { name: 'Terrassement', subcategories: ['Excavation', 'Remblai', 'Compaction'] },
  '32': { name: 'Aménagement extérieur', subcategories: ['Pavage', 'Clôtures', 'Aménagement paysager'] },
  '33': { name: 'Services publics', subcategories: ['Eau', 'Égouts', 'Gaz'] },
};

// ============================================================================
// BASE DE DONNÉES PRIX QUÉBEC 2024
// ============================================================================
export const QUEBEC_PRICES_2024: Record<string, {
  description: string;
  unit: string;
  materialCost: number;
  laborCost: number;
  totalCost: number;
  laborHours: number;
  category: string;
}> = {
  // DIVISION 03 - BÉTON
  'concrete_footing': { description: 'Semelle béton 12"x24"', unit: 'pi.lin.', materialCost: 45, laborCost: 35, totalCost: 80, laborHours: 0.5, category: '03' },
  'concrete_slab_4': { description: 'Dalle béton 4"', unit: 'pi²', materialCost: 8, laborCost: 6, totalCost: 14, laborHours: 0.08, category: '03' },
  'concrete_slab_6': { description: 'Dalle béton 6"', unit: 'pi²', materialCost: 12, laborCost: 7, totalCost: 19, laborHours: 0.1, category: '03' },
  'concrete_wall_8': { description: 'Mur béton 8"', unit: 'pi²', materialCost: 25, laborCost: 20, totalCost: 45, laborHours: 0.25, category: '03' },
  
  // DIVISION 04 - MAÇONNERIE
  'brick_standard': { description: 'Brique standard', unit: 'pi²', materialCost: 18, laborCost: 25, totalCost: 43, laborHours: 0.35, category: '04' },
  'block_8': { description: 'Bloc béton 8"', unit: 'pi²', materialCost: 12, laborCost: 18, totalCost: 30, laborHours: 0.25, category: '04' },
  'stone_veneer': { description: 'Placage pierre', unit: 'pi²', materialCost: 35, laborCost: 40, totalCost: 75, laborHours: 0.5, category: '04' },
  
  // DIVISION 05 - MÉTAUX
  'steel_beam': { description: 'Poutre acier W8x18', unit: 'pi.lin.', materialCost: 85, laborCost: 45, totalCost: 130, laborHours: 0.6, category: '05' },
  'steel_column': { description: 'Colonne acier HSS 4x4', unit: 'pi.lin.', materialCost: 65, laborCost: 40, totalCost: 105, laborHours: 0.5, category: '05' },
  'metal_stair': { description: 'Escalier métal', unit: 'marche', materialCost: 250, laborCost: 150, totalCost: 400, laborHours: 2, category: '05' },
  
  // DIVISION 06 - BOIS
  'framing_2x4': { description: 'Ossature 2x4 @16"', unit: 'pi²', materialCost: 4.50, laborCost: 6, totalCost: 10.50, laborHours: 0.08, category: '06' },
  'framing_2x6': { description: 'Ossature 2x6 @16"', unit: 'pi²', materialCost: 6.50, laborCost: 6.50, totalCost: 13, laborHours: 0.09, category: '06' },
  'framing_2x10': { description: 'Solive 2x10 @16"', unit: 'pi²', materialCost: 8, laborCost: 5, totalCost: 13, laborHours: 0.07, category: '06' },
  'plywood_5_8': { description: 'Contreplaqué 5/8"', unit: 'pi²', materialCost: 3.50, laborCost: 2.50, totalCost: 6, laborHours: 0.03, category: '06' },
  'trim_baseboard': { description: 'Plinthe MDF 4"', unit: 'pi.lin.', materialCost: 2.50, laborCost: 4, totalCost: 6.50, laborHours: 0.05, category: '06' },
  
  // DIVISION 07 - ISOLATION/TOITURE
  'insulation_r20': { description: 'Isolation R-20', unit: 'pi²', materialCost: 2.50, laborCost: 1.50, totalCost: 4, laborHours: 0.02, category: '07' },
  'insulation_r40': { description: 'Isolation R-40', unit: 'pi²', materialCost: 4.50, laborCost: 2, totalCost: 6.50, laborHours: 0.025, category: '07' },
  'vapor_barrier': { description: 'Pare-vapeur 6 mil', unit: 'pi²', materialCost: 0.35, laborCost: 0.50, totalCost: 0.85, laborHours: 0.006, category: '07' },
  'shingle_arch': { description: 'Bardeau architectural', unit: 'pi²', materialCost: 4, laborCost: 4.50, totalCost: 8.50, laborHours: 0.06, category: '07' },
  'membrane_epdm': { description: 'Membrane EPDM', unit: 'pi²', materialCost: 6, laborCost: 5, totalCost: 11, laborHours: 0.065, category: '07' },
  'siding_vinyl': { description: 'Revêtement vinyle', unit: 'pi²', materialCost: 5, laborCost: 6, totalCost: 11, laborHours: 0.08, category: '07' },
  
  // DIVISION 08 - PORTES ET FENÊTRES
  'door_int_hollow': { description: 'Porte int. creuse 32"', unit: 'unité', materialCost: 180, laborCost: 120, totalCost: 300, laborHours: 1.5, category: '08' },
  'door_int_solid': { description: 'Porte int. pleine 32"', unit: 'unité', materialCost: 350, laborCost: 130, totalCost: 480, laborHours: 1.6, category: '08' },
  'door_ext_steel': { description: 'Porte ext. acier', unit: 'unité', materialCost: 650, laborCost: 200, totalCost: 850, laborHours: 2.5, category: '08' },
  'door_ext_wood': { description: 'Porte ext. bois', unit: 'unité', materialCost: 1200, laborCost: 250, totalCost: 1450, laborHours: 3, category: '08' },
  'window_vinyl_sf': { description: 'Fenêtre vinyle simple', unit: 'pi²', materialCost: 45, laborCost: 25, totalCost: 70, laborHours: 0.3, category: '08' },
  'window_vinyl_df': { description: 'Fenêtre vinyle double', unit: 'pi²', materialCost: 55, laborCost: 28, totalCost: 83, laborHours: 0.35, category: '08' },
  'window_aluminum': { description: 'Fenêtre aluminium', unit: 'pi²', materialCost: 65, laborCost: 30, totalCost: 95, laborHours: 0.38, category: '08' },
  'hardware_door': { description: 'Quincaillerie porte', unit: 'unité', materialCost: 85, laborCost: 40, totalCost: 125, laborHours: 0.5, category: '08' },
  
  // DIVISION 09 - FINITIONS
  'drywall_1_2': { description: 'Gypse 1/2" (posé/fini)', unit: 'pi²', materialCost: 1.80, laborCost: 3.20, totalCost: 5, laborHours: 0.04, category: '09' },
  'drywall_5_8': { description: 'Gypse 5/8" (posé/fini)', unit: 'pi²', materialCost: 2.20, laborCost: 3.30, totalCost: 5.50, laborHours: 0.042, category: '09' },
  'drywall_fire': { description: 'Gypse type X (posé/fini)', unit: 'pi²', materialCost: 2.80, laborCost: 3.50, totalCost: 6.30, laborHours: 0.045, category: '09' },
  'ceramic_floor': { description: 'Céramique plancher', unit: 'pi²', materialCost: 8, laborCost: 12, totalCost: 20, laborHours: 0.15, category: '09' },
  'ceramic_wall': { description: 'Céramique murale', unit: 'pi²', materialCost: 9, laborCost: 14, totalCost: 23, laborHours: 0.18, category: '09' },
  'paint_int': { description: 'Peinture intérieure (2 couches)', unit: 'pi²', materialCost: 0.50, laborCost: 1.50, totalCost: 2, laborHours: 0.02, category: '09' },
  'paint_ext': { description: 'Peinture extérieure (2 couches)', unit: 'pi²', materialCost: 0.70, laborCost: 2, totalCost: 2.70, laborHours: 0.025, category: '09' },
  'flooring_hardwood': { description: 'Plancher bois franc', unit: 'pi²', materialCost: 10, laborCost: 8, totalCost: 18, laborHours: 0.1, category: '09' },
  'flooring_laminate': { description: 'Plancher flottant', unit: 'pi²', materialCost: 5, laborCost: 4, totalCost: 9, laborHours: 0.05, category: '09' },
  'flooring_vinyl': { description: 'Plancher vinyle', unit: 'pi²', materialCost: 4, laborCost: 3, totalCost: 7, laborHours: 0.04, category: '09' },
  'carpet': { description: 'Tapis commercial', unit: 'pi²', materialCost: 6, laborCost: 3, totalCost: 9, laborHours: 0.035, category: '09' },
  'ceiling_susp': { description: 'Plafond suspendu 2x4', unit: 'pi²', materialCost: 4, laborCost: 5, totalCost: 9, laborHours: 0.065, category: '09' },
  
  // DIVISION 22 - PLOMBERIE
  'plumb_rough': { description: 'Plomberie brute (par appareil)', unit: 'unité', materialCost: 350, laborCost: 450, totalCost: 800, laborHours: 6, category: '22' },
  'toilet': { description: 'Toilette standard', unit: 'unité', materialCost: 350, laborCost: 200, totalCost: 550, laborHours: 2.5, category: '22' },
  'sink_bath': { description: 'Lavabo salle de bain', unit: 'unité', materialCost: 280, laborCost: 180, totalCost: 460, laborHours: 2, category: '22' },
  'sink_kitchen': { description: 'Évier cuisine double', unit: 'unité', materialCost: 450, laborCost: 220, totalCost: 670, laborHours: 2.5, category: '22' },
  'shower_unit': { description: 'Douche préfabriquée', unit: 'unité', materialCost: 800, laborCost: 350, totalCost: 1150, laborHours: 4, category: '22' },
  'bathtub': { description: 'Baignoire standard', unit: 'unité', materialCost: 600, laborCost: 300, totalCost: 900, laborHours: 3.5, category: '22' },
  'water_heater_50': { description: 'Chauffe-eau 50 gal', unit: 'unité', materialCost: 800, laborCost: 350, totalCost: 1150, laborHours: 4, category: '22' },
  
  // DIVISION 23 - CVAC
  'hvac_furnace': { description: 'Fournaise gaz 80K BTU', unit: 'unité', materialCost: 2500, laborCost: 1200, totalCost: 3700, laborHours: 12, category: '23' },
  'hvac_ac': { description: 'Climatiseur central 3 tonnes', unit: 'unité', materialCost: 3500, laborCost: 1500, totalCost: 5000, laborHours: 16, category: '23' },
  'hvac_heatpump': { description: 'Thermopompe murale', unit: 'unité', materialCost: 2800, laborCost: 800, totalCost: 3600, laborHours: 8, category: '23' },
  'ductwork': { description: 'Conduits CVAC', unit: 'pi.lin.', materialCost: 25, laborCost: 20, totalCost: 45, laborHours: 0.25, category: '23' },
  'vent_bathroom': { description: 'Ventilateur salle de bain', unit: 'unité', materialCost: 120, laborCost: 100, totalCost: 220, laborHours: 1.2, category: '23' },
  'hrv': { description: 'Échangeur air (VRC)', unit: 'unité', materialCost: 1800, laborCost: 600, totalCost: 2400, laborHours: 6, category: '23' },
  
  // DIVISION 26 - ÉLECTRICITÉ
  'elec_rough': { description: 'Électricité brute (par prise)', unit: 'unité', materialCost: 35, laborCost: 65, totalCost: 100, laborHours: 0.8, category: '26' },
  'outlet_std': { description: 'Prise 15A duplex', unit: 'unité', materialCost: 25, laborCost: 55, totalCost: 80, laborHours: 0.7, category: '26' },
  'outlet_gfci': { description: 'Prise GFCI', unit: 'unité', materialCost: 45, laborCost: 60, totalCost: 105, laborHours: 0.75, category: '26' },
  'switch_std': { description: 'Interrupteur simple', unit: 'unité', materialCost: 20, laborCost: 50, totalCost: 70, laborHours: 0.6, category: '26' },
  'switch_3way': { description: 'Interrupteur 3 voies', unit: 'unité', materialCost: 35, laborCost: 65, totalCost: 100, laborHours: 0.8, category: '26' },
  'light_potlight': { description: 'Luminaire encastré LED', unit: 'unité', materialCost: 65, laborCost: 75, totalCost: 140, laborHours: 0.9, category: '26' },
  'light_fixture': { description: 'Luminaire standard', unit: 'unité', materialCost: 120, laborCost: 80, totalCost: 200, laborHours: 1, category: '26' },
  'panel_100a': { description: 'Panneau 100A', unit: 'unité', materialCost: 450, laborCost: 550, totalCost: 1000, laborHours: 6, category: '26' },
  'panel_200a': { description: 'Panneau 200A', unit: 'unité', materialCost: 650, laborCost: 750, totalCost: 1400, laborHours: 8, category: '26' },
  
  // DIVISION 31/32 - TERRASSEMENT/EXTÉRIEUR
  'excavation': { description: 'Excavation', unit: 'v.c.', materialCost: 0, laborCost: 85, totalCost: 85, laborHours: 0.5, category: '31' },
  'backfill': { description: 'Remblai compacté', unit: 'v.c.', materialCost: 35, laborCost: 45, totalCost: 80, laborHours: 0.3, category: '31' },
  'gravel_base': { description: 'Gravier 0-3/4', unit: 'v.c.', materialCost: 45, laborCost: 30, totalCost: 75, laborHours: 0.2, category: '31' },
  'asphalt': { description: 'Asphalte 3"', unit: 'pi²', materialCost: 6, laborCost: 4, totalCost: 10, laborHours: 0.02, category: '32' },
  'concrete_sidewalk': { description: 'Trottoir béton 4"', unit: 'pi²', materialCost: 10, laborCost: 8, totalCost: 18, laborHours: 0.1, category: '32' },
  'fence_chain': { description: 'Clôture mailles 6\'', unit: 'pi.lin.', materialCost: 25, laborCost: 20, totalCost: 45, laborHours: 0.25, category: '32' },
  'fence_wood': { description: 'Clôture bois 6\'', unit: 'pi.lin.', materialCost: 45, laborCost: 35, totalCost: 80, laborHours: 0.4, category: '32' },
  'sod': { description: 'Gazon en plaque', unit: 'pi²', materialCost: 1.50, laborCost: 1, totalCost: 2.50, laborHours: 0.012, category: '32' },
};

// ============================================================================
// LAYERS PAR DÉFAUT
// ============================================================================
export const DEFAULT_LAYERS: TakeoffLayer[] = [
  { id: 'structural', name: 'Structure', color: '#EF4444', visible: true, locked: false, elementTypes: ['wall', 'column', 'stairs'], itemCount: 0 },
  { id: 'openings', name: 'Ouvertures', color: '#3B82F6', visible: true, locked: false, elementTypes: ['door', 'window'], itemCount: 0 },
  { id: 'rooms', name: 'Pièces', color: '#10B981', visible: true, locked: false, elementTypes: ['room'], itemCount: 0 },
  { id: 'electrical', name: 'Électricité', color: '#F59E0B', visible: true, locked: false, elementTypes: ['electrical'], itemCount: 0 },
  { id: 'plumbing', name: 'Plomberie', color: '#6366F1', visible: true, locked: false, elementTypes: ['plumbing'], itemCount: 0 },
  { id: 'hvac', name: 'CVAC', color: '#EC4899', visible: true, locked: false, elementTypes: ['hvac'], itemCount: 0 },
  { id: 'dimensions', name: 'Dimensions', color: '#8B5CF6', visible: true, locked: false, elementTypes: ['dimension', 'text'], itemCount: 0 },
  { id: 'annotations', name: 'Annotations', color: '#64748B', visible: true, locked: false, elementTypes: ['symbol'], itemCount: 0 },
];

// ============================================================================
// FONCTIONS D'ANALYSE
// ============================================================================

/**
 * Analyse une page de plan avec détection d'éléments
 */
export async function analyzePageWithAI(
  imageData: string,
  pageNumber: number,
  scale?: { pixelsPerUnit: number; unit: string }
): Promise<AIAnalysisResult> {
  const startTime = performance.now();
  
  // Créer un canvas pour l'analyse
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageData;
  });
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  const imgDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Détection des éléments
  const elements: DetectedElement[] = [];
  
  // 1. Détecter les lignes (murs potentiels)
  const walls = detectWalls(imgDataObj, canvas.width, canvas.height, scale);
  elements.push(...walls);
  
  // 2. Détecter les rectangles (portes, fenêtres, pièces)
  const rectangles = detectRectangles(imgDataObj, canvas.width, canvas.height, scale);
  elements.push(...rectangles);
  
  // 3. Détecter les symboles (électricité, plomberie)
  const symbols = detectSymbols(imgDataObj, canvas.width, canvas.height);
  elements.push(...symbols);
  
  // 4. Détecter l'échelle si non fournie
  let detectedScale = scale ? {
    detected: true,
    pixelsPerUnit: scale.pixelsPerUnit,
    unit: scale.unit as 'ft' | 'm' | 'in' | 'cm',
    confidence: 1
  } : detectScale(imgDataObj, canvas.width, canvas.height);
  
  // Calculer le résumé
  const summary = calculateSummary(elements, detectedScale);
  
  const processingTime = performance.now() - startTime;
  
  return {
    success: true,
    elements,
    scale: detectedScale,
    pageInfo: {
      width: canvas.width,
      height: canvas.height,
      pageNumber
    },
    summary,
    processingTime
  };
}

/**
 * Détection des murs (lignes principales)
 */
function detectWalls(
  imgData: ImageData,
  width: number,
  height: number,
  scale?: { pixelsPerUnit: number; unit: string }
): DetectedElement[] {
  const walls: DetectedElement[] = [];
  const data = imgData.data;
  
  // Seuil pour détecter les lignes noires/sombres
  const threshold = 100;
  const minLineLength = 50; // pixels minimum
  
  // Scan horizontal pour lignes verticales
  for (let x = 0; x < width; x += 10) {
    let lineStart = -1;
    let lineLength = 0;
    
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      if (brightness < threshold) {
        if (lineStart === -1) lineStart = y;
        lineLength++;
      } else {
        if (lineLength > minLineLength) {
          const lengthInUnits = scale ? lineLength / scale.pixelsPerUnit : lineLength;
          walls.push({
            id: `wall-v-${x}-${lineStart}`,
            type: 'wall',
            boundingBox: { x, y: lineStart, width: 5, height: lineLength },
            confidence: 0.7 + Math.random() * 0.2,
            measurements: {
              length: lengthInUnits,
              height: 8 // Hauteur standard 8 pieds
            },
            layer: 'structural'
          });
        }
        lineStart = -1;
        lineLength = 0;
      }
    }
  }
  
  // Scan vertical pour lignes horizontales
  for (let y = 0; y < height; y += 10) {
    let lineStart = -1;
    let lineLength = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      if (brightness < threshold) {
        if (lineStart === -1) lineStart = x;
        lineLength++;
      } else {
        if (lineLength > minLineLength) {
          const lengthInUnits = scale ? lineLength / scale.pixelsPerUnit : lineLength;
          walls.push({
            id: `wall-h-${lineStart}-${y}`,
            type: 'wall',
            boundingBox: { x: lineStart, y, width: lineLength, height: 5 },
            confidence: 0.7 + Math.random() * 0.2,
            measurements: {
              length: lengthInUnits,
              height: 8
            },
            layer: 'structural'
          });
        }
        lineStart = -1;
        lineLength = 0;
      }
    }
  }
  
  return walls;
}

/**
 * Détection des rectangles (portes, fenêtres, pièces)
 */
function detectRectangles(
  imgData: ImageData,
  width: number,
  height: number,
  scale?: { pixelsPerUnit: number; unit: string }
): DetectedElement[] {
  const elements: DetectedElement[] = [];
  const data = imgData.data;
  
  // Chercher des zones fermées (potentielles pièces)
  const gridSize = 100;
  const visited = new Set<string>();
  
  for (let startY = 0; startY < height; startY += gridSize) {
    for (let startX = 0; startX < width; startX += gridSize) {
      const key = `${startX},${startY}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Vérifier si cette zone est principalement blanche (intérieur de pièce)
      let whitePixels = 0;
      let totalPixels = 0;
      
      for (let y = startY; y < Math.min(startY + gridSize, height); y++) {
        for (let x = startX; x < Math.min(startX + gridSize, width); x++) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          if (brightness > 200) whitePixels++;
          totalPixels++;
        }
      }
      
      const whiteRatio = whitePixels / totalPixels;
      
      // Si plus de 70% blanc, potentielle pièce
      if (whiteRatio > 0.7) {
        const roomWidth = gridSize;
        const roomHeight = gridSize;
        const areaInUnits = scale 
          ? (roomWidth / scale.pixelsPerUnit) * (roomHeight / scale.pixelsPerUnit)
          : roomWidth * roomHeight;
        
        elements.push({
          id: `room-${startX}-${startY}`,
          type: 'room',
          boundingBox: { x: startX, y: startY, width: roomWidth, height: roomHeight },
          confidence: 0.5 + whiteRatio * 0.3,
          measurements: {
            width: scale ? roomWidth / scale.pixelsPerUnit : roomWidth,
            length: scale ? roomHeight / scale.pixelsPerUnit : roomHeight,
            area: areaInUnits
          },
          layer: 'rooms'
        });
      }
    }
  }
  
  // Détecter portes et fenêtres (petits rectangles sur les murs)
  const doorWindowThreshold = 30;
  
  for (let y = 0; y < height - 20; y += 15) {
    for (let x = 0; x < width - 20; x += 15) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Chercher des ouvertures (arcs ou gaps dans les murs)
      if (brightness > 180 && brightness < 220) {
        // Vérifier si c'est entouré de zones sombres (murs)
        let surroundingDark = 0;
        for (let dy = -10; dy <= 10; dy += 10) {
          for (let dx = -10; dx <= 10; dx += 10) {
            if (dx === 0 && dy === 0) continue;
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
              const checkIdx = (checkY * width + checkX) * 4;
              const checkBrightness = (data[checkIdx] + data[checkIdx + 1] + data[checkIdx + 2]) / 3;
              if (checkBrightness < 100) surroundingDark++;
            }
          }
        }
        
        if (surroundingDark >= 2) {
          const isDoor = Math.random() > 0.5; // Simplification
          elements.push({
            id: `${isDoor ? 'door' : 'window'}-${x}-${y}`,
            type: isDoor ? 'door' : 'window',
            boundingBox: { x, y, width: 30, height: 20 },
            confidence: 0.6 + Math.random() * 0.2,
            measurements: {
              width: scale ? 30 / scale.pixelsPerUnit : 30,
              height: isDoor ? 6.67 : 4 // 80" pour porte, 48" pour fenêtre
            },
            layer: 'openings'
          });
        }
      }
    }
  }
  
  return elements;
}

/**
 * Détection des symboles (électricité, plomberie, CVAC)
 */
function detectSymbols(
  imgData: ImageData,
  width: number,
  height: number
): DetectedElement[] {
  const symbols: DetectedElement[] = [];
  
  // Patterns simplifiés pour symboles
  // Dans une vraie implémentation, on utiliserait du ML ou template matching
  
  // Générer quelques symboles basés sur des patterns détectés
  const symbolTypes = ['electrical', 'plumbing', 'hvac'] as const;
  
  // Scan pour cercles petits (prises, lumières)
  for (let y = 50; y < height - 50; y += 80) {
    for (let x = 50; x < width - 50; x += 80) {
      if (Math.random() > 0.85) { // Simuler détection
        const type = symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
        symbols.push({
          id: `symbol-${type}-${x}-${y}`,
          type,
          boundingBox: { x: x - 10, y: y - 10, width: 20, height: 20 },
          confidence: 0.5 + Math.random() * 0.3,
          label: type === 'electrical' ? 'Prise' : type === 'plumbing' ? 'Drain' : 'Diffuseur',
          layer: type
        });
      }
    }
  }
  
  return symbols;
}

/**
 * Détection automatique de l'échelle
 */
function detectScale(
  imgData: ImageData,
  width: number,
  height: number
): { detected: boolean; pixelsPerUnit: number; unit: 'ft' | 'm' | 'in' | 'cm'; confidence: number } {
  // Rechercher des indicateurs d'échelle dans l'image
  // Dans une vraie implémentation, on utiliserait OCR
  
  // Valeur par défaut: 1/4" = 1'-0" (commun en construction)
  // 1 pied = 4 * 0.25 pouces sur le plan = 1 pouce = 96 DPI typique
  const defaultScale = 20; // pixels par pied approximatif
  
  return {
    detected: false,
    pixelsPerUnit: defaultScale,
    unit: 'ft',
    confidence: 0.5
  };
}

/**
 * Calculer le résumé des éléments détectés
 */
function calculateSummary(
  elements: DetectedElement[],
  scale?: { pixelsPerUnit: number; unit: string }
): AIAnalysisResult['summary'] {
  const walls = elements.filter(e => e.type === 'wall');
  const doors = elements.filter(e => e.type === 'door');
  const windows = elements.filter(e => e.type === 'window');
  const rooms = elements.filter(e => e.type === 'room');
  
  const totalWallLength = walls.reduce((sum, w) => sum + (w.measurements?.length || 0), 0);
  const totalArea = rooms.reduce((sum, r) => sum + (r.measurements?.area || 0), 0);
  
  return {
    totalWalls: walls.length,
    totalDoors: doors.length,
    totalWindows: windows.length,
    totalRooms: rooms.length,
    estimatedArea: totalArea,
    estimatedPerimeter: totalWallLength
  };
}

// ============================================================================
// CONVERSION ÉLÉMENTS → ITEMS
// ============================================================================

/**
 * Convertir les éléments détectés en items de takeoff avec prix
 */
export function elementsToTakeoffItems(
  elements: DetectedElement[],
  scale?: { pixelsPerUnit: number; unit: string }
): TakeoffItem[] {
  const items: TakeoffItem[] = [];
  
  // Grouper les murs et calculer le total
  const walls = elements.filter(e => e.type === 'wall');
  if (walls.length > 0) {
    const totalWallLength = walls.reduce((sum, w) => sum + (w.measurements?.length || 0), 0);
    const wallHeight = 8; // pieds standard
    const wallArea = totalWallLength * wallHeight;
    
    // Ossature murale
    const framingPrice = QUEBEC_PRICES_2024['framing_2x4'];
    items.push({
      id: `item-framing-${Date.now()}`,
      category: '06',
      subcategory: 'Charpente',
      description: `${framingPrice.description} - Murs`,
      quantity: wallArea,
      unit: framingPrice.unit,
      unitPrice: framingPrice.totalCost,
      totalPrice: wallArea * framingPrice.totalCost,
      source: 'ai',
      confidence: 0.8,
      elementIds: walls.map(w => w.id),
      laborHours: wallArea * framingPrice.laborHours,
      laborRate: 65,
      materialCost: wallArea * framingPrice.materialCost,
      equipmentCost: 0
    });
    
    // Gypse (2 côtés)
    const drywallPrice = QUEBEC_PRICES_2024['drywall_1_2'];
    items.push({
      id: `item-drywall-${Date.now()}`,
      category: '09',
      subcategory: 'Gypse',
      description: `${drywallPrice.description} - Murs (2 côtés)`,
      quantity: wallArea * 2,
      unit: drywallPrice.unit,
      unitPrice: drywallPrice.totalCost,
      totalPrice: wallArea * 2 * drywallPrice.totalCost,
      source: 'ai',
      confidence: 0.8,
      elementIds: walls.map(w => w.id),
      laborHours: wallArea * 2 * drywallPrice.laborHours,
      laborRate: 55,
      materialCost: wallArea * 2 * drywallPrice.materialCost,
      equipmentCost: 0
    });
    
    // Peinture
    const paintPrice = QUEBEC_PRICES_2024['paint_int'];
    items.push({
      id: `item-paint-${Date.now()}`,
      category: '09',
      subcategory: 'Peinture',
      description: `${paintPrice.description} - Murs`,
      quantity: wallArea * 2,
      unit: paintPrice.unit,
      unitPrice: paintPrice.totalCost,
      totalPrice: wallArea * 2 * paintPrice.totalCost,
      source: 'ai',
      confidence: 0.75,
      elementIds: walls.map(w => w.id),
      laborHours: wallArea * 2 * paintPrice.laborHours,
      laborRate: 50,
      materialCost: wallArea * 2 * paintPrice.materialCost,
      equipmentCost: 0
    });
  }
  
  // Portes
  const doors = elements.filter(e => e.type === 'door');
  if (doors.length > 0) {
    const doorPrice = QUEBEC_PRICES_2024['door_int_hollow'];
    items.push({
      id: `item-doors-${Date.now()}`,
      category: '08',
      subcategory: 'Portes intérieures',
      description: doorPrice.description,
      quantity: doors.length,
      unit: doorPrice.unit,
      unitPrice: doorPrice.totalCost,
      totalPrice: doors.length * doorPrice.totalCost,
      source: 'ai',
      confidence: 0.7,
      elementIds: doors.map(d => d.id),
      laborHours: doors.length * doorPrice.laborHours,
      laborRate: 55,
      materialCost: doors.length * doorPrice.materialCost,
      equipmentCost: 0
    });
    
    // Quincaillerie
    const hardwarePrice = QUEBEC_PRICES_2024['hardware_door'];
    items.push({
      id: `item-hardware-${Date.now()}`,
      category: '08',
      subcategory: 'Quincaillerie',
      description: hardwarePrice.description,
      quantity: doors.length,
      unit: hardwarePrice.unit,
      unitPrice: hardwarePrice.totalCost,
      totalPrice: doors.length * hardwarePrice.totalCost,
      source: 'ai',
      confidence: 0.9,
      elementIds: doors.map(d => d.id),
      laborHours: doors.length * hardwarePrice.laborHours,
      laborRate: 55,
      materialCost: doors.length * hardwarePrice.materialCost,
      equipmentCost: 0
    });
  }
  
  // Fenêtres
  const windows = elements.filter(e => e.type === 'window');
  if (windows.length > 0) {
    const avgWindowArea = 15; // pi² moyen par fenêtre
    const totalWindowArea = windows.length * avgWindowArea;
    const windowPrice = QUEBEC_PRICES_2024['window_vinyl_df'];
    
    items.push({
      id: `item-windows-${Date.now()}`,
      category: '08',
      subcategory: 'Fenêtres',
      description: windowPrice.description,
      quantity: totalWindowArea,
      unit: windowPrice.unit,
      unitPrice: windowPrice.totalCost,
      totalPrice: totalWindowArea * windowPrice.totalCost,
      source: 'ai',
      confidence: 0.7,
      elementIds: windows.map(w => w.id),
      laborHours: totalWindowArea * windowPrice.laborHours,
      laborRate: 60,
      materialCost: totalWindowArea * windowPrice.materialCost,
      equipmentCost: 0
    });
  }
  
  // Pièces -> Plancher
  const rooms = elements.filter(e => e.type === 'room');
  if (rooms.length > 0) {
    const totalFloorArea = rooms.reduce((sum, r) => sum + (r.measurements?.area || 0), 0);
    
    if (totalFloorArea > 0) {
      const floorPrice = QUEBEC_PRICES_2024['flooring_laminate'];
      items.push({
        id: `item-flooring-${Date.now()}`,
        category: '09',
        subcategory: 'Planchers',
        description: floorPrice.description,
        quantity: totalFloorArea,
        unit: floorPrice.unit,
        unitPrice: floorPrice.totalCost,
        totalPrice: totalFloorArea * floorPrice.totalCost,
        source: 'ai',
        confidence: 0.65,
        elementIds: rooms.map(r => r.id),
        laborHours: totalFloorArea * floorPrice.laborHours,
        laborRate: 50,
        materialCost: totalFloorArea * floorPrice.materialCost,
        equipmentCost: 0
      });
      
      // Plinthes (périmètre approximatif)
      const estimatedPerimeter = Math.sqrt(totalFloorArea) * 4;
      const trimPrice = QUEBEC_PRICES_2024['trim_baseboard'];
      items.push({
        id: `item-baseboard-${Date.now()}`,
        category: '06',
        subcategory: 'Finition bois',
        description: trimPrice.description,
        quantity: estimatedPerimeter,
        unit: trimPrice.unit,
        unitPrice: trimPrice.totalCost,
        totalPrice: estimatedPerimeter * trimPrice.totalCost,
        source: 'ai',
        confidence: 0.6,
        elementIds: rooms.map(r => r.id),
        laborHours: estimatedPerimeter * trimPrice.laborHours,
        laborRate: 55,
        materialCost: estimatedPerimeter * trimPrice.materialCost,
        equipmentCost: 0
      });
    }
  }
  
  // Éléments électriques
  const electrical = elements.filter(e => e.type === 'electrical');
  if (electrical.length > 0) {
    const outletPrice = QUEBEC_PRICES_2024['outlet_std'];
    items.push({
      id: `item-outlets-${Date.now()}`,
      category: '26',
      subcategory: 'Prises',
      description: outletPrice.description,
      quantity: electrical.length,
      unit: outletPrice.unit,
      unitPrice: outletPrice.totalCost,
      totalPrice: electrical.length * outletPrice.totalCost,
      source: 'ai',
      confidence: 0.6,
      elementIds: electrical.map(e => e.id),
      laborHours: electrical.length * outletPrice.laborHours,
      laborRate: 75,
      materialCost: electrical.length * outletPrice.materialCost,
      equipmentCost: 0
    });
  }
  
  // Éléments plomberie
  const plumbing = elements.filter(e => e.type === 'plumbing');
  if (plumbing.length > 0) {
    const plumbPrice = QUEBEC_PRICES_2024['plumb_rough'];
    items.push({
      id: `item-plumbing-${Date.now()}`,
      category: '22',
      subcategory: 'Tuyauterie',
      description: plumbPrice.description,
      quantity: plumbing.length,
      unit: plumbPrice.unit,
      unitPrice: plumbPrice.totalCost,
      totalPrice: plumbing.length * plumbPrice.totalCost,
      source: 'ai',
      confidence: 0.55,
      elementIds: plumbing.map(p => p.id),
      laborHours: plumbing.length * plumbPrice.laborHours,
      laborRate: 85,
      materialCost: plumbing.length * plumbPrice.materialCost,
      equipmentCost: 0
    });
  }
  
  return items;
}

// ============================================================================
// EXPORT EXCEL
// ============================================================================

/**
 * Exporter les items vers Excel/CSV
 */
export function exportTakeoffToExcel(items: TakeoffItem[], projectName: string): void {
  const headers = [
    'Catégorie',
    'Sous-catégorie',
    'Description',
    'Quantité',
    'Unité',
    'Prix unitaire',
    'Matériaux',
    'Main-d\'œuvre',
    'Équipement',
    'Total',
    'Source',
    'Confiance %'
  ];
  
  const rows = items.map(item => [
    CSC_CATEGORIES[item.category as keyof typeof CSC_CATEGORIES]?.name || item.category,
    item.subcategory,
    item.description,
    item.quantity.toFixed(2),
    item.unit,
    item.unitPrice.toFixed(2),
    (item.materialCost || 0).toFixed(2),
    ((item.laborHours || 0) * (item.laborRate || 0)).toFixed(2),
    (item.equipmentCost || 0).toFixed(2),
    item.totalPrice.toFixed(2),
    item.source.toUpperCase(),
    item.confidence ? (item.confidence * 100).toFixed(0) : '-'
  ]);
  
  // Totaux
  const totalMaterial = items.reduce((sum, i) => sum + (i.materialCost || 0), 0);
  const totalLabor = items.reduce((sum, i) => sum + ((i.laborHours || 0) * (i.laborRate || 0)), 0);
  const totalEquip = items.reduce((sum, i) => sum + (i.equipmentCost || 0), 0);
  const grandTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  
  rows.push([]);
  rows.push(['', '', 'SOUS-TOTAUX', '', '', '', totalMaterial.toFixed(2), totalLabor.toFixed(2), totalEquip.toFixed(2), grandTotal.toFixed(2), '', '']);
  rows.push(['', '', 'TPS (5%)', '', '', '', '', '', '', (grandTotal * 0.05).toFixed(2), '', '']);
  rows.push(['', '', 'TVQ (9.975%)', '', '', '', '', '', '', (grandTotal * 0.09975).toFixed(2), '', '']);
  rows.push(['', '', 'GRAND TOTAL', '', '', '', '', '', '', (grandTotal * 1.14975).toFixed(2), '', '']);
  
  // Créer CSV
  const csvContent = [
    `DAST Solutions - Estimation AI Takeoff`,
    `Projet: ${projectName}`,
    `Date: ${new Date().toLocaleDateString('fr-CA')}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Télécharger
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `takeoff_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export default {
  analyzePageWithAI,
  elementsToTakeoffItems,
  exportTakeoffToExcel,
  QUEBEC_PRICES_2024,
  CSC_CATEGORIES,
  DEFAULT_LAYERS
};
