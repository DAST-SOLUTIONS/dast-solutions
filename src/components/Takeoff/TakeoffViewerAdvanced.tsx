/**
 * DAST Solutions - TakeoffViewer Avancé
 * Intégration AI, Layers, Outils de mesure avancés
 * VERSION CORRIGÉE - pdfjs-dist v4 compatible
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import {
  Upload, ZoomIn, ZoomOut, RotateCw, Ruler, Square, Circle,
  MousePointer, Move, Layers, Eye, EyeOff, Lock, Unlock,
  Download, FileSpreadsheet, Trash2,
  ChevronLeft, ChevronRight,
  Cpu, Wand2, Target, PenTool, Hash, ArrowRight,
  AlertCircle, Loader2, X,
  Calculator, Send
} from 'lucide-react';
import {
  analyzePageWithAI,
  elementsToTakeoffItems,
  exportTakeoffToExcel,
  CSC_CATEGORIES,
  DEFAULT_LAYERS,
  type DetectedElement,
  type AIAnalysisResult,
  type TakeoffItem,
  type TakeoffLayer
} from '@/services/aiTakeoffService';

// Configuration PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ============================================================================
// TYPES
// ============================================================================
interface Measurement {
  id: string;
  type: 'line' | 'rectangle' | 'polygon' | 'circle' | 'count' | 'polyline';
  points: { x: number; y: number }[];
  value: number;
  unit: string;
  label: string;
  color: string;
  layer: string;
  pageNumber: number;
}

interface ScaleConfig {
  pixelsPerUnit: number;
  unit: 'ft' | 'm' | 'in' | 'cm';
  isCalibrated: boolean;
  calibrationPoints?: { x: number; y: number }[];
  knownDistance?: number;
}

type Tool = 'select' | 'pan' | 'line' | 'rectangle' | 'polygon' | 'circle' | 'count' | 'polyline' | 'calibrate';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function TakeoffViewerAdvanced() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  // États PDF
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImages, setPageImages] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États vue
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  
  // États outils
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  
  // États échelle
  const [scale, setScale] = useState<ScaleConfig>({
    pixelsPerUnit: 20,
    unit: 'ft',
    isCalibrated: false
  });
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<'start' | 'point1' | 'point2' | 'distance'>('start');
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);
  const [knownDistance, setKnownDistance] = useState('');
  
  // États layers
  const [layers, setLayers] = useState<TakeoffLayer[]>(DEFAULT_LAYERS);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  
  // États AI
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  
  // États takeoff items
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([]);
  const [showItemsPanel, setShowItemsPanel] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  
  // ============================================================================
  // CHARGEMENT PDF
  // ============================================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier PDF');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setPageImages(new Map());
      setMeasurements([]);
      setDetectedElements([]);
      setAiResult(null);
      setTakeoffItems([]);
      
      await renderPage(pdf, 1);
    } catch (err) {
      console.error('Erreur chargement PDF:', err);
      setError('Erreur lors du chargement du PDF');
    } finally {
      setLoading(false);
    }
  };
  
  const renderPage = async (pdf: pdfjs.PDFDocumentProxy, pageNum: number) => {
    if (pageImages.has(pageNum)) return;
    
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    // FIX: pdfjs-dist v4 requires canvas in RenderParameters
    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas
    } as any).promise;
    
    const imageUrl = canvas.toDataURL('image/png');
    setPageImages(prev => new Map(prev).set(pageNum, imageUrl));
  };
  
  // ============================================================================
  // RENDU CANVAS
  // ============================================================================
  useEffect(() => {
    if (!pageImages.has(currentPage)) return;
    
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;
    
    const ctx = canvas.getContext('2d')!;
    const overlayCtx = overlay.getContext('2d')!;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      overlay.width = img.width;
      overlay.height = img.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      drawOverlay(overlayCtx);
    };
    img.src = pageImages.get(currentPage)!;
  }, [pageImages, currentPage, rotation, measurements, detectedElements, selectedElements, layers, currentMeasurement]);
  
  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Dessiner les éléments AI détectés
    detectedElements
      .filter(el => {
        const layer = layers.find(l => l.elementTypes.includes(el.type));
        return layer?.visible;
      })
      .forEach(element => {
        const isSelected = selectedElements.has(element.id);
        const layer = layers.find(l => l.elementTypes.includes(element.type));
        const color = layer?.color || '#666';
        
        ctx.strokeStyle = isSelected ? '#FFD700' : color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fillStyle = `${color}33`;
        
        const { x, y, width, height } = element.boundingBox;
        
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fill();
        ctx.stroke();
        
        if (element.label || element.type) {
          ctx.fillStyle = color;
          ctx.font = '12px sans-serif';
          ctx.fillText(element.label || element.type, x, y - 5);
        }
        
        if (element.confidence) {
          ctx.fillStyle = '#666';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${(element.confidence * 100).toFixed(0)}%`, x + width - 25, y + height + 12);
        }
      });
    
    // Dessiner les mesures
    measurements
      .filter(m => m.pageNumber === currentPage)
      .filter(m => {
        const layer = layers.find(l => l.id === m.layer);
        return layer?.visible;
      })
      .forEach(measurement => {
        const isSelected = selectedMeasurement === measurement.id;
        ctx.strokeStyle = isSelected ? '#FFD700' : measurement.color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fillStyle = `${measurement.color}33`;
        
        drawMeasurement(ctx, measurement);
      });
    
    // Dessiner la mesure en cours
    if (currentMeasurement && currentMeasurement.points && currentMeasurement.points.length > 0) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      drawMeasurement(ctx, currentMeasurement as Measurement);
      ctx.setLineDash([]);
    }
    
    // Points de calibration
    if (calibrationStep !== 'start' && calibrationPoints.length > 0) {
      ctx.fillStyle = '#FF0000';
      calibrationPoints.forEach((point, i) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${i + 1}`, point.x - 4, point.y + 4);
        ctx.fillStyle = '#FF0000';
      });
    }
  };
  
  const drawMeasurement = (ctx: CanvasRenderingContext2D, m: Partial<Measurement>) => {
    if (!m.points || m.points.length === 0) return;
    
    switch (m.type) {
      case 'line':
      case 'polyline':
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        
        if (m.value && m.points.length >= 2) {
          const midX = (m.points[0].x + m.points[m.points.length - 1].x) / 2;
          const midY = (m.points[0].y + m.points[m.points.length - 1].y) / 2;
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, midX + 5, midY - 5);
        }
        break;
        
      case 'rectangle':
        if (m.points.length >= 2) {
          const width = m.points[1].x - m.points[0].x;
          const height = m.points[1].y - m.points[0].y;
          ctx.beginPath();
          ctx.rect(m.points[0].x, m.points[0].y, width, height);
          ctx.fill();
          ctx.stroke();
          
          if (m.value) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, m.points[0].x + 5, m.points[0].y + 20);
          }
        }
        break;
        
      case 'polygon':
        if (m.points.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(m.points[0].x, m.points[0].y);
          m.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          if (m.value) {
            const centroid = m.points.reduce(
              (acc, p) => ({ x: acc.x + p.x / m.points!.length, y: acc.y + p.y / m.points!.length }),
              { x: 0, y: 0 }
            );
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, centroid.x, centroid.y);
          }
        }
        break;
        
      case 'circle':
        if (m.points.length >= 2) {
          const radius = Math.sqrt(
            Math.pow(m.points[1].x - m.points[0].x, 2) +
            Math.pow(m.points[1].y - m.points[0].y, 2)
          );
          ctx.beginPath();
          ctx.arc(m.points[0].x, m.points[0].y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          if (m.value) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${m.value.toFixed(2)} ${m.unit}`, m.points[0].x + 5, m.points[0].y);
          }
        }
        break;
        
      case 'count':
        m.points.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`${i + 1}`, p.x - 4, p.y + 4);
          ctx.fillStyle = (m.color || '#666') + '33';
        });
        break;
    }
  };
  
  // ============================================================================
  // GESTION SOURIS
  // ============================================================================
  const getCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    if (activeTool === 'calibrate') {
      if (calibrationStep === 'point1' || calibrationStep === 'point2') {
        setCalibrationPoints(prev => [...prev, coords]);
        if (calibrationStep === 'point1') {
          setCalibrationStep('point2');
        } else {
          setCalibrationStep('distance');
        }
      }
      return;
    }
    
    if (activeTool === 'select') {
      const clickedElement = detectedElements.find(el => {
        const { x, y, width, height } = el.boundingBox;
        return coords.x >= x && coords.x <= x + width && coords.y >= y && coords.y <= y + height;
      });
      
      if (clickedElement) {
        setSelectedElements(prev => {
          const newSet = new Set(prev);
          if (e.ctrlKey || e.metaKey) {
            if (newSet.has(clickedElement.id)) {
              newSet.delete(clickedElement.id);
            } else {
              newSet.add(clickedElement.id);
            }
          } else {
            newSet.clear();
            newSet.add(clickedElement.id);
          }
          return newSet;
        });
        return;
      }
      
      setSelectedElements(new Set());
      setSelectedMeasurement(null);
      return;
    }
    
    if (['line', 'rectangle', 'polygon', 'circle', 'polyline', 'count'].includes(activeTool)) {
      if (!currentMeasurement) {
        setCurrentMeasurement({
          id: `m-${Date.now()}`,
          type: activeTool as Measurement['type'],
          points: [coords],
          color: layers.find(l => l.id === 'annotations')?.color || '#64748B',
          layer: 'annotations',
          pageNumber: currentPage,
          unit: scale.unit === 'ft' ? 'pi' : scale.unit
        });
      } else {
        const newPoints = [...(currentMeasurement.points || []), coords];
        
        if (
          (activeTool === 'line' && newPoints.length === 2) ||
          (activeTool === 'rectangle' && newPoints.length === 2) ||
          (activeTool === 'circle' && newPoints.length === 2)
        ) {
          completeMeasurement(newPoints);
        } else if (activeTool === 'polygon' || activeTool === 'polyline') {
          setCurrentMeasurement(prev => ({ ...prev, points: newPoints }));
        } else if (activeTool === 'count') {
          setCurrentMeasurement(prev => ({
            ...prev,
            points: newPoints,
            value: newPoints.length
          }));
        }
      }
    }
  };
  
  const handleDoubleClick = () => {
    if ((activeTool === 'polygon' || activeTool === 'polyline') && currentMeasurement?.points && currentMeasurement.points.length >= 3) {
      completeMeasurement(currentMeasurement.points);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current && activeTool === 'pan') {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  const handleMouseUp = () => {
    isPanning.current = false;
  };
  
  const completeMeasurement = (points: { x: number; y: number }[]) => {
    if (!currentMeasurement) return;
    
    let value = 0;
    let unit = scale.unit === 'ft' ? 'pi' : scale.unit;
    
    switch (currentMeasurement.type) {
      case 'line':
      case 'polyline':
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i - 1].x;
          const dy = points[i].y - points[i - 1].y;
          value += Math.sqrt(dx * dx + dy * dy) / scale.pixelsPerUnit;
        }
        break;
        
      case 'rectangle':
        const rectWidth = Math.abs(points[1].x - points[0].x) / scale.pixelsPerUnit;
        const rectHeight = Math.abs(points[1].y - points[0].y) / scale.pixelsPerUnit;
        value = rectWidth * rectHeight;
        unit = scale.unit === 'ft' ? 'pi²' : `${scale.unit}²`;
        break;
        
      case 'polygon':
        let area = 0;
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          area += points[i].x * points[j].y;
          area -= points[j].x * points[i].y;
        }
        value = Math.abs(area / 2) / (scale.pixelsPerUnit * scale.pixelsPerUnit);
        unit = scale.unit === 'ft' ? 'pi²' : `${scale.unit}²`;
        break;
        
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(points[1].x - points[0].x, 2) +
          Math.pow(points[1].y - points[0].y, 2)
        ) / scale.pixelsPerUnit;
        value = Math.PI * radius * radius;
        unit = scale.unit === 'ft' ? 'pi²' : `${scale.unit}²`;
        break;
        
      case 'count':
        value = points.length;
        unit = 'unités';
        break;
    }
    
    const newMeasurement: Measurement = {
      id: currentMeasurement.id!,
      type: currentMeasurement.type!,
      points,
      value,
      unit,
      label: currentMeasurement.label || `${currentMeasurement.type} ${measurements.length + 1}`,
      color: currentMeasurement.color!,
      layer: currentMeasurement.layer!,
      pageNumber: currentPage
    };
    
    setMeasurements(prev => [...prev, newMeasurement]);
    setCurrentMeasurement(null);
  };
  
  // ============================================================================
  // CALIBRATION ÉCHELLE
  // ============================================================================
  const startCalibration = () => {
    setActiveTool('calibrate');
    setCalibrationStep('point1');
    setCalibrationPoints([]);
    setShowScaleModal(true);
  };
  
  const completeCalibration = () => {
    if (calibrationPoints.length !== 2 || !knownDistance) return;
    
    const dx = calibrationPoints[1].x - calibrationPoints[0].x;
    const dy = calibrationPoints[1].y - calibrationPoints[0].y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const distance = parseFloat(knownDistance);
    
    setScale({
      pixelsPerUnit: pixelDistance / distance,
      unit: scale.unit,
      isCalibrated: true,
      calibrationPoints,
      knownDistance: distance
    });
    
    setShowScaleModal(false);
    setCalibrationStep('start');
    setCalibrationPoints([]);
    setKnownDistance('');
    setActiveTool('select');
  };
  
  // ============================================================================
  // ANALYSE AI
  // ============================================================================
  const runAIAnalysis = async () => {
    const imageData = pageImages.get(currentPage);
    if (!imageData) return;
    
    setAiAnalyzing(true);
    setShowAIPanel(true);
    
    try {
      const result = await analyzePageWithAI(
        imageData,
        currentPage,
        scale.isCalibrated ? { pixelsPerUnit: scale.pixelsPerUnit, unit: scale.unit } : undefined
      );
      
      setAiResult(result);
      setDetectedElements(result.elements);
      
      setLayers(prev => prev.map(layer => ({
        ...layer,
        itemCount: result.elements.filter(el => layer.elementTypes.includes(el.type)).length
      })));
      
    } catch (err) {
      console.error('Erreur analyse AI:', err);
      setError('Erreur lors de l\'analyse AI');
    } finally {
      setAiAnalyzing(false);
    }
  };
  
  const convertToTakeoffItems = () => {
    const selectedEls = detectedElements.filter(el => selectedElements.has(el.id));
    const elementsToConvert = selectedEls.length > 0 ? selectedEls : detectedElements;
    
    const items = elementsToTakeoffItems(
      elementsToConvert,
      scale.isCalibrated ? { pixelsPerUnit: scale.pixelsPerUnit, unit: scale.unit } : undefined
    );
    
    setTakeoffItems(prev => [...prev, ...items]);
    setShowItemsPanel(true);
  };
  
  // ============================================================================
  // EXPORT
  // ============================================================================
  const handleExportExcel = () => {
    const projectName = `Projet-${projectId || 'nouveau'}`;
    exportTakeoffToExcel(takeoffItems, projectName);
  };
  
  const handleExportToEstimation = () => {
    localStorage.setItem('takeoff_items', JSON.stringify(takeoffItems));
    navigate(`/estimation${projectId ? `/${projectId}` : ''}`);
  };
  
  // ============================================================================
  // NAVIGATION PAGES
  // ============================================================================
  const goToPage = async (page: number) => {
    if (!pdfDoc || page < 1 || page > totalPages) return;
    setCurrentPage(page);
    await renderPage(pdfDoc, page);
  };
  
  // ============================================================================
  // LAYER TOGGLE
  // ============================================================================
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ));
  };
  
  const toggleLayerLock = (layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, locked: !l.locked } : l
    ));
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Upload size={18} />
          Charger PDF
        </button>
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
        
        {/* Outils de mesure */}
        <div className="flex gap-1">
          {[
            { tool: 'select', icon: MousePointer, label: 'Sélection' },
            { tool: 'pan', icon: Move, label: 'Déplacer' },
            { tool: 'line', icon: Ruler, label: 'Ligne' },
            { tool: 'rectangle', icon: Square, label: 'Rectangle' },
            { tool: 'polygon', icon: PenTool, label: 'Polygone' },
            { tool: 'circle', icon: Circle, label: 'Cercle' },
            { tool: 'polyline', icon: ArrowRight, label: 'Polyligne' },
            { tool: 'count', icon: Hash, label: 'Comptage' },
          ].map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool as Tool)}
              className={`p-2 rounded-lg ${
                activeTool === tool 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
        
        {/* Échelle */}
        <button
          onClick={startCalibration}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
            scale.isCalibrated 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
          }`}
        >
          <Target size={18} />
          {scale.isCalibrated ? `${scale.pixelsPerUnit.toFixed(1)} px/${scale.unit}` : 'Calibrer échelle'}
        </button>
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
        
        {/* AI Analysis */}
        <button
          onClick={runAIAnalysis}
          disabled={!pageImages.has(currentPage) || aiAnalyzing}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
        >
          {aiAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          🤖 Analyse IA
        </button>
        
        <button
          onClick={convertToTakeoffItems}
          disabled={detectedElements.length === 0}
          className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
        >
          <Calculator size={18} />
          Convertir en devis
        </button>
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
        
        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ZoomOut size={18} />
          </button>
          <span className="w-16 text-center text-sm">{(zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ZoomIn size={18} />
          </button>
        </div>
        
        <button 
          onClick={() => setRotation(r => (r + 90) % 360)} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Rotation"
        >
          <RotateCw size={18} />
        </button>
        
        <div className="flex-1" />
        
        {/* Panels toggle */}
        <button
          onClick={() => setShowLayersPanel(!showLayersPanel)}
          className={`p-2 rounded-lg ${showLayersPanel ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        >
          <Layers size={18} />
        </button>
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`p-2 rounded-lg ${showAIPanel ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
        >
          <Cpu size={18} />
        </button>
        <button
          onClick={() => setShowItemsPanel(!showItemsPanel)}
          className={`p-2 rounded-lg ${showItemsPanel ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'}`}
        >
          <FileSpreadsheet size={18} />
        </button>
        
        {/* Export */}
        <button
          onClick={handleExportExcel}
          disabled={takeoffItems.length === 0}
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download size={18} />
          Excel
        </button>
        
        <button
          onClick={handleExportToEstimation}
          disabled={takeoffItems.length === 0}
          className="px-3 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 hover:bg-orange-700 disabled:opacity-50"
        >
          <Send size={18} />
          Estimation
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers Panel */}
        {showLayersPanel && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Layers size={18} />
              Calques
            </h3>
            <div className="space-y-2">
              {layers.map(layer => (
                <div 
                  key={layer.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="flex-1 text-sm">{layer.name}</span>
                  <span className="text-xs text-gray-500">{layer.itemCount}</span>
                  <button onClick={() => toggleLayerVisibility(layer.id)}>
                    {layer.visible ? <Eye size={16} /> : <EyeOff size={16} className="text-gray-400" />}
                  </button>
                  <button onClick={() => toggleLayerLock(layer.id)}>
                    {layer.locked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} className="text-gray-400" />}
                  </button>
                </div>
              ))}
            </div>
            
            {/* Mesures manuelles */}
            <h3 className="font-semibold mt-6 mb-3 flex items-center gap-2">
              <Ruler size={18} />
              Mesures ({measurements.filter(m => m.pageNumber === currentPage).length})
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {measurements
                .filter(m => m.pageNumber === currentPage)
                .map(m => (
                  <div 
                    key={m.id}
                    className={`text-sm p-2 rounded cursor-pointer ${
                      selectedMeasurement === m.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedMeasurement(m.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: m.color }} />
                      <span className="flex-1">{m.label}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setMeasurements(prev => prev.filter(x => x.id !== m.id));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-gray-500 ml-5">{m.value.toFixed(2)} {m.unit}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 relative"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 z-50">
              <Loader2 size={48} className="animate-spin text-blue-600" />
            </div>
          )}
          
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 z-50">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError(null)}><X size={18} /></button>
            </div>
          )}
          
          {!pdfDoc && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Upload size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Chargez un plan PDF pour commencer</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sélectionner un fichier
                </button>
              </div>
            </div>
          )}
          
          <div 
            className="relative inline-block"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'top left'
            }}
          >
            <canvas ref={canvasRef} className="block" />
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 pointer-events-auto"
              onClick={handleCanvasClick}
              onDoubleClick={handleDoubleClick}
              style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'pointer' : 'crosshair' }}
            />
          </div>
        </div>
        
        {/* AI Results Panel */}
        {showAIPanel && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Cpu size={18} />
              Analyse IA
            </h3>
            
            {aiAnalyzing && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin mx-auto text-purple-600 mb-2" />
                <p className="text-gray-600">Analyse en cours...</p>
              </div>
            )}
            
            {aiResult && !aiAnalyzing && (
              <>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 mb-4">
                  <div className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                    Analysé en {aiResult.processingTime.toFixed(0)}ms
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Murs: <strong>{aiResult.summary.totalWalls}</strong></div>
                    <div>Portes: <strong>{aiResult.summary.totalDoors}</strong></div>
                    <div>Fenêtres: <strong>{aiResult.summary.totalWindows}</strong></div>
                    <div>Pièces: <strong>{aiResult.summary.totalRooms}</strong></div>
                  </div>
                  <div className="mt-2 text-sm">
                    Surface: ~{aiResult.summary.estimatedArea.toFixed(0)} {scale.unit}²
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Éléments détectés ({detectedElements.length})</h4>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {detectedElements.map(el => (
                    <div 
                      key={el.id}
                      className={`text-sm p-2 rounded cursor-pointer flex items-center gap-2 ${
                        selectedElements.has(el.id) 
                          ? 'bg-purple-100 dark:bg-purple-900' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedElements(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(el.id)) {
                            newSet.delete(el.id);
                          } else {
                            newSet.add(el.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedElements.has(el.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: layers.find(l => l.elementTypes.includes(el.type))?.color }}
                      />
                      <span className="flex-1 capitalize">{el.type}</span>
                      <span className="text-gray-500">{(el.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedElements(new Set(detectedElements.map(e => e.id)))}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => setSelectedElements(new Set())}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                  >
                    Désélectionner
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Takeoff Items Panel */}
        {showItemsPanel && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileSpreadsheet size={18} />
              Items Devis ({takeoffItems.length})
            </h3>
            
            {takeoffItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucun item</p>
                <p className="text-sm">Utilisez l'analyse IA puis "Convertir en devis"</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {takeoffItems.map(item => (
                    <div 
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{item.description}</span>
                        <button
                          onClick={() => setTakeoffItems(prev => prev.filter(i => i.id !== item.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {CSC_CATEGORIES[item.category as keyof typeof CSC_CATEGORIES]?.name || item.category} / {item.subcategory}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{item.quantity.toFixed(2)} {item.unit}</span>
                        <span className="font-semibold">${item.totalPrice.toFixed(2)}</span>
                      </div>
                      {item.confidence && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex-1 h-1 bg-gray-200 rounded">
                            <div 
                              className="h-1 bg-purple-500 rounded"
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{(item.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Totaux */}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>${takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TPS (5%)</span>
                    <span>${(takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0) * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVQ (9.975%)</span>
                    <span>${(takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0) * 0.09975).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${(takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0) * 1.14975).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Page Navigation */}
      {totalPages > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex items-center justify-center gap-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
      
      {/* Scale Calibration Modal */}
      {showScaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target size={24} />
              Calibration de l'échelle
            </h3>
            
            {calibrationStep === 'start' && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Pour calibrer l'échelle, vous devez identifier une distance connue sur le plan.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Unité de mesure</label>
                  <select
                    value={scale.unit}
                    onChange={(e) => setScale(prev => ({ ...prev, unit: e.target.value as ScaleConfig['unit'] }))}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="ft">Pieds (ft)</option>
                    <option value="m">Mètres (m)</option>
                    <option value="in">Pouces (in)</option>
                    <option value="cm">Centimètres (cm)</option>
                  </select>
                </div>
                <button
                  onClick={() => setCalibrationStep('point1')}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Commencer la calibration
                </button>
              </>
            )}
            
            {calibrationStep === 'point1' && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Étape 1/3:</strong> Cliquez sur le premier point de référence sur le plan.
                </p>
                <div className="text-center py-8">
                  <Target size={48} className="mx-auto text-blue-500 animate-pulse" />
                </div>
              </>
            )}
            
            {calibrationStep === 'point2' && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Étape 2/3:</strong> Cliquez sur le deuxième point de référence.
                </p>
                <div className="text-center py-8">
                  <Target size={48} className="mx-auto text-blue-500 animate-pulse" />
                </div>
              </>
            )}
            
            {calibrationStep === 'distance' && (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Étape 3/3:</strong> Entrez la distance réelle entre les deux points.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Distance en {scale.unit}</label>
                  <input
                    type="number"
                    value={knownDistance}
                    onChange={(e) => setKnownDistance(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    autoFocus
                  />
                </div>
                <button
                  onClick={completeCalibration}
                  disabled={!knownDistance}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Terminer la calibration
                </button>
              </>
            )}
            
            <button
              onClick={() => {
                setShowScaleModal(false);
                setCalibrationStep('start');
                setCalibrationPoints([]);
                setActiveTool('select');
              }}
              className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
