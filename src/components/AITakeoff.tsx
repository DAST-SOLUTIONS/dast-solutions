/**
 * DAST Solutions - AI Takeoff Component
 * Analyse automatique des plans avec intelligence artificielle
 * VERSION CORRIGÉE - Compatible avec aiTakeoffService
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import {
  Upload, ZoomIn, ZoomOut, RotateCw, Ruler, Square, MousePointer,
  Move, Layers, Eye, EyeOff, Download, Save, Trash2,
  ChevronLeft, ChevronRight, Cpu, Wand2, Target,
  Plus, Minus, AlertCircle, Loader2, X, FileSpreadsheet,
  Calculator, Settings, CheckCircle2
} from 'lucide-react';
import {
  analyzePageWithAI,
  elementsToTakeoffItems,
  exportTakeoffToExcel,
  QUEBEC_PRICES_2024,
  CSC_CATEGORIES,
  DEFAULT_LAYERS,
  type DetectedElement,
  type AIAnalysisResult,
  type TakeoffItem,
  type TakeoffLayer
} from '@/services/aiTakeoffService';

// Configuration PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// ============================================================================
// TYPES LOCAUX
// ============================================================================
interface ScaleConfig {
  pixelsPerUnit: number;
  unit: string;
  isCalibrated: boolean;
}

interface LocalTakeoffItem extends TakeoffItem {
  // Alias pour compatibilité
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function AITakeoff() {
  const { projectId } = useParams<{ projectId: string }>();
  
  // États PDF
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États vue
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // États échelle
  const [scale, setScale] = useState<ScaleConfig>({
    pixelsPerUnit: 20,
    unit: 'ft',
    isCalibrated: false
  });
  
  // États AI
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [detectedElements, setDetectedElements] = useState<DetectedElement[]>([]);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  
  // États takeoff items
  const [takeoffItems, setTakeoffItems] = useState<LocalTakeoffItem[]>([]);
  const [showItemsPanel, setShowItemsPanel] = useState(true);
  
  // États layers
  const [layers, setLayers] = useState<TakeoffLayer[]>(DEFAULT_LAYERS);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    
    // Render avec le bon format
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    setPageImage(canvas.toDataURL('image/png'));
  };
  
  // ============================================================================
  // RENDU CANVAS
  // ============================================================================
  useEffect(() => {
    if (!pageImage) return;
    
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
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
    img.src = pageImage;
  }, [pageImage, rotation, detectedElements, selectedElements, layers]);
  
  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
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
      });
  };
  
  // ============================================================================
  // ANALYSE AI
  // ============================================================================
  const runAIAnalysis = async () => {
    if (!pageImage) return;
    
    setAiAnalyzing(true);
    
    try {
      const result = await analyzePageWithAI(
        pageImage,
        currentPage,
        scale.isCalibrated ? { pixelsPerUnit: scale.pixelsPerUnit, unit: scale.unit } : undefined
      );
      
      setAiResult(result);
      setDetectedElements(result.elements);
      
      // Mettre à jour si échelle détectée
      if (result.scaleDetected) {
        setScale({
          pixelsPerUnit: result.scaleDetected.pixelsPerUnit,
          unit: result.scaleDetected.unit,
          isCalibrated: true
        });
      }
      
      // Mettre à jour les compteurs de layers
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
  };
  
  // ============================================================================
  // GESTION ITEMS
  // ============================================================================
  const addManualItem = () => {
    const newItem: LocalTakeoffItem = {
      id: `manual-${Date.now()}`,
      category: '06',
      subcategory: 'Bois et plastiques',
      description: 'Nouvel item',
      quantity: 0,
      unit: 'pi²',
      unitPrice: 0,
      totalPrice: 0,
      source: 'manual'
    };
    setTakeoffItems(prev => [...prev, newItem]);
  };
  
  const updateItem = (id: string, updates: Partial<LocalTakeoffItem>) => {
    setTakeoffItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      // Recalculer le total
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };
  
  const deleteItem = (id: string) => {
    setTakeoffItems(prev => prev.filter(i => i.id !== id));
  };
  
  // ============================================================================
  // EXPORT
  // ============================================================================
  const handleExportExcel = () => {
    const projectName = `Projet-${projectId || 'nouveau'}`;
    exportTakeoffToExcel(takeoffItems, projectName);
  };
  
  // ============================================================================
  // NAVIGATION PAGES
  // ============================================================================
  const goToPage = async (page: number) => {
    if (!pdfDoc || page < 1 || page > totalPages) return;
    setCurrentPage(page);
    await renderPage(pdfDoc, page);
  };
  
  // Calculer les totaux
  const totals = {
    sousTotal: takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0),
    tps: takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0) * 0.05,
    tvq: takeoffItems.reduce((sum, i) => sum + i.totalPrice, 0) * 0.09975,
    get total() { return this.sousTotal + this.tps + this.tvq; }
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
        
        {/* Échelle */}
        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
          scale.isCalibrated 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        }`}>
          <Target size={18} />
          {scale.isCalibrated ? `${scale.pixelsPerUnit.toFixed(1)} px/${scale.unit}` : 'Non calibré'}
        </div>
        
        <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
        
        {/* AI Analysis */}
        <button
          onClick={runAIAnalysis}
          disabled={!pageImage || aiAnalyzing}
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
        >
          <RotateCw size={18} />
        </button>
        
        <div className="flex-1" />
        
        {/* Export */}
        <button
          onClick={handleExportExcel}
          disabled={takeoffItems.length === 0}
          className="px-3 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download size={18} />
          Export Excel
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 relative p-4">
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">Chargez un plan PDF pour commencer</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sélectionner un fichier
                </button>
              </div>
            </div>
          )}
          
          {pageImage && (
            <div 
              className="relative inline-block"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              <canvas ref={canvasRef} className="block" />
              <canvas
                ref={overlayRef}
                className="absolute top-0 left-0 pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                  const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                  
                  const clicked = detectedElements.find(el => {
                    const { x: ex, y: ey, width, height } = el.boundingBox;
                    return x >= ex && x <= ex + width && y >= ey && y <= ey + height;
                  });
                  
                  if (clicked) {
                    setSelectedElements(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(clicked.id)) {
                        newSet.delete(clicked.id);
                      } else {
                        newSet.add(clicked.id);
                      }
                      return newSet;
                    });
                  }
                }}
              />
            </div>
          )}
        </div>
        
        {/* Right Panel - Items */}
        {showItemsPanel && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            {/* AI Results */}
            {aiResult && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Cpu size={18} />
                  Analyse IA
                </h3>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Murs: <strong>{aiResult.summary.totalWalls}</strong></div>
                    <div>Portes: <strong>{aiResult.summary.totalDoors}</strong></div>
                    <div>Fenêtres: <strong>{aiResult.summary.totalWindows}</strong></div>
                    <div>Pièces: <strong>{aiResult.summary.totalRooms}</strong></div>
                  </div>
                  <div className="mt-2 text-purple-600 dark:text-purple-400">
                    {detectedElements.length} éléments détectés
                  </div>
                </div>
              </div>
            )}
            
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileSpreadsheet size={18} />
                  Items ({takeoffItems.length})
                </h3>
                <button
                  onClick={addManualItem}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {takeoffItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Utilisez l'analyse IA puis "Convertir en devis"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {takeoffItems.map(item => (
                    <div 
                      key={item.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          className="font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none flex-1"
                        />
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-gray-500">Qté</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Unité</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Prix/u</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-gray-500">{item.source === 'ai' ? '🤖 AI' : '✋ Manuel'}</span>
                        <span className="font-semibold">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Totals */}
            {takeoffItems.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>${totals.sousTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>TPS (5%)</span>
                    <span>${totals.tps.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>TVQ (9.975%)</span>
                    <span>${totals.tvq.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
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
          <span className="text-sm">Page {currentPage} / {totalPages}</span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
